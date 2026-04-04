import { sendEmail, canSendEmail } from '@/lib/email'
import { logger } from '@/lib/logger'

export interface PaymentActionRequiredData {
  orderId: string
  customerEmail: string
  customerName?: string
}

function buildHtml(data: PaymentActionRequiredData): string {
  const { orderId, customerName } = data
  const greeting = customerName ? `Hi ${customerName},` : 'Hi there,'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Action Required — Complete Your Payment</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#18181b;border-radius:12px 12px 0 0;padding:32px;text-align:center;">
              <h1 style="margin:0;font-size:24px;font-weight:700;color:#fff;">ShopName</h1>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="background:#fff;padding:40px 32px 24px;text-align:center;">
              <div style="width:64px;height:64px;background:#fef9c3;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
                <span style="font-size:32px;">&#9888;</span>
              </div>
              <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111;">Action required to complete payment</h2>
              <p style="margin:0;font-size:15px;color:#555;">${greeting} Your bank requires additional verification to process your payment.</p>
              <p style="margin:12px 0 0;font-size:12px;color:#888;">
                Order ID: <span style="font-family:monospace;font-weight:600;color:#333;">${orderId}</span>
              </p>
            </td>
          </tr>

          <!-- Instructions -->
          <tr>
            <td style="background:#fff;padding:0 32px 32px;">
              <div style="background:#fefce8;border:1px solid #fde047;border-radius:8px;padding:16px 20px;">
                <p style="margin:0;font-size:14px;color:#713f12;line-height:1.6;">
                  Your order is reserved but payment has not been collected yet.
                  Please return to our checkout and complete the authentication step
                  to finalise your purchase. Your reservation will expire soon.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f4f4f5;border-radius:0 0 12px 12px;padding:24px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#999;">
                &copy; ${new Date().getFullYear()} ShopName. All rights reserved.
              </p>
              <p style="margin:8px 0 0;font-size:12px;color:#999;">
                If you did not place this order, you can safely ignore this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function buildText(data: PaymentActionRequiredData): string {
  const { orderId, customerName } = data
  const greeting = customerName ? `Hi ${customerName},` : 'Hi there,'

  return `${greeting}

Action required — complete your payment

Your bank requires additional verification to process your payment for order ${orderId}.

Please return to our checkout to complete the authentication step. Your reservation will expire soon.

If you did not place this order, you can safely ignore this email.`
}

export async function sendPaymentActionRequiredEmail(
  data: PaymentActionRequiredData
): Promise<void> {
  if (!canSendEmail()) {
    logger.info('Email sending skipped — RESEND_API_KEY not configured', { orderId: data.orderId })
    return
  }

  await sendEmail({
    to: data.customerEmail,
    subject: `Action required — complete your payment for order #${data.orderId.slice(-8).toUpperCase()}`,
    html: buildHtml(data),
    text: buildText(data),
  })
}
