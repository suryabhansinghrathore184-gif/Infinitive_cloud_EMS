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
    const recipientId = auth.userId || auth.employeeId || 'usr-admin-1';

    // 1. Unread notifications count
    const notifPromise = db.collection('notifications').countDocuments({
      organizationId: orgId,
      recipientId,
      status: 'UNREAD',
      deletedAt: null,
    });

    // 2. Pending leaves count
    let leaveQuery: any = { organizationId: orgId, status: 'Pending' };
    if (auth.role === 'EMPLOYEE' && auth.employeeId) {
      leaveQuery.employeeId = auth.employeeId;
    }
    const leavePromise = db.collection('leaves').countDocuments(leaveQuery);

    // 3. Open actionable helpdesk requests count
    let helpdeskQuery: any = {
      organizationId: orgId,
      status: { $in: ['Open', 'Assigned', 'In Progress', 'open', 'assigned', 'in progress'] },
    };
    if (auth.role === 'EMPLOYEE' && auth.employeeId) {
      helpdeskQuery.employeeId = auth.employeeId;
    }
    const helpdeskPromise = db.collection('hr_requests').countDocuments(helpdeskQuery);

    const [unreadNotifications, pendingLeaves, openHelpdesk] = await Promise.all([
      notifPromise,
      leavePromise,
      helpdeskPromise,
    ]);

    return NextResponse.json({
      success: true,
      data: {
        unreadNotifications,
        pendingLeaves,
        openHelpdesk,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch layout badge counts' },
      { status: 500 }
    );
  }
}
