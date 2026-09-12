import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { db } = await connectToDatabase();

    const query: any = {
      organizationId: auth.organizationId,
      status: 'UNREAD',
      deletedAt: { $in: [null, undefined] },
    };

    if (auth.role === 'EMPLOYEE') {
      query.$or = [
        { recipientId: auth.userId },
        { recipientId: auth.employeeId },
        { targetScope: 'ORGANIZATION' },
      ];
    } else {
      query.$or = [
        { recipientId: auth.userId },
        { recipientId: auth.employeeId },
        { recipientId: 'usr-admin-1' },
        { targetScope: 'ORGANIZATION' },
        { targetScope: 'ROLE', targetId: auth.role },
      ];
    }

    const unreadCount = await db.collection('notifications').countDocuments(query);

    return NextResponse.json({
      success: true,
      unreadCount,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, unreadCount: 0, message: err.message }, { status: 500 });
  }
}
