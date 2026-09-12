import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { hashToken } from '@/lib/cryptoAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const cookieSession = req.cookies.get('ems_session')?.value;
    const authHeader = req.headers.get('authorization');
    const headerToken = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : null;

    const tokenToRevoke = cookieSession || headerToken || auth.sessionId;

    if (tokenToRevoke) {
      const { db } = await connectToDatabase();
      const tokenHash = hashToken(tokenToRevoke);

      await db.collection('user_sessions').deleteMany({
        $or: [{ sessionToken: tokenToRevoke }, { sessionTokenHash: tokenHash }],
      });
    }

    if (auth.isAuthenticated) {
      await logAuditEvent(req, 'LOGOUT', {
        details: { email: auth.email, userId: auth.userId },
      });
    }

    const response = NextResponse.json({
      success: true,
      message: 'Session revoked and logged out successfully.',
    });

    // Clear HTTP-Only authentication cookie
    response.cookies.set('ems_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: new Date(0),
    });

    return response;
  } catch (error: any) {
    console.error('Error in POST /api/v1/auth/logout:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process logout request.' },
      { status: 500 }
    );
  }
}
