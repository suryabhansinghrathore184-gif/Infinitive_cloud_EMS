import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// POST /api/v1/super-admin/security/revoke-global-sessions - Revoke all active sessions in authoritative user_sessions collection
export async function POST(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { db } = await connectToDatabase();

    // Revoke all active sessions in authoritative user_sessions collection
    const deleteResult = await db.collection('user_sessions').deleteMany({});
    
    // Also clean up temporary auth tokens if any exist
    await db.collection('auth_tokens').deleteMany({ type: { $ne: 'EMAIL_VERIFICATION' } });

    await logAuditEvent(req, 'GLOBAL_SESSIONS_REVOKED', {
      details: {
        revokedBy: auth.email,
        revokedCount: deleteResult.deletedCount,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Global session emergency revocation complete. ${deleteResult.deletedCount} active session(s) revoked.`,
    });
  } catch (error: any) {
    console.error('Error revoking global sessions:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to revoke global sessions' }, { status: 500 });
  }
}
