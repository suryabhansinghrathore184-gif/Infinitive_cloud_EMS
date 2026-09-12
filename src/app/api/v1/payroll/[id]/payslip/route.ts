import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
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

    const record = await db.collection('payroll_records').findOne(query);
    if (!record) {
      return NextResponse.json({ success: false, message: 'Payroll record not found.' }, { status: 404 });
    }

    // Role check: Employee can only fetch their own payslip
    if (auth.role === 'EMPLOYEE' && auth.employeeId && record.employeeId !== auth.employeeId) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. You can only access your own payslip.' },
        { status: 403 }
      );
    }

    // SAFEGUARD: Payslips can ONLY be generated from APPROVED or PAID records
    const validStatuses = ['APPROVED', 'PAID', 'Approved', 'Paid', 'Processed', 'PROCESSED'];
    if (!validStatuses.includes(record.status)) {
      return NextResponse.json(
        { success: false, message: `Payslip cannot be generated for payroll in '${record.status}' status. Must be APPROVED or PAID.` },
        { status: 400 }
      );
    }

    // Fetch company info for header
    const company = await db.collection('organizations').findOne({ organizationId: orgId });

    return NextResponse.json({
      success: true,
      data: {
        payslipNumber: `PAY-${record.payYear}-${String(record.payMonth).padStart(2, '0')}-${record.employeeId}`,
        company: company || { name: 'Enterprise Organization', address: 'HQ', city: 'Mumbai', country: 'India' },
        payrollRecord: record,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to generate payslip' }, { status: 500 });
  }
}
