import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const userId = params.id;
    const body = await req.json();
    const { role, status } = body;

    const { db } = await connectToDatabase();
    const now = new Date();

    let query: any = {};
    if (ObjectId.isValid(userId)) {
      query.$or = [{ _id: new ObjectId(userId) }, { id: userId }, { email: userId }];
    } else {
      query.$or = [{ id: userId }, { email: userId }];
    }

    const userDoc = await db.collection('users').findOne(query);
    const empDoc = !userDoc ? await db.collection('employees').findOne(query) : null;

    if (!userDoc && !empDoc) {
      return NextResponse.json({ success: false, message: 'User or employee record not found.' }, { status: 404 });
    }

    const updateFields: any = { updatedAt: now };
    if (role) updateFields.role = role;
    if (status) updateFields.status = status;

    if (userDoc) {
      await db.collection('users').updateOne({ _id: userDoc._id }, { $set: updateFields });
    }

    if (empDoc) {
      await db.collection('employees').updateOne({ _id: empDoc._id }, { $set: updateFields });
    }

    await logAuditEvent(req, 'UPDATE_USER_ROLE_OR_STATUS', { details: { userId, updateFields } });

    return NextResponse.json({
      success: true,
      message: 'User record updated successfully.',
      data: { userId, ...updateFields },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to update user' }, { status: 500 });
  }
}
