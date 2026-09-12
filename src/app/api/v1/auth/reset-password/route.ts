import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { hashToken, hashPassword } from '@/lib/cryptoAuth';
import { getSecurityConfig, validatePasswordPolicy } from '@/lib/securityPolicy';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, newPassword, confirmPassword } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Invalid or missing password reset token.' },
        { status: 400 }
      );
    }

    if (!newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'New password and confirmation password are required.' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'Passwords do not match.' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const secConfig = await getSecurityConfig(db);

    // Validate password against security policy
    const policyResult = validatePasswordPolicy(newPassword, secConfig);
    if (!policyResult.valid) {
      return NextResponse.json(
        { success: false, message: policyResult.errors.join(' ') },
        { status: 400 }
      );
    }

    const tokenHash = hashToken(token);
    const now = new Date();

    // Find token record in password_reset_tokens
    const tokenDoc = await db.collection('password_reset_tokens').findOne({
      tokenHash,
      used: false,
      expiresAt: { $gt: now },
    });

    if (!tokenDoc) {
      return NextResponse.json(
        { success: false, message: 'This password reset link is invalid or has expired.' },
        { status: 400 }
      );
    }

    const { formatted, salt } = hashPassword(newPassword);

    // Update user password in users collection
    await db.collection('users').updateOne(
      { email: tokenDoc.email },
      {
        $set: {
          passwordHash: formatted,
          salt,
          failedLoginAttempts: 0,
          lockoutUntil: null,
          updatedAt: now,
        },
        $unset: { password: '' },
      }
    );

    // Update employee document if exists
    await db.collection('employees').updateOne(
      { email: tokenDoc.email },
      {
        $set: {
          passwordHash: formatted,
          salt,
          updatedAt: now,
        },
      }
    );

    // Mark reset token as used
    await db.collection('password_reset_tokens').updateOne(
      { _id: tokenDoc._id },
      { $set: { used: true, usedAt: now } }
    );

    // Revoke all existing active sessions for this user for security
    await db.collection('user_sessions').deleteMany({ email: tokenDoc.email });

    await logAuditEvent(req, 'PASSWORD_RESET_SUCCESS', { details: { email: tokenDoc.email } });

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. Please log in with your new password.',
    });
  } catch (error: any) {
    console.error('Error in POST /api/v1/auth/reset-password:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to reset password.' },
      { status: 500 }
    );
  }
}
