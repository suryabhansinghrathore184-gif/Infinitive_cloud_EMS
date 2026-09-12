import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

// GET /api/v1/organization - Fetch all org entities
export async function GET(req: NextRequest) {
  try {
    const { db } = await connectToDatabase();

    const [departments, designations, locations, employees] = await Promise.all([
      db.collection('departments').find({}).toArray(),
      db.collection('designations').find({}).toArray(),
      db.collection('locations').find({}).toArray(),
      db.collection('employees').find({}).toArray(),
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
    const role = req.headers.get('x-user-role') || 'ADMIN';
    if (role !== 'ADMIN' && role !== 'HR_ADMIN' && role !== 'HR Administrator' && role !== 'Admin') {
      return NextResponse.json(
        { success: false, message: 'Forbidden: Insufficient RBAC permissions' },
        { status: 403 }
      );
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
      id: data.id || `${entityType.slice(0, 3)}-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection(collectionName).insertOne(newRecord);

    // Audit log
    await db.collection('audit_logs').insertOne({
      action: `CREATE_${entityType.toUpperCase()}`,
      performerRole: role,
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
    const role = req.headers.get('x-user-role') || 'ADMIN';
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

    const res = await db.collection(collectionName).updateOne(
      { id },
      { $set: { ...updated, updatedAt: new Date().toISOString() } }
    );

    if (res.matchedCount === 0) {
      return NextResponse.json({ success: false, message: 'Entity not found' }, { status: 404 });
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

    // Safety check for active employees
    const employees = await db.collection('employees').find({}).toArray();
    let assignedCount = 0;

    if (entityType === 'department') {
      const dept = await db.collection('departments').findOne({ id });
      if (dept) {
        assignedCount = employees.filter(
          (e: any) => e.department === dept.name || e.department === id
        ).length;
      }
    } else if (entityType === 'designation') {
      const desg = await db.collection('designations').findOne({ id });
      if (desg) {
        assignedCount = employees.filter(
          (e: any) => e.designation === desg.title || e.designation === id
        ).length;
      }
    } else if (entityType === 'location') {
      const loc = await db.collection('locations').findOne({ id });
      if (loc) {
        assignedCount = employees.filter(
          (e: any) => e.location === loc.name || e.location === id || e.city === loc.city
        ).length;
      }
    }

    if (assignedCount > 0) {
      // Deactivate instead of delete
      await db.collection(collectionName).updateOne({ id }, { $set: { status: 'Inactive', updatedAt: new Date().toISOString() } });
      return NextResponse.json({
        success: true,
        message: `${entityType} has ${assignedCount} assigned employee(s) and was set to Inactive status.`,
      });
    }

    await db.collection(collectionName).deleteOne({ id });
    return NextResponse.json({ success: true, message: `${entityType} deleted successfully.` });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete entity' },
      { status: 500 }
    );
  }
}
