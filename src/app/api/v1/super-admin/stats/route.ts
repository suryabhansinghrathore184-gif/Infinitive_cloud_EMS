import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN', 'ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { db } = await connectToDatabase();
    const todayStr = new Date().toISOString().split('T')[0];

    const [
      totalOrgs,
      activeOrgs,
      totalUsers,
      totalEmployees,
      activeEmployees,
      onLeaveToday,
      pendingLeaves,
      pendingTickets,
      recentAuditLogs,
    ] = await Promise.all([
      db.collection('organization_settings').countDocuments(),
      db.collection('organization_settings').countDocuments({ status: { $ne: 'Inactive' } }),
      db.collection('users').countDocuments(),
      db.collection('employees').countDocuments(),
      db.collection('employees').countDocuments({ status: 'Active' }),
      db.collection('leaves').countDocuments({ status: 'Approved', startDate: { $lte: todayStr }, endDate: { $gte: todayStr } }),
      db.collection('leaves').countDocuments({ status: 'Pending' }),
      db.collection('hr_requests').countDocuments({ status: { $in: ['Open', 'Assigned', 'In Progress', 'open'] } }),
      db.collection('audit_logs').find().sort({ timestamp: -1 }).limit(10).toArray(),
    ]);

    // Ensure fallback minimum org count if organization_settings has at least current tenant
    const safeTotalOrgs = Math.max(1, totalOrgs);
    const safeActiveOrgs = Math.max(1, activeOrgs);

    return NextResponse.json({
      success: true,
      data: {
        totalOrganizations: safeTotalOrgs,
        activeOrganizations: safeActiveOrgs,
        totalUsers: Math.max(totalUsers, totalEmployees),
        totalEmployees,
        activeEmployees,
        onLeaveToday,
        pendingLeaves,
        pendingTickets,
        recentAuditLogs: recentAuditLogs.map((log) => ({
          ...log,
          id: log._id.toString(),
        })),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch Super Admin stats' }, { status: 500 });
  }
}
