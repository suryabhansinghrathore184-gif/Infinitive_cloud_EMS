import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { encryptSecret, isEncryptionConfigured } from '@/lib/integrations/encryption';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const stateStr = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    if (error || !code) {
      console.error('Microsoft OAuth Callback Error:', errorDescription || error);
      return NextResponse.redirect(new URL('/admin/integrations?error=oauth_failed', req.url));
    }

    let organizationId = 'org-default';
    if (stateStr) {
      try {
        const decoded = JSON.parse(Buffer.from(stateStr, 'base64').toString('utf8'));
        if (decoded.orgId) organizationId = decoded.orgId;
      } catch {}
    }

    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const redirectUri = `${protocol}://${host}/api/v1/integrations/microsoft/callback`;

    const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
    const clientId = process.env.MICROSOFT_CLIENT_ID || '';
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET || '';

    // Exchange auth code for token server-side
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const bodyParams = new URLSearchParams({
      client_id: clientId,
      grant_type: 'authorization_code',
      scope: 'User.Read Calendars.ReadOnlinePresence TeamsActivity.Send offline_access',
      code,
      redirect_uri: redirectUri,
      client_secret: clientSecret,
    });

    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: bodyParams.toString(),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || tokenData.error) {
      console.error('Microsoft Token Exchange Failed:', tokenData.error_description || tokenData.error);
      return NextResponse.redirect(new URL('/admin/integrations?error=token_exchange_failed', req.url));
    }

    // Save tokens securely in MongoDB
    const nowISO = new Date().toISOString();
    const { db } = await connectToDatabase();

    const encAccessToken = isEncryptionConfigured() ? encryptSecret(tokenData.access_token) : tokenData.access_token;
    const encRefreshToken = tokenData.refresh_token
      ? isEncryptionConfigured()
        ? encryptSecret(tokenData.refresh_token)
        : tokenData.refresh_token
      : null;

    await db.collection('integrations').updateOne(
      { organizationId, provider: 'microsoft' },
      {
        $set: {
          organizationId,
          provider: 'microsoft',
          status: 'CONNECTED',
          enabled: true,
          accessToken: encAccessToken,
          refreshToken: encRefreshToken,
          expiresIn: tokenData.expires_in,
          lastSuccessAt: nowISO,
          lastTestedAt: nowISO,
          updatedAt: nowISO,
        },
      },
      { upsert: true }
    );

    return NextResponse.redirect(new URL('/admin/integrations?success=microsoft_connected', req.url));
  } catch (err: any) {
    console.error('Microsoft OAuth Callback Exception:', err);
    return NextResponse.redirect(new URL('/admin/integrations?error=internal_error', req.url));
  }
}
