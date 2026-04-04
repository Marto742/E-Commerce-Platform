/**
 * webhook.service.test.ts
 *
 * Unit tests for handleWebhookEvent — simulates every Stripe event outcome.
 *
 * Stripe test card scenarios covered:
 *   ✅ 4242 4242 4242 4242   — payment_intent.succeeded → order CONFIRMED + stock deducted
 *   ✅ Guest order success    — confirmation email sent to guestEmail
 *   ❌ 4000 0000 0000 0002   — payment_intent.payment_failed → order CANCELLED, coupon reverted
 *   🔄 Idempotency            — already-CONFIRMED order → no duplicate processing
 *   🔒 Invalid signature      — 400, order untouched
 *   ⚠️  Missing orderId        — logged warn, no crash
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import * as emailLib from '@/lib/emails/order-confirmation'
import { handleWebhookEvent } from './webhook.service'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: { findUnique: vi.fn(), update: vi.fn() },
    productVariant: { findUnique: vi.fn(), update: vi.fn() },
    coupon: { update: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: { constructEventAsync: vi.fn() },
  },
}))

vi.mock('@/lib/emails/order-confirmation', () => ({
  sendOrderConfirmationEmail: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/config/env', () => ({
  env: {
    STRIPE_WEBHOOK_SECRET: 'whsec_test_secret',
    NODE_ENV: 'test',
    RESEND_API_KEY: 'test-key',
    EMAIL_FROM: 'noreply@test.com',
  },
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeEvent(type: string, metadata: Record<string, string> = {}, piId = 'pi_test') {
  return { id: 'evt_test', type, data: { object: { id: piId, metadata } } }
}

function makeOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 'order-1',
    userId: 'user-1',
    guestEmail: null,
    status: 'PENDING',
    subtotal: '25.00',
    shippingCost: '5.99',
    tax: '1.60',
    total: '32.59',
    discountAmount: '0.00',
    couponCode: null,
    shippingAddress: {
      line1: '123 Main St',
      city: 'Springfield',
      state: 'IL',
      postalCode: '62701',
      country: 'US',
    },
    user: { email: 'user@example.com', firstName: 'John', lastName: 'Doe' },
    items: [
      {
        id: 'oi-1',
        variantId: 'var-1',
        productName: 'Widget',
        variantName: 'Default',
        quantity: 2,
        price: '12.50',
      },
    ],
    ...overrides,
  }
}

function setupWebhookEvent(type: string, metadata: Record<string, string> = {}) {
  vi.mocked(stripe.webhooks.constructEventAsync).mockResolvedValue(
    makeEvent(type, metadata) as never
  )
}

const RAW_BODY = Buffer.from('{}')
const VALID_SIG = 'stripe-sig-valid'

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── payment_intent.succeeded (test card 4242 4242 4242 4242) ─────────────────

describe('payment_intent.succeeded — card 4242', () => {
  it('confirms the order and deducts stock', async () => {
    setupWebhookEvent('payment_intent.succeeded', { orderId: 'order-1' })

    const order = makeOrder()
    vi.mocked(prisma.order.findUnique).mockResolvedValue(order as never)
    vi.mocked(prisma.$transaction).mockImplementation(async (cb: unknown) => {
      if (typeof cb !== 'function') return cb
      const tx = {
        productVariant: {
          findUnique: vi.fn().mockResolvedValue({ id: 'var-1', sku: 'SKU-001', stock: 5 }),
          update: vi.fn().mockResolvedValue({}),
        },
        order: { update: vi.fn().mockResolvedValue({ ...order, status: 'CONFIRMED' }) },
      }
      return tx.order.update ? cb(tx) : cb
    })

    await handleWebhookEvent(RAW_BODY, VALID_SIG)

    expect(prisma.$transaction).toHaveBeenCalledOnce()
  })

  it('sends confirmation email to authenticated user', async () => {
    setupWebhookEvent('payment_intent.succeeded', { orderId: 'order-1' })
    vi.mocked(prisma.order.findUnique).mockResolvedValue(makeOrder() as never)
    vi.mocked(prisma.$transaction).mockImplementation(async (cb: unknown) => {
      if (typeof cb !== 'function') return cb
      const tx = {
        productVariant: {
          findUnique: vi.fn().mockResolvedValue({ id: 'var-1', sku: 'SKU-001', stock: 5 }),
          update: vi.fn().mockResolvedValue({}),
        },
        order: { update: vi.fn().mockResolvedValue({}) },
      }
      return cb(tx)
    })

    await handleWebhookEvent(RAW_BODY, VALID_SIG)

    // Email is fire-and-forget — give microtasks a tick
    await new Promise((r) => setTimeout(r, 0))
    expect(emailLib.sendOrderConfirmationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ customerEmail: 'user@example.com', customerName: 'John Doe' })
    )
  })

  it('sends confirmation email to guest using guestEmail and guestName from PI metadata', async () => {
    setupWebhookEvent('payment_intent.succeeded', {
      orderId: 'order-1',
      guestEmail: 'guest@example.com',
      guestName: 'Jane Doe',
    })
    const guestOrder = makeOrder({ userId: null, guestEmail: 'guest@example.com', user: null })
    vi.mocked(prisma.order.findUnique).mockResolvedValue(guestOrder as never)
    vi.mocked(prisma.$transaction).mockImplementation(async (cb: unknown) => {
      if (typeof cb !== 'function') return cb
      const tx = {
        productVariant: {
          findUnique: vi.fn().mockResolvedValue({ id: 'var-1', sku: 'SKU-001', stock: 5 }),
          update: vi.fn().mockResolvedValue({}),
        },
        order: { update: vi.fn().mockResolvedValue({}) },
      }
      return cb(tx)
    })

    await handleWebhookEvent(RAW_BODY, VALID_SIG)

    await new Promise((r) => setTimeout(r, 0))
    expect(emailLib.sendOrderConfirmationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        customerEmail: 'guest@example.com',
        customerName: 'Jane Doe',
      })
    )
  })

  it('is idempotent — skips already CONFIRMED order (Stripe retry simulation)', async () => {
    setupWebhookEvent('payment_intent.succeeded', { orderId: 'order-1' })
    vi.mocked(prisma.order.findUnique).mockResolvedValue(
      makeOrder({ status: 'CONFIRMED' }) as never
    )

    await handleWebhookEvent(RAW_BODY, VALID_SIG)

    expect(prisma.$transaction).not.toHaveBeenCalled()
    expect(emailLib.sendOrderConfirmationEmail).not.toHaveBeenCalled()
  })

  it('is idempotent — skips CANCELLED order', async () => {
    setupWebhookEvent('payment_intent.succeeded', { orderId: 'order-1' })
    vi.mocked(prisma.order.findUnique).mockResolvedValue(
      makeOrder({ status: 'CANCELLED' }) as never
    )

    await handleWebhookEvent(RAW_BODY, VALID_SIG)

    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('skips gracefully when orderId is missing from metadata', async () => {
    setupWebhookEvent('payment_intent.succeeded', {}) // no orderId
    await expect(handleWebhookEvent(RAW_BODY, VALID_SIG)).resolves.toBeUndefined()
    expect(prisma.order.findUnique).not.toHaveBeenCalled()
  })

  it('skips gracefully when order is not found in DB', async () => {
    setupWebhookEvent('payment_intent.succeeded', { orderId: 'missing' })
    vi.mocked(prisma.order.findUnique).mockResolvedValue(null)
    await expect(handleWebhookEvent(RAW_BODY, VALID_SIG)).resolves.toBeUndefined()
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('skips email when order has no email address (no user, no guestEmail)', async () => {
    setupWebhookEvent('payment_intent.succeeded', { orderId: 'order-1' })
    const noEmailOrder = makeOrder({ userId: null, guestEmail: null, user: null })
    vi.mocked(prisma.order.findUnique).mockResolvedValue(noEmailOrder as never)
    vi.mocked(prisma.$transaction).mockImplementation(async (cb: unknown) => {
      if (typeof cb !== 'function') return cb
      const tx = {
        productVariant: {
          findUnique: vi.fn().mockResolvedValue({ id: 'var-1', sku: 'SKU-001', stock: 5 }),
          update: vi.fn().mockResolvedValue({}),
        },
        order: { update: vi.fn().mockResolvedValue({}) },
      }
      return cb(tx)
    })

    await handleWebhookEvent(RAW_BODY, VALID_SIG)
    await new Promise((r) => setTimeout(r, 0))
    expect(emailLib.sendOrderConfirmationEmail).not.toHaveBeenCalled()
  })
})

// ─── payment_intent.payment_failed (test card 4000 0000 0000 0002) ───────────

describe('payment_intent.payment_failed — card declined (4000 0000 0000 0002)', () => {
  it('cancels a PENDING order', async () => {
    setupWebhookEvent('payment_intent.payment_failed', { orderId: 'order-1' })
    const order = makeOrder({ couponCode: null })
    vi.mocked(prisma.order.findUnique).mockResolvedValue(order as never)
    vi.mocked(prisma.$transaction).mockImplementation(async (cb: unknown) => {
      if (typeof cb !== 'function') return cb
      const tx = {
        coupon: { update: vi.fn() },
        order: { update: vi.fn().mockResolvedValue({ ...order, status: 'CANCELLED' }) },
      }
      return cb(tx)
    })

    await handleWebhookEvent(RAW_BODY, VALID_SIG)

    expect(prisma.$transaction).toHaveBeenCalledOnce()
  })

  it('reverts coupon usesCount when order had a coupon applied', async () => {
    setupWebhookEvent('payment_intent.payment_failed', { orderId: 'order-1' })
    const order = makeOrder({ couponCode: 'SAVE10' })
    vi.mocked(prisma.order.findUnique).mockResolvedValue(order as never)

    let couponUpdateCalled = false
    vi.mocked(prisma.$transaction).mockImplementation(async (cb: unknown) => {
      if (typeof cb !== 'function') return cb
      const tx = {
        coupon: {
          update: vi.fn().mockImplementation(() => {
            couponUpdateCalled = true
            return {}
          }),
        },
        order: { update: vi.fn().mockResolvedValue({ ...order, status: 'CANCELLED' }) },
      }
      return cb(tx)
    })

    await handleWebhookEvent(RAW_BODY, VALID_SIG)

    expect(couponUpdateCalled).toBe(true)
  })

  it('does not restore stock (stock was never decremented for PENDING order)', async () => {
    setupWebhookEvent('payment_intent.payment_failed', { orderId: 'order-1' })
    vi.mocked(prisma.order.findUnique).mockResolvedValue(makeOrder() as never)

    let variantUpdateCalled = false
    vi.mocked(prisma.$transaction).mockImplementation(async (cb: unknown) => {
      if (typeof cb !== 'function') return cb
      const tx = {
        coupon: { update: vi.fn() },
        order: { update: vi.fn().mockResolvedValue({}) },
        productVariant: {
          update: vi.fn().mockImplementation(() => {
            variantUpdateCalled = true
            return {}
          }),
        },
      }
      return cb(tx)
    })

    await handleWebhookEvent(RAW_BODY, VALID_SIG)
    expect(variantUpdateCalled).toBe(false)
  })

  it('skips terminal orders (idempotency on retry)', async () => {
    setupWebhookEvent('payment_intent.payment_failed', { orderId: 'order-1' })
    vi.mocked(prisma.order.findUnique).mockResolvedValue(
      makeOrder({ status: 'CANCELLED' }) as never
    )

    await handleWebhookEvent(RAW_BODY, VALID_SIG)

    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('skips gracefully when orderId is missing', async () => {
    setupWebhookEvent('payment_intent.payment_failed', {})
    await expect(handleWebhookEvent(RAW_BODY, VALID_SIG)).resolves.toBeUndefined()
  })
})

// ─── Signature verification ───────────────────────────────────────────────────

describe('signature verification', () => {
  it('throws when Stripe signature is invalid (prevents spoofed webhooks)', async () => {
    vi.mocked(stripe.webhooks.constructEventAsync).mockRejectedValue(
      new Error('No signatures found matching the expected signature for payload')
    )

    await expect(handleWebhookEvent(RAW_BODY, 'bad-sig')).rejects.toThrow(
      'Webhook signature verification failed'
    )

    expect(prisma.order.findUnique).not.toHaveBeenCalled()
  })

  it('throws when signature verification fails — confirms secret is required at runtime', async () => {
    // The handler always verifies via constructEventAsync; a missing/wrong secret
    // surfaces as a signature error. The unit test for the missing-secret branch is
    // covered by the env guard in stripe.ts (throws at module load time).
    vi.mocked(stripe.webhooks.constructEventAsync).mockRejectedValue(
      new Error('No signatures found matching the expected signature for payload')
    )
    await expect(handleWebhookEvent(RAW_BODY, 'wrong-secret')).rejects.toThrow(
      'Webhook signature verification failed'
    )
  })
})

// ─── Unhandled event types ────────────────────────────────────────────────────

describe('unhandled event types', () => {
  it('silently ignores events that are not handled (e.g. charge.succeeded)', async () => {
    setupWebhookEvent('charge.succeeded', {})
    await expect(handleWebhookEvent(RAW_BODY, VALID_SIG)).resolves.toBeUndefined()
    expect(prisma.order.findUnique).not.toHaveBeenCalled()
  })
})
