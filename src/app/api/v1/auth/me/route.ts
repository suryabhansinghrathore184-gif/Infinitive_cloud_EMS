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

    const { db } = await connectToDatabase();
    const tokenHash = hashToken(token);

    // Look up active session in user_sessions collection
    let sessionDoc = await db.collection('user_sessions').findOne({
      $or: [{ sessionToken: token }, { sessionTokenHash: tokenHash }],
      status: 'ACTIVE',
      expiresAt: { $gt: new Date() },
    });

    let userDoc: any = null;

    if (sessionDoc) {
      userDoc = await db.collection('users').findOne({
        $or: [{ email: sessionDoc.email }, { id: sessionDoc.userId }, { employeeId: sessionDoc.employeeId }],
      });

      if (!userDoc && sessionDoc.email) {
        const empDoc = await db.collection('employees').findOne({ email: sessionDoc.email });
        if (empDoc) {
          userDoc = {
            id: empDoc.id || empDoc.employeeId,
            employeeId: empDoc.employeeId,
            name: `${empDoc.firstName || ''} ${empDoc.lastName || ''}`.trim() || 'Employee',
            email: empDoc.email,
            role: empDoc.role || 'EMPLOYEE',
            department: empDoc.department || 'General',
            designation: empDoc.designation || 'Staff',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
          };
        }
      }
    }

    // Fallback via getAuthContext if userDoc wasn't directly found in user_sessions
    if (!userDoc) {
      const authCtx = getAuthContext(request);
      if (authCtx && authCtx.isAuthenticated && authCtx.email) {
        userDoc = await db.collection('users').findOne({ email: authCtx.email });
        if (!userDoc) {
          const empDoc = await db.collection('employees').findOne({ email: authCtx.email });
          if (empDoc) {
            userDoc = {
              id: empDoc.id || empDoc.employeeId,
              employeeId: empDoc.employeeId,
              name: `${empDoc.firstName || ''} ${empDoc.lastName || ''}`.trim() || 'Employee',
              email: empDoc.email,
              role: empDoc.role || 'EMPLOYEE',
              department: empDoc.department || 'General',
              designation: empDoc.designation || 'Staff',
              avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
            };
          }
        }
      }
    }

    if (!userDoc && sessionDoc) {
      // Use details directly from sessionDoc if user record was not found
      userDoc = {
        id: sessionDoc.userId,
        employeeId: sessionDoc.employeeId,
        name: sessionDoc.name || 'Authenticated User',
        email: sessionDoc.email,
        role: sessionDoc.role,
        department: 'General',
        designation: 'Staff',
      };
    }

    if (!userDoc) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired session token.' },
        { status: 401 }
      );
    }

    const userRoleStr = (userDoc.role || sessionDoc?.role || 'EMPLOYEE').toUpperCase();
    const normalizedRole = (userRoleStr === 'SUPER_ADMIN' || userRoleStr === 'SUPER ADMIN')
      ? 'SUPER_ADMIN'
      : (userRoleStr === 'ADMIN' || userRoleStr === 'HR' || userRoleStr === 'HR/ADMIN')
      ? 'ADMIN'
      : (userRoleStr === 'MANAGER')
      ? 'MANAGER'
      : 'EMPLOYEE';

    const empIdFallback = normalizedRole === 'SUPER_ADMIN' ? 'SUP0001' : normalizedRole === 'ADMIN' ? 'EMP9201' : normalizedRole === 'MANAGER' ? 'MGR1001' : 'EMP1001';

    return NextResponse.json({
      success: true,
      user: {
        id: userDoc.id || userDoc._id?.toString() || sessionDoc?.userId,
        employeeId: userDoc.employeeId || sessionDoc?.employeeId || empIdFallback,
        name: userDoc.name || sessionDoc?.name || 'Authenticated User',
        email: userDoc.email || sessionDoc?.email,
        avatar: userDoc.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
        role: userDoc.role || normalizedRole,
        department: userDoc.department || 'General',
        designation: userDoc.designation || 'Staff',
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
