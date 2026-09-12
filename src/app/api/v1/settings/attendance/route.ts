import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const DEFAULT_ATTENDANCE_RULES = {
  workStartTime: '09:00 AM',
  workEndTime: '06:00 PM',
  gracePeriodMinutes: 15,
  lateMarkingEnabled: true,
  halfDayThresholdHours: 4,
  minHoursFullDay: 8,
  overtimeEnabled: true,
  overtimeMinMinutes: 60,
  workingDaysPerWeek: 5,
  autoCheckoutEnabled: false,
  autoCheckoutTime: '11:59 PM',
  attendanceMethod: 'WEB_BIOMETRIC',
};

// GET /api/v1/settings/attendance - Fetch attendance rules
export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
    if (!perm.isAllowed) {
      return NextResponse.json(
        { success: false, message: perm.message },
        { status: perm.statusCode }
      );
    }

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;

    let orgDoc: any = await db.collection('organization_settings').findOne({ organizationId: orgId });

    if (!orgDoc || !orgDoc.attendance) {
      const updatedAttendance = DEFAULT_ATTENDANCE_RULES;
      await db.collection('organization_settings').updateOne(
        { organizationId: orgId },
        { $set: { attendance: updatedAttendance, updatedAt: new Date() } },
        { upsert: true }
      );
      if (!orgDoc) orgDoc = { attendance: updatedAttendance };
      else orgDoc.attendance = updatedAttendance;
    }

    return NextResponse.json({
      success: true,
      data: {
        organizationId: orgId,
        ...DEFAULT_ATTENDANCE_RULES,
        ...(orgDoc?.attendance || {}),
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/v1/settings/attendance:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch attendance rules.' },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/settings/attendance - Update attendance rules
export async function PATCH(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN', 'ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json(
        { success: false, message: perm.message },
        { status: perm.statusCode }
      );
    }

    const body = await req.json();
    const {
      workStartTime,
      workEndTime,
      gracePeriodMinutes,
      lateMarkingEnabled,
      halfDayThresholdHours,
      minHoursFullDay,
      overtimeEnabled,
      overtimeMinMinutes,
      workingDaysPerWeek,
      autoCheckoutEnabled,
      autoCheckoutTime,
      attendanceMethod,
    } = body;

    const graceMin = Number(gracePeriodMinutes);
    if (isNaN(graceMin) || graceMin < 0 || graceMin > 180) {
      return NextResponse.json(
        { success: false, message: 'Grace period must be a positive number between 0 and 180 minutes.' },
        { status: 400 }
      );
    }

    const halfDayHrs = Number(halfDayThresholdHours);
    if (isNaN(halfDayHrs) || halfDayHrs < 1 || halfDayHrs > 12) {
      return NextResponse.json(
        { success: false, message: 'Half day threshold must be between 1 and 12 hours.' },
        { status: 400 }
      );
    }

    const minFullHrs = Number(minHoursFullDay);
    if (isNaN(minFullHrs) || minFullHrs < halfDayHrs || minFullHrs > 16) {
      return NextResponse.json(
        { success: false, message: 'Minimum full day hours must be equal to or greater than half day threshold.' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;
    const now = new Date();

    const updatedAttendanceRules = {
      workStartTime: workStartTime || '09:00 AM',
      workEndTime: workEndTime || '06:00 PM',
      gracePeriodMinutes: graceMin,
      lateMarkingEnabled: Boolean(lateMarkingEnabled),
      halfDayThresholdHours: halfDayHrs,
      minHoursFullDay: minFullHrs,
      overtimeEnabled: Boolean(overtimeEnabled),
      overtimeMinMinutes: Number(overtimeMinMinutes) || 60,
      workingDaysPerWeek: Number(workingDaysPerWeek) || 5,
      autoCheckoutEnabled: Boolean(autoCheckoutEnabled),
      autoCheckoutTime: autoCheckoutTime || '11:59 PM',
      attendanceMethod: attendanceMethod || 'WEB_BIOMETRIC',
      updatedAt: now,
    };

    await db.collection('organization_settings').updateOne(
      { organizationId: orgId },
      {
        $set: {
          attendance: updatedAttendanceRules,
          updatedAt: now,
        },
      },
      { upsert: true }
    );

    await logAuditEvent(req, 'UPDATE_ATTENDANCE_SETTINGS', {
      details: { organizationId: orgId, rules: updatedAttendanceRules },
    });

    return NextResponse.json({
      success: true,
      message: 'Attendance rules updated successfully and applied to attendance calculations.',
      data: updatedAttendanceRules,
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/v1/settings/attendance:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update attendance settings.' },
      { status: 500 }
    );
  }
}
