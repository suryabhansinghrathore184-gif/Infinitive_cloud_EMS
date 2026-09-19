import { sendEmail, MailDispatchResult } from '@/lib/mailer';

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
  provider?: 'Gmail_SMTP';
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
 * Builds professional responsive HTML email template for Gmail SMTP dispatch
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
 * Main Email Dispatch Function
 * Routes email sending exclusively through Nodemailer Gmail SMTP.
 */
export async function sendOtpEmail({
  to,
  otp,
  purpose = 'LOGIN',
  userName,
  organizationName,
  role = 'EMPLOYEE',
}: SendOtpEmailParams): Promise<EmailDispatchResult> {
  const { subject, htmlContent, textContent } = buildOtpHtmlContent(
    to,
    otp,
    purpose,
    userName,
    organizationName,
    role
  );

  const dispatchResult = await sendEmail({
    to,
    subject,
    html: htmlContent,
    text: textContent,
  });

  return {
    success: dispatchResult.success,
    messageId: dispatchResult.messageId,
    provider: 'Gmail_SMTP',
    error: dispatchResult.error,
  };
}
