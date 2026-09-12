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
    const search = searchParams.get('search') || '';

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;

    const empQuery: any = { organizationId: orgId };
    if (deptFilter && deptFilter !== 'All') empQuery.department = deptFilter;
    if (auth.role === 'MANAGER' && auth.employeeId) {
      empQuery.$or = [
        { managerId: auth.employeeId },
        { reportingTo: auth.employeeId },
        { employeeId: auth.employeeId },
      ];
    }
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      empQuery.$or = [{ firstName: searchRegex }, { lastName: searchRegex }, { employeeId: searchRegex }];
    }

    const employees = await db.collection('employees').find(empQuery).toArray();
    const empIds = employees.map((e) => e.employeeId || e.id || e._id.toString());

    // Fetch leaves and leave balances
    const leaveRequests = await db
      .collection('leaves')
      .find({ organizationId: orgId, employeeId: { $in: empIds } })
      .toArray();

    const leaveBalances = await db
      .collection('leave_balances')
      .find({ organizationId: orgId, employeeId: { $in: empIds } })
      .toArray();

    // Index leave balances by employeeId
    const balMap: Record<string, any> = {};
    leaveBalances.forEach((b) => {
      balMap[b.employeeId] = b;
    });

    // Group leave stats by employeeId
    const leaveStatsMap: Record<
      string,
      { approved: number; pending: number; rejected: number; usedDays: number }
    > = {};

    leaveRequests.forEach((l) => {
      const empId = l.employeeId;
      if (!leaveStatsMap[empId]) {
        leaveStatsMap[empId] = { approved: 0, pending: 0, rejected: 0, usedDays: 0 };
      }
      const days = Number(l.daysCount || l.days || 1);
      const status = (l.status || '').toLowerCase();

      if (status === 'approved') {
        leaveStatsMap[empId].approved += 1;
        leaveStatsMap[empId].usedDays += days;
      } else if (status === 'pending') {
        leaveStatsMap[empId].pending += 1;
      } else if (status === 'rejected') {
        leaveStatsMap[empId].rejected += 1;
      }
    });

    const headers = [
      'Employee ID',
      'Employee Name',
      'Department',
      'Leave Type',
      'Allocated Balance',
      'Used Days',
      'Remaining Balance',
      'Pending Requests',
      'Approved Requests',
      'Rejected Requests',
    ];

    let totalAllocatedSum = 0;
    let totalUsedSum = 0;
    let totalPendingSum = 0;

    const rows = employees.map((e) => {
      const empId = e.employeeId || e.id || e._id.toString();
      const balObj = balMap[empId] || {};
      const stats = leaveStatsMap[empId] || { approved: 0, pending: 0, rejected: 0, usedDays: 0 };

      const allocated = Number(balObj.casualLeaveAllocated || balObj.allocated || 18);
      const used = stats.usedDays;
      const remaining = Math.max(0, allocated - used);

      totalAllocatedSum += allocated;
      totalUsedSum += used;
      totalPendingSum += stats.pending;

      return [
        empId,
        e.fullName || `${e.firstName || ''} ${e.lastName || ''}`.trim() || 'Employee',
        e.department || 'N/A',
        'Casual / Sick Leave',
        allocated,
        used,
        remaining,
        stats.pending,
        stats.approved,
        stats.rejected,
      ];
    });

    const summaryMetrics = [
      { label: 'Total Employees', value: employees.length },
      { label: 'Total Leave Allocated', value: `${totalAllocatedSum} Days` },
      { label: 'Total Used Days', value: `${totalUsedSum} Days` },
      { label: 'Pending Approvals', value: totalPendingSum },
    ];

    if (format === 'csv') {
      const csvStr = generateCSV(headers, rows);
      return new NextResponse(csvStr, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="Leave_Utilization_Audit.csv"',
        },
      });
    }

    if (format === 'excel') {
      const excelXml = generateExcelXML(
        'Leave Utilization Audit',
        { Department: deptFilter },
        headers,
        rows
      );
      return new NextResponse(excelXml, {
        headers: {
          'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
          'Content-Disposition': 'attachment; filename="Leave_Utilization_Audit.xls"',
        },
      });
    }

    return NextResponse.json({
      success: true,
      reportTitle: 'Leave Utilization Audit',
      count: employees.length,
      summaryMetrics,
      headers,
      data: employees.map((e, idx) => ({
        id: e.id || e._id.toString(),
        employeeId: rows[idx][0],
        name: rows[idx][1],
        department: rows[idx][2],
        leaveType: rows[idx][3],
        allocated: rows[idx][4],
        used: rows[idx][5],
        remaining: rows[idx][6],
        pending: rows[idx][7],
        approved: rows[idx][8],
        rejected: rows[idx][9],
      })),
    });
  } catch (error: any) {
    console.error('Error generating leave report:', error);
    return NextResponse.json({ success: false, message: error.message || 'Error generating leave report' }, { status: 500 });
  }
}
