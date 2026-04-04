import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { env } from '@/config/env'
import { logger } from '@/lib/logger'
import { sendOrderConfirmationEmail } from '@/lib/emails/order-confirmation'

interface PaymentIntentEventObject {
  id: string
  metadata: Record<string, string>
}

// ─── Order helpers ────────────────────────────────────────────────────────────

async function confirmOrder(pi: PaymentIntentEventObject): Promise<void> {
  const { orderId } = pi.metadata

  if (!orderId) {
    logger.warn('payment_intent.succeeded missing orderId in metadata', { paymentIntentId: pi.id })
    return
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      items: true,
    },
  })
  if (!order) {
    logger.warn('Order not found for payment intent', { orderId, paymentIntentId: pi.id })
    return
  }
  if (order.status !== 'PENDING') {
    logger.info('Order already processed — skipping', { orderId, status: order.status })
    return
  }

  await prisma.order.update({ where: { id: orderId }, data: { status: 'CONFIRMED' } })
  logger.info('Order confirmed via webhook', { orderId, paymentIntentId: pi.id })

  const addr = order.shippingAddress as {
    line1: string
    line2?: string | null
    city: string
    state: string
    postalCode: string
    country: string
  }

  sendOrderConfirmationEmail({
    orderId: order.id,
    customerEmail: order.user.email,
    customerName: `${order.user.firstName} ${order.user.lastName}`.trim() || undefined,
    items: order.items.map((item) => ({
      productName: item.productName,
      variantName: item.variantName,
      quantity: item.quantity,
      price: item.price.toString(),
    })),
    subtotal: order.subtotal.toString(),
    shippingCost: order.shippingCost.toString(),
    tax: order.tax.toString(),
    discountAmount: order.discountAmount.toString(),
    total: order.total.toString(),
    couponCode: order.couponCode,
    shippingAddress: addr,
  }).catch((err: unknown) => {
    logger.error('Failed to send order confirmation email', {
      orderId,
      error: err instanceof Error ? err.message : String(err),
    })
  })
}

async function cancelOrder(pi: PaymentIntentEventObject): Promise<void> {
  const { orderId } = pi.metadata

  if (!orderId) {
    logger.warn('payment_intent.payment_failed missing orderId in metadata', {
      paymentIntentId: pi.id,
    })
    return
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })

  if (!order) {
    logger.warn('Order not found for failed payment intent', { orderId })
    return
  }
  if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
    logger.info('Order already in terminal state — skipping', { orderId, status: order.status })
    return
  }

  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } },
      })
    }
    if (order.couponCode) {
      await tx.coupon.update({
        where: { code: order.couponCode },
        data: { usesCount: { decrement: 1 } },
      })
    }
    await tx.order.update({ where: { id: orderId }, data: { status: 'CANCELLED' } })
  })

  logger.info('Order cancelled due to payment failure', { orderId, paymentIntentId: pi.id })
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function handleWebhookEvent(rawBody: Buffer, signature: string): Promise<void> {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured')
  }

  let event: { type: string; id: string; data: { object: unknown } }

  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    throw new Error(`Webhook signature verification failed: ${message}`)
  }

  logger.info('Stripe webhook received', { type: event.type, id: event.id })

  const pi = event.data.object as PaymentIntentEventObject

  switch (event.type) {
    case 'payment_intent.succeeded':
      await confirmOrder(pi)
      break
    case 'payment_intent.payment_failed':
      await cancelOrder(pi)
      break
    default:
      logger.debug('Unhandled webhook event type', { type: event.type })
  }
}
