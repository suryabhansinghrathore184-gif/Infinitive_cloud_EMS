import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

// POST /api/v1/super-admin/users/[id]/resend-verification - Resend verification email/token
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const userId = params.id;
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

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    const verifyToken = `verify-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Invalidate previous verification tokens
    await db.collection('auth_tokens').updateMany(
      { email: userDoc.email, type: 'EMAIL_VERIFICATION' },
      { $set: { status: 'SUPERSEDED' } }
    );

    // Create new verification token entry
    await db.collection('auth_tokens').insertOne({
      type: 'EMAIL_VERIFICATION',
      userId: userDoc.id || userDoc._id.toString(),
      email: userDoc.email,
      token: verifyToken,
      expiresAt,
      createdAt: now.toISOString(),
      status: 'ACTIVE',
    });

    await logAuditEvent(req, 'USER_VERIFICATION_RESENT', {
      details: { targetUserId: userDoc.id || userDoc._id.toString(), email: userDoc.email },
    });

    return NextResponse.json({
      success: true,
      message: `Verification link and token generated successfully for ${userDoc.email}.`,
    });
  } catch (error: any) {
    console.error('Error resending verification:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to resend verification' }, { status: 500 });
  }
}
