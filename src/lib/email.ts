import nodemailer, { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

export interface SendOtpEmailParams {
  to: string;
  otp: string;
  purpose?: string;
  userName?: string;
  organizationName?: string;
  role?: string;
}

export interface EmailDispatchResult {
  success: boolean;
  messageId?: string;
  provider?: 'Brevo' | 'Gmail_SMTP' | 'Mock';
  error?: string;
}

/**
 * Subject & Title Mapping by Purpose
 */
function getEmailSubjectAndTitle(purpose: string, otp: string, role: string) {
  let subject = `EMS HRMS Verification Code: ${otp}`;
  let titleText = 'Account Verification';
  let bodyText = 'You requested a 6-digit verification code to access your EMS/HRMS account:';

  switch (purpose) {
    case 'ACCOUNT_INVITATION':
      subject = `EMS HRMS Account Invitation Code: ${otp}`;
      titleText = 'Account Setup Invitation';
      bodyText = `You have been officially invited to join EMS/HRMS as <strong>${role}</strong>. Please use the verification code below to complete your account setup:`;
      break;

    case 'EMAIL_VERIFICATION':
      subject = `EMS HRMS Email Verification Code: ${otp}`;
      titleText = 'Account Email Confirmation';
      bodyText = 'Your EMS/HRMS account has been created. Please use the 6-digit verification code below to confirm your email address:';
      break;

    case '2FA':
    case '2FA_OTP':
      subject = `EMS HRMS Two-Factor Authentication Code: ${otp}`;
      titleText = 'Two-Factor Authentication';
      bodyText = 'Use the security verification code below to complete 2FA authentication:';
      break;

    case 'PASSWORD_RESET':
      subject = `EMS HRMS Password Reset Code: ${otp}`;
      titleText = 'Password Reset Request';
      bodyText = 'You requested a password reset for your EMS/HRMS account. Use the code or reset token below to reset your password:';
      break;

    case 'LOGIN':
    case 'LOGIN_OTP':
    default:
      subject = `EMS HRMS Login Verification Code: ${otp}`;
      titleText = 'Login Authentication';
      bodyText = 'You requested a 6-digit verification code to sign in to your EMS/HRMS account:';
      break;
  }

  return { subject, titleText, bodyText };
}

/**
 * Builds professional responsive HTML email template for Brevo/SMTP dispatch
 */
function buildOtpHtmlContent(
  to: string,
  otp: string,
  purpose: string,
  userName?: string,
  organizationName?: string,
  role = 'EMPLOYEE'
): { subject: string; htmlContent: string; textContent: string } {
  const { subject, titleText, bodyText } = getEmailSubjectAndTitle(purpose, otp, role);
  const greetingName = userName ? userName : 'Valued User';
  const orgDisplay = organizationName || 'EMS / HRMS Enterprise';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin:0; padding:0; background-color:#0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#e2e8f0;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 30px auto; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
        <!-- Header -->
        <tr>
          <td style="padding: 32px 32px 20px 32px; text-align: center; background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%); border-bottom: 1px solid #334155;">
            <table align="center" border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background-color: #4f46e5; border-radius: 12px; padding: 10px 18px; font-weight: 800; color: #ffffff; font-size: 18px; letter-spacing: 1px;">
                  ${orgDisplay}
                </td>
              </tr>
            </table>
            <h2 style="color: #ffffff; font-size: 20px; font-weight: 700; margin-top: 16px; margin-bottom: 4px;">EMS / HRMS Operations</h2>
            <p style="color: #94a3b8; font-size: 13px; margin: 0;">${titleText}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding: 32px;">
            <p style="color: #f1f5f9; font-size: 15px; margin-top: 0; margin-bottom: 16px;">Hello <strong>${greetingName}</strong>,</p>
            <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
              ${bodyText}
            </p>

            <!-- OTP Code Display -->
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
              <tr>
                <td align="center" style="background-color: #0f172a; border: 2px dashed #6366f1; border-radius: 12px; padding: 20px;">
                  <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #38bdf8; display: inline-block;">
                    ${otp}
                  </span>
                </td>
              </tr>
            </table>

            <p style="color: #94a3b8; font-size: 13px; margin-bottom: 8px;">
              ⏳ This code will expire in <strong>10 minutes</strong>.
            </p>
            <p style="color: #94a3b8; font-size: 13px; margin-bottom: 24px;">
              🔒 For security, never share your verification code with anyone.
            </p>

            <hr style="border: 0; border-top: 1px solid #334155; margin: 24px 0;" />

            <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0;">
              If you did not request this verification code, please ignore this email or contact your HR/Admin team.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color: #0f172a; padding: 20px 32px; text-align: center; border-top: 1px solid #334155;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">
              &copy; ${new Date().getFullYear()} ${orgDisplay}. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const textContent = `Hello ${greetingName},\n\n${subject}\nYour verification code is: ${otp}\n\nThis code will expire in 10 minutes.\nNever share this code with anyone.\n\nRegards,\n${orgDisplay} Team`;

  return { subject, htmlContent, textContent };
}

/**
 * Sends Transactional Email via Brevo HTTP API (api.brevo.com/v3/smtp/email)
 */
async function sendBrevoTransactionalEmail(
  to: string,
  otp: string,
  purpose: string,
  userName?: string,
  organizationName?: string,
  role?: string
): Promise<EmailDispatchResult> {
  const brevoApiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim() || process.env.GMAIL_USER || 'no-reply@organization.com';
  const senderName = process.env.BREVO_SENDER_NAME?.trim() || 'EMS HRMS';

  if (!brevoApiKey) {
    return { success: false, error: 'Brevo API key not configured (BREVO_API_KEY missing).' };
  }

  const { subject, htmlContent, textContent } = buildOtpHtmlContent(to, otp, purpose, userName, organizationName, role);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout

  try {
    const maskedEmail = to.replace(/(.{2})(.*)(?=@)/, '$1***');
    console.log(`[Brevo API] OTP_SEND_STARTED for ${maskedEmail} (Purpose: ${purpose})`);

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': brevoApiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [
          {
            email: to.trim().toLowerCase(),
            name: userName || 'Valued User',
          },
        ],
        subject,
        htmlContent,
        textContent,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error(`[Brevo API Error] Status ${response.status}:`, data.message || data.code || 'API error');
      return {
        success: false,
        error: data.message || `Brevo API returned HTTP status ${response.status}`,
      };
    }

    const messageId = data.messageId || `<brevo-${Date.now()}@brevo.com>`;
    console.log(`[Brevo API] OTP_SEND_SUCCESS for ${maskedEmail}. MessageId: ${messageId}`);

    return {
      success: true,
      messageId,
      provider: 'Brevo',
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error('[Brevo API] Request timed out after 10000ms.');
      return { success: false, error: 'Email service request timed out.' };
    }
    console.error('[Brevo API] Dispatch failed:', error?.message || error);
    return { success: false, error: 'Failed to communicate with email delivery service.' };
  }
}

