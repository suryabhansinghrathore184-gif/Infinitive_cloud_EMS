import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/v1/organization - Fetch all org entities
export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { db } = await connectToDatabase();
    const orgFilter = { organizationId: auth.organizationId };

    const [departments, designations, locations, employees] = await Promise.all([
      db.collection('departments').find(orgFilter).toArray(),
      db.collection('designations').find(orgFilter).toArray(),
      db.collection('locations').find(orgFilter).toArray(),
      db.collection('employees').find(orgFilter).toArray(),
    ]);

    // Compute dynamic employee counts
    const computedDepts = departments.map((d: any) => {
      const count = employees.filter(
        (e: any) => e.department?.toLowerCase() === d.name?.toLowerCase() || e.department === d.id
      ).length;
      return { ...d, employeeCount: count > 0 ? count : d.employeeCount || 0 };
    });

    const computedDesgs = designations.map((d: any) => {
      const count = employees.filter(
        (e: any) => e.designation?.toLowerCase() === d.title?.toLowerCase() || e.designation === d.id
      ).length;
      return { ...d, employeeCount: count > 0 ? count : d.employeeCount || 0 };
    });

    const computedLocs = locations.map((l: any) => {
      const count = employees.filter(
        (e: any) =>
          e.location?.toLowerCase() === l.name?.toLowerCase() ||
          e.location === l.id ||
          e.city?.toLowerCase() === l.city?.toLowerCase()
      ).length;
      return { ...l, employeeCount: count > 0 ? count : l.employeeCount || 0 };
    });

    return NextResponse.json({
      success: true,
      data: {
        departments: computedDepts,
        designations: computedDesgs,
        locations: computedLocs,
        totalEmployees: employees.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch organization data' },
      { status: 500 }
    );
  }
}

// POST /api/v1/organization - Create new org entity (Department, Designation, Location)
export async function POST(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN', 'ADMIN', 'HR']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const body = await req.json();
    const { entityType, data } = body;

    if (!entityType || !data) {
      return NextResponse.json(
        { success: false, message: 'Missing entityType or data payload' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const collectionName =
      entityType === 'department'
        ? 'departments'
        : entityType === 'designation'
        ? 'designations'
        : entityType === 'location'
        ? 'locations'
        : null;

    if (!collectionName) {
      return NextResponse.json({ success: false, message: 'Invalid entityType' }, { status: 400 });
    }

    const newRecord = {
      ...data,
      organizationId: auth.organizationId,
      id: data.id || `${entityType.slice(0, 3)}-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection(collectionName).insertOne(newRecord);

    // Audit log
    await db.collection('audit_logs').insertOne({
      organizationId: auth.organizationId,
      action: `CREATE_${entityType.toUpperCase()}`,
      performerRole: auth.role,
      performerUserId: auth.userId,
      details: `Created new ${entityType}: ${data.name || data.title}`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { success: true, message: `${entityType} created successfully`, data: newRecord },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create entity' },
      { status: 500 }
    );
  }
}

// PUT /api/v1/organization - Update org entity
export async function PUT(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN', 'ADMIN', 'HR']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const body = await req.json();
    const { entityType, id, updated } = body;

    if (!entityType || !id || !updated) {
      return NextResponse.json(
        { success: false, message: 'Missing entityType, id, or updated payload' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const collectionName =
      entityType === 'department'
        ? 'departments'
        : entityType === 'designation'
        ? 'designations'
        : entityType === 'location'
        ? 'locations'
        : null;

    if (!collectionName) {
      return NextResponse.json({ success: false, message: 'Invalid entityType' }, { status: 400 });
    }

    // Strip protected identity fields from updated body
    const { organizationId, _id, ...safeUpdates } = updated || {};

    const res = await db.collection(collectionName).updateOne(
      { id, organizationId: auth.organizationId },
      { $set: { ...safeUpdates, updatedAt: new Date().toISOString() } }
    );

    if (res.matchedCount === 0) {
      return NextResponse.json({ success: false, message: 'Entity not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `${entityType} updated successfully` });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update entity' },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/organization - Delete or deactivate org entity
export async function DELETE(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN', 'ADMIN', 'HR']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get('entityType');
    const id = searchParams.get('id');

    if (!entityType || !id) {
      return NextResponse.json({ success: false, message: 'Missing entityType or id query params' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const collectionName =
      entityType === 'department'
        ? 'departments'
        : entityType === 'designation'
        ? 'designations'
        : entityType === 'location'
        ? 'locations'
        : null;

    if (!collectionName) {
      return NextResponse.json({ success: false, message: 'Invalid entityType' }, { status: 400 });
    }

    // Safety check for active employees within same organization
    const employees = await db.collection('employees').find({ organizationId: auth.organizationId }).toArray();
    let assignedCount = 0;

    if (entityType === 'department') {
      const dept = await db.collection('departments').findOne({ id, organizationId: auth.organizationId });
      if (dept) {
        assignedCount = employees.filter(
          (e: any) => e.department === dept.name || e.department === id
        ).length;
      }
    } else if (entityType === 'designation') {
      const desg = await db.collection('designations').findOne({ id, organizationId: auth.organizationId });
      if (desg) {
        assignedCount = employees.filter(
          (e: any) => e.designation === desg.title || e.designation === id
        ).length;
      }
    } else if (entityType === 'location') {
      const loc = await db.collection('locations').findOne({ id, organizationId: auth.organizationId });
      if (loc) {
        assignedCount = employees.filter(
          (e: any) => e.location === loc.name || e.location === id || e.city === loc.city
        ).length;
      }
    }

    if (assignedCount > 0) {
      // Deactivate instead of delete
      await db.collection(collectionName).updateOne(
        { id, organizationId: auth.organizationId },
        { $set: { status: 'Inactive', updatedAt: new Date().toISOString() } }
      );
      return NextResponse.json({
        success: true,
        message: `${entityType} has ${assignedCount} assigned employee(s) and was set to Inactive status.`,
      });
    }

    await db.collection(collectionName).deleteOne({ id, organizationId: auth.organizationId });
    return NextResponse.json({ success: true, message: `${entityType} deleted successfully.` });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete entity' },
      { status: 500 }
    );
  }
}
