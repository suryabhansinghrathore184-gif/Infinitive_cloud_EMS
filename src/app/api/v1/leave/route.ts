import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { createNotification } from '@/lib/notifications/notificationService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)));
    const search = searchParams.get('search')?.trim() || '';
    const statusFilter = searchParams.get('status')?.trim();
    const leaveTypeFilter = searchParams.get('leaveType')?.trim();
    const startDateFilter = searchParams.get('startDate')?.trim();
    const endDateFilter = searchParams.get('endDate')?.trim();
    const deptFilter = searchParams.get('department')?.trim();

    let query: any = { organizationId: orgId };

    if (auth.role === 'EMPLOYEE' && auth.employeeId) {
      query.employeeId = auth.employeeId;
    } else if (auth.role === 'MANAGER' && auth.employeeId) {
      const team = await db
        .collection('employees')
        .find({
          organizationId: orgId,
          $or: [{ managerId: auth.employeeId }, { reportingTo: auth.employeeId }, { employeeId: auth.employeeId }],
        })
        .toArray();
      const teamEmpIds = team.map((e) => e.employeeId || e._id.toString());
      query.employeeId = { $in: teamEmpIds };
    }

    if (deptFilter) {
      const deptEmployees = await db
        .collection('employees')
        .find({ organizationId: orgId, department: deptFilter })
        .toArray();
      const deptEmpIds = deptEmployees.map((e) => e.employeeId || e._id.toString());
      query.employeeId = { $in: deptEmpIds };
    }

    if (statusFilter && statusFilter !== 'All') {
      query.status = statusFilter;
    }

    if (leaveTypeFilter && leaveTypeFilter !== 'All') {
      query.leaveType = { $regex: leaveTypeFilter, $options: 'i' };
    }

    if (startDateFilter || endDateFilter) {
      query.startDate = {};
      if (startDateFilter) query.startDate.$gte = startDateFilter;
      if (endDateFilter) query.startDate.$lte = endDateFilter;
    }

    if (search) {
      query.$or = [
        { employeeName: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { leaveType: { $regex: search, $options: 'i' } },
        { reason: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [total, leaves, leaveBalances] = await Promise.all([
      db.collection('leaves').countDocuments(query),
      db
        .collection('leaves')
        .find(query)
        .sort({ requestedDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection('leave_balances').find({ organizationId: orgId }).toArray(),
    ]);

    const formattedLeaves = leaves.map((doc) => ({
      ...doc,
      id: doc.id || doc._id.toString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        leaves: formattedLeaves,
        leaveBalances,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch leave requests' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const body = await req.json();
    const { employeeId, leaveType, startDate, endDate, durationDays, reason, attachmentFileId, attachmentName } = body;

    const targetEmpId = auth.role === 'EMPLOYEE' ? (auth.employeeId || employeeId) : (employeeId || auth.employeeId);
    if (!targetEmpId || !leaveType || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, message: 'Employee ID, leave type, start date, and end date are required.' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;
    const now = new Date();

    const emp = await db.collection('employees').findOne({ organizationId: orgId, employeeId: targetEmpId });
    const empName = emp ? `${emp.firstName} ${emp.lastName}` : auth.name || 'Employee';
    const managerId = emp?.managerId || '';

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ success: false, message: 'Invalid start date or end date format.' }, { status: 400 });
    }

    if (end < start) {
      return NextResponse.json({ success: false, message: 'End date cannot be prior to start date.' }, { status: 400 });
    }

    const calculatedDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);
    const days = Number(durationDays) || calculatedDays;

    // Organization leave policies check
    const orgSettings = await db.collection('organization_settings').findOne({ organizationId: orgId });
    const leavePolicy = orgSettings?.leave || { noticePeriodDays: 2, attachmentRequiredDays: 3, maxCarryForwardDays: 30 };

    // Notice period check for employees
    if (leavePolicy.noticePeriodDays > 0 && auth.role === 'EMPLOYEE') {
      const minNoticeDate = new Date();
      minNoticeDate.setHours(0, 0, 0, 0);
      minNoticeDate.setDate(minNoticeDate.getDate() + (leavePolicy.noticePeriodDays - 1));
      if (start < minNoticeDate) {
        return NextResponse.json(
          {
            success: false,
            message: `Leave policy requires applying at least ${leavePolicy.noticePeriodDays} day(s) in advance.`,
          },
          { status: 400 }
        );
      }
    }

    // Attachment check if duration >= threshold
    if (days >= (leavePolicy.attachmentRequiredDays || 3) && !attachmentFileId) {
      return NextResponse.json(
        {
          success: false,
          message: `Supporting attachment document is mandatory for leave requests of ${leavePolicy.attachmentRequiredDays || 3} day(s) or longer.`,
        },
        { status: 400 }
      );
    }

    // Fetch or initialize leave balance for employee
    const currentYear = new Date().getFullYear();
    let balanceDoc: any = await db.collection('leave_balances').findOne({
      organizationId: orgId,
      employeeId: targetEmpId,
      year: currentYear,
    });

    if (!balanceDoc) {
      const activeTypes = await db.collection('leave_types').find({ organizationId: orgId, active: true }).toArray();
      const configuredTypes = activeTypes.length > 0 ? activeTypes : [
        { name: 'Casual Leave', code: 'CL', allowanceDays: 12 },
        { name: 'Sick Leave', code: 'SL', allowanceDays: 10 },
        { name: 'Earned Leave', code: 'EL', allowanceDays: 15 },
        { name: 'Unpaid Leave / LOP', code: 'LOP', allowanceDays: 30 },
      ];

      const defaultBalances: any = {};
      for (const lt of configuredTypes) {
        const key = lt.name || lt.code;
        const total = lt.allowanceDays || 12;
        defaultBalances[key] = { total, used: 0, pending: 0, remaining: total };
      }

      const newBal = {
        organizationId: orgId,
        employeeId: targetEmpId,
        year: currentYear,
        balances: defaultBalances,
        createdAt: now,
        updatedAt: now,
      };
      await db.collection('leave_balances').insertOne(newBal as any);
      balanceDoc = newBal;
    }

    const typeKey = Object.keys(balanceDoc?.balances || {}).find(
      (k) => k.toLowerCase() === leaveType.toLowerCase()
    ) || leaveType;
    const currentCategory = balanceDoc?.balances?.[typeKey] || { total: 12, used: 0, pending: 0, remaining: 12 };

    const isUnpaid = leaveType.toLowerCase().includes('unpaid') || leaveType.toLowerCase().includes('lop');
    if (!isUnpaid && currentCategory.remaining < days) {
      return NextResponse.json(
        {
          success: false,
          message: `Insufficient ${leaveType} leave balance. Available: ${currentCategory.remaining} day(s), Requested: ${days} day(s).`,
        },
        { status: 400 }
      );
    }

    const leaveDoc = {
      organizationId: orgId,
      employeeId: targetEmpId,
      employeeName: empName,
      avatar: emp?.avatar || '',
      managerId,
      leaveType,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      durationDays: days,
      reason: reason || '',
      attachmentFileId: attachmentFileId || null,
      attachmentName: attachmentName || null,
      requestedDate: now.toISOString().split('T')[0],
      approver: managerId ? 'Manager / HR' : 'HR Administrator',
      status: 'Pending',
      createdAt: now,
      updatedAt: now,
    };

    const insertRes = await db.collection('leaves').insertOne(leaveDoc);
    const insertedIdStr = insertRes.insertedId.toString();

    // Update pending count in leave_balances
    const updatedPending = (currentCategory.pending || 0) + days;
    await db.collection('leave_balances').updateOne(
      { organizationId: orgId, employeeId: targetEmpId, year: currentYear },
      { $set: { [`balances.${typeKey}.pending`]: updatedPending, updatedAt: now } }
    );

    // Idempotent Notification to HR / Manager
    await createNotification({
      organizationId: orgId,
      recipientType: 'ADMIN',
      recipientId: managerId || 'usr-admin-1',
      eventType: 'leave_submitted',
      eventId: `leave:${insertedIdStr}:submitted`,
      category: 'LEAVE',
      title: 'New Leave Request Submitted',
      message: `${empName} submitted a ${leaveType} request for ${days} day(s) (${startDate} to ${endDate}).`,
      priority: 'NORMAL',
      actionUrl: '/admin/leave',
      metadata: { leaveId: insertedIdStr, employeeId: targetEmpId, durationDays: days },
    });

    await logAuditEvent(req, 'SUBMIT_LEAVE_REQUEST', { details: leaveDoc });

    return NextResponse.json({
      success: true,
      message: `Leave request for ${days} day(s) submitted successfully.`,
      data: { ...leaveDoc, _id: insertRes.insertedId, id: insertedIdStr },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to submit leave request' }, { status: 500 });
  }
}
