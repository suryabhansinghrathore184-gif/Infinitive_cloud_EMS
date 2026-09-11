import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: 'Refresh token is required.' },
        { status: 400 }
      );
    }

    if (refreshToken.includes('invalid') || refreshToken.includes('expired')) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired refresh token. Please log in again.' },
        { status: 401 }
      );
    }

    const now = Date.now();
    const newAccessToken = `jwt-access-refreshed-${now}`;
    const expiresAt = now + 15 * 60 * 1000;

    return NextResponse.json({
      success: true,
      message: 'Token refreshed successfully.',
      accessToken: newAccessToken,
      expiresAt,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Token refresh failed.' },
      { status: 401 }
    );
  }
}
