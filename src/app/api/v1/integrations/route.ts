import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, checkPermissions } from '@/lib/auth';

export const dynamic = 'force-dynamic';
import { connectToDatabase } from '@/lib/mongodb';
import { testGridFSConnection } from '@/lib/integrations/gridfs';
import { testWhatsAppConnection } from '@/lib/integrations/whatsapp';
import { testBiometricConnection } from '@/lib/integrations/biometric';
import { testMicrosoftConnection } from '@/lib/integrations/microsoft';
import { decryptSecret, maskSecret, isEncryptionConfigured } from '@/lib/integrations/encryption';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN', 'ADMIN', 'HR']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;

    // Fetch integration configurations from DB
    const dbConfigs = await db.collection('integrations').find({ organizationId: orgId }).toArray();
    const configMap = new Map<string, any>();
    dbConfigs.forEach((c) => configMap.set(c.provider, c));

    // 1. GridFS Health Check (Always active in MongoDB)
    const gridfsHealth = await testGridFSConnection();
    const dbGridfs = configMap.get('gridfs');
    const gridfsStatus = dbGridfs?.enabled === false ? 'DISABLED' : gridfsHealth.status;

    // 2. WhatsApp Business API
    const dbWhatsapp = configMap.get('whatsapp');
    let whatsappStatus: string = 'NOT_CONFIGURED';
    let whatsappMaskedConfig: any = {};

    if (dbWhatsapp) {
      if (dbWhatsapp.enabled === false) {
        whatsappStatus = 'DISABLED';
      } else {
        // Decrypt stored secret for health check if encryption is configured
        let rawToken = dbWhatsapp.accessToken || '';
        if (rawToken && isEncryptionConfigured()) {
          try {
            rawToken = decryptSecret(rawToken);
          } catch {
            // Keep raw if unencrypted
          }
        }
        const waHealth = await testWhatsAppConnection({
          provider: 'whatsapp',
          phoneNumberId: dbWhatsapp.phoneNumberId,
          businessAccountId: dbWhatsapp.businessAccountId,
          accessToken: rawToken,
          graphVersion: dbWhatsapp.graphVersion,
          apiBaseUrl: dbWhatsapp.apiBaseUrl,
        });
        whatsappStatus = waHealth.status;
      }

      whatsappMaskedConfig = {
        phoneNumberId: dbWhatsapp.phoneNumberId || '',
        businessAccountId: dbWhatsapp.businessAccountId || '',
        apiBaseUrl: dbWhatsapp.apiBaseUrl || 'https://graph.facebook.com',
        graphVersion: dbWhatsapp.graphVersion || 'v19.0',
        accessToken: maskSecret(dbWhatsapp.accessToken),
        webhookVerifyToken: maskSecret(dbWhatsapp.webhookVerifyToken),
        enabled: dbWhatsapp.enabled !== false,
      };
    } else if (process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_API_TOKEN) {
      const waEnvHealth = await testWhatsAppConnection();
      whatsappStatus = waEnvHealth.status;
      whatsappMaskedConfig = {
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
        accessToken: maskSecret(process.env.WHATSAPP_API_TOKEN),
        enabled: true,
      };
    }

    // 3. Biometric Attendance Gateway
    const dbBiometric = configMap.get('biometric');
    let biometricStatus: string = 'NOT_CONFIGURED';
    let biometricMaskedConfig: any = {};

    if (dbBiometric) {
      if (dbBiometric.enabled === false) {
        biometricStatus = 'DISABLED';
      } else {
        const bioHealth = await testBiometricConnection({
          provider: dbBiometric.provider || 'ZKTeco',
          deviceName: dbBiometric.deviceName || 'ZKTeco Gateway',
          deviceId: dbBiometric.deviceId || 'DEV-ZKT-01',
          connectorUrl: dbBiometric.connectorUrl || '',
          apiKey: dbBiometric.apiKey || '',
          syncMode: dbBiometric.syncMode || 'Manual',
        });
        biometricStatus = bioHealth.status;
      }

      biometricMaskedConfig = {
        provider: dbBiometric.provider || 'ZKTeco',
        deviceName: dbBiometric.deviceName || '',
        deviceId: dbBiometric.deviceId || '',
        connectorUrl: dbBiometric.connectorUrl || '',
        apiKey: maskSecret(dbBiometric.apiKey),
        syncMode: dbBiometric.syncMode || 'Manual',
        syncIntervalMinutes: dbBiometric.syncIntervalMinutes || 15,
        employeeMappings: dbBiometric.employeeMappings || [],
        enabled: dbBiometric.enabled !== false,
      };
    }

    // 4. Microsoft 365 / Teams
    const dbMicrosoft = configMap.get('microsoft');
    let microsoftStatus: string = 'NOT_CONFIGURED';
    let microsoftMaskedConfig: any = {};

    if (dbMicrosoft) {
      if (dbMicrosoft.enabled === false) {
        microsoftStatus = 'DISABLED';
      } else {
        let rawToken = dbMicrosoft.accessToken || '';
        if (rawToken && isEncryptionConfigured()) {
          try {
            rawToken = decryptSecret(rawToken);
          } catch {}
        }
        const msHealth = await testMicrosoftConnection({
          tenantId: dbMicrosoft.tenantId,
          clientId: dbMicrosoft.clientId,
          accessToken: rawToken,
          accountEmail: dbMicrosoft.accountEmail,
          tenantName: dbMicrosoft.tenantName,
        });
        microsoftStatus = msHealth.status;
      }

      microsoftMaskedConfig = {
        tenantId: dbMicrosoft.tenantId || '',
        clientId: dbMicrosoft.clientId || '',
        accountEmail: dbMicrosoft.accountEmail || '',
        tenantName: dbMicrosoft.tenantName || '',
        enabled: dbMicrosoft.enabled !== false,
      };
    }

    // Compute dynamic summary metrics
    const integrationsList = [
      {
        id: 'integ-gridfs',
        provider: 'gridfs',
        name: 'MongoDB GridFS Storage Driver',
        category: 'Document Storage',
        description: 'Secure, encrypted document and photo binary storage directly inside MongoDB.',
        status: gridfsStatus,
        statusText: gridfsStatus === 'CONNECTED' ? `Connected (Bucket: photos & documents)` : 'Connection Failed',
        lastTestedAt: dbGridfs?.lastTestedAt || new Date().toISOString(),
        config: {
          bucketPhotos: 'photos',
          bucketDocuments: 'documents',
          photosCount: gridfsHealth.photosCount,
          documentsCount: gridfsHealth.documentsCount,
          storageType: gridfsHealth.storageType,
        },
      },
      {
        id: 'integ-whatsapp',
        provider: 'whatsapp',
        name: 'WhatsApp Business API',
        category: 'Messaging & Alerts',
        description: 'Send instant payslip notifications, leave approvals, and announcements via WhatsApp.',
        status: whatsappStatus,
        statusText:
          whatsappStatus === 'CONNECTED'
            ? 'Connected & Active'
            : whatsappStatus === 'DISABLED'
            ? 'Disabled'
            : whatsappStatus === 'CONNECTION_FAILED'
            ? 'Connection Failed'
            : 'Not Configured',
        lastTestedAt: dbWhatsapp?.lastTestedAt || null,
        config: whatsappMaskedConfig,
      },
      {
        id: 'integ-biometric',
        provider: 'biometric',
        name: 'Biometric Attendance Gateway',
        category: 'Hardware Integration',
        description: 'Sync ZKTeco / Matrix biometric punch logs automatically via local gateway connector.',
        status: biometricStatus,
        statusText:
          biometricStatus === 'CONNECTED'
            ? 'Connected (Local Connector Active)'
            : biometricStatus === 'DISABLED'
            ? 'Disabled'
            : biometricStatus === 'CONNECTION_FAILED'
            ? 'Connection Failed'
            : 'Not Configured',
        lastTestedAt: dbBiometric?.lastTestedAt || null,
        config: biometricMaskedConfig,
      },
      {
        id: 'integ-microsoft',
        provider: 'microsoft',
        name: 'Microsoft 365 / Teams',
        category: 'Enterprise Suite',
        description: 'Sync company calendar events, holiday notices, and employee directory with MS Teams.',
        status: microsoftStatus,
        statusText:
          microsoftStatus === 'CONNECTED'
            ? `Connected (${dbMicrosoft?.accountEmail || 'Entra ID'})`
            : microsoftStatus === 'DISABLED'
            ? 'Disabled'
            : microsoftStatus === 'CONNECTION_FAILED'
            ? 'Connection Failed'
            : 'Not Configured',
        lastTestedAt: dbMicrosoft?.lastTestedAt || null,
        config: microsoftMaskedConfig,
      },
    ];

    const metrics = {
      total: integrationsList.length,
      connected: integrationsList.filter((i) => i.status === 'CONNECTED').length,
      notConfigured: integrationsList.filter((i) => i.status === 'NOT_CONFIGURED').length,
      connectionFailed: integrationsList.filter((i) => i.status === 'CONNECTION_FAILED').length,
      disabled: integrationsList.filter((i) => i.status === 'DISABLED').length,
    };

    return NextResponse.json({
      success: true,
      metrics,
      integrations: integrationsList,
      encryptionConfigured: isEncryptionConfigured(),
    });
  } catch (err: any) {
    console.error('Error fetching integrations list:', err);
    return NextResponse.json({ success: false, message: err.message || 'Failed to load integrations' }, { status: 500 });
  }
}
