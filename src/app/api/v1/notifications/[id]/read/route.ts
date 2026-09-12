import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function PATCH(
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

    await db.collection('notifications').updateOne(
      { _id: notif._id },
      {
        $set: {
          status: 'READ',
          isRead: true,
          readAt: nowISO,
          updatedAt: nowISO,
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Notification marked as READ',
      id,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
