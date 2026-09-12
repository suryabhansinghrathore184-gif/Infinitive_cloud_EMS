import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status') || 'All';
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;

    let query: any = {
      $or: [{ organizationId: orgId }, { organizationId: 'org-default' }, { organizationId: { $exists: false } }],
    };

    // Status filter
    if (statusFilter && statusFilter !== 'All' && statusFilter !== 'ALL') {
      query.status = statusFilter;
    }

    // RBAC: Manager & Employee Scoping
    if (auth.role === 'EMPLOYEE' && auth.employeeId) {
      query.employeeId = auth.employeeId;
    } else if (auth.role === 'MANAGER' && auth.employeeId) {
      const team = await db.collection('employees').find({
        organizationId: orgId,
        $or: [{ managerId: auth.employeeId }, { reportingTo: auth.employeeId }, { employeeId: auth.employeeId }],
      }).toArray();
      const teamEmpIds = team.map((e) => e.employeeId || e._id.toString());
      query.employeeId = { $in: teamEmpIds };
    }

    const rawRecords = await db.collection('attendance').find(query).sort({ date: -1, checkIn: 1 }).toArray();

    // Normalize date strings and apply date range filtering safely
    const attendanceRecords = rawRecords
      .map((r: any) => {
        let normDate = r.date || '';
        if (typeof normDate === 'string' && normDate.includes('GMT')) {
          const p = new Date(normDate);
          if (!isNaN(p.getTime())) normDate = p.toISOString().split('T')[0];
        }
        return { ...r, date: normDate };
      })
      .filter((r: any) => {
        if (fromDate && r.date < fromDate) return false;
        if (toDate && r.date > toDate) return false;
        return true;
      });

    if (!attendanceRecords || attendanceRecords.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No attendance records found for the selected filters.' },
        { status: 404 }
      );
    }

    // Generate CSV string with UTF-8 BOM
    const headers = [
      'Employee Name',
      'Employee ID',
      'Date',
      'Check-In',
      'Check-Out',
      'Break',
      'Working Hours',
      'Method',
      'Status',
    ];

    const rows = attendanceRecords.map((r) => [
      escapeCSV(r.employeeName || 'Employee'),
      escapeCSV(r.employeeId || 'EMP-N/A'),
      escapeCSV(r.date || ''),
      escapeCSV(r.checkIn || 'N/A'),
      escapeCSV(r.checkOut || 'N/A'),
      escapeCSV(r.breakDuration || '0 hr'),
      escapeCSV(r.workingHours || '0 hrs'),
      escapeCSV(r.method || 'Web'),
      escapeCSV(r.status || 'Present'),
    ]);

    const csvContent = '\uFEFF' + [headers.map(h => `"${h}"`).join(','), ...rows.map(row => row.join(','))].join('\r\n');

    const todayStr = new Date().toISOString().split('T')[0];
    const filename = `attendance-log-${todayStr}.csv`;

    await logAuditEvent(req, 'ATTENDANCE_EXPORT', {
      details: {
        statusFilter,
        fromDate: fromDate || 'ALL',
        toDate: toDate || 'ALL',
        exportedCount: attendanceRecords.length,
        filename,
      },
    });

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Unable to export attendance log. Please try again.' },
      { status: 500 }
    );
  }
}
