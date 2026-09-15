import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// POST /api/v1/super-admin/organization-structure/designation - Add Designation
export async function POST(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const body = await req.json();
    const { organizationId, department, title, code, level, description, status } = body;

    if (!organizationId || !department?.trim() || !title?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Organization ID, Department, and Designation Title are required.' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const titleTrimmed = title.trim();
    const deptTrimmed = department.trim();

    // Duplicate check
    const existing = await db.collection('designations').findOne({
      organizationId,
      department: new RegExp(`^${deptTrimmed}$`, 'i'),
      title: new RegExp(`^${titleTrimmed}$`, 'i'),
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: `Designation "${titleTrimmed}" already exists in department "${deptTrimmed}".` },
        { status: 409 }
      );
    }

    const newDesigDoc = {
      id: `desg-${Date.now()}`,
      organizationId,
      department: deptTrimmed,
      title: titleTrimmed,
      name: titleTrimmed,
      code: code?.trim() || titleTrimmed.substring(0, 4).toUpperCase(),
      level: level || 'Standard',
      description: description?.trim() || '',
      status: status || 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection('designations').insertOne(newDesigDoc as any);

    await logAuditEvent(req, 'DESIGNATION_CREATED', {
      details: { title: titleTrimmed, department: deptTrimmed, organizationId },
    });

    return NextResponse.json(
      { success: true, message: `Designation "${titleTrimmed}" created successfully.`, data: newDesigDoc },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating designation:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to create designation' }, { status: 500 });
  }
}

// PUT /api/v1/super-admin/organization-structure/designation - Edit Designation
export async function PUT(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const body = await req.json();
    const { id, organizationId, department, title, code, level, description, status } = body;

    if (!id || !title?.trim()) {
      return NextResponse.json({ success: false, message: 'Designation ID and Title are required.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const titleTrimmed = title.trim();
    const deptTrimmed = department?.trim();

    const existing = await db.collection('designations').findOne({
      $or: [{ id }, { _id: id }],
    });

    const oldTitle = existing?.title || existing?.name;

    await db.collection('designations').updateOne(
      { $or: [{ id }, { _id: id }] },
      {
        $set: {
          title: titleTrimmed,
          name: titleTrimmed,
          department: deptTrimmed || existing?.department || 'General',
          code: code?.trim() || titleTrimmed.substring(0, 4).toUpperCase(),
          level: level || 'Standard',
          description: description?.trim() || '',
          status: status || 'Active',
          updatedAt: new Date().toISOString(),
        },
      },
      { upsert: true }
    );

    if (oldTitle && oldTitle.toLowerCase() !== titleTrimmed.toLowerCase()) {
      await db.collection('employees').updateMany(
        { designation: oldTitle },
        { $set: { designation: titleTrimmed } }
      );
    }

    await logAuditEvent(req, 'DESIGNATION_UPDATED', {
      details: { title: titleTrimmed, oldTitle, organizationId },
    });

    return NextResponse.json({ success: true, message: `Designation "${titleTrimmed}" updated successfully.` });
  } catch (error: any) {
    console.error('Error updating designation:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to update designation' }, { status: 500 });
  }
}
