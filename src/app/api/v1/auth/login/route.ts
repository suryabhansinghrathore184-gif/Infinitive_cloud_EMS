import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ensureDefaultUsersSeeded, UserRole } from '@/lib/auth';
import { verifyPassword, hashPassword, generateSecureToken, generateNumericOTP, hashToken } from '@/lib/cryptoAuth';
import { getSecurityConfig, checkAccountLockout, recordFailedLogin, recordSuccessfulLogin } from '@/lib/securityPolicy';
import { createNotification } from '@/lib/notifications/notificationService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password, rememberMe } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: 'Email/Employee ID and password are required.' },
        { status: 400 }
      );
    }

    await ensureDefaultUsersSeeded();

    const { db } = await connectToDatabase();
    const cleanIdentifier = identifier.trim().toLowerCase();

    // Check Account Lockout status
    const lockout = await checkAccountLockout(db, cleanIdentifier);
    if (lockout.isLocked) {
      return NextResponse.json(
        {
          success: false,
          message: `Account is temporarily locked due to repeated invalid login attempts. Please try again in ${lockout.remainingMinutes || 15} minute(s).`,
        },
        { status: 423 }
      );
    }

    // Lookup user in MongoDB users collection or employees collection
    const regex = new RegExp(`^${cleanIdentifier}$`, 'i');
    let userDoc = await db.collection('users').findOne({
      $or: [{ email: regex }, { employeeId: regex }, { id: cleanIdentifier }],
    });

    if (!userDoc) {
      const empDoc = await db.collection('employees').findOne({
        $or: [{ email: regex }, { employeeId: regex }],
      });

      if (empDoc) {
        const empRole = (empDoc.role || 'EMPLOYEE').toUpperCase();
        let defaultHash = 'emp123';
        if (empRole === 'ADMIN' || empRole === 'HR') defaultHash = 'admin123';
        else if (empRole === 'SUPER_ADMIN' || empRole === 'SUPER ADMIN') defaultHash = 'super123';
        else if (empRole === 'MANAGER') defaultHash = 'manager123';

        userDoc = {
          _id: empDoc._id,
          id: empDoc.id || empDoc.employeeId,
          employeeId: empDoc.employeeId,
          name: `${empDoc.firstName || ''} ${empDoc.lastName || ''}`.trim() || 'Employee',
          email: empDoc.email,
          role: empDoc.role || 'EMPLOYEE',
          organizationId: empDoc.organizationId || 'org-default',
          passwordHash: empDoc.passwordHash || defaultHash,
          status: empDoc.status || 'Active',
          emailVerified: true,
        };
      }
    }

    // If user not found, record failed login attempt generically
    if (!userDoc) {
      await recordFailedLogin(req, db, cleanIdentifier);
      return NextResponse.json(
        { success: false, message: 'Invalid email/employee ID or password.' },
        { status: 401 }
      );
    }

    // Verify account active status
    if (userDoc.status === 'Inactive' || userDoc.status === 'Suspended') {
      return NextResponse.json(
        { success: false, message: 'Your account is inactive or suspended. Please contact your organization administrator.' },
        { status: 403 }
      );
    }

    // Verify password using secure crypto verification
    const isValid = verifyPassword(password, userDoc.passwordHash || userDoc.password, userDoc.salt);
    if (!isValid) {
      const failedResult = await recordFailedLogin(req, db, userDoc.email || cleanIdentifier);
      if (failedResult.isLockedNow) {
        return NextResponse.json(
          {
            success: false,
            message: 'Account locked due to 5 consecutive failed login attempts. Please try again after 15 minutes.',
          },
          { status: 423 }
        );
      }
      return NextResponse.json(
        { success: false, message: 'Invalid email/employee ID or password.' },
        { status: 401 }
      );
    }

    // Upgrade legacy plain text password to hashed format automatically
    if (userDoc.password && !userDoc.passwordHash) {
      const { formatted, salt } = hashPassword(password);
      await db.collection('users').updateOne(
        { _id: userDoc._id },
        { $set: { passwordHash: formatted, salt }, $unset: { password: '' } }
      );
    }

    const secConfig = await getSecurityConfig(db);
    const userRoleStr = (userDoc.role || 'EMPLOYEE').toUpperCase();
    const isSuperAdmin = userRoleStr === 'SUPER_ADMIN' || userRoleStr === 'SUPER ADMIN';

    // Check if 2FA / OTP verification is required
    const requires2FA = userDoc.isTwoFactorEnabled || secConfig.mfaEnforced || (isSuperAdmin && secConfig.mfaForSuperAdminsOnly);

    if (requires2FA) {
      const twoFactorToken = `2fa-tok-${Date.now()}-${generateSecureToken(16)}`;
      const otpCode = generateNumericOTP(6);
      const hashedOtp = hashToken(otpCode);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

      await db.collection('auth_tokens').insertOne({
        type: '2FA_OTP',
        userId: userDoc.id || userDoc._id.toString(),
        email: userDoc.email,
        twoFactorToken,
        hashedOtp,
        expiresAt,
        createdAt: now,
      });

      // Dispatch real email / notification
      try {
        await createNotification({
          organizationId: userDoc.organizationId || 'org-default',
          recipientType: 'EMPLOYEE',
          recipientId: userDoc.employeeId || userDoc.email,
          eventType: '2fa_otp',
          category: 'SECURITY',
          title: 'EMS Security Code',
          message: `Your 2FA authentication code is: ${otpCode}. Code expires in 10 minutes.`,
          priority: 'HIGH',
          recipientEmail: userDoc.email,
        });
      } catch (notifErr) {
        console.warn('Notification dispatch note:', notifErr);
      }

      return NextResponse.json({
        success: true,
        message: 'Password verified. 2FA verification code sent to your registered email.',
        requiresTwoFactor: true,
        twoFactorToken,
      });
    }

    // Successful Login: Reset failed attempts & record success
    await recordSuccessfulLogin(req, db, userDoc);

    const nowMs = Date.now();
    const sessionDurationMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : secConfig.sessionTimeoutMinutes * 60 * 1000;
    const expiresAtMs = nowMs + sessionDurationMs;

    const normalizedRole = isSuperAdmin
      ? 'SUPER_ADMIN'
      : userRoleStr === 'ADMIN' || userRoleStr === 'HR' || userRoleStr === 'HR/ADMIN'
      ? 'ADMIN'
      : userRoleStr === 'MANAGER'
      ? 'MANAGER'
      : 'EMPLOYEE';

    const empId = userDoc.employeeId || 'EMP1001';
    const orgId = userDoc.organizationId || 'org-default';
    const userIdStr = userDoc.id || userDoc._id.toString();

    // Session token
    const accessToken = `jwt-session-${userIdStr}-${orgId}-${normalizedRole}-${empId}-${nowMs}`;
    const refreshToken = `jwt-refresh-${userIdStr}-${nowMs}`;

    // Store active session in user_sessions collection
    await db.collection('user_sessions').insertOne({
      sessionToken: accessToken,
      sessionTokenHash: hashToken(accessToken),
      userId: userIdStr,
      email: userDoc.email,
      name: userDoc.name || `${userDoc.firstName || ''} ${userDoc.lastName || ''}`.trim(),
      role: normalizedRole,
      organizationId: orgId,
      employeeId: empId,
      userAgent: req.headers.get('user-agent') || 'Browser',
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(expiresAtMs),
    });

    // Prepare User Payload
    const userData = {
      id: userIdStr,
      employeeId: empId,
      name: userDoc.name || `${userDoc.firstName || ''} ${userDoc.lastName || ''}`.trim() || 'User',
      email: userDoc.email,
      avatar: userDoc.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
      role: userDoc.role || normalizedRole,
      department: userDoc.department || 'General',
      designation: userDoc.designation || 'Staff',
      isTwoFactorEnabled: Boolean(userDoc.isTwoFactorEnabled),
    };

    // Construct response with HTTP-only session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login successful. Redirecting to your dashboard...',
      session: {
        user: userData,
        accessToken,
        refreshToken,
        expiresAt: expiresAtMs,
      },
    });

    // Set secure HTTP-only cookie
    response.cookies.set('ems_session', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: Math.floor(sessionDurationMs / 1000),
    });

    return response;
  } catch (error: any) {
    console.error('Error in POST /api/v1/auth/login:', error);
    return NextResponse.json(
      { success: false, message: 'Authentication service is temporarily unavailable. Please try again later.' },
      { status: 500 }
    );
  }
}
