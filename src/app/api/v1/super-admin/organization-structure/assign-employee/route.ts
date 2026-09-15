import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

// PATCH /api/v1/super-admin/organization-structure/assign-employee - Assign Org, Dept, Desig to employee
export async function PATCH(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const body = await req.json();
    const { employeeId, id, organizationId, department, designation } = body;

    const targetId = id || employeeId;
    if (!targetId || !department?.trim() || !designation?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Employee ID, Department, and Designation are required.' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const deptTrimmed = department.trim();
    const desigTrimmed = designation.trim();
    const effectiveOrgId = organizationId || 'org-default';

    // Find employee by _id (if valid ObjectId) or employeeId
    let query: any = { employeeId: targetId };
    if (ObjectId.isValid(targetId)) {
      query = { $or: [{ _id: new ObjectId(targetId) }, { employeeId: targetId }] };
    }

    const empDoc = await db.collection('employees').findOne(query);

    if (!empDoc) {
      return NextResponse.json({ success: false, message: 'Employee not found' }, { status: 404 });
    }

    await db.collection('employees').updateOne(
      { _id: empDoc._id },
      {
        $set: {
          organizationId: effectiveOrgId,
          department: deptTrimmed,
          designation: desigTrimmed,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    // Also sync to user document if matched by employeeId or email
    await db.collection('users').updateMany(
      { $or: [{ employeeId: empDoc.employeeId }, { email: empDoc.email }] },
      {
        $set: {
          organizationId: effectiveOrgId,
          department: deptTrimmed,
          designation: desigTrimmed,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    await logAuditEvent(req, 'EMPLOYEE_STRUCTURE_UPDATED', {
      details: {
        employeeId: empDoc.employeeId,
        employeeName: `${empDoc.firstName} ${empDoc.lastName}`,
        department: deptTrimmed,
        designation: desigTrimmed,
        organizationId: effectiveOrgId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Employee "${empDoc.firstName} ${empDoc.lastName}" structure updated successfully.`,
    });
  } catch (error: any) {
    console.error('Error assigning employee structure:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to update employee structure' }, { status: 500 });
  }
}
