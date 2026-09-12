import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

function buildIdFilter(orgId: string, id: string): any {
  const conditions: any[] = [{ id }];
  if (ObjectId.isValid(id)) {
    conditions.push({ _id: new ObjectId(id) });
  }
  return {
    organizationId: orgId,
    $or: conditions,
  };
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN', 'ADMIN', 'HR']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { id } = params;
    const body = await req.json();
    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;
    const now = new Date();

    const updateFields: any = {
      ...body,
      updatedAt: now,
    };
    delete updateFields._id;
    delete updateFields.id;

    await db.collection('announcements').updateOne(
      buildIdFilter(orgId, id),
      { $set: updateFields }
    );

    await logAuditEvent(req, 'UPDATE_ANNOUNCEMENT', {
      details: { id, updateFields },
    });

    return NextResponse.json({
      success: true,
      message: 'Announcement updated successfully.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update announcement' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN', 'ADMIN', 'HR']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { id } = params;
    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;

    await db.collection('announcements').deleteOne(buildIdFilter(orgId, id));

    await logAuditEvent(req, 'DELETE_ANNOUNCEMENT', { details: { id } });

    return NextResponse.json({
      success: true,
      message: 'Announcement deleted successfully.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete announcement' },
      { status: 500 }
    );
  }
}
