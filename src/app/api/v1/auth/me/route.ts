import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext } from '@/lib/auth';
import { hashToken } from '@/lib/cryptoAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cookieSessionToken = request.cookies.get('ems_session')?.value;
    let headerToken = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : null;
    const token = cookieSessionToken || headerToken;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Missing authorization token.' },
        { status: 401 }
      );
    }

    const authCtx = getAuthContext(request);
    if (!authCtx.isAuthenticated) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired session token.' },
        { status: 401 }
      );
    }

    const { db } = await connectToDatabase();
    const tokenHash = hashToken(token);

    let sessionDoc = await db.collection('user_sessions').findOne({
      $or: [{ sessionToken: token }, { sessionTokenHash: tokenHash }],
      status: 'ACTIVE',
      expiresAt: { $gt: new Date() },
    });

    const isExplicitHeaderAuth = Boolean(request.headers.get('x-user-id') && request.headers.get('x-user-role'));

    if (!sessionDoc && !isExplicitHeaderAuth) {
      return NextResponse.json(
        { success: false, message: 'Session has expired or has been revoked. Please log in again.' },
        { status: 401 }
      );
    }

    let userDoc: any = null;

    if (sessionDoc) {
      userDoc = await db.collection('users').findOne({
        $or: [{ email: sessionDoc.email }, { id: sessionDoc.userId }, { employeeId: sessionDoc.employeeId }],
      });
    }

    if (!userDoc && isExplicitHeaderAuth && authCtx.email) {
      userDoc = await db.collection('users').findOne({ email: authCtx.email });
    }

    const userEmail = userDoc?.email || authCtx.email;
    const userId = userDoc?.id || userDoc?._id?.toString() || authCtx.userId;
    const userRole = userDoc?.role || authCtx.role;
    const empId = userDoc?.employeeId || authCtx.employeeId || (userRole === 'SUPER_ADMIN' ? 'SUP0001' : 'EMP9201');
    const name = userDoc?.name || authCtx.name || (userRole === 'SUPER_ADMIN' ? 'Super Administrator' : 'Suryabhan Singh Rathore');

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        employeeId: empId,
        name,
        email: userEmail,
        avatar: userDoc?.avatar || (userRole === 'SUPER_ADMIN'
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80'),
        role: userRole,
        department: userDoc?.department || (userRole === 'SUPER_ADMIN' ? 'Executive Board' : 'Human Resources'),
        designation: userDoc?.designation || (userRole === 'SUPER_ADMIN' ? 'Platform Super Admin' : 'HR Administrator'),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/v1/auth/me:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch user session.' },
      { status: 500 }
    );
  }
}
