import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { db } = await connectToDatabase();
    const nowISO = new Date().toISOString();

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

    const result = await db.collection('notifications').updateMany(query, {
      $set: {
        status: 'READ',
        isRead: true,
        readAt: nowISO,
        updatedAt: nowISO,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as READ`,
      updatedCount: result.modifiedCount,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
