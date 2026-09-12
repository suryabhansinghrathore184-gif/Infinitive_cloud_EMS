import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const employeeId = searchParams.get('employeeId');

    let query: any = { organizationId: orgId };
    if (date) query.date = date;
    if (employeeId) query.employeeId = employeeId;

    if (auth.role === 'EMPLOYEE' && auth.employeeId) {
      query.employeeId = auth.employeeId;
    } else if (auth.role === 'MANAGER' && auth.employeeId) {
      // Find direct report employees
      const team = await db.collection('employees').find({
        organizationId: orgId,
        $or: [{ managerId: auth.employeeId }, { reportingTo: auth.employeeId }, { employeeId: auth.employeeId }],
      }).toArray();
      const teamEmpIds = team.map((e) => e.employeeId || e._id.toString());
      query.employeeId = { $in: teamEmpIds };
    }

    const attendanceRecords = await db.collection('attendance').find(query).sort({ date: -1 }).toArray();

    return NextResponse.json({
      success: true,
      count: attendanceRecords.length,
      data: attendanceRecords,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch attendance records' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const body = await req.json();
    const { employeeId, employeeName, date, checkIn, checkOut, status, method, location } = body;

    const targetEmpId = employeeId || auth.employeeId || 'EMP-UNKNOWN';
    const targetDate = date || new Date().toISOString().split('T')[0];

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;
    const now = new Date();

    // Check if an employee record exists to fetch latest name if missing
    let empName = employeeName;
    if (!empName) {
      const emp = await db.collection('employees').findOne({ organizationId: orgId, employeeId: targetEmpId });
      if (emp) empName = `${emp.firstName} ${emp.lastName}`;
    }

    const attendanceDoc = {
      organizationId: orgId,
      employeeId: targetEmpId,
      employeeName: empName || 'Employee',
      date: targetDate,
      checkIn: checkIn || '09:00 AM',
      checkOut: checkOut || '06:00 PM',
      breakDuration: body.breakDuration || '1 hr',
      workingHours: body.workingHours || '8 hrs',
      status: status || 'Present',
      method: method || 'Web',
      location: location || 'Office HQ',
      updatedAt: now,
    };

    await db.collection('attendance').updateOne(
      { organizationId: orgId, employeeId: targetEmpId, date: targetDate, checkIn: attendanceDoc.checkIn },
      { $set: attendanceDoc, $setOnInsert: { createdAt: now } },
      { upsert: true }
    );

    await logAuditEvent(req, 'RECORD_ATTENDANCE', { employeeId: targetEmpId, details: attendanceDoc });

    return NextResponse.json({
      success: true,
      message: 'Attendance record saved successfully.',
      data: attendanceDoc,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to save attendance' }, { status: 500 });
  }
}
