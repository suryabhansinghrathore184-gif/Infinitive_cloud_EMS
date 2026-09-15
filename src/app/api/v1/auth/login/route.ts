import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ensureDefaultUsersSeeded } from '@/lib/auth';
import { verifyPassword, hashPassword, generateSecureToken, generateNumericOTP, hashToken } from '@/lib/cryptoAuth';
import { getSecurityConfig, checkAccountLockout, recordFailedLogin, recordSuccessfulLogin } from '@/lib/securityPolicy';
import { createNotification } from '@/lib/notifications/notificationService';
import { sendOtpEmail } from '@/lib/email';
import { IS_DEMO_MODE, DEMO_ACCOUNTS } from '@/lib/demoConfig';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    service: 'EMS/HRMS Authentication API (Demo & Real Auth Ready)',
    endpoint: '/api/v1/auth/login',
    method: 'POST',
    isDemoMode: IS_DEMO_MODE,
    status: 'Operational',
  });
}

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

    const cleanIdentifier = identifier.trim().toLowerCase();

    // 1. Check Demo Mode Accounts when DEMO_MODE is active
    if (IS_DEMO_MODE) {
      const demoAccount = DEMO_ACCOUNTS.find(
        (acc) => acc.email.toLowerCase() === cleanIdentifier && acc.password === password
      );

      if (demoAccount) {
        const { db } = await connectToDatabase();
        await ensureDefaultUsersSeeded();

        const nowMs = Date.now();
        const sessionDurationMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
        const expiresAtMs = nowMs + sessionDurationMs;

        const accessToken = `jwt-session-${demoAccount.id}-org-default-${demoAccount.role}-${demoAccount.employeeId}-${nowMs}`;
        const refreshToken = `jwt-refresh-${demoAccount.id}-${nowMs}`;

        // Upsert active demo session in user_sessions collection
        await db.collection('user_sessions').updateOne(
          { sessionToken: accessToken },
          {
            $set: {
              sessionToken: accessToken,
              sessionTokenHash: hashToken(accessToken),
              userId: demoAccount.id,
              email: demoAccount.email,
              name: demoAccount.name,
              role: demoAccount.role,
              organizationId: 'org-default',
              employeeId: demoAccount.employeeId,
              userAgent: req.headers.get('user-agent') || 'Browser',
              ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
              status: 'ACTIVE',
              isDemoSession: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              expiresAt: new Date(expiresAtMs),
            },
          },
          { upsert: true }
        );

        const userData = {
          id: demoAccount.id,
          employeeId: demoAccount.employeeId,
          name: demoAccount.name,
          email: demoAccount.email,
          avatar: demoAccount.role === 'SUPER_ADMIN'
            ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
          role: demoAccount.role,
          department: demoAccount.role === 'SUPER_ADMIN' ? 'Executive Board' : 'Human Resources',
          designation: demoAccount.role === 'SUPER_ADMIN' ? 'Platform Super Admin' : 'HR Administrator',
          isTwoFactorEnabled: false,
        };

        const response = NextResponse.json({
          success: true,
          message: `Demo sign-in successful as ${demoAccount.label}. Redirecting to dashboard...`,
          session: {
            user: userData,
            accessToken,
            refreshToken,
            expiresAt: expiresAtMs,
          },
        });

        response.cookies.set('ems_session', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: Math.floor(sessionDurationMs / 1000),
        });

        return response;
      }
    }

    // 2. Production Real Authentication Flow
    await ensureDefaultUsersSeeded();
    const { db } = await connectToDatabase();

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

    if (!userDoc) {
      await recordFailedLogin(req, db, cleanIdentifier);
      return NextResponse.json(
        { success: false, message: 'Invalid email/employee ID or password.' },
        { status: 401 }
      );
    }

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

    const secConfig = await getSecurityConfig(db);
    const userRoleStr = (userDoc.role || 'EMPLOYEE').toUpperCase();
    const isSuperAdmin = userRoleStr === 'SUPER_ADMIN' || userRoleStr === 'SUPER ADMIN';

    const requires2FA = userDoc.isTwoFactorEnabled || secConfig.mfaEnforced || (isSuperAdmin && secConfig.mfaForSuperAdminsOnly);

    if (requires2FA) {
      const twoFactorToken = `2fa-tok-${Date.now()}-${generateSecureToken(16)}`;
      const otpCode = generateNumericOTP(6);
      const hashedOtp = hashToken(otpCode);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

      await db.collection('auth_tokens').insertOne({
        type: '2FA_OTP',
        userId: userDoc.id || userDoc._id.toString(),
        email: userDoc.email,
        twoFactorToken,
        hashedOtp,
        expiresAt,
        createdAt: now,
      });

      try {
        await sendOtpEmail({
          to: userDoc.email,
          otp: otpCode,
          purpose: '2FA',
          userName: userDoc.name || `${userDoc.firstName || ''} ${userDoc.lastName || ''}`.trim(),
        });
      } catch (emailErr) {
        console.warn('2FA Email dispatch warning:', emailErr);
      }

      return NextResponse.json({
        success: true,
        message: 'Password verified. 2FA verification code sent to your registered email.',
        requiresTwoFactor: true,
        twoFactorToken,
      });
    }

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

    const empId = userDoc.employeeId || (
      isSuperAdmin ? 'SUP0001' :
      normalizedRole === 'ADMIN' ? 'EMP9201' :
      normalizedRole === 'MANAGER' ? 'MGR1001' :
      'EMP1001'
    );
    const orgId = userDoc.organizationId || 'org-default';
    const userIdStr = userDoc.id || userDoc._id.toString();

    const accessToken = `jwt-session-${userIdStr}-${orgId}-${normalizedRole}-${empId}-${nowMs}`;
    const refreshToken = `jwt-refresh-${userIdStr}-${nowMs}`;

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
