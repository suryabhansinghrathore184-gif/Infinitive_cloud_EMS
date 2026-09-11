import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { twoFactorToken } = body;

    if (!twoFactorToken) {
      return NextResponse.json(
        { success: false, message: 'Two-factor session token is missing.' },
        { status: 400 }
      );
    }

    const newTwoFactorToken = `2fa-tok-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    return NextResponse.json({
      success: true,
      message: 'A new 6-digit OTP has been sent to your registered email/phone (Use: 123456).',
      twoFactorToken: newTwoFactorToken,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to resend OTP.' },
      { status: 500 }
    );
  }
}
