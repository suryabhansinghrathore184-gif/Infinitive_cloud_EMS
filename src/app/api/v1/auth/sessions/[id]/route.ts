import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const sessionId = params.id;
    const { db } = await connectToDatabase();

    let query: any = {
      $or: [{ userId: auth.userId }, { email: auth.email }],
    };

    if (ObjectId.isValid(sessionId)) {
      query._id = new ObjectId(sessionId);
    } else {
      query.sessionToken = sessionId;
    }

    const result = await db.collection('user_sessions').deleteOne(query);

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Session not found or not authorized to revoke.' },
        { status: 404 }
      );
    }

    await logAuditEvent(req, 'SESSION_REVOKED', {
      details: { email: auth.email, sessionId },
    });

    return NextResponse.json({
      success: true,
      message: 'Session revoked successfully.',
    });
  } catch (error: any) {
    console.error('Error revoking session:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to revoke session.' },
      { status: 500 }
    );
  }
}
