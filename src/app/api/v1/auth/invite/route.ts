import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { generateNumericOTP, hashToken, hashPassword } from '@/lib/cryptoAuth';
import { sendOtpEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN', 'ADMIN', 'HR']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const body = await req.json();
    const { firstName, lastName, email, role, phone, department, designation, managerId } = body;

    if (!firstName || !lastName || !email) {
      return NextResponse.json({ success: false, message: 'First name, last name, and email address are required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const requestedRole = (role || 'EMPLOYEE').toUpperCase();
    const validRoles = ['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN', 'SUPER_ADMIN'];

    if (!validRoles.includes(requestedRole)) {
      return NextResponse.json({ success: false, message: `Invalid account role: ${role}` }, { status: 400 });
    }

    // Role Security: Admin/HR users cannot invite SUPER_ADMIN accounts
    if (requestedRole === 'SUPER_ADMIN' && auth.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Only a Super Admin can issue invitations for the SUPER_ADMIN role.' },
        { status: 403 }
      );
    }

    // Tenant Isolation: Force organizationId from server auth context for Admin/HR callers
    let orgId = auth.organizationId;
    if (auth.role === 'SUPER_ADMIN' && body.organizationId) {
      orgId = body.organizationId;
    }

    const { db } = await connectToDatabase();
    const now = new Date();

    // Duplicate Check
    const existingUser = await db.collection('users').findOne({ email: cleanEmail });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: `An account already exists for email "${cleanEmail}".` },
        { status: 409 }
      );
    }

    const empCount = await db.collection('employees').countDocuments({ organizationId: orgId });
    const employeeId = body.employeeId?.trim() || `EMP-${String(empCount + 101).padStart(3, '0')}`;

    // Manager validation
    let validatedManagerId = '';
    if (managerId && managerId.trim()) {
      const cleanMgr = managerId.trim();
      if (cleanMgr !== employeeId && cleanMgr !== cleanEmail) {
        const mgr = await db.collection('employees').findOne({
          organizationId: orgId,
          $or: [{ employeeId: cleanMgr }, { id: cleanMgr }, { email: cleanMgr.toLowerCase() }],
        });
        if (mgr) {
          validatedManagerId = mgr.employeeId || cleanMgr;
        }
      }
    }

    const employeeDoc = {
      organizationId: orgId,
      employeeId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: cleanEmail,
      phone: phone ? phone.trim() : '',
      department: department || 'General',
      designation: designation || 'Staff',
      role: requestedRole,
      status: 'Active',
      joiningDate: now.toISOString().split('T')[0],
      location: 'Headquarters',
      managerId: validatedManagerId,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('employees').updateOne(
      { organizationId: orgId, employeeId },
      { $set: employeeDoc, $setOnInsert: { createdAt: now } },
      { upsert: true }
    );

    // Initial user doc in PENDING_VERIFICATION state
    const tempPass = `TempInv_${Date.now()}`;
    const { formatted, salt } = hashPassword(tempPass);
    const userDoc = {
      id: `usr-${employeeId.toLowerCase()}`,
      employeeId,
      name: `${firstName.trim()} ${lastName.trim()}`,
      email: cleanEmail,
      avatar: employeeDoc.avatar,
      role: requestedRole,
      organizationId: orgId,
      department: employeeDoc.department,
      designation: employeeDoc.designation,
      passwordHash: formatted,
      salt,
      status: 'PENDING_VERIFICATION',
      emailVerified: false,
      emailVerificationStatus: 'PENDING_VERIFICATION',
      isTwoFactorEnabled: false,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('users').updateOne(
      { email: cleanEmail },
      { $set: userDoc, $setOnInsert: { createdAt: now } },
      { upsert: true }
    );

    // Generate 6-digit OTP for invitation completion
    const rawOtp = generateNumericOTP(6);
    const otpHash = hashToken(rawOtp);
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24-hour invitation TTL

    await db.collection('auth_otp_tokens').deleteMany({
      email: cleanEmail,
      purpose: 'ACCOUNT_INVITATION',
    });

    await db.collection('auth_otp_tokens').insertOne({
      userId: employeeId,
      email: cleanEmail,
      organizationId: orgId,
      otpHash,
      purpose: 'ACCOUNT_INVITATION',
      expiresAt,
      attempts: 0,
      createdAt: now,
    });

    // Send real Gmail invitation
    const emailResult = await sendOtpEmail({
      to: cleanEmail,
      otp: rawOtp,
      purpose: 'ACCOUNT_INVITATION',
      userName: `${firstName.trim()} ${lastName.trim()}`,
      organizationName: orgId,
      role: requestedRole,
    });

    await logAuditEvent(req, 'ACCOUNT_INVITATION_SENT', {
      employeeId,
      details: {
        actorId: auth.userId,
        actorRole: auth.role,
        organizationId: orgId,
        targetEmail: cleanEmail,
        role: requestedRole,
        emailDelivered: emailResult.success,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Invitation sent successfully to ${cleanEmail}.`,
      email: cleanEmail,
      emailDelivered: emailResult.success,
    });
  } catch (error: any) {
    console.error('Error in POST /api/v1/auth/invite:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to issue account invitation.' },
      { status: 500 }
    );
  }
}
