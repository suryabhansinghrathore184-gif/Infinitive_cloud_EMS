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
    const { entityType = 'job', data } = body;
    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;
    const collectionName = entityType === 'job' ? 'jobs' : 'candidates';
    const now = new Date();

    const updateFields = {
      ...data,
      updatedAt: now,
    };
    delete updateFields._id;
    delete updateFields.id;

    await db.collection(collectionName).updateOne(
      buildIdFilter(orgId, id),
      { $set: updateFields }
    );

    await logAuditEvent(req, `UPDATE_${entityType.toUpperCase()}`, { details: { id, updateFields } });

    return NextResponse.json({
      success: true,
      message: `${entityType === 'job' ? 'Hiring requirement' : 'Candidate'} updated successfully.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to update item' }, { status: 500 });
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
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get('entityType') || 'job';
    const collectionName = entityType === 'job' ? 'jobs' : 'candidates';

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;

    await db.collection(collectionName).deleteOne(buildIdFilter(orgId, id));

    await logAuditEvent(req, `DELETE_${entityType.toUpperCase()}`, { details: { id } });

    return NextResponse.json({
      success: true,
      message: `${entityType === 'job' ? 'Requirement' : 'Candidate'} deleted successfully.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to delete item' }, { status: 500 });
  }
}
