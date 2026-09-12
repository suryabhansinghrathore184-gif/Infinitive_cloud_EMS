import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { hashToken, generateSecureToken } from '@/lib/cryptoAuth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { twoFactorToken, otpCode } = body;

    if (!twoFactorToken || !otpCode) {
      return NextResponse.json(
        { success: false, message: 'OTP code and verification token are required.' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const now = new Date();

    // Look up token record in auth_tokens
    const tokenDoc = await db.collection('auth_tokens').findOne({
      twoFactorToken,
      type: '2FA_OTP',
      expiresAt: { $gt: now },
    });

    if (!tokenDoc) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired 2FA verification session. Please log in again.' },
        { status: 401 }
      );
    }

    const hashedInputOtp = hashToken(otpCode.trim());

    if (tokenDoc.hashedOtp !== hashedInputOtp) {
      // Record failed OTP attempt
      await db.collection('auth_tokens').updateOne(
        { _id: tokenDoc._id },
        { $inc: { attempts: 1 } }
      );

      await logAuditEvent(req, 'OTP_FAILED', { details: { email: tokenDoc.email } });

      return NextResponse.json(
        { success: false, message: 'Invalid verification code entered. Please check and try again.' },
        { status: 401 }
      );
    }

    // Delete used OTP token
    await db.collection('auth_tokens').deleteOne({ _id: tokenDoc._id });

    // Look up user document
    const userDoc = await db.collection('users').findOne({ email: tokenDoc.email });
    if (!userDoc) {
      return NextResponse.json(
        { success: false, message: 'Authenticated user record not found.' },
        { status: 404 }
      );
    }

    const userRoleStr = (userDoc.role || 'EMPLOYEE').toUpperCase();
    const isSuperAdmin = userRoleStr === 'SUPER_ADMIN' || userRoleStr === 'SUPER ADMIN';

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

    const nowMs = Date.now();
    const expiresAtMs = nowMs + 24 * 60 * 60 * 1000;
    const accessToken = `jwt-session-${userIdStr}-${orgId}-${normalizedRole}-${empId}-${nowMs}`;
    const refreshToken = `jwt-refresh-${userIdStr}-${nowMs}`;

    // Store active session in user_sessions collection
    await db.collection('user_sessions').insertOne({
      sessionToken: accessToken,
      sessionTokenHash: hashToken(accessToken),
      userId: userIdStr,
      email: userDoc.email,
      name: userDoc.name || 'Authenticated User',
      role: normalizedRole,
      organizationId: orgId,
      employeeId: empId,
      userAgent: req.headers.get('user-agent') || 'Browser',
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(expiresAtMs),
    });

    await logAuditEvent(req, 'OTP_VERIFIED', {
      details: { email: userDoc.email, role: normalizedRole },
    });

    const userData = {
      id: userIdStr,
      employeeId: empId,
      name: userDoc.name || 'User',
      email: userDoc.email,
      avatar: userDoc.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
      role: userDoc.role || normalizedRole,
      department: userDoc.department || 'General',
      designation: userDoc.designation || 'Staff',
      isTwoFactorEnabled: true,
    };

    const response = NextResponse.json({
      success: true,
      message: '2FA OTP verified successfully.',
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
      maxAge: 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error('Error in POST /api/v1/auth/verify-otp:', error);
    return NextResponse.json(
      { success: false, message: 'OTP verification failed.' },
      { status: 500 }
    );
  }
}
