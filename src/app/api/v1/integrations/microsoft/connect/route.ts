import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { getMicrosoftAuthUrl } from '@/lib/integrations/microsoft';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN', 'ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const redirectUri = `${protocol}://${host}/api/v1/integrations/microsoft/callback`;

    const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
    const clientId = process.env.MICROSOFT_CLIENT_ID || 'client-id-placeholder';
    const stateStr = Buffer.from(JSON.stringify({ orgId: auth.organizationId, ts: Date.now() })).toString('base64');

    const authUrl = getMicrosoftAuthUrl(tenantId, clientId, redirectUri, stateStr);

    return NextResponse.redirect(authUrl);
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
