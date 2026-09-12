import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN', 'ADMIN', 'HR']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const body = await req.json();
    const { employeeId, salaryStructureId, basicSalary, hra, conveyance, medical, specialAllowance, otherAllowances, bonus, effectiveFrom, effectiveTo } = body;

    if (!employeeId) {
      return NextResponse.json({ success: false, message: 'Employee ID is required.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;
    const now = new Date();

    const fromDate = effectiveFrom ? new Date(effectiveFrom) : now;
    const toDate = effectiveTo ? new Date(effectiveTo) : undefined;

    // Supercede previous active assignments for this employee
    await db.collection('salary_assignments').updateMany(
      { organizationId: orgId, employeeId, status: 'Active' },
      { $set: { status: 'Superceded', effectiveTo: fromDate, updatedAt: now } }
    );

    const assignmentDoc = {
      organizationId: orgId,
      employeeId,
      salaryStructureId: salaryStructureId || 'struct-std',
      basicSalary: Number(basicSalary) || 50000,
      hra: Number(hra) || 20000,
      conveyance: Number(conveyance) || 3000,
      medical: Number(medical) || 2000,
      specialAllowance: Number(specialAllowance) || 5000,
      otherAllowances: Number(otherAllowances) || 0,
      bonus: Number(bonus) || 0,
      effectiveFrom: fromDate,
      effectiveTo: toDate,
      status: 'Active',
      assignedBy: auth.email || auth.userId,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('salary_assignments').insertOne(assignmentDoc);

    await logAuditEvent(req, 'ASSIGN_EMPLOYEE_SALARY', { employeeId, details: assignmentDoc });

    return NextResponse.json({
      success: true,
      message: 'Salary structure assigned successfully with effective dating.',
      data: assignmentDoc,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to assign salary' }, { status: 500 });
  }
}
