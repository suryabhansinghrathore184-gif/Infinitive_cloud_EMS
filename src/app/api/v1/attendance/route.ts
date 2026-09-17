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
    const statusParam = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.max(1, Math.min(100, parseInt(limitParam, 10))) : 0;

    let query: any = {
      $or: [{ organizationId: orgId }, { organizationId: 'org-default' }, { organizationId: { $exists: false } }],
    };
    if (date) query.date = date;
    if (employeeId) query.employeeId = employeeId;
    if (statusParam && statusParam !== 'All') query.status = statusParam;

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

    const totalCount = await db.collection('attendance').countDocuments(query);

    let queryCursor = db.collection('attendance').find(query).sort({ date: -1 });
    if (limit > 0) {
      queryCursor = queryCursor.skip((page - 1) * limit).limit(limit);
    }

    const rawRecords = await queryCursor.toArray();
    const attendanceRecords = rawRecords.map((r) => ({
      ...r,
      date: typeof r.date === 'string' && r.date.includes('GMT')
        ? new Date(r.date).toISOString().split('T')[0]
        : r.date,
    }));

    return NextResponse.json({
      success: true,
      count: attendanceRecords.length,
      total: totalCount,
      page: limit > 0 ? page : 1,
      limit: limit > 0 ? limit : totalCount,
      totalPages: limit > 0 ? Math.ceil(totalCount / limit) : 1,
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
    const { action, employeeId, employeeName, date, checkIn, checkOut, status, method, location } = body;

    // Strict security: EMPLOYEE role MUST use their own authenticated session employeeId
    const targetEmpId = (auth.role === 'EMPLOYEE' && auth.employeeId)
      ? auth.employeeId
      : (employeeId || auth.employeeId || 'EMP-UNKNOWN');

    const targetDate = date || new Date().toISOString().split('T')[0];

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;
    const now = new Date();

    // Format current time into "hh:mm AM/PM"
    const nowTimeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    // Check if an employee record exists to fetch latest name if missing
    let empName = employeeName || auth.name;
    if (!empName) {
      const emp = await db.collection('employees').findOne({
        $or: [{ organizationId: orgId }, { organizationId: 'org-default' }],
        employeeId: targetEmpId,
      });
      if (emp) empName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.name;
    }

    // Handle Clock-In Action
    if (action === 'CLOCK_IN') {
      const existingToday = await db.collection('attendance').findOne({
        $or: [{ organizationId: orgId }, { organizationId: 'org-default' }, { organizationId: { $exists: false } }],
        employeeId: targetEmpId,
        date: targetDate,
      });

      if (existingToday && existingToday.checkIn && !existingToday.checkOut) {
        return NextResponse.json(
          { success: false, message: 'You are already checked in for today.' },
          { status: 400 }
        );
      }

      // Calculate Late / Present
      const orgSettings = await db.collection('organization_settings').findOne({ organizationId: orgId });
      const attRules = orgSettings?.attendance || { workStartTime: '09:00 AM', gracePeriodMinutes: 15, lateMarkingEnabled: true };

      let calculatedStatus = status || 'Present';
      try {
        const [timePart, modifier] = nowTimeStr.split(' ');
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
        }
      } catch {
        calculatedStatus = 'Present';
      }

      const clockInDoc = {
        organizationId: orgId,
        employeeId: targetEmpId,
        employeeName: empName || 'Employee',
        date: targetDate,
        checkIn: nowTimeStr,
        checkOut: '',
        status: calculatedStatus,
        method: method || 'Web',
        location: location || 'Office HQ',
        workingHours: 0,
        updatedAt: now,
      };

      await db.collection('attendance').updateOne(
        { employeeId: targetEmpId, date: targetDate },
        { $set: clockInDoc, $setOnInsert: { createdAt: now } },
        { upsert: true }
      );

      await logAuditEvent(req, 'CLOCK_IN', { employeeId: targetEmpId, details: clockInDoc });

      return NextResponse.json({
        success: true,
        message: 'Attendance checked in successfully.',
        data: clockInDoc,
      });
    }

    // Handle Clock-Out Action
    if (action === 'CLOCK_OUT') {
      const existingToday = await db.collection('attendance').findOne({
        $or: [{ organizationId: orgId }, { organizationId: 'org-default' }, { organizationId: { $exists: false } }],
        employeeId: targetEmpId,
        date: targetDate,
      });

      if (!existingToday || !existingToday.checkIn) {
        return NextResponse.json(
          { success: false, message: 'Cannot check out without checking in first.' },
          { status: 400 }
        );
      }

      if (existingToday.checkOut) {
        return NextResponse.json(
          { success: false, message: 'You have already checked out for today.' },
          { status: 400 }
        );
      }

      // Calculate working hours
      let hoursWorked = 8;
      try {
        const inStr = existingToday.checkIn;
        const [inTime, inMod] = inStr.split(' ');
        let [inH, inM] = inTime.split(':').map(Number);
        if (inMod === 'PM' && inH < 12) inH += 12;
        if (inMod === 'AM' && inH === 12) inH = 0;

        const [outTime, outMod] = nowTimeStr.split(' ');
        let [outH, outM] = outTime.split(':').map(Number);
        if (outMod === 'PM' && outH < 12) outH += 12;
        if (outMod === 'AM' && outH === 12) outH = 0;

        const diffMins = (outH * 60 + outM) - (inH * 60 + inM);
        hoursWorked = Math.max(0.1, Math.round((diffMins / 60) * 10) / 10);
      } catch {
        hoursWorked = 8;
      }

      const updateData = {
        checkOut: nowTimeStr,
        workingHours: hoursWorked,
        updatedAt: now,
      };

      await db.collection('attendance').updateOne(
        { employeeId: targetEmpId, date: targetDate },
        { $set: updateData }
      );

      await logAuditEvent(req, 'CLOCK_OUT', { employeeId: targetEmpId, details: updateData });

      return NextResponse.json({
        success: true,
        message: 'Attendance checked out successfully.',
        data: { ...existingToday, ...updateData },
      });
    }

    // Direct manual attendance upsert (Admin / HR)
    const attendanceDoc = {
      organizationId: orgId,
      employeeId: targetEmpId,
      employeeName: empName || 'Employee',
      date: targetDate,
      checkIn: checkIn || '09:00 AM',
      checkOut: checkOut || '06:00 PM',
      breakDuration: body.breakDuration || '1 hr',
      workingHours: body.workingHours || 8,
      status: status || 'Present',
      method: method || 'Web',
      location: location || 'Office HQ',
      updatedAt: now,
    };

    await db.collection('attendance').updateOne(
      { employeeId: targetEmpId, date: targetDate },
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
    console.error('Error in POST /api/v1/attendance:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to save attendance' }, { status: 500 });
  }
}
