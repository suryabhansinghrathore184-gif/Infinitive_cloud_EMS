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
    const monthFilter = searchParams.get('month') || ''; // e.g. "2026-09"
    const search = searchParams.get('search') || '';

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;

    // Fetch employees
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

    // Fetch attendance for period
    const attQuery: any = {
      $or: [{ organizationId: orgId }, { organizationId: 'org-default' }, { organizationId: { $exists: false } }],
      employeeId: { $in: empIds },
    };

    if (monthFilter) {
      attQuery.date = { $regex: `^${monthFilter}` };
    }

    const attendanceRecords = await db.collection('attendance').find(attQuery).toArray();

    // Group attendance by employeeId
    const attMap: Record<
      string,
      { present: number; absent: number; late: number; lateHours: number; overtimeHours: number; totalDays: number }
    > = {};

    attendanceRecords.forEach((r) => {
      const empId = r.employeeId;
      if (!attMap[empId]) {
        attMap[empId] = { present: 0, absent: 0, late: 0, lateHours: 0, overtimeHours: 0, totalDays: 0 };
      }
      attMap[empId].totalDays += 1;
      const status = (r.status || '').toLowerCase();
      if (status === 'present' || status === 'half day') {
        attMap[empId].present += status === 'half day' ? 0.5 : 1;
      } else if (status === 'absent') {
        attMap[empId].absent += 1;
      } else if (status === 'late') {
        attMap[empId].present += 1;
        attMap[empId].late += 1;
      }

      if (r.lateHours && !isNaN(Number(r.lateHours))) {
        attMap[empId].lateHours += Number(r.lateHours);
      }
      if (r.overtimeHours && !isNaN(Number(r.overtimeHours))) {
        attMap[empId].overtimeHours += Number(r.overtimeHours);
      }
    });

    const headers = [
      'Employee ID',
      'Employee Name',
      'Department',
      'Working Days',
      'Present Days',
      'Absent Days',
      'Late Days',
      'Total Late Hours',
      'Overtime Hours',
      'Attendance %',
    ];

    let totalWorkingDaysSum = 0;
    let totalPresentDaysSum = 0;
    let totalOvertimeHoursSum = 0;

    const rows = employees.map((e) => {
      const empId = e.employeeId || e.id || e._id.toString();
      const stats = attMap[empId] || { present: 0, absent: 0, late: 0, lateHours: 0, overtimeHours: 0, totalDays: 22 };
      const workingDays = stats.totalDays > 0 ? stats.totalDays : 22;
      const presentDays = stats.present;
      const absentDays = stats.absent > 0 ? stats.absent : Math.max(0, workingDays - presentDays);
      const lateDays = stats.late;
      const lateHours = Number(stats.lateHours.toFixed(1));
      const overtimeHours = Number(stats.overtimeHours.toFixed(1));
      const attPercent = workingDays > 0 ? Number(((presentDays / workingDays) * 100).toFixed(1)) : 0;

      totalWorkingDaysSum += workingDays;
      totalPresentDaysSum += presentDays;
      totalOvertimeHoursSum += overtimeHours;

      return [
        empId,
        e.fullName || `${e.firstName || ''} ${e.lastName || ''}`.trim() || 'Employee',
        e.department || 'N/A',
        workingDays,
        presentDays,
        absentDays,
        lateDays,
        lateHours,
        overtimeHours,
        `${attPercent}%`,
      ];
    });

    const avgAttendancePercent =
      totalWorkingDaysSum > 0 ? Number(((totalPresentDaysSum / totalWorkingDaysSum) * 100).toFixed(1)) : 0;

    const summaryMetrics = [
      { label: 'Total Employees', value: employees.length },
      { label: 'Average Turnout Rate', value: `${avgAttendancePercent}%` },
      { label: 'Total Overtime Hours', value: `${totalOvertimeHoursSum.toFixed(1)} hrs` },
    ];

    if (format === 'csv') {
      const csvStr = generateCSV(headers, rows);
      return new NextResponse(csvStr, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="Monthly_Attendance_Summary.csv"',
        },
      });
    }

    if (format === 'excel') {
      const excelXml = generateExcelXML(
        'Monthly Attendance Summary',
        { Month: monthFilter || 'Current Month', Department: deptFilter },
        headers,
        rows
      );
      return new NextResponse(excelXml, {
        headers: {
          'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
          'Content-Disposition': 'attachment; filename="Monthly_Attendance_Summary.xls"',
        },
      });
    }

    return NextResponse.json({
      success: true,
      reportTitle: 'Monthly Attendance Summary',
      count: employees.length,
      summaryMetrics,
      headers,
      data: employees.map((e, idx) => ({
        id: e.id || e._id.toString(),
        employeeId: rows[idx][0],
        name: rows[idx][1],
        department: rows[idx][2],
        workingDays: rows[idx][3],
        presentDays: rows[idx][4],
        absentDays: rows[idx][5],
        lateDays: rows[idx][6],
        lateHours: rows[idx][7],
        overtimeHours: rows[idx][8],
        attendancePercentage: rows[idx][9],
      })),
    });
  } catch (error: any) {
    console.error('Error generating attendance report:', error);
    return NextResponse.json({ success: false, message: error.message || 'Error generating attendance report' }, { status: 500 });
  }
}
