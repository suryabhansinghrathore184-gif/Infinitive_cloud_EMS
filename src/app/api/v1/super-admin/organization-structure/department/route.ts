import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// POST /api/v1/super-admin/organization-structure/department - Add Department
export async function POST(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const body = await req.json();
    const { organizationId, name, code, head, description, status } = body;

    if (!organizationId || !name?.trim()) {
      return NextResponse.json({ success: false, message: 'Organization ID and Department Name are required.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const deptNameTrimmed = name.trim();

    // Check duplicate department within same organization
    const existing = await db.collection('departments').findOne({
      organizationId,
      name: new RegExp(`^${deptNameTrimmed}$`, 'i'),
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: `Department "${deptNameTrimmed}" already exists in this organization.` },
        { status: 409 }
      );
    }

    const newDeptDoc = {
      id: `dept-${Date.now()}`,
      organizationId,
      name: deptNameTrimmed,
      code: code?.trim() || deptNameTrimmed.substring(0, 4).toUpperCase(),
      head: head?.trim() || 'Unassigned',
      description: description?.trim() || '',
      status: status || 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection('departments').insertOne(newDeptDoc as any);

    await logAuditEvent(req, 'DEPARTMENT_CREATED', {
      details: { departmentName: deptNameTrimmed, code: newDeptDoc.code, organizationId },
    });

    return NextResponse.json(
      { success: true, message: `Department "${deptNameTrimmed}" created successfully.`, data: newDeptDoc },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating department:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to create department' }, { status: 500 });
  }
}

// PUT /api/v1/super-admin/organization-structure/department - Edit Department
export async function PUT(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const body = await req.json();
    const { id, organizationId, name, code, head, description, status } = body;

    if (!id || !name?.trim()) {
      return NextResponse.json({ success: false, message: 'Department ID and Name are required.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const deptNameTrimmed = name.trim();

    // Find existing
    const existing = await db.collection('departments').findOne({
      $or: [{ id }, { _id: id }],
    });

    const oldName = existing?.name;

    await db.collection('departments').updateOne(
      { $or: [{ id }, { _id: id }] },
      {
        $set: {
          name: deptNameTrimmed,
          code: code?.trim() || deptNameTrimmed.substring(0, 4).toUpperCase(),
          head: head?.trim() || 'Unassigned',
          description: description?.trim() || '',
          status: status || 'Active',
          updatedAt: new Date().toISOString(),
        },
      },
      { upsert: true }
    );

    // If department name was changed, update references in employees
    if (oldName && oldName.toLowerCase() !== deptNameTrimmed.toLowerCase()) {
      await db.collection('employees').updateMany(
        { department: oldName },
        { $set: { department: deptNameTrimmed } }
      );
    }

    await logAuditEvent(req, 'DEPARTMENT_UPDATED', {
      details: { departmentName: deptNameTrimmed, oldName, organizationId },
    });

    return NextResponse.json({ success: true, message: `Department "${deptNameTrimmed}" updated successfully.` });
  } catch (error: any) {
    console.error('Error updating department:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to update department' }, { status: 500 });
  }
}
