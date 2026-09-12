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

    let query: any = {
      $or: [{ organizationId: orgId }, { organizationId: 'org-default' }, { organizationId: { $exists: false } }],
    };
    if (date) query.date = date;
    if (employeeId) query.employeeId = employeeId;

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

    const rawRecords = await db.collection('attendance').find(query).sort({ date: -1 }).toArray();
    const attendanceRecords = rawRecords.map((r) => ({
      ...r,
      date: typeof r.date === 'string' && r.date.includes('GMT')
        ? new Date(r.date).toISOString().split('T')[0]
        : r.date,
    }));

    return NextResponse.json({
      success: true,
      count: attendanceRecords.length,
      data: attendanceRecords,
    });
  } catch (error: any) {
    console.error('Attendance API Error:', error);
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

    // Fetch organization attendance rules to calculate Late / Present status if status not explicitly provided
    const orgSettings = await db.collection('organization_settings').findOne({ organizationId: orgId });
    const attRules = orgSettings?.attendance || { workStartTime: '09:00 AM', gracePeriodMinutes: 15, lateMarkingEnabled: true };

    let calculatedStatus = status;
    if (!calculatedStatus) {
      const checkInTimeStr = checkIn || '09:00 AM';
      // Parse checkIn and workStartTime
      try {
        const [timePart, modifier] = checkInTimeStr.split(' ');
        let [hours, minutes] = timePart.split(':').map(Number);
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;

        const [shiftTimePart, shiftModifier] = (attRules.workStartTime || '09:00 AM').split(' ');
        let [shiftHours, shiftMinutes] = shiftTimePart.split(':').map(Number);
        if (shiftModifier === 'PM' && shiftHours < 12) shiftHours += 12;
        if (shiftModifier === 'AM' && shiftHours === 12) shiftHours = 0;

        const checkInMins = hours * 60 + minutes;
        const shiftMins = shiftHours * 60 + shiftMinutes;
        const graceMins = Number(attRules.gracePeriodMinutes) || 15;

        if (attRules.lateMarkingEnabled && checkInMins > shiftMins + graceMins) {
          calculatedStatus = 'Late';
        } else {
          calculatedStatus = 'Present';
        }
      } catch {
        calculatedStatus = 'Present';
      }
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
      status: calculatedStatus,
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
