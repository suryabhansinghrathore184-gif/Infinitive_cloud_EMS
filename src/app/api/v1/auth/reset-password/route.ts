import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, newPassword, confirmPassword } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Invalid or missing password reset token.' },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'Passwords do not match.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. Please log in with your new password.',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to reset password.' },
      { status: 500 }
    );
  }
}
