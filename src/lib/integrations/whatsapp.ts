import { connectToDatabase } from '@/lib/mongodb';

export interface WhatsAppConfig {
  provider: string;
  phoneNumberId: string;
  businessAccountId?: string;
  apiBaseUrl?: string;
  graphVersion?: string;
  accessToken: string;
  webhookVerifyToken?: string;
}

export interface WhatsAppTestResult {
  provider: 'whatsapp';
  status: 'CONNECTED' | 'NOT_CONFIGURED' | 'CONNECTION_FAILED';
  phoneNumberId?: string;
  businessAccountId?: string;
  testedAt: string;
  message: string;
}

const DEFAULT_GRAPH_VERSION = 'v19.0';
const DEFAULT_API_BASE_URL = 'https://graph.facebook.com';

/**
 * Tests WhatsApp Business API credentials by pinging Meta Graph API endpoint.
 * NEVER sends real employee notifications during testing.
 */
export async function testWhatsAppConnection(
  config?: WhatsAppConfig
): Promise<WhatsAppTestResult> {
  const nowISO = new Date().toISOString();

  const phoneNumberId =
    config?.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  const accessToken =
    config?.accessToken || process.env.WHATSAPP_API_TOKEN || '';
  const graphVersion =
    config?.graphVersion || process.env.WHATSAPP_GRAPH_VERSION || DEFAULT_GRAPH_VERSION;
  const baseUrl =
    config?.apiBaseUrl || process.env.WHATSAPP_API_BASE_URL || DEFAULT_API_BASE_URL;

  if (!phoneNumberId || !accessToken) {
    return {
      provider: 'whatsapp',
      status: 'NOT_CONFIGURED',
      testedAt: nowISO,
      message: 'WhatsApp credentials missing. Please configure Phone Number ID and Access Token.',
    };
  }

  try {
    const url = `${baseUrl.replace(/\/$/, '')}/${graphVersion}/${phoneNumberId}?fields=id,display_phone_number,verified_name,quality_rating`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      const errMsg =
        data?.error?.message ||
        data?.error?.error_user_msg ||
        'Authentication failed with WhatsApp Meta Graph API';
      return {
        provider: 'whatsapp',
        status: 'CONNECTION_FAILED',
        phoneNumberId,
        businessAccountId: config?.businessAccountId,
        testedAt: nowISO,
        message: `WhatsApp API Connection Failed: ${errMsg}`,
      };
    }

    return {
      provider: 'whatsapp',
      status: 'CONNECTED',
      phoneNumberId: data.id || phoneNumberId,
      businessAccountId: config?.businessAccountId,
      testedAt: nowISO,
      message: `WhatsApp API Connected successfully! Phone: ${data.display_phone_number || phoneNumberId} (${data.verified_name || 'Verified'})`,
    };
  } catch (err: any) {
    console.error('WhatsApp Test Connection Error:', err);
    return {
      provider: 'whatsapp',
      status: 'CONNECTION_FAILED',
      phoneNumberId,
      testedAt: nowISO,
      message: 'Unable to authenticate with Meta WhatsApp Business API endpoint.',
    };
  }
}

/**
 * Dispatches WhatsApp message & logs delivery into `whatsapp_delivery_logs`.
 */
export async function sendWhatsAppMessage(options: {
  organizationId: string;
  employeeId?: string;
  eventType: string;
  phone: string;
  templateName: string;
  languageCode?: string;
  components?: any[];
  config?: WhatsAppConfig;
}): Promise<{ success: boolean; providerMessageId?: string; error?: string }> {
  const nowISO = new Date().toISOString();
  const { organizationId, employeeId, eventType, phone, templateName, components, config } = options;

  const phoneNumberId = config?.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  const accessToken = config?.accessToken || process.env.WHATSAPP_API_TOKEN || '';
  const graphVersion = config?.graphVersion || process.env.WHATSAPP_GRAPH_VERSION || DEFAULT_GRAPH_VERSION;
  const baseUrl = config?.apiBaseUrl || process.env.WHATSAPP_API_BASE_URL || DEFAULT_API_BASE_URL;

  if (!phoneNumberId || !accessToken) {
    return { success: false, error: 'WhatsApp integration is not configured' };
  }

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const url = `${baseUrl.replace(/\/$/, '')}/${graphVersion}/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: cleanPhone,
    type: 'template',
    template: {
      name: templateName,
      language: { code: options.languageCode || 'en_US' },
      components: components || [],
    },
  };

  let deliveryStatus: 'SENT' | 'FAILED' = 'FAILED';
  let providerMessageId: string | undefined = undefined;
  let errorMsg: string | undefined = undefined;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok && data?.messages?.[0]?.id) {
      deliveryStatus = 'SENT';
      providerMessageId = data.messages[0].id;
    } else {
      errorMsg = data?.error?.message || 'Failed to dispatch WhatsApp message';
    }
  } catch (err: any) {
    errorMsg = err.message || 'WhatsApp network error';
  }

  // Log delivery attempt securely
  try {
    const { db } = await connectToDatabase();
    await db.collection('whatsapp_delivery_logs').insertOne({
      organizationId,
      employeeId,
      eventType,
      phone: cleanPhone,
      messageTemplate: templateName,
      providerMessageId,
      status: deliveryStatus,
      error: errorMsg,
      sentAt: nowISO,
    });
  } catch (logErr) {
    console.error('Failed to save whatsapp delivery log:', logErr);
  }

  return {
    success: deliveryStatus === 'SENT',
    providerMessageId,
    error: errorMsg,
  };
}
