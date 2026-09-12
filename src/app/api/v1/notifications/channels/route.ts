import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN', 'ADMIN', 'HR']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { db } = await connectToDatabase();
    const orgConfigs = await db.collection('integrations').find({ organizationId: auth.organizationId }).toArray();
    const configMap = new Map<string, any>();
    orgConfigs.forEach((c) => configMap.set(c.provider, c));

    const waDoc = configMap.get('whatsapp');
    const smtpDoc = configMap.get('smtp');
    const smsDoc = configMap.get('sms');

    const channels = [
      {
        id: 'in_app',
        name: 'In-App Notifications',
        type: 'IN_APP',
        configured: true,
        status: 'CONNECTED',
        statusText: 'Active & Operational',
        description: 'Instant notification feed, bell badge alerts & action modals',
      },
      {
        id: 'email',
        name: 'Email / SMTP Gateway',
        type: 'EMAIL',
        configured: Boolean(smtpDoc || process.env.SMTP_HOST),
        status: smtpDoc?.enabled !== false && (smtpDoc?.status === 'CONNECTED' || process.env.SMTP_HOST) ? 'CONNECTED' : 'NOT_CONFIGURED',
        statusText: smtpDoc?.enabled === false ? 'Disabled' : smtpDoc?.status === 'CONNECTED' || process.env.SMTP_HOST ? 'Connected' : 'Not Configured',
        description: 'Automated email payslips, leave approvals, and employee notifications',
      },
      {
        id: 'whatsapp',
        name: 'WhatsApp Business API',
        type: 'WHATSAPP',
        configured: Boolean(waDoc || process.env.WHATSAPP_PHONE_NUMBER_ID),
        status: waDoc?.enabled !== false && (waDoc?.status === 'CONNECTED' || process.env.WHATSAPP_PHONE_NUMBER_ID) ? 'CONNECTED' : waDoc?.enabled === false ? 'DISABLED' : 'NOT_CONFIGURED',
        statusText: waDoc?.enabled === false ? 'Disabled' : waDoc?.status === 'CONNECTED' || process.env.WHATSAPP_PHONE_NUMBER_ID ? 'Connected (Meta Graph API)' : 'Not Configured',
        description: 'Direct Meta WhatsApp template messaging for urgent HR alerts',
      },
      {
        id: 'sms',
        name: 'SMS Gateway',
        type: 'SMS',
        configured: Boolean(smsDoc),
        status: smsDoc?.status === 'CONNECTED' ? 'CONNECTED' : 'NOT_CONFIGURED',
        statusText: 'Not Configured',
        description: 'Cellular SMS text alerts for urgent employee broadcasts',
      },
      {
        id: 'push',
        name: 'Mobile & Web Push',
        type: 'PUSH',
        configured: false,
        status: 'NOT_CONFIGURED',
        statusText: 'Not Configured',
        description: 'Browser & PWA push notifications',
      },
    ];

    return NextResponse.json({
      success: true,
      channels,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
