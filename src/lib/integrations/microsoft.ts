import { connectToDatabase } from '@/lib/mongodb';

export interface MicrosoftConfig {
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  scopes?: string[];
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  accountEmail?: string;
  tenantName?: string;
}

export interface MicrosoftTestResult {
  provider: 'microsoft';
  status: 'CONNECTED' | 'NOT_CONFIGURED' | 'CONNECTION_FAILED';
  tenantId?: string;
  tenantName?: string;
  accountEmail?: string;
  testedAt: string;
  message: string;
}

/**
 * Tests Microsoft 365 / Teams integration state and Entra ID connection.
 */
export async function testMicrosoftConnection(
  config?: MicrosoftConfig
): Promise<MicrosoftTestResult> {
  const nowISO = new Date().toISOString();

  const tenantId = config?.tenantId || process.env.MICROSOFT_TENANT_ID || '';
  const clientId = config?.clientId || process.env.MICROSOFT_CLIENT_ID || '';
  const accessToken = config?.accessToken || process.env.MICROSOFT_ACCESS_TOKEN || '';

  if (!tenantId || !clientId) {
    return {
      provider: 'microsoft',
      status: 'NOT_CONFIGURED',
      testedAt: nowISO,
      message: 'Microsoft 365 integration is not configured. Tenant ID and Client ID are required.',
    };
  }

  if (!accessToken) {
    return {
      provider: 'microsoft',
      status: 'NOT_CONFIGURED',
      tenantId,
      testedAt: nowISO,
      message: 'Microsoft 365 OAuth authorization incomplete. Please click "Connect Microsoft 365".',
    };
  }

  try {
    // Validate access token via Microsoft Graph API /me endpoint
    const res = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (res.ok) {
      const meData = await res.json();
      return {
        provider: 'microsoft',
        status: 'CONNECTED',
        tenantId,
        accountEmail: meData.userPrincipalName || meData.mail || config?.accountEmail,
        tenantName: meData.displayName || config?.tenantName || 'Enterprise Tenant',
        testedAt: nowISO,
        message: `Microsoft 365 Connected! Account: ${meData.userPrincipalName || meData.displayName || 'Authorized User'}`,
      };
    }

    return {
      provider: 'microsoft',
      status: 'CONNECTION_FAILED',
      tenantId,
      testedAt: nowISO,
      message: 'Microsoft 365 session expired or OAuth token revoked. Re-authentication required.',
    };
  } catch (err: any) {
    console.error('Microsoft Connection Test Error:', err);
    return {
      provider: 'microsoft',
      status: 'CONNECTION_FAILED',
      tenantId,
      testedAt: nowISO,
      message: 'Unable to authenticate with Microsoft 365 / Entra ID service.',
    };
  }
}

/**
 * Builds standard OAuth 2.0 Authorization URL for Microsoft Entra ID.
 */
export function getMicrosoftAuthUrl(tenantId: string, clientId: string, redirectUri: string, stateStr: string): string {
  const scope = encodeURIComponent('User.Read Calendars.ReadOnlinePresence TeamsActivity.Send offline_access');
  const tenant = tenantId || 'common';
  return `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_mode=query&scope=${scope}&state=${stateStr}`;
}
