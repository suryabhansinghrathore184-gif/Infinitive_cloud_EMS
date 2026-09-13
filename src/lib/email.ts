import nodemailer, { Transporter } from 'nodemailer';

export interface SendOtpEmailParams {
  to: string;
  otp: string;
  purpose?: string;
  userName?: string;
  organizationName?: string;
  role?: string;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  const gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;

  if (!gmailUser || !gmailPass) {
    console.warn('GMAIL_USER or GMAIL_APP_PASSWORD is not configured in environment variables.');
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: process.env.SMTP_SECURE !== 'false',
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  return transporter;
}

/**
 * Sends a real Gmail SMTP OTP / Confirmation / Invitation email to the given recipient
 */
export async function sendOtpEmail({
  to,
  otp,
  purpose = 'LOGIN',
  userName,
  organizationName,
  role = 'EMPLOYEE',
}: SendOtpEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
    if (!gmailUser || (!process.env.GMAIL_APP_PASSWORD && !process.env.SMTP_PASS)) {
      console.error('Email sending failed: Missing GMAIL_USER or GMAIL_APP_PASSWORD credentials.');
      return { success: false, error: 'Email service credentials not configured.' };
    }

    const mailTransporter = getTransporter();

    let subject = 'Your EMS/HRMS Verification Code';
    let titleText = 'Enterprise Security Authentication';
    let bodyText = 'You requested a One-Time Password (OTP) to authenticate into your EMS/HRMS workspace. Use the code below to complete your verification:';

    if (purpose === 'ACCOUNT_INVITATION') {
      subject = "You've Been Invited to EMS/HRMS";
      titleText = 'Account Setup Invitation';
      bodyText = `You have been officially invited to join EMS/HRMS as <strong>${role}</strong>. Please use the 6-digit verification code below to complete your account setup and set your password:`;
    } else if (purpose === 'EMAIL_VERIFICATION') {
      subject = 'Confirm Your EMS/HRMS Account';
      titleText = 'Account Email Confirmation';
      bodyText = 'Your EMS/HRMS account has been created. Please use the 6-digit verification code below to confirm your email address:';
    } else if (purpose === '2FA') {
      subject = 'Your EMS Security Verification Code';
      titleText = 'Two-Factor Authentication';
      bodyText = 'Use the security verification code below to complete 2FA authentication:';
    }

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
                  <td style="background-color: #6366f1; border-radius: 12px; padding: 10px 16px; font-weight: 800; color: #ffffff; font-size: 18px; letter-spacing: 1px;">
                    ${orgDisplay}
                  </td>
                </tr>
              </table>
              <h2 style="color: #ffffff; font-size: 20px; font-weight: 700; margin-top: 16px; margin-bottom: 4px;">Infinitive Cloud Management</h2>
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
                🔒 For security, never share this verification code with anyone.
              </p>

              <hr style="border: 0; border-top: 1px solid #334155; margin: 24px 0;" />

              <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0;">
                If you did not expect this account or code, please contact your HR/Admin team immediately.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 20px 32px; text-align: center; border-top: 1px solid #334155;">
              <p style="color: #64748b; font-size: 12px; margin: 0;">
                &copy; ${new Date().getFullYear()} ${orgDisplay}. Regards, EMS/HRMS Team.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const info = await mailTransporter.sendMail({
      from: `"EMS Security" <${gmailUser}>`,
      to,
      subject,
      html: htmlContent,
      text: `Hello ${greetingName},\n\nYour EMS/HRMS account has been created. Please use the verification code below to confirm your email address:\n\n${otp}\n\nThis code will expire in 10 minutes.\n\nRegards,\nEMS/HRMS Team`,
    });

    console.log(`Confirmation Email sent to ${to}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Failed to send email via Nodemailer/Gmail SMTP:', error);
    return { success: false, error: error?.message || 'Failed to dispatch email.' };
  }
}
