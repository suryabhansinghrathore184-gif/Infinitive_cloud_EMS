import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

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

    let query: any = { organizationId: orgId };

    if (auth.role === 'EMPLOYEE' && auth.employeeId) {
      query.employeeId = auth.employeeId;
    } else if (auth.role === 'MANAGER' && auth.employeeId) {
      // Find team members
      const team = await db.collection('employees').find({
        organizationId: orgId,
        $or: [{ managerId: auth.employeeId }, { reportingTo: auth.employeeId }, { employeeId: auth.employeeId }],
      }).toArray();
      const teamEmpIds = team.map((e) => e.employeeId || e._id.toString());
      query.employeeId = { $in: teamEmpIds };
    }

    const [leaves, leaveBalances] = await Promise.all([
      db.collection('leaves').find(query).sort({ requestedDate: -1, createdAt: -1 }).toArray(),
      db.collection('leave_balances').find({ organizationId: orgId }).toArray(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        leaves,
        leaveBalances,
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
    const { employeeId, leaveType, startDate, endDate, durationDays, reason } = body;

    const targetEmpId = employeeId || auth.employeeId;
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
    const days = Number(durationDays) || Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);

    // Fetch or initialize leave balance for employee
    const currentYear = new Date().getFullYear();
    let balanceDoc: any = await db.collection('leave_balances').findOne({ organizationId: orgId, employeeId: targetEmpId, year: currentYear });

    if (!balanceDoc) {
      const newBal = {
        organizationId: orgId,
        employeeId: targetEmpId,
        year: currentYear,
        balances: {
          Casual: { total: 12, used: 0, pending: 0, remaining: 12 },
          Sick: { total: 10, used: 0, pending: 0, remaining: 10 },
          Earned: { total: 15, used: 0, pending: 0, remaining: 15 },
          Unpaid: { total: 30, used: 0, pending: 0, remaining: 30 },
        },
        createdAt: now,
        updatedAt: now,
      };
      await db.collection('leave_balances').insertOne(newBal as any);
      balanceDoc = newBal;
    }

    const typeKey = Object.keys(balanceDoc?.balances || {}).find((k) => k.toLowerCase() === leaveType.toLowerCase()) || leaveType;
    const currentCategory = balanceDoc?.balances?.[typeKey] || { total: 12, used: 0, pending: 0, remaining: 12 };

    // Balance check guard (except Unpaid / LOP)
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
      requestedDate: now.toISOString().split('T')[0],
      approver: managerId ? 'Manager / HR' : 'HR Administrator',
      status: 'Pending',
      createdAt: now,
      updatedAt: now,
    };

    const insertRes = await db.collection('leaves').insertOne(leaveDoc);

    // Update pending balance in leave_balances
    const updatedPending = (currentCategory.pending || 0) + days;
    await db.collection('leave_balances').updateOne(
      { organizationId: orgId, employeeId: targetEmpId, year: currentYear },
      { $set: { [`balances.${typeKey}.pending`]: updatedPending, updatedAt: now } }
    );

    await logAuditEvent(req, 'SUBMIT_LEAVE_REQUEST', { employeeId: targetEmpId, details: leaveDoc });

    return NextResponse.json({
      success: true,
      message: `Leave request for ${days} day(s) submitted successfully.`,
      data: { ...leaveDoc, _id: insertRes.insertedId },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to submit leave request' }, { status: 500 });
  }
}
