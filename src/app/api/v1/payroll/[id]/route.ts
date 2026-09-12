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
    const { basic, hra, conveyance, medical, specialAllowance, otherAllowances, bonus, pf, pt, tds, esi, status } = body;

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;

    let query: any = { organizationId: orgId };
    if (ObjectId.isValid(id)) {
      query._id = new ObjectId(id);
    } else {
      query.employeeId = id;
    }

    const existing = await db.collection('payroll_records').findOne(query);
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Payroll record not found.' }, { status: 404 });
    }

    const newBasic = basic !== undefined ? Number(basic) : existing.basic;
    const newHra = hra !== undefined ? Number(hra) : (existing.allowances?.hra || 0);
    const newConveyance = conveyance !== undefined ? Number(conveyance) : (existing.allowances?.conveyance || 0);
    const newMedical = medical !== undefined ? Number(medical) : (existing.allowances?.medical || 0);
    const newSpecial = specialAllowance !== undefined ? Number(specialAllowance) : (existing.allowances?.specialAllowance || 0);
    const newOtherAllowances = otherAllowances !== undefined ? Number(otherAllowances) : (existing.allowances?.otherAllowances || 0);
    const newBonus = bonus !== undefined ? Number(bonus) : (existing.bonus || 0);

    const grossSalary = newBasic + newHra + newConveyance + newMedical + newSpecial + newOtherAllowances + (existing.overtimePay || 0) + newBonus;

    const newPf = pf !== undefined ? Number(pf) : existing.pf;
    const newPt = pt !== undefined ? Number(pt) : existing.pt;
    const newTds = tds !== undefined ? Number(tds) : existing.tds;
    const newEsi = esi !== undefined ? Number(esi) : (existing.esi || 0);
    const lopDeduction = existing.lopDays > 0 ? Math.round((newBasic / (existing.workingDays || 26)) * existing.lopDays) : 0;

    const totalDeductions = lopDeduction + newPf + newPt + newTds + newEsi + (existing.otherDeductions || 0);
    const netSalary = Math.max(0, grossSalary - totalDeductions);

    const updatedDoc = {
      basic: newBasic,
      allowances: {
        hra: newHra,
        conveyance: newConveyance,
        medical: newMedical,
        specialAllowance: newSpecial,
        otherAllowances: newOtherAllowances,
      },
      bonus: newBonus,
      grossSalary,
      pf: newPf,
      pt: newPt,
      tds: newTds,
      esi: newEsi,
      totalDeductions,
      netSalary,
      status: status || existing.status || 'PROCESSED',
      updatedAt: new Date(),
    };

    await db.collection('payroll_records').updateOne(query, { $set: updatedDoc });

    await logAuditEvent(req, 'EDIT_PAYROLL_RECORD', { employeeId: existing.employeeId, oldValue: existing, newValue: updatedDoc });

    const freshRecord = await db.collection('payroll_records').findOne(query);

    return NextResponse.json({
      success: true,
      message: 'Payroll record updated successfully.',
      data: freshRecord,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to update payroll record' }, { status: 500 });
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

    const existing = await db.collection('payroll_records').findOne(query);
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Payroll record not found.' }, { status: 404 });
    }

    await db.collection('payroll_records').deleteOne(query);

    await logAuditEvent(req, 'DELETE_PAYROLL_RECORD', { employeeId: existing.employeeId, details: existing });

    return NextResponse.json({
      success: true,
      message: 'Payroll record deleted successfully.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to delete payroll record' }, { status: 500 });
  }
}
