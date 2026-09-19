import nodemailer, { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

/**
 * Interface for mail dispatch options
 */
export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Interface for mail dispatch response
 */
export interface MailDispatchResult {
  success: boolean;
  messageId?: string;
  provider: 'Gmail_SMTP';
  error?: string;
}

let cachedTransporter: Transporter<SMTPTransport.SentMessageInfo> | null = null;

/**
 * Validates existence of required Gmail SMTP environment variables
 */
export function validateGmailConfig(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!process.env.GMAIL_USER?.trim()) {
    missing.push('GMAIL_USER');
  }
  if (!process.env.GMAIL_APP_PASSWORD?.trim()) {
    missing.push('GMAIL_APP_PASSWORD');
  }
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Returns a cached singleton Nodemailer transporter configured for Gmail SMTP (smtp.gmail.com:465)
 */
export function getMailerTransporter(): Transporter<SMTPTransport.SentMessageInfo> {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const gmailUser = process.env.GMAIL_USER?.trim() || '';
  const gmailPass = (process.env.GMAIL_APP_PASSWORD?.trim() || '').replace(/\s+/g, '');

  const smtpOptions: SMTPTransport.Options = {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // TLS/SSL port 465
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: {
      rejectUnauthorized: false,
    },
  };

  cachedTransporter = nodemailer.createTransport(smtpOptions);
  return cachedTransporter;
}

/**
 * Safe server-side diagnostic function to verify SMTP connection.
 * Does NOT leak secrets.
 */
export async function verifyMailerConfig(): Promise<{ success: boolean; error?: string }> {
  const config = validateGmailConfig();
  if (!config.valid) {
    return {
      success: false,
      error: `Missing environment configuration: ${config.missing.join(', ')}`,
    };
  }

  try {
    const transporter = getMailerTransporter();
    await transporter.verify();
    return { success: true };
  } catch (err: any) {
    const safeError = err?.message || 'Failed to establish connection with Gmail SMTP server';
    console.error('[SMTP Transporter] Diagnostic verification failed:', safeError);
    return { success: false, error: safeError };
  }
}

/**
 * Reusable email dispatch function via Gmail SMTP
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendMailOptions): Promise<MailDispatchResult> {
  const config = validateGmailConfig();
  if (!config.valid) {
    const errMsg = `Gmail SMTP credentials not configured. Missing: ${config.missing.join(', ')}`;
    console.error(`[Mailer Error] ${errMsg}`);
    return {
      success: false,
      provider: 'Gmail_SMTP',
      error: errMsg,
    };
  }

  try {
    const transporter = getMailerTransporter();
    const fromAddress = process.env.GMAIL_FROM?.trim() || process.env.GMAIL_USER?.trim() || '';
    const fromName = process.env.GMAIL_FROM_NAME?.trim() || 'EMS HRMS';
    const fromHeader = `"${fromName}" <${fromAddress}>`;

    const maskedEmail = to.replace(/(.{2})(.*)(?=@)/, '$1***');
    console.log(`[Gmail SMTP] Initiating mail dispatch to ${maskedEmail}`);

    const info = await transporter.sendMail({
      from: fromHeader,
      to: to.trim().toLowerCase(),
      subject,
      html,
      text,
      headers: {
        'X-Priority': '1',
        Importance: 'high',
      },
    });

    console.log(`[Gmail SMTP] Mail successfully sent to ${maskedEmail}. MessageId: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
      provider: 'Gmail_SMTP',
    };
  } catch (err: any) {
    const safeError = err?.message || 'SMTP transmission failure';
    const maskedEmail = to.replace(/(.{2})(.*)(?=@)/, '$1***');
    console.error(`[Gmail SMTP Error] Failed to send email to ${maskedEmail}:`, safeError);

    return {
      success: false,
      provider: 'Gmail_SMTP',
      error: 'Unable to send verification email. Please try again later.',
    };
  }
}
