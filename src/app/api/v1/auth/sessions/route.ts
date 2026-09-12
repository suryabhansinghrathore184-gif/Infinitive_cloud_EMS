import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { db } = await connectToDatabase();
    const now = new Date();

    const sessionDocs = await db
      .collection('user_sessions')
      .find({
        $or: [{ userId: auth.userId }, { email: auth.email }],
        expiresAt: { $gt: now },
      })
      .sort({ createdAt: -1 })
      .toArray();

    const formattedSessions = sessionDocs.map((s) => ({
      id: s._id.toString(),
      sessionToken: s.sessionToken,
      userAgent: s.userAgent || 'Unknown Device',
      ipAddress: s.ipAddress || '127.0.0.1',
      createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : new Date().toISOString(),
      lastActiveAt: s.updatedAt ? new Date(s.updatedAt).toISOString() : new Date().toISOString(),
      expiresAt: s.expiresAt ? new Date(s.expiresAt).toISOString() : new Date().toISOString(),
      isCurrent: s.sessionToken === auth.sessionId,
    }));

    return NextResponse.json({
      success: true,
      data: formattedSessions,
    });
  } catch (error: any) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch active sessions.' },
      { status: 500 }
    );
  }
}
