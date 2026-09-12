import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { id } = params;
    const body = await req.json();
    const { status, reviewComment } = body; // Approved, Rejected, Cancelled

    if (!status || !['Approved', 'Rejected', 'Cancelled'].includes(status)) {
      return NextResponse.json({ success: false, message: 'Valid status (Approved, Rejected, Cancelled) is required.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;

    let query: any = { organizationId: orgId };
    if (ObjectId.isValid(id)) {
      query._id = new ObjectId(id);
    } else {
      query.id = id;
    }

    const existingLeave = await db.collection('leaves').findOne(query);
    if (!existingLeave) {
      return NextResponse.json({ success: false, message: 'Leave request not found.' }, { status: 404 });
    }

    // Manager role check: Manager can only approve/reject leaves of direct team members
    if (auth.role === 'MANAGER' && auth.employeeId) {
      const isDirectReport = existingLeave.managerId === auth.employeeId || existingLeave.employeeId === auth.employeeId;
      if (!isDirectReport) {
        return NextResponse.json(
          { success: false, message: 'Forbidden. Managers can only approve leave requests for their team.' },
          { status: 403 }
        );
      }
    }

    // Prevent duplicate processing if already in final status
    if (existingLeave.status === status) {
      return NextResponse.json({ success: true, message: `Leave request is already ${status}.`, data: existingLeave });
    }

    const now = new Date();
    const currentYear = new Date(existingLeave.startDate || now).getFullYear();
    const days = existingLeave.durationDays || 1;
    const leaveType = existingLeave.leaveType || 'Casual';

    // Fetch leave balances for balance deduction / restoration
    let balanceDoc = await db.collection('leave_balances').findOne({
      organizationId: orgId,
      employeeId: existingLeave.employeeId,
      year: currentYear,
    });

    const typeKey = balanceDoc?.balances
      ? Object.keys(balanceDoc.balances).find((k) => k.toLowerCase() === leaveType.toLowerCase()) || leaveType
      : leaveType;

    const currentBal = balanceDoc?.balances?.[typeKey] || { total: 12, used: 0, pending: 0, remaining: 12 };

    if (status === 'Approved' && existingLeave.status !== 'Approved') {
      // Deduct balance
      const newUsed = (currentBal.used || 0) + days;
      const newPending = Math.max(0, (currentBal.pending || 0) - days);
      const newRemaining = Math.max(0, currentBal.total - newUsed);

      if (balanceDoc) {
        await db.collection('leave_balances').updateOne(
          { _id: balanceDoc._id },
          {
            $set: {
              [`balances.${typeKey}.used`]: newUsed,
              [`balances.${typeKey}.pending`]: newPending,
              [`balances.${typeKey}.remaining`]: newRemaining,
              updatedAt: now,
            },
          }
        );
      }
    } else if (status === 'Cancelled' && existingLeave.status === 'Approved') {
      // RESTORE BALANCE: If previously approved leave is cancelled, restore deducted days!
      const newUsed = Math.max(0, (currentBal.used || 0) - days);
      const newRemaining = Math.min(currentBal.total, currentBal.total - newUsed);

      if (balanceDoc) {
        await db.collection('leave_balances').updateOne(
          { _id: balanceDoc._id },
          {
            $set: {
              [`balances.${typeKey}.used`]: newUsed,
              [`balances.${typeKey}.remaining`]: newRemaining,
              updatedAt: now,
            },
          }
        );
      }
    } else if (status === 'Rejected' && existingLeave.status === 'Pending') {
      // Clear pending balance count
      const newPending = Math.max(0, (currentBal.pending || 0) - days);
      if (balanceDoc) {
        await db.collection('leave_balances').updateOne(
          { _id: balanceDoc._id },
          { $set: { [`balances.${typeKey}.pending`]: newPending, updatedAt: now } }
        );
      }
    }

    const updatePayload = {
      status,
      reviewedBy: auth.email || auth.userId,
      reviewedAt: now,
      reviewComment: reviewComment || '',
      updatedAt: now,
    };

    await db.collection('leaves').updateOne(query, { $set: updatePayload });

    await logAuditEvent(req, `LEAVE_${status.toUpperCase()}`, {
      employeeId: existingLeave.employeeId,
      details: {
        leaveId: existingLeave._id?.toString() || existingLeave.id,
        oldStatus: existingLeave.status,
        newStatus: status,
      },
    });

    const updatedLeave = await db.collection('leaves').findOne(query);

    // Trigger Notification
    try {
      const { createNotification } = await import('@/lib/notifications/notificationService');
      await createNotification({
        organizationId: auth.organizationId,
        recipientId: existingLeave.employeeId,
        eventType: status === 'Approved' ? 'leave_approved' : status === 'Rejected' ? 'leave_rejected' : 'leave_updated',
        category: 'LEAVE',
        title: `Leave Request ${status}`,
        message: `Your ${existingLeave.type || 'casual'} leave request from ${existingLeave.startDate} to ${existingLeave.endDate} has been ${status.toLowerCase()}.`,
        priority: 'NORMAL',
        actionUrl: '/admin/leave',
      });
    } catch (notifErr) {
      console.error('Failed to trigger leave notification:', notifErr);
    }

    return NextResponse.json({
      success: true,
      message: `Leave request has been ${status.toLowerCase()}.`,
      data: updatedLeave,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to update leave request' }, { status: 500 });
  }
}
