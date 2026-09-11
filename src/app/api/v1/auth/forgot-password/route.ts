import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    // Always respond with success to prevent account enumeration attack
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been dispatched.',
      resetToken: `reset-tok-${Date.now()}`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to process password reset request.' },
      { status: 500 }
    );
  }
}
