import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { generateCSV, generateExcelXML } from '@/lib/exportHelper';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN', 'ADMIN', 'HR']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: 'Forbidden. Payroll report requires HR permission.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json';
    const deptFilter = searchParams.get('department') || 'All';
    const monthFilter = searchParams.get('month') || ''; // e.g. "2026-08"
    const search = searchParams.get('search') || '';

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;

    const query: any = { organizationId: orgId };
    if (monthFilter) {
      query.payrollPeriod = monthFilter;
    }
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [{ employeeName: searchRegex }, { employeeId: searchRegex }, { department: searchRegex }];
    }

    const rawPayrollRecords = await db
      .collection('payroll_records')
      .find(query)
      .sort({ payrollPeriod: -1, employeeName: 1 })
      .toArray();

    // Also fetch employees if department filter is active or missing in payroll records
    const employees = await db.collection('employees').find({ organizationId: orgId }).toArray();
    const empDeptMap: Record<string, string> = {};
    employees.forEach((e) => {
      empDeptMap[e.employeeId || e.id] = e.department || 'N/A';
    });

    const filteredRecords = rawPayrollRecords.filter((p) => {
      const dept = p.department || empDeptMap[p.employeeId] || 'N/A';
      if (deptFilter && deptFilter !== 'All' && dept !== deptFilter) return false;
      return true;
    });

    const headers = [
      'Employee ID',
      'Employee Name',
      'Department',
      'Payroll Period',
      'Gross Salary (₹)',
      'PF Deduction (₹)',
      'PT Deduction (₹)',
      'TDS Deduction (₹)',
      'Total Deductions (₹)',
      'Net Salary (₹)',
      'Payroll Status',
      'Payment Status',
    ];

    let totalGrossSum = 0;
    let totalDeductionsSum = 0;
    let totalNetSum = 0;

    const rows = filteredRecords.map((p) => {
      const gross = Number(p.grossSalary || p.basicSalary || 0);
      const pf = Number(p.pfAmount || p.pfDeduction || 0);
      const pt = Number(p.ptAmount || p.ptDeduction || 0);
      const tds = Number(p.tdsAmount || p.tdsDeduction || 0);
      const totalDeductions = Number(p.totalDeductions || pf + pt + tds);
      const net = Number(p.netSalary || Math.max(0, gross - totalDeductions));

      totalGrossSum += gross;
      totalDeductionsSum += totalDeductions;
      totalNetSum += net;

      return [
        p.employeeId || 'N/A',
        p.employeeName || 'Employee',
        p.department || empDeptMap[p.employeeId] || 'N/A',
        p.payrollPeriod || 'Current Month',
        gross.toLocaleString('en-IN'),
        pf.toLocaleString('en-IN'),
        pt.toLocaleString('en-IN'),
        tds.toLocaleString('en-IN'),
        totalDeductions.toLocaleString('en-IN'),
        net.toLocaleString('en-IN'),
        p.status || 'Processed',
        p.paymentStatus || (p.status === 'Paid' || p.status === 'Processed' ? 'Paid' : 'Pending'),
      ];
    });

    const summaryMetrics = [
      { label: 'Total Records', value: filteredRecords.length },
      { label: 'Total Gross Disbursal', value: `₹${totalGrossSum.toLocaleString('en-IN')}` },
      { label: 'Total Net Disbursal', value: `₹${totalNetSum.toLocaleString('en-IN')}` },
      { label: 'Total Deductions', value: `₹${totalDeductionsSum.toLocaleString('en-IN')}` },
    ];

    if (format === 'csv') {
      const csvStr = generateCSV(headers, rows);
      return new NextResponse(csvStr, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="Payroll_Disbursal_Register.csv"',
        },
      });
    }

    if (format === 'excel') {
      const excelXml = generateExcelXML(
        'Payroll Disbursal Register',
        { Period: monthFilter || 'All Periods', Department: deptFilter },
        headers,
        rows
      );
      return new NextResponse(excelXml, {
        headers: {
          'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
          'Content-Disposition': 'attachment; filename="Payroll_Disbursal_Register.xls"',
        },
      });
    }

    return NextResponse.json({
      success: true,
      reportTitle: 'Payroll Disbursal Register',
      count: filteredRecords.length,
      summaryMetrics,
      headers,
      data: filteredRecords.map((p, idx) => ({
        id: p.id || p._id.toString(),
        employeeId: rows[idx][0],
        name: rows[idx][1],
        department: rows[idx][2],
        payrollPeriod: rows[idx][3],
        grossSalary: rows[idx][4],
        pfDeduction: rows[idx][5],
        ptDeduction: rows[idx][6],
        tdsDeduction: rows[idx][7],
        totalDeductions: rows[idx][8],
        netSalary: rows[idx][9],
        payrollStatus: rows[idx][10],
        paymentStatus: rows[idx][11],
      })),
    });
  } catch (error: any) {
    console.error('Error generating payroll report:', error);
    return NextResponse.json({ success: false, message: error.message || 'Error generating payroll report' }, { status: 500 });
  }
}
