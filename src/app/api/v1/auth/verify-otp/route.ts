import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { twoFactorToken, otpCode } = body;

    if (!twoFactorToken || !otpCode) {
      return NextResponse.json(
        { success: false, message: 'OTP code and verification token are required.' },
        { status: 400 }
      );
    }

    // Default test OTP code: 123456 or any 6-digit number
    if (otpCode !== '123456' && otpCode.length !== 6) {
      return NextResponse.json(
        { success: false, message: 'Invalid 6-digit OTP code entered.' },
        { status: 401 }
      );
    }

    const now = Date.now();
    const expiresAt = now + 15 * 60 * 1000;
    const accessToken = `jwt-access-2fa-${now}`;
    const refreshToken = `jwt-refresh-2fa-${now}`;

    return NextResponse.json({
      success: true,
      message: '2FA OTP verified successfully.',
      session: {
        user: {
          id: 'usr-2fa-01',
          employeeId: 'EMP2FA',
          name: 'Ananya Roy',
          email: '2fa@organization.com',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
          role: 'HR/Admin',
          department: 'Human Resources',
          isTwoFactorEnabled: true,
        },
        accessToken,
        refreshToken,
        expiresAt,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'OTP verification failed.' },
      { status: 500 }
    );
  }
}
