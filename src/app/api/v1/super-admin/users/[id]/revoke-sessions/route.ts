import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

// POST /api/v1/super-admin/users/[id]/revoke-sessions - Revoke specific session or ALL sessions in user_sessions collection
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const userId = params.id;
    const body = await req.json().catch(() => ({}));
    const { sessionId, revokeAll } = body;

    const { db } = await connectToDatabase();

    let query: any = {};
    if (ObjectId.isValid(userId)) {
      query.$or = [{ _id: new ObjectId(userId) }, { id: userId }, { email: userId }];
    } else {
      query.$or = [{ id: userId }, { email: userId }];
    }

    const userDoc = await db.collection('users').findOne(query);

    if (!userDoc) {
      return NextResponse.json({ success: false, message: 'User record not found' }, { status: 404 });
    }

    if (revokeAll || !sessionId) {
      // Invalidate all active sessions for user in user_sessions
      const deleteResult = await db.collection('user_sessions').deleteMany({
        $or: [{ userId: userDoc.id }, { email: userDoc.email }],
      });

      await logAuditEvent(req, 'USER_SESSIONS_REVOKED', {
        details: { targetUserId: userDoc.id || userDoc._id.toString(), email: userDoc.email, count: deleteResult.deletedCount },
      });

      return NextResponse.json({
        success: true,
        message: `All active sessions for user ${userDoc.email} have been revoked.`,
      });
    } else {
      // Delete specific session from user_sessions
      let sessionQuery: any = {
        $or: [{ userId: userDoc.id }, { email: userDoc.email }],
      };

      if (ObjectId.isValid(sessionId)) {
        sessionQuery.$or = [
          { _id: new ObjectId(sessionId) },
          { sessionToken: sessionId },
        ];
      } else {
        sessionQuery.sessionToken = sessionId;
      }

      await db.collection('user_sessions').deleteOne(sessionQuery);

      await logAuditEvent(req, 'USER_SESSION_REVOKED', {
        details: { targetUserId: userDoc.id || userDoc._id.toString(), email: userDoc.email, sessionId },
      });

      return NextResponse.json({
        success: true,
        message: `Session revoked successfully.`,
      });
    }
  } catch (error: any) {
    console.error('Error revoking user sessions:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to revoke sessions' }, { status: 500 });
  }
}
