import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';

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
    const todayStr = new Date().toISOString().split('T')[0];

    const currentYear = new Date().getFullYear();
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const monthPrefix = `${currentYear}-${currentMonth}`;

    let baseQuery: any = { organizationId: orgId };

    if (auth.role === 'EMPLOYEE' && auth.employeeId) {
      baseQuery.employeeId = auth.employeeId;
    } else if (auth.role === 'MANAGER' && auth.employeeId) {
      const team = await db
        .collection('employees')
        .find({
          organizationId: orgId,
          $or: [{ managerId: auth.employeeId }, { reportingTo: auth.employeeId }, { employeeId: auth.employeeId }],
        })
        .toArray();
      const teamEmpIds = team.map((e) => e.employeeId || e._id.toString());
      baseQuery.employeeId = { $in: teamEmpIds };
    }

    const [pending, approved, rejected, cancelled, total, onLeaveToday, approvedThisMonth] = await Promise.all([
      db.collection('leaves').countDocuments({ ...baseQuery, status: 'Pending' }),
      db.collection('leaves').countDocuments({ ...baseQuery, status: 'Approved' }),
      db.collection('leaves').countDocuments({ ...baseQuery, status: 'Rejected' }),
      db.collection('leaves').countDocuments({ ...baseQuery, status: 'Cancelled' }),
      db.collection('leaves').countDocuments(baseQuery),
      db.collection('leaves').countDocuments({
        ...baseQuery,
        status: 'Approved',
        startDate: { $lte: todayStr },
        endDate: { $gte: todayStr },
      }),
      db.collection('leaves').countDocuments({
        ...baseQuery,
        status: 'Approved',
        startDate: { $regex: `^${monthPrefix}` },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        pending,
        approved,
        rejected,
        cancelled,
        total,
        onLeaveToday,
        approvedThisMonth,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch leave statistics' }, { status: 500 });
  }
}
