import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { generateCSV, generateExcelXML } from '@/lib/exportHelper';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
    if (!perm.isAllowed || auth.role === 'EMPLOYEE') {
      return NextResponse.json({ success: false, message: 'Forbidden. Access restricted.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json';
    const deptFilter = searchParams.get('department') || 'All';
    const statusFilter = searchParams.get('status') || 'All';
    const search = searchParams.get('search') || '';

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;

    const query: any = { organizationId: orgId };
    if (deptFilter && deptFilter !== 'All') query.department = deptFilter;
    if (statusFilter && statusFilter !== 'All') query.status = statusFilter;
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [{ firstName: searchRegex }, { lastName: searchRegex }, { employeeId: searchRegex }, { department: searchRegex }];
    }

    const employees = await db.collection('employees').find(query).toArray();

    const totalHeadcount = employees.length;
    const activeEmployees = employees.filter((e) => e.status === 'Active' || e.status === 'Probation').length;
    const resignedEmployees = employees.filter((e) => e.status === 'Resigned' || e.status === 'Former Employee').length;
    const terminatedEmployees = employees.filter((e) => e.status === 'Terminated').length;
    const totalExits = resignedEmployees + terminatedEmployees;

    const attritionRate = totalHeadcount > 0 ? Number(((totalExits / totalHeadcount) * 100).toFixed(1)) : 0;

    // Calculate tenure for employees
    let totalTenureMonths = 0;
    let tenureCount = 0;

    const headers = [
      'Employee ID',
      'Employee Name',
      'Department',
      'Designation',
      'Joining Date',
      'Exit Date',
      'Status',
      'Tenure (Months)',
      'Resignation / Exit Reason',
    ];

    const rows = employees.map((e) => {
      const joiningDate = e.joiningDate ? new Date(e.joiningDate) : null;
      const exitDateStr = e.resignationDate || e.terminationDate || (e.status === 'Resigned' || e.status === 'Terminated' ? e.updatedAt : '');
      const exitDate = exitDateStr ? new Date(exitDateStr) : new Date();

      let tenureMonths = 'N/A';
      if (joiningDate && !isNaN(joiningDate.getTime())) {
        const diffMonths = Math.max(0, Math.round((exitDate.getTime() - joiningDate.getTime()) / (1000 * 60 * 60 * 24 * 30.4375)));
        tenureMonths = String(diffMonths);
        totalTenureMonths += diffMonths;
        tenureCount += 1;
      }

      const reason = e.resignationReason || e.exitReason || (e.status === 'Resigned' || e.status === 'Terminated' ? 'Career Progression' : 'Active Service');

      return [
        e.employeeId || e.id || '',
        e.fullName || `${e.firstName || ''} ${e.lastName || ''}`.trim() || 'Employee',
        e.department || 'N/A',
        e.designation || 'N/A',
        e.joiningDate || 'N/A',
        exitDateStr ? exitDateStr.slice(0, 10) : 'Active Service',
        e.status || 'Active',
        tenureMonths,
        reason,
      ];
    });

    const avgTenureMonths = tenureCount > 0 ? (totalTenureMonths / tenureCount / 12).toFixed(1) : '0';

    const summaryMetrics = [
      { label: 'Total Employees', value: totalHeadcount },
      { label: 'Active Headcount', value: activeEmployees },
      { label: 'Total Exits', value: totalExits },
      { label: 'Attrition Rate', value: `${attritionRate}%` },
      { label: 'Average Tenure', value: `${avgTenureMonths} Years` },
    ];

    if (format === 'csv') {
      const csvStr = generateCSV(headers, rows);
      return new NextResponse(csvStr, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="Employee_Attrition_Report.csv"',
        },
      });
    }

    if (format === 'excel') {
      const excelXml = generateExcelXML(
        'Employee Attrition & Turnover Report',
        { Department: deptFilter, Status: statusFilter },
        headers,
        rows
      );
      return new NextResponse(excelXml, {
        headers: {
          'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
          'Content-Disposition': 'attachment; filename="Employee_Attrition_Report.xls"',
        },
      });
    }

    return NextResponse.json({
      success: true,
      reportTitle: 'Employee Attrition & Turnover Report',
      count: employees.length,
      summaryMetrics,
      headers,
      data: employees.map((e, idx) => ({
        id: e.id || e._id.toString(),
        employeeId: rows[idx][0],
        name: rows[idx][1],
        department: rows[idx][2],
        designation: rows[idx][3],
        joiningDate: rows[idx][4],
        exitDate: rows[idx][5],
        status: rows[idx][6],
        tenureMonths: rows[idx][7],
        resignationReason: rows[idx][8],
      })),
    });
  } catch (error: any) {
    console.error('Error generating attrition report:', error);
    return NextResponse.json({ success: false, message: error.message || 'Error generating attrition report' }, { status: 500 });
  }
}
