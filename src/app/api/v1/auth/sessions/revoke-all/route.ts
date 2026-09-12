import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { db } = await connectToDatabase();

    // Delete all sessions for this user except current session
    const filter: any = {
      $or: [{ userId: auth.userId }, { email: auth.email }],
    };

    if (auth.sessionId) {
      filter.sessionToken = { $ne: auth.sessionId };
    }

    const result = await db.collection('user_sessions').deleteMany(filter);

    await logAuditEvent(req, 'ALL_OTHER_SESSIONS_REVOKED', {
      details: { email: auth.email, revokedCount: result.deletedCount },
    });

    return NextResponse.json({
      success: true,
      message: `Revoked ${result.deletedCount} other active session(s).`,
      revokedCount: result.deletedCount,
    });
  } catch (error: any) {
    console.error('Error revoking all sessions:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to revoke other sessions.' },
      { status: 500 }
    );
  }
}
