import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { logAuditEvent } from '@/lib/audit';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { db } = await connectToDatabase();
    const id = params.id;
    const nowISO = new Date().toISOString();

    let objectId: ObjectId | null = null;
    try {
      if (ObjectId.isValid(id)) objectId = new ObjectId(id);
    } catch {}

    const query: any = {
      organizationId: auth.organizationId,
      $or: objectId ? [{ id }, { _id: objectId }] : [{ id }],
    };

    const notif = await db.collection('notifications').findOne(query);

    if (!notif) {
      return NextResponse.json({ success: false, message: 'Notification not found or unauthorized' }, { status: 404 });
    }

    // Soft Delete
    await db.collection('notifications').updateOne(
      { _id: notif._id },
      {
        $set: {
          deletedAt: nowISO,
          deletedBy: auth.userId,
          updatedAt: nowISO,
        },
      }
    );

    // Audit Event
    await logAuditEvent(req, 'DELETE_NOTIFICATION', {
      details: {
        notificationId: id,
        title: notif.title,
        eventType: notif.eventType,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully',
      id,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
