import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { generateNumericOTP, hashToken } from '@/lib/cryptoAuth';
import { sendOtpEmail } from '@/lib/email';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, purpose = 'LOGIN' } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // 1. Rate Limit Check: 60-second resend cooldown
    const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);
    const recentOtp = await db.collection('auth_otp_tokens').findOne({
      email: cleanEmail,
      purpose,
      createdAt: { $gte: sixtySecondsAgo },
    });

    if (recentOtp) {
      await logAuditEvent(req, 'OTP_RATE_LIMITED', {
        details: { email: cleanEmail, reason: 'COOLDOWN_ACTIVE' },
      });
      return NextResponse.json(
        {
          success: false,
          message: 'A verification code was recently sent. Please wait 60 seconds before requesting another code.',
        },
        { status: 429 }
      );
    }

    // 2. Rate Limit Check: Hourly limit (max 5 requests per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const hourlyRequestCount = await db.collection('auth_otp_tokens').countDocuments({
      email: cleanEmail,
      purpose,
      createdAt: { $gte: oneHourAgo },
    });

    if (hourlyRequestCount >= 5) {
      await logAuditEvent(req, 'OTP_RATE_LIMITED', {
        details: { email: cleanEmail, reason: 'HOURLY_LIMIT_EXCEEDED' },
      });
      return NextResponse.json({
        success: true,
        message: 'If the account is eligible, a verification code has been sent.',
      });
    }

    // Lookup user in MongoDB users collection or employees collection
    const regex = new RegExp(`^${cleanEmail}$`, 'i');
    let userDoc = await db.collection('users').findOne({ email: regex });

    if (!userDoc) {
      const empDoc = await db.collection('employees').findOne({ email: regex });
      if (empDoc) {
        userDoc = {
          _id: empDoc._id,
          id: empDoc.id || empDoc.employeeId,
          name: `${empDoc.firstName || ''} ${empDoc.lastName || ''}`.trim() || 'Employee',
          email: empDoc.email,
          status: empDoc.status || 'Active',
        };
      }
    }

    // Generic anti-enumeration response if user does not exist or is inactive
    if (!userDoc || userDoc.status === 'Inactive' || userDoc.status === 'Suspended') {
      await new Promise((res) => setTimeout(res, 300));
      return NextResponse.json({
        success: true,
        message: 'If the account is eligible, a verification code has been sent.',
      });
    }

    // Generate 6-digit numeric OTP via crypto.randomInt(100000, 1000000)
    const rawOtp = generateNumericOTP(6);
    const otpHash = hashToken(rawOtp);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes TTL

    // Invalidate existing unused tokens for this email and purpose atomically
    await db.collection('auth_otp_tokens').deleteMany({
      email: cleanEmail,
      purpose,
    });

    // Store hashed OTP in auth_otp_tokens collection
    await db.collection('auth_otp_tokens').insertOne({
      userId: userDoc.id || userDoc._id.toString(),
      email: cleanEmail,
      otpHash,
      purpose,
      expiresAt,
      attempts: 0,
      createdAt: now,
    });

    // Dispatch real email via Gmail SMTP
    const emailResult = await sendOtpEmail({
      to: cleanEmail,
      otp: rawOtp,
      purpose,
      userName: userDoc.name || userDoc.firstName,
    });

    if (!emailResult.success) {
      console.warn(`Failed to dispatch OTP email to ${cleanEmail}:`, emailResult.error);
    }

    await logAuditEvent(req, 'OTP_REQUESTED', {
      details: { email: cleanEmail, purpose, emailDelivered: emailResult.success },
    });

    return NextResponse.json({
      success: true,
      message: 'If the account is eligible, a verification code has been sent.',
    });
  } catch (error: any) {
    console.error('Error in POST /api/v1/auth/request-otp:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to process OTP request. Please try again later.' },
      { status: 500 }
    );
  }
}
