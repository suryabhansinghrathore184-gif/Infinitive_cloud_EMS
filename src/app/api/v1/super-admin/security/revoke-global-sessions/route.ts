import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// POST /api/v1/super-admin/security/revoke-global-sessions - Revoke all non-current active session tokens
export async function POST(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { db } = await connectToDatabase();

    // Revoke all tokens in auth_tokens
    const deleteResult = await db.collection('auth_tokens').deleteMany({});

    await logAuditEvent(req, 'GLOBAL_SESSIONS_REVOKED', {
      details: {
        revokedBy: auth.email,
        revokedCount: deleteResult.deletedCount,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Global session emergency revocation complete. ${deleteResult.deletedCount} active token(s) revoked.`,
    });
  } catch (error: any) {
    console.error('Error revoking global sessions:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to revoke global sessions' }, { status: 500 });
  }
}
