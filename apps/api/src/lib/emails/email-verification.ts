import { sendEmail, canSendEmail } from '@/lib/email'
import { logger } from '@/lib/logger'

export interface EmailVerificationData {
  userId: string
  customerEmail: string
  customerName?: string
  verificationUrl: string
}

function buildHtml(data: EmailVerificationData): string {
  const { customerName, verificationUrl } = data
  const greeting = customerName ? `Hi ${customerName},` : 'Hi there,'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Verify your email</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="background:#18181b;border-radius:12px 12px 0 0;padding:32px;text-align:center;">
              <h1 style="margin:0;font-size:24px;font-weight:700;color:#fff;">ShopName</h1>
            </td>
          </tr>
          <tr>
            <td style="background:#fff;padding:40px 32px;text-align:center;">
              <div style="width:64px;height:64px;background:#dbeafe;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
                <span style="font-size:32px;">&#9993;</span>
              </div>
              <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111;">Verify your email address</h2>
              <p style="margin:0 0 24px;font-size:15px;color:#555;">${greeting} Click the button below to verify your email and activate your account.</p>
              <a href="${verificationUrl}" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;">Verify email address</a>
              <p style="margin:24px 0 0;font-size:12px;color:#888;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
            </td>
          </tr>
          <tr>
            <td style="background:#f4f4f5;border-radius:0 0 12px 12px;padding:24px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#999;">&copy; ${new Date().getFullYear()} ShopName. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function buildText(data: EmailVerificationData): string {
  const { customerName, verificationUrl } = data
  const greeting = customerName ? `Hi ${customerName},` : 'Hi there,'

  return `${greeting}

Please verify your email address by visiting the link below:

${verificationUrl}

This link expires in 24 hours.

If you didn't create an account, you can safely ignore this email.`
}

export async function sendEmailVerification(data: EmailVerificationData): Promise<void> {
  if (!canSendEmail()) {
    logger.info('Email sending skipped — RESEND_API_KEY not configured', { userId: data.userId })
    return
  }

  await sendEmail({
    to: data.customerEmail,
    subject: 'Verify your email address — ShopName',
    html: buildHtml(data),
    text: buildText(data),
  })
}
