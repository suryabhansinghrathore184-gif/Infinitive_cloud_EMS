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
    const locFilter = searchParams.get('location') || 'All';
    const statusFilter = searchParams.get('status') || 'All';
    const search = searchParams.get('search') || '';

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;

    const query: any = { organizationId: orgId };

    if (auth.role === 'MANAGER' && auth.employeeId) {
      query.$or = [
        { managerId: auth.employeeId },
        { reportingTo: auth.employeeId },
        { employeeId: auth.employeeId },
      ];
    }

    if (deptFilter && deptFilter !== 'All') query.department = deptFilter;
    if (locFilter && locFilter !== 'All') query.location = locFilter;
    if (statusFilter && statusFilter !== 'All') query.status = statusFilter;

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$and = [
        ...(query.$and || []),
        {
          $or: [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { employeeId: searchRegex },
            { email: searchRegex },
            { department: searchRegex },
            { designation: searchRegex },
          ],
        },
      ];
    }

    const employees = await db
      .collection('employees')
      .find(query)
      .sort({ employeeId: 1, firstName: 1 })
      .toArray();

    const headers = [
      'Employee ID',
      'Employee Name',
      'Department',
      'Designation',
      'Location',
      'Employment Type',
      'Joining Date',
      'Status',
    ];

    const rows = employees.map((e) => [
      e.employeeId || e.id || '',
      e.fullName || `${e.firstName || ''} ${e.lastName || ''}`.trim() || 'Employee',
      e.department || 'N/A',
      e.designation || 'N/A',
      e.location || 'N/A',
      e.employmentType || 'Full-time',
      e.joiningDate || 'N/A',
      e.status || 'Active',
    ]);

    const activeCount = employees.filter((e) => e.status === 'Active' || e.status === 'Probation').length;
    const summaryMetrics = [
      { label: 'Total Employees', value: employees.length },
      { label: 'Active Headcount', value: activeCount },
      { label: 'Departments', value: new Set(employees.map((e) => e.department)).size },
      { label: 'Locations', value: new Set(employees.map((e) => e.location)).size },
    ];

    if (format === 'csv') {
      const csvStr = generateCSV(headers, rows);
      return new NextResponse(csvStr, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="Employee_Directory_Report.csv"',
        },
      });
    }

    if (format === 'excel') {
      const excelXml = generateExcelXML(
        'Employee Directory Report',
        { Department: deptFilter, Location: locFilter, Status: statusFilter },
        headers,
        rows
      );
      return new NextResponse(excelXml, {
        headers: {
          'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
          'Content-Disposition': 'attachment; filename="Employee_Directory_Report.xls"',
        },
      });
    }

    return NextResponse.json({
      success: true,
      reportTitle: 'Employee Directory Report',
      count: employees.length,
      summaryMetrics,
      headers,
      data: employees.map((e, idx) => ({
        id: e.id || e._id.toString(),
        employeeId: rows[idx][0],
        name: rows[idx][1],
        department: rows[idx][2],
        designation: rows[idx][3],
        location: rows[idx][4],
        employmentType: rows[idx][5],
        joiningDate: rows[idx][6],
        status: rows[idx][7],
      })),
    });
  } catch (error: any) {
    console.error('Error generating employee directory report:', error);
    return NextResponse.json({ success: false, message: error.message || 'Error generating report' }, { status: 500 });
  }
}
