import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { createNotification } from '@/lib/notifications/notificationService';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;
    const leaveId = params.id;

    let query: any = { organizationId: orgId };
    if (ObjectId.isValid(leaveId)) {
      query.$or = [{ _id: new ObjectId(leaveId) }, { id: leaveId }];
    } else {
      query.id = leaveId;
    }

    const leaveDoc = await db.collection('leaves').findOne(query);
    if (!leaveDoc) {
      return NextResponse.json({ success: false, message: 'Leave request not found.' }, { status: 404 });
    }

    // Permission check for employee
    if (auth.role === 'EMPLOYEE' && leaveDoc.employeeId !== auth.employeeId) {
      return NextResponse.json({ success: false, message: 'Unauthorized access to leave request.' }, { status: 403 });
    }

    // Permission check for manager
    if (auth.role === 'MANAGER' && auth.employeeId) {
      const isTeamMember = await db.collection('employees').findOne({
        organizationId: orgId,
        employeeId: leaveDoc.employeeId,
        $or: [{ managerId: auth.employeeId }, { reportingTo: auth.employeeId }, { employeeId: auth.employeeId }],
      });
      if (!isTeamMember) {
        return NextResponse.json({ success: false, message: 'Unauthorized to view team member request.' }, { status: 403 });
      }
    }

    // Fetch employee details
    const employee = await db.collection('employees').findOne({
      organizationId: orgId,
      employeeId: leaveDoc.employeeId,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...leaveDoc,
        department: employee?.department || 'General',
        designation: employee?.designation || 'Team Member',
        email: employee?.email || '',
        phone: employee?.phone || '',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch leave request detail' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const leaveId = params.id;
    const body = await req.json();
    const { action, status, rejectionReason } = body;

    const targetStatus = (status || action || '').toString().trim();
    const normalizedStatus =
      targetStatus.toLowerCase() === 'approved' || targetStatus.toLowerCase() === 'approve'
        ? 'Approved'
        : targetStatus.toLowerCase() === 'rejected' || targetStatus.toLowerCase() === 'reject'
        ? 'Rejected'
        : targetStatus.toLowerCase() === 'cancelled' || targetStatus.toLowerCase() === 'cancel'
        ? 'Cancelled'
        : null;

    if (!normalizedStatus) {
      return NextResponse.json(
        { success: false, message: 'Invalid action/status. Must be Approved, Rejected, or Cancelled.' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;
    const now = new Date();

    let query: any = { organizationId: orgId };
    if (ObjectId.isValid(leaveId)) {
      query.$or = [{ _id: new ObjectId(leaveId) }, { id: leaveId }];
    } else {
      query.id = leaveId;
    }

    const leaveDoc = await db.collection('leaves').findOne(query);
    if (!leaveDoc) {
      return NextResponse.json({ success: false, message: 'Leave request not found.' }, { status: 404 });
    }

    const currentStatus = leaveDoc.status || 'Pending';
    const durationDays = Number(leaveDoc.durationDays) || 1;
    const empId = leaveDoc.employeeId;
    const leaveType = leaveDoc.leaveType;
    const currentYear = new Date().getFullYear();

    // Verification for EMPLOYEE role (Can only cancel own request)
    if (auth.role === 'EMPLOYEE') {
      if (empId !== auth.employeeId) {
        return NextResponse.json({ success: false, message: 'You can only manage your own leave requests.' }, { status: 403 });
      }
      if (normalizedStatus !== 'Cancelled') {
        return NextResponse.json({ success: false, message: 'Employees can only cancel leave requests.' }, { status: 403 });
      }
    }

    // -------------------------------------------------------------
    // ACTION: APPROVE
    // -------------------------------------------------------------
    if (normalizedStatus === 'Approved') {
      if (currentStatus === 'Approved') {
        return NextResponse.json({ success: false, message: 'Leave request is already approved.' }, { status: 409 });
      }
      if (currentStatus !== 'Pending') {
        return NextResponse.json({ success: false, message: `Cannot approve leave request in "${currentStatus}" state.` }, { status: 400 });
      }

      // ATOMIC UPDATE PRECONDITION (status MUST still be Pending in DB)
      const updateResult = await db.collection('leaves').updateOne(
        { _id: leaveDoc._id, organizationId: orgId, status: 'Pending' },
        {
          $set: {
            status: 'Approved',
            approvedBy: auth.name || 'HR Admin',
            approvedAt: now,
            updatedAt: now,
          },
        }
      );

      if (updateResult.modifiedCount === 0) {
        return NextResponse.json(
          { success: false, message: 'Conflict: Leave request has already been processed or status changed by another user.' },
          { status: 409 }
        );
      }

      // Deduct balance from leave_balances
      const balanceDoc: any = await db.collection('leave_balances').findOne({
        organizationId: orgId,
        employeeId: empId,
        year: currentYear,
      });

      if (balanceDoc?.balances) {
        const typeKey = Object.keys(balanceDoc.balances).find(
          (k) => k.toLowerCase() === leaveType.toLowerCase()
        ) || leaveType;

        const cat = balanceDoc.balances[typeKey] || { total: 12, used: 0, pending: 0, remaining: 12 };
        const newPending = Math.max(0, (cat.pending || 0) - durationDays);
        const newUsed = (cat.used || 0) + durationDays;
        const newRemaining = Math.max(0, (cat.remaining || 0) - durationDays);

        await db.collection('leave_balances').updateOne(
          { _id: balanceDoc._id },
          {
            $set: {
              [`balances.${typeKey}.pending`]: newPending,
              [`balances.${typeKey}.used`]: newUsed,
              [`balances.${typeKey}.remaining`]: newRemaining,
              updatedAt: now,
            },
          }
        );
      }

      // Idempotent Notification
      await createNotification({
        organizationId: orgId,
        recipientType: 'EMPLOYEE',
        recipientId: empId,
        eventType: 'leave_approved',
        eventId: `leave:${leaveDoc._id.toString()}:approved`,
        category: 'LEAVE',
        title: 'Leave Request Approved',
        message: `Your ${leaveType} leave request for ${durationDays} day(s) from ${leaveDoc.startDate} to ${leaveDoc.endDate} has been approved.`,
        priority: 'HIGH',
        actionUrl: '/employee/leave',
        metadata: { leaveId: leaveDoc._id.toString(), durationDays },
      });

      await logAuditEvent(req, 'LEAVE_APPROVED', { details: { leaveId: leaveDoc._id.toString(), employeeId: empId, durationDays } });

      return NextResponse.json({
        success: true,
        message: `Leave request approved successfully for ${leaveDoc.employeeName}.`,
        data: { ...leaveDoc, status: 'Approved' },
      });
    }

    // -------------------------------------------------------------
    // ACTION: REJECT
    // -------------------------------------------------------------
    if (normalizedStatus === 'Rejected') {
      if (currentStatus === 'Rejected') {
        return NextResponse.json({ success: false, message: 'Leave request is already rejected.' }, { status: 409 });
      }
      if (currentStatus !== 'Pending') {
        return NextResponse.json({ success: false, message: `Cannot reject leave request in "${currentStatus}" state.` }, { status: 400 });
      }

      if (!rejectionReason || !rejectionReason.trim()) {
        return NextResponse.json({ success: false, message: 'Rejection reason is required when rejecting a leave request.' }, { status: 400 });
      }

      // ATOMIC UPDATE PRECONDITION (status MUST still be Pending in DB)
      const updateResult = await db.collection('leaves').updateOne(
        { _id: leaveDoc._id, organizationId: orgId, status: 'Pending' },
        {
          $set: {
            status: 'Rejected',
            rejectionReason: rejectionReason.trim(),
            rejectedBy: auth.name || 'HR Admin',
            rejectedAt: now,
            updatedAt: now,
          },
        }
      );

      if (updateResult.modifiedCount === 0) {
        return NextResponse.json(
          { success: false, message: 'Conflict: Leave request has already been processed or status changed.' },
          { status: 409 }
        );
      }

      // Restore pending count in balanceDoc
      const balanceDoc: any = await db.collection('leave_balances').findOne({
        organizationId: orgId,
        employeeId: empId,
        year: currentYear,
      });

      if (balanceDoc?.balances) {
        const typeKey = Object.keys(balanceDoc.balances).find(
          (k) => k.toLowerCase() === leaveType.toLowerCase()
        ) || leaveType;

        const cat = balanceDoc.balances[typeKey];
        if (cat) {
          const newPending = Math.max(0, (cat.pending || 0) - durationDays);
          await db.collection('leave_balances').updateOne(
            { _id: balanceDoc._id },
            { $set: { [`balances.${typeKey}.pending`]: newPending, updatedAt: now } }
          );
        }
      }

      // Idempotent Notification
      await createNotification({
        organizationId: orgId,
        recipientType: 'EMPLOYEE',
        recipientId: empId,
        eventType: 'leave_rejected',
        eventId: `leave:${leaveDoc._id.toString()}:rejected`,
        category: 'LEAVE',
        title: 'Leave Request Rejected',
        message: `Your ${leaveType} leave request from ${leaveDoc.startDate} to ${leaveDoc.endDate} was rejected. Reason: ${rejectionReason.trim()}`,
        priority: 'HIGH',
        actionUrl: '/employee/leave',
        metadata: { leaveId: leaveDoc._id.toString(), rejectionReason: rejectionReason.trim() },
      });

      await logAuditEvent(req, 'LEAVE_REJECTED', { details: { leaveId: leaveDoc._id.toString(), employeeId: empId, rejectionReason } });

      return NextResponse.json({
        success: true,
        message: `Leave request rejected for ${leaveDoc.employeeName}.`,
        data: { ...leaveDoc, status: 'Rejected', rejectionReason },
      });
    }

    // -------------------------------------------------------------
    // ACTION: CANCEL
    // -------------------------------------------------------------
    if (normalizedStatus === 'Cancelled') {
      if (currentStatus === 'Cancelled') {
        return NextResponse.json({ success: false, message: 'Leave request is already cancelled.' }, { status: 409 });
      }

      // ATOMIC UPDATE PRECONDITION (status MUST match currentStatus)
      const updateResult = await db.collection('leaves').updateOne(
        { _id: leaveDoc._id, organizationId: orgId, status: currentStatus },
        {
          $set: {
            status: 'Cancelled',
            cancelledBy: auth.name || 'User',
            cancelledAt: now,
            updatedAt: now,
          },
        }
      );

      if (updateResult.modifiedCount === 0) {
        return NextResponse.json(
          { success: false, message: 'Conflict: Leave request status was modified during operation.' },
          { status: 409 }
        );
      }

      // Restore balances
      const balanceDoc: any = await db.collection('leave_balances').findOne({
        organizationId: orgId,
        employeeId: empId,
        year: currentYear,
      });

      if (balanceDoc?.balances) {
        const typeKey = Object.keys(balanceDoc.balances).find(
          (k) => k.toLowerCase() === leaveType.toLowerCase()
        ) || leaveType;

        const cat = balanceDoc.balances[typeKey];
        if (cat) {
          if (currentStatus === 'Pending') {
            const newPending = Math.max(0, (cat.pending || 0) - durationDays);
            await db.collection('leave_balances').updateOne(
              { _id: balanceDoc._id },
              { $set: { [`balances.${typeKey}.pending`]: newPending, updatedAt: now } }
            );
          } else if (currentStatus === 'Approved') {
            // Restore used and remaining balances exactly once
            const newUsed = Math.max(0, (cat.used || 0) - durationDays);
            const newRemaining = (cat.remaining || 0) + durationDays;
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
        }
      }

      // Idempotent Notification to Employee / HR
      await createNotification({
        organizationId: orgId,
        recipientType: auth.role === 'EMPLOYEE' ? 'ADMIN' : 'EMPLOYEE',
        recipientId: auth.role === 'EMPLOYEE' ? (leaveDoc.managerId || 'ADMIN') : empId,
        eventType: 'leave_cancelled',
        eventId: `leave:${leaveDoc._id.toString()}:cancelled`,
        category: 'LEAVE',
        title: 'Leave Request Cancelled',
        message: `${leaveDoc.employeeName}'s ${leaveType} leave request (${durationDays} days) has been cancelled.`,
        priority: 'NORMAL',
        actionUrl: '/admin/leave',
        metadata: { leaveId: leaveDoc._id.toString() },
      });

      await logAuditEvent(req, 'LEAVE_CANCELLED', { details: { leaveId: leaveDoc._id.toString(), employeeId: empId, previousStatus: currentStatus } });

      return NextResponse.json({
        success: true,
        message: `Leave request cancelled successfully.`,
        data: { ...leaveDoc, status: 'Cancelled' },
      });
    }

    return NextResponse.json({ success: false, message: 'Unhandled action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to update leave request status' }, { status: 500 });
  }
}
