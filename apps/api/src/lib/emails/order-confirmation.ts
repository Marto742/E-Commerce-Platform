import { sendEmail, canSendEmail } from '@/lib/email'
import { logger } from '@/lib/logger'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrderConfirmationData {
  orderId: string
  customerEmail: string
  customerName?: string
  items: Array<{
    productName: string
    variantName: string
    quantity: number
    price: string // decimal string e.g. "29.99"
  }>
  subtotal: string
  shippingCost: string
  tax: string
  discountAmount: string
  total: string
  couponCode?: string | null
  shippingAddress: {
    line1: string
    line2?: string | null
    city: string
    state: string
    postalCode: string
    country: string
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function formatAddress(addr: OrderConfirmationData['shippingAddress']): string {
  const lines = [addr.line1]
  if (addr.line2) lines.push(addr.line2)
  lines.push(`${addr.city}, ${addr.state} ${addr.postalCode}`)
  lines.push(addr.country)
  return lines.join('<br>')
}

// ─── HTML template ────────────────────────────────────────────────────────────

function buildHtml(data: OrderConfirmationData): string {
  const { orderId, customerName, items, shippingAddress, couponCode } = data
  const greeting = customerName ? `Hi ${customerName},` : 'Hi there,'
  const discount = parseFloat(data.discountAmount)

  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;">
          <p style="margin:0;font-size:14px;font-weight:600;color:#111;">${item.productName}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#666;">${item.variantName} &times; ${item.quantity}</p>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-size:14px;font-weight:600;color:#111;">
          ${fmt(parseFloat(item.price) * item.quantity)}
        </td>
      </tr>`
    )
    .join('')

  const discountRow =
    discount > 0
      ? `<tr>
          <td style="padding:6px 0;font-size:13px;color:#059669;">
            Discount${couponCode ? ` (${couponCode})` : ''}
          </td>
          <td style="padding:6px 0;text-align:right;font-size:13px;color:#059669;">-${fmt(discount)}</td>
        </tr>`
      : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Order Confirmed</title>
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
              <div style="width:64px;height:64px;background:#dcfce7;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
                <span style="font-size:32px;">&#10003;</span>
              </div>
              <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111;">Order confirmed!</h2>
              <p style="margin:0;font-size:15px;color:#555;">${greeting} Thanks for your purchase.</p>
              <p style="margin:12px 0 0;font-size:12px;color:#888;">
                Order ID: <span style="font-family:monospace;font-weight:600;color:#333;">${orderId}</span>
              </p>
            </td>
          </tr>

          <!-- Items -->
          <tr>
            <td style="background:#fff;padding:0 32px 24px;">
              <h3 style="margin:0 0 12px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#888;">Items ordered</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${itemRows}
              </table>
            </td>
          </tr>

          <!-- Totals -->
          <tr>
            <td style="background:#fff;padding:0 32px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e7eb;padding-top:16px;">
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#555;">Subtotal</td>
                  <td style="padding:6px 0;text-align:right;font-size:13px;color:#555;">${fmt(data.subtotal)}</td>
                </tr>
                ${discountRow}
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#555;">Shipping</td>
                  <td style="padding:6px 0;text-align:right;font-size:13px;color:#555;">${fmt(data.shippingCost)}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#555;">Tax</td>
                  <td style="padding:6px 0;text-align:right;font-size:13px;color:#555;">${fmt(data.tax)}</td>
                </tr>
                <tr>
                  <td style="padding:12px 0 0;font-size:15px;font-weight:700;color:#111;border-top:2px solid #e5e7eb;">Total paid</td>
                  <td style="padding:12px 0 0;text-align:right;font-size:15px;font-weight:700;color:#111;border-top:2px solid #e5e7eb;">${fmt(data.total)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Shipping address -->
          <tr>
            <td style="background:#f9fafb;padding:24px 32px;border-top:1px solid #e5e7eb;">
              <h3 style="margin:0 0 8px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#888;">Shipping to</h3>
              <p style="margin:0;font-size:14px;color:#444;line-height:1.6;">${formatAddress(shippingAddress)}</p>
            </td>
          </tr>

          <!-- Next steps -->
          <tr>
            <td style="background:#fff;padding:24px 32px;border-top:1px solid #e5e7eb;">
              <h3 style="margin:0 0 12px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#888;">What happens next</h3>
              <ol style="margin:0;padding-left:20px;font-size:14px;color:#555;line-height:2;">
                <li>We&rsquo;ll pick, pack, and dispatch your items.</li>
                <li>You&rsquo;ll receive a shipping notification with tracking info.</li>
                <li>Delivery typically takes 3&ndash;5 business days.</li>
              </ol>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f4f4f5;border-radius:0 0 12px 12px;padding:24px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#999;">
                &copy; ${new Date().getFullYear()} ShopName. All rights reserved.
              </p>
              <p style="margin:8px 0 0;font-size:12px;color:#999;">
                Questions? Reply to this email or visit our help centre.
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

function buildText(data: OrderConfirmationData): string {
  const { orderId, customerName, items, shippingAddress, couponCode } = data
  const greeting = customerName ? `Hi ${customerName},` : 'Hi there,'
  const discount = parseFloat(data.discountAmount)

  const itemLines = items
    .map(
      (i) =>
        `  - ${i.productName} (${i.variantName}) x${i.quantity}: ${fmt(parseFloat(i.price) * i.quantity)}`
    )
    .join('\n')

  const addr = shippingAddress
  const addrLines = [
    addr.line1,
    addr.line2,
    `${addr.city}, ${addr.state} ${addr.postalCode}`,
    addr.country,
  ]
    .filter(Boolean)
    .join(', ')

  return `${greeting}

Your order has been confirmed!

Order ID: ${orderId}

ITEMS ORDERED
${itemLines}

ORDER TOTAL
Subtotal:  ${fmt(data.subtotal)}${discount > 0 ? `\nDiscount${couponCode ? ` (${couponCode})` : ''}: -${fmt(discount)}` : ''}
Shipping:  ${fmt(data.shippingCost)}
Tax:       ${fmt(data.tax)}
Total:     ${fmt(data.total)}

SHIPPING TO
${addrLines}

WHAT HAPPENS NEXT
1. We'll pick, pack, and dispatch your items.
2. You'll receive a shipping notification with tracking info.
3. Delivery typically takes 3-5 business days.

Thank you for shopping with us!`
}

// ─── Public sender ────────────────────────────────────────────────────────────

export async function sendOrderConfirmationEmail(data: OrderConfirmationData): Promise<void> {
  if (!canSendEmail()) {
    logger.info('Email sending skipped — RESEND_API_KEY not configured', { orderId: data.orderId })
    return
  }

  await sendEmail({
    to: data.customerEmail,
    subject: `Order confirmed — #${data.orderId.slice(-8).toUpperCase()}`,
    html: buildHtml(data),
    text: buildText(data),
  })
}
