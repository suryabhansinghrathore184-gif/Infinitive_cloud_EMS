import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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

    let query: any = { organizationId: orgId };
    if (ObjectId.isValid(id)) {
      query._id = new ObjectId(id);
    } else {
      query.employeeId = id;
    }

    const existing = await db.collection('employees').findOne(query);
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Employee not found.' }, { status: 404 });
    }

    const updateDoc = {
      ...body,
      organizationId: orgId, // Guard: preserve org
      updatedAt: new Date(),
    };
    delete updateDoc._id;

    await db.collection('employees').updateOne(query, { $set: updateDoc });

    await logAuditEvent(req, 'UPDATE_EMPLOYEE', { employeeId: existing.employeeId, oldValue: existing, newValue: updateDoc });

    const updated = await db.collection('employees').findOne(query);

    return NextResponse.json({
      success: true,
      message: 'Employee updated successfully.',
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to update employee' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN', 'ADMIN', 'HR']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { id } = params;
    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;

    let query: any = { organizationId: orgId };
    if (ObjectId.isValid(id)) {
      query._id = new ObjectId(id);
    } else {
      query.employeeId = id;
    }

    const existing = await db.collection('employees').findOne(query);
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Employee not found.' }, { status: 404 });
    }

    // Soft delete: mark status as Terminated
    await db.collection('employees').updateOne(query, { $set: { status: 'Terminated', updatedAt: new Date() } });

    await logAuditEvent(req, 'TERMINATE_EMPLOYEE', { employeeId: existing.employeeId, details: existing });

    return NextResponse.json({
      success: true,
      message: `Employee ${existing.firstName} ${existing.lastName} deactivated.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to deactivate employee' }, { status: 500 });
  }
}