/**
 * Gmail SMTP Fallback Transporter
 */
function createGmailTransporter(gmailUser: string, gmailPass: string): Transporter {
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const isSecure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE !== 'false' : port === 465;

  const smtpOptions: SMTPTransport.Options = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: isSecure,
    auth: { user: gmailUser, pass: gmailPass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: { rejectUnauthorized: false },
  };

  return nodemailer.createTransport(smtpOptions);
}

/**
 * Main Email Dispatch Function
 * Prefers Brevo API if BREVO_API_KEY is set; falls back to Gmail SMTP if configured.
 */
export async function sendOtpEmail({
  to,
  otp,
  purpose = 'LOGIN',
  userName,
  organizationName,
  role = 'EMPLOYEE',
}: SendOtpEmailParams): Promise<EmailDispatchResult> {
  // 1. Try Brevo Transactional Email API first if BREVO_API_KEY exists
  if (process.env.BREVO_API_KEY?.trim()) {
    const brevoResult = await sendBrevoTransactionalEmail(to, otp, purpose, userName, organizationName, role);
    if (brevoResult.success) {
      return brevoResult;
    }
    console.warn('[Email Service] Brevo dispatch failed, checking SMTP fallback:', brevoResult.error);
  }

  // 2. Gmail / Nodemailer SMTP Fallback
  const rawUser = process.env.GMAIL_USER || process.env.SMTP_USER || '';
  const rawPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || '';
  const gmailUser = rawUser.trim();
  const gmailPass = rawPass.trim().replace(/\s+/g, '');

  if (gmailUser && gmailPass) {
    try {
      const mailTransporter = createGmailTransporter(gmailUser, gmailPass);
      const { subject, htmlContent, textContent } = buildOtpHtmlContent(to, otp, purpose, userName, organizationName, role);

      const info = await mailTransporter.sendMail({
        from: `"${process.env.BREVO_SENDER_NAME || 'EMS HRMS'}" <${gmailUser}>`,
        to,
        subject,
        html: htmlContent,
        text: textContent,
        headers: { 'X-Priority': '1', Importance: 'high' },
      });

      console.log(`[Gmail SMTP] Confirmation Email sent to ${to}. MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId, provider: 'Gmail_SMTP' };
    } catch (smtpErr: any) {
      console.error('[Gmail SMTP] Failed to send email:', smtpErr?.message);
      return { success: false, error: smtpErr?.message || 'SMTP dispatch failure' };
    }
  }

  console.error('[Email Service] No valid email credentials configured (Neither BREVO_API_KEY nor GMAIL_USER/GMAIL_APP_PASSWORD present).');
  return { success: false, error: 'Email service credentials not configured.' };
}
