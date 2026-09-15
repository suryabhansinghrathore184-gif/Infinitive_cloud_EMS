import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { logAuditEvent } from '@/lib/audit';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const body = await req.json();
    const action = body.action; // 'markRead' | 'markUnread' | 'delete'
    const ids: string[] = Array.isArray(body.ids) ? body.ids : [];

    if (!ids.length) {
      return NextResponse.json({ success: false, message: 'No notification IDs provided for bulk operation.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const nowISO = new Date().toISOString();

    // Convert string IDs to ObjectIds where valid
    const objectIds = ids.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));

    // Scope query to prevent cross-tenant/unauthorized modifications
    const scopeQuery: any = {
      $or: [{ id: { $in: ids } }, { _id: { $in: objectIds } }],
    };

    if (auth.role !== 'SUPER_ADMIN') {
      scopeQuery.organizationId = auth.organizationId;
    }

    let modifiedCount = 0;
    let auditAction = 'NOTIFICATION_BULK_ACTION';

    if (action === 'markRead') {
      auditAction = 'NOTIFICATION_BULK_READ';
      const res = await db.collection('notifications').updateMany(scopeQuery, {
        $set: {
          status: 'READ',
          isRead: true,
          readAt: nowISO,
          updatedAt: nowISO,
        },
      });
      modifiedCount = res.modifiedCount;
    } else if (action === 'markUnread') {
      auditAction = 'NOTIFICATION_BULK_UNREAD';
      const res = await db.collection('notifications').updateMany(scopeQuery, {
        $set: {
          status: 'UNREAD',
          isRead: false,
          readAt: null,
          updatedAt: nowISO,
        },
      });
      modifiedCount = res.modifiedCount;
    } else if (action === 'delete') {
      auditAction = 'NOTIFICATION_BULK_DELETED';
      const res = await db.collection('notifications').updateMany(scopeQuery, {
        $set: {
          deletedAt: nowISO,
          deletedBy: auth.userId,
          updatedAt: nowISO,
        },
      });
      modifiedCount = res.modifiedCount;
    } else {
      return NextResponse.json({ success: false, message: 'Invalid bulk action' }, { status: 400 });
    }

    // Audit Event Log
    await logAuditEvent(req, auditAction, {
      details: {
        count: modifiedCount,
        action,
        requestedIdsCount: ids.length,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully executed bulk ${action} on ${modifiedCount} notifications`,
      modifiedCount,
    });
  } catch (err: any) {
    console.error('Error executing bulk notification operation:', err);
    return NextResponse.json({ success: false, message: err.message || 'Bulk operation failed' }, { status: 500 });
  }
}
