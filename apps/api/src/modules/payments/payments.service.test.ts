/**
 * payments.service.test.ts
 *
 * Unit tests for createPaymentIntent and createGuestPaymentIntent.
 * Stripe is mocked — no real API calls are made.
 *
 * Stripe test card scenarios simulated:
 *   ✅ 4242 4242 4242 4242 — immediate success
 *   ✅ Guest checkout (no userId)
 *   ❌ Unavailable variant → 422 before PI is created
 *   ❌ Insufficient stock  → 409 before PI is created
 *   ❌ Invalid coupon      → 422 before PI is created
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { createPaymentIntent, createGuestPaymentIntent } from './payments.service'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/lib/prisma', () => ({
  prisma: {
    productVariant: { findMany: vi.fn() },
    coupon: { findUnique: vi.fn(), update: vi.fn() },
    order: { create: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/stripe', () => ({
  stripe: {
    paymentIntents: { create: vi.fn() },
  },
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockVariant = {
  id: 'var-1',
  name: 'Default',
  sku: 'SKU-001',
  price: 25.0,
  stock: 10,
  isActive: true,
  product: { name: 'Widget' },
}

const mockOrder = {
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
  stripePaymentIntentId: null,
  shippingAddress: {},
  billingAddress: {},
  items: [],
}

// Simulates a Stripe PaymentIntent as returned for test card 4242 4242 4242 4242
const mockPaymentIntent = {
  id: 'pi_test_4242',
  client_secret: 'pi_test_4242_secret_abc',
}

const baseIntentInput = {
  items: [{ variantId: 'var-1', quantity: 1 }],
  shippingAddress: {
    line1: '123 Main St',
    city: 'Springfield',
    state: 'IL',
    postalCode: '62701',
    country: 'US',
  },
  shippingMethod: 'STANDARD' as const,
}

function setupHappyPath() {
  vi.mocked(prisma.productVariant.findMany).mockResolvedValue([mockVariant] as never)
  vi.mocked(prisma.$transaction).mockImplementation(async (cb: (tx: never) => unknown) =>
    cb({
      coupon: { update: vi.fn() },
      order: { create: vi.fn().mockResolvedValue(mockOrder) },
    } as never)
  )
  vi.mocked(stripe.paymentIntents.create).mockResolvedValue(mockPaymentIntent as never)
  vi.mocked(prisma.order.update).mockResolvedValue({
    ...mockOrder,
    stripePaymentIntentId: mockPaymentIntent.id,
  } as never)
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── createPaymentIntent (authenticated) ──────────────────────────────────────

describe('createPaymentIntent — authenticated', () => {
  it('creates a PaymentIntent and returns clientSecret + breakdown (simulates test card 4242)', async () => {
    setupHappyPath()

    const result = await createPaymentIntent('user-1', baseIntentInput)

    expect(stripe.paymentIntents.create).toHaveBeenCalledOnce()
    expect(result.clientSecret).toBe(mockPaymentIntent.client_secret)
    expect(result.orderId).toBe(mockOrder.id)
    expect(result.breakdown).toMatchObject({
      subtotal: 25,
      shipping: 5.99, // US STANDARD < $75 threshold
      discount: 0,
    })
    expect(result.breakdown.total).toBeGreaterThan(0)
  })

  it('applies free STANDARD shipping when subtotal >= $75 (test card 4242, large order)', async () => {
    const bigVariant = { ...mockVariant, price: 80.0 }
    vi.mocked(prisma.productVariant.findMany).mockResolvedValue([bigVariant] as never)
    vi.mocked(prisma.$transaction).mockImplementation(async (cb: (tx: never) => unknown) =>
      cb({
        coupon: { update: vi.fn() },
        order: { create: vi.fn().mockResolvedValue(mockOrder) },
      } as never)
    )
    vi.mocked(stripe.paymentIntents.create).mockResolvedValue(mockPaymentIntent as never)
    vi.mocked(prisma.order.update).mockResolvedValue(mockOrder as never)

    const result = await createPaymentIntent('user-1', {
      ...baseIntentInput,
      items: [{ variantId: 'var-1', quantity: 1 }],
    })
    expect(result.breakdown.shipping).toBe(0)
  })

  it('applies EXPRESS shipping cost for US', async () => {
    setupHappyPath()
    const result = await createPaymentIntent('user-1', {
      ...baseIntentInput,
      shippingMethod: 'EXPRESS',
    })
    expect(result.breakdown.shipping).toBe(14.99)
  })

  it('applies OVERNIGHT shipping cost for US', async () => {
    setupHappyPath()
    const result = await createPaymentIntent('user-1', {
      ...baseIntentInput,
      shippingMethod: 'OVERNIGHT',
    })
    expect(result.breakdown.shipping).toBe(24.99)
  })

  it('applies international STANDARD rate for non-US country', async () => {
    setupHappyPath()
    const result = await createPaymentIntent('user-1', {
      ...baseIntentInput,
      shippingAddress: {
        ...baseIntentInput.shippingAddress,
        country: 'GB',
        postalCode: 'SW1A 1AA',
      },
    })
    expect(result.breakdown.shipping).toBe(14.99)
  })

  it('applies a valid coupon discount', async () => {
    const coupon = {
      id: 'coupon-1',
      code: 'SAVE5',
      type: 'FIXED_AMOUNT',
      value: '5.00',
      isActive: true,
      expiresAt: null,
      maxUses: null,
      usesCount: 0,
      minOrderAmount: null,
    }
    vi.mocked(prisma.productVariant.findMany).mockResolvedValue([mockVariant] as never)
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue(coupon as never)
    vi.mocked(prisma.$transaction).mockImplementation(async (cb: (tx: never) => unknown) =>
      cb({
        coupon: { update: vi.fn() },
        order: { create: vi.fn().mockResolvedValue(mockOrder) },
      } as never)
    )
    vi.mocked(stripe.paymentIntents.create).mockResolvedValue(mockPaymentIntent as never)
    vi.mocked(prisma.order.update).mockResolvedValue(mockOrder as never)

    const result = await createPaymentIntent('user-1', { ...baseIntentInput, couponCode: 'SAVE5' })
    expect(result.breakdown.discount).toBe(5)
  })

  it('throws INSUFFICIENT_STOCK when variant stock is too low (simulates card declined before PI)', async () => {
    vi.mocked(prisma.productVariant.findMany).mockResolvedValue([
      { ...mockVariant, stock: 0 },
    ] as never)

    await expect(
      createPaymentIntent('user-1', {
        ...baseIntentInput,
        items: [{ variantId: 'var-1', quantity: 1 }],
      })
    ).rejects.toMatchObject({ code: 'INSUFFICIENT_STOCK' })

    expect(stripe.paymentIntents.create).not.toHaveBeenCalled()
  })

  it('throws badRequest when variant is not found / inactive (simulates cart invalidation)', async () => {
    vi.mocked(prisma.productVariant.findMany).mockResolvedValue([] as never)

    await expect(createPaymentIntent('user-1', baseIntentInput)).rejects.toMatchObject({
      statusCode: 422,
    })

    expect(stripe.paymentIntents.create).not.toHaveBeenCalled()
  })

  it('throws COUPON_INVALID for an expired coupon', async () => {
    vi.mocked(prisma.productVariant.findMany).mockResolvedValue([mockVariant] as never)
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      id: 'coupon-1',
      code: 'EXPIRED',
      isActive: true,
      expiresAt: new Date('2000-01-01'),
      maxUses: null,
      usesCount: 0,
      minOrderAmount: null,
      type: 'FIXED_AMOUNT',
      value: '10.00',
    } as never)

    await expect(
      createPaymentIntent('user-1', { ...baseIntentInput, couponCode: 'EXPIRED' })
    ).rejects.toMatchObject({ code: 'COUPON_INVALID' })

    expect(stripe.paymentIntents.create).not.toHaveBeenCalled()
  })
})

// ─── createGuestPaymentIntent ─────────────────────────────────────────────────

describe('createGuestPaymentIntent — guest (no account)', () => {
  const guestInput = {
    ...baseIntentInput,
    email: 'guest@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
  }

  it('creates a PaymentIntent for a guest and returns clientSecret (simulates test card 4242)', async () => {
    setupHappyPath()

    const result = await createGuestPaymentIntent(guestInput)

    expect(stripe.paymentIntents.create).toHaveBeenCalledOnce()
    // Guest metadata — guestEmail and guestName are stored on the PI
    const piArgs = vi.mocked(stripe.paymentIntents.create).mock.calls[0]?.[0] as Record<
      string,
      unknown
    >
    expect((piArgs['metadata'] as Record<string, string>)['guestEmail']).toBe('guest@example.com')
    expect((piArgs['metadata'] as Record<string, string>)['guestName']).toBe('Jane Doe')
    expect(result.clientSecret).toBe(mockPaymentIntent.client_secret)
  })

  it('records guestEmail on the order (no userId)', async () => {
    setupHappyPath()
    await createGuestPaymentIntent(guestInput)

    const txCall = vi.mocked(prisma.$transaction).mock.calls[0]?.[0]
    if (typeof txCall === 'function') {
      // Verify the order.create was called with guestEmail
      const txMock = {
        coupon: { update: vi.fn() },
        order: { create: vi.fn().mockResolvedValue(mockOrder) },
      }
      await txCall(txMock as never)
      const createArgs = txMock.order.create.mock.calls[0]?.[0] as { data: Record<string, unknown> }
      expect(createArgs.data['guestEmail']).toBe('guest@example.com')
      expect(createArgs.data['userId']).toBeNull()
    }
  })

  it('throws INSUFFICIENT_STOCK before creating PI for guest', async () => {
    vi.mocked(prisma.productVariant.findMany).mockResolvedValue([
      { ...mockVariant, stock: 0 },
    ] as never)

    await expect(createGuestPaymentIntent(guestInput)).rejects.toMatchObject({
      code: 'INSUFFICIENT_STOCK',
    })
    expect(stripe.paymentIntents.create).not.toHaveBeenCalled()
  })
})
