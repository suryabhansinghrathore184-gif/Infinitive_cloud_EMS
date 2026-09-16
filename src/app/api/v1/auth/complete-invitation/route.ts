import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { hashToken, hashPassword } from '@/lib/cryptoAuth';
import { getSecurityConfig, validatePasswordPolicy } from '@/lib/securityPolicy';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp, otpCode, password } = body;
    const cleanEmail = email ? email.trim().toLowerCase() : null;
    const inputOtp = (otp || otpCode || '').trim();

    if (!cleanEmail || !inputOtp || !password) {
      return NextResponse.json(
        { success: false, message: 'Email address, 6-digit verification code, and new password are required.' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const secConfig = await getSecurityConfig(db);

    const policyResult = validatePasswordPolicy(password, secConfig);
    if (!policyResult.valid) {
      return NextResponse.json(
        { success: false, message: policyResult.errors.join(' ') },
        { status: 400 }
      );
    }

    const now = new Date();

    // Find active invitation token (purpose: ACCOUNT_INVITATION ONLY)
    const otpDoc = await db.collection('auth_otp_tokens').findOne({
      email: cleanEmail,
      purpose: 'ACCOUNT_INVITATION',
      expiresAt: { $gt: now },
    });

    if (!otpDoc) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired invitation code. Please request a new invitation.' },
        { status: 400 }
      );
    }

    if ((otpDoc.attempts || 0) >= 5) {
      await db.collection('auth_otp_tokens').deleteOne({ _id: otpDoc._id });
      return NextResponse.json(
        { success: false, message: 'Too many failed attempts. Please request a new invitation.' },
        { status: 429 }
      );
    }

    const hashedInput = hashToken(inputOtp);
    if (otpDoc.otpHash !== hashedInput) {
      await db.collection('auth_otp_tokens').updateOne(
        { _id: otpDoc._id },
        { $inc: { attempts: 1 } }
      );
      await logAuditEvent(req, 'OTP_VERIFICATION_FAILED', { details: { email: cleanEmail, purpose: otpDoc.purpose } });
      return NextResponse.json(
        { success: false, message: 'Invalid 6-digit verification code. Please check and try again.' },
        { status: 400 }
      );
    }

    // Hash new password using PBKDF2/SHA-256 with salt
    const { formatted, salt } = hashPassword(password);

    // Update users record
    await db.collection('users').updateOne(
      { email: cleanEmail },
      {
        $set: {
          passwordHash: formatted,
          salt,
          emailVerified: true,
          emailVerificationStatus: 'VERIFIED',
          status: 'ACTIVE',
          updatedAt: now,
        },
      }
    );

    // Update employees record
    await db.collection('employees').updateOne(
      { email: cleanEmail },
      {
        $set: {
          emailVerified: true,
          emailVerificationStatus: 'VERIFIED',
          status: 'Active',
          updatedAt: now,
        },
      }
    );

    // Consume OTP token (single-use)
    await db.collection('auth_otp_tokens').deleteOne({ _id: otpDoc._id });

    // Log audit events per user specification
    await logAuditEvent(req, 'ACCOUNT_INVITATION_ACCEPTED', { details: { email: cleanEmail } });
    await logAuditEvent(req, 'EMAIL_VERIFIED', { details: { email: cleanEmail, method: 'INVITATION_OTP' } });
    await logAuditEvent(req, 'ACCOUNT_ACTIVATED', { details: { email: cleanEmail } });

    return NextResponse.json({
      success: true,
      message: 'Account setup completed successfully! Your account is now active and verified.',
    });
  } catch (error: any) {
    console.error('Error in POST /api/v1/auth/complete-invitation:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to complete account setup due to a server error.' },
      { status: 500 }
    );
  }
}
