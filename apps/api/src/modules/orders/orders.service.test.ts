import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import {
  listOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  cancelOrder,
} from './orders.service'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    productVariant: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    coupon: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    address: {
      findFirst: vi.fn(),
    },
    orderItem: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

const mockOrder = {
  id: 'order-1',
  userId: 'user-1',
  status: 'PENDING',
  subtotal: '20.00',
  shippingCost: '5.00',
  tax: '1.20',
  total: '26.20',
  discountAmount: '0.00',
  couponCode: null,
  items: [],
  _count: { items: 0 },
}

const mockVariant = {
  id: 'var-1',
  name: 'Default',
  price: 10.0,
  stock: 20,
  isActive: true,
  product: { name: 'Widget' },
}

const mockAddress = {
  id: 'addr-1',
  userId: 'user-1',
  line1: '123 Main St',
  line2: null,
  city: 'Springfield',
  state: 'IL',
  postalCode: '62701',
  country: 'US',
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── listOrders ───────────────────────────────────────────────────────────────

describe('listOrders', () => {
  it('returns paginated orders for regular user', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([[mockOrder], 1] as never)
    const result = await listOrders('user-1', false, { page: 1, limit: 10 })
    expect(result.orders).toEqual([mockOrder])
    expect(result.meta.total).toBe(1)
  })

  it('admin sees all orders', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([[mockOrder], 1] as never)
    await listOrders('admin-1', true, { page: 1, limit: 10 })
    expect(prisma.$transaction).toHaveBeenCalled()
  })
})

// ─── getOrderById ─────────────────────────────────────────────────────────────

describe('getOrderById', () => {
  it('returns order for its owner', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as never)
    const result = await getOrderById('order-1', 'user-1', false)
    expect(result).toEqual(mockOrder)
  })

  it('returns any order for admin', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      ...mockOrder,
      userId: 'another-user',
    } as never)
    const result = await getOrderById('order-1', 'admin-1', true)
    expect(result).toMatchObject({ userId: 'another-user' })
  })

  it('throws notFound when order does not exist', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(null)
    await expect(getOrderById('missing', 'user-1', false)).rejects.toMatchObject({
      statusCode: 404,
    })
  })

  it('throws forbidden when non-owner accesses order', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      ...mockOrder,
      userId: 'other-user',
    } as never)
    await expect(getOrderById('order-1', 'user-1', false)).rejects.toMatchObject({
      statusCode: 403,
      code: 'FORBIDDEN',
    })
  })
})

// ─── createOrder ─────────────────────────────────────────────────────────────

describe('createOrder', () => {
  const orderInput = {
    items: [{ variantId: 'var-1', quantity: 2 }],
    shippingAddressId: 'addr-1',
  }

  function setupCreateOrderMocks() {
    vi.mocked(prisma.productVariant.findMany).mockResolvedValue([mockVariant] as never)
    vi.mocked(prisma.address.findFirst).mockResolvedValue(mockAddress as never)
    vi.mocked(prisma.$transaction).mockImplementation(async (cb: unknown) => {
      if (typeof cb === 'function') {
        const tx = {
          productVariant: { update: vi.fn().mockResolvedValue({}) },
          coupon: { update: vi.fn().mockResolvedValue({}) },
          order: { create: vi.fn().mockResolvedValue(mockOrder) },
        }
        return cb(tx)
      }
      return cb
    })
  }

  it('creates order and returns it', async () => {
    setupCreateOrderMocks()
    const result = await createOrder('user-1', orderInput)
    expect(result).toEqual(mockOrder)
  })

  it('throws badRequest when a variant is unavailable', async () => {
    // Returns fewer variants than requested
    vi.mocked(prisma.productVariant.findMany).mockResolvedValue([] as never)
    await expect(createOrder('user-1', orderInput)).rejects.toMatchObject({
      statusCode: 422,
    })
  })

  it('throws INSUFFICIENT_STOCK when variant stock is too low', async () => {
    vi.mocked(prisma.productVariant.findMany).mockResolvedValue([
      { ...mockVariant, stock: 1 },
    ] as never)
    await expect(
      createOrder('user-1', { ...orderInput, items: [{ variantId: 'var-1', quantity: 5 }] })
    ).rejects.toMatchObject({ code: 'INSUFFICIENT_STOCK' })
  })

  it('throws notFound when shipping address does not belong to user', async () => {
    vi.mocked(prisma.productVariant.findMany).mockResolvedValue([mockVariant] as never)
    vi.mocked(prisma.address.findFirst).mockResolvedValue(null)
    await expect(createOrder('user-1', orderInput)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws COUPON_INVALID for unknown coupon code', async () => {
    vi.mocked(prisma.productVariant.findMany).mockResolvedValue([mockVariant] as never)
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.address.findFirst).mockResolvedValue(mockAddress as never)
    await expect(
      createOrder('user-1', { ...orderInput, couponCode: 'BOGUS' })
    ).rejects.toMatchObject({ code: 'COUPON_INVALID' })
  })

  it('throws COUPON_INVALID for expired coupon', async () => {
    vi.mocked(prisma.productVariant.findMany).mockResolvedValue([mockVariant] as never)
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      id: 'c1',
      code: 'SAVE10',
      isActive: true,
      expiresAt: new Date('2000-01-01'), // past
      maxUses: null,
      usesCount: 0,
      minOrderAmount: null,
      type: 'FIXED',
      value: 10,
    } as never)
    vi.mocked(prisma.address.findFirst).mockResolvedValue(mockAddress as never)
    await expect(
      createOrder('user-1', { ...orderInput, couponCode: 'SAVE10' })
    ).rejects.toMatchObject({ code: 'COUPON_INVALID' })
  })

  it('throws COUPON_INVALID when coupon usage limit is reached', async () => {
    vi.mocked(prisma.productVariant.findMany).mockResolvedValue([mockVariant] as never)
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      id: 'c1',
      code: 'SAVE10',
      isActive: true,
      expiresAt: null,
      maxUses: 5,
      usesCount: 5, // at limit
      minOrderAmount: null,
      type: 'FIXED',
      value: 10,
    } as never)
    vi.mocked(prisma.address.findFirst).mockResolvedValue(mockAddress as never)
    await expect(
      createOrder('user-1', { ...orderInput, couponCode: 'SAVE10' })
    ).rejects.toMatchObject({ code: 'COUPON_INVALID' })
  })

  it('throws COUPON_INVALID when order total is below minimum', async () => {
    vi.mocked(prisma.productVariant.findMany).mockResolvedValue([mockVariant] as never)
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      id: 'c1',
      code: 'BIGORDER',
      isActive: true,
      expiresAt: null,
      maxUses: null,
      usesCount: 0,
      minOrderAmount: 500, // requires $500 order
      type: 'FIXED',
      value: 50,
    } as never)
    vi.mocked(prisma.address.findFirst).mockResolvedValue(mockAddress as never)
    await expect(
      createOrder('user-1', { ...orderInput, couponCode: 'BIGORDER' })
    ).rejects.toMatchObject({ code: 'COUPON_INVALID' })
  })
})

// ─── updateOrderStatus ────────────────────────────────────────────────────────

describe('updateOrderStatus', () => {
  it('advances order to a valid next status', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as never) // PENDING
    vi.mocked(prisma.order.update).mockResolvedValue({
      ...mockOrder,
      status: 'CONFIRMED',
    } as never)
    const result = await updateOrderStatus('order-1', 'CONFIRMED')
    expect(result).toMatchObject({ status: 'CONFIRMED' })
  })

  it('throws notFound when order does not exist', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(null)
    await expect(updateOrderStatus('missing', 'CONFIRMED')).rejects.toMatchObject({
      statusCode: 404,
    })
  })

  it('throws badRequest for invalid status transition', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as never) // PENDING
    // PENDING → DELIVERED is not allowed
    await expect(updateOrderStatus('order-1', 'DELIVERED')).rejects.toMatchObject({
      statusCode: 422,
    })
    expect(prisma.order.update).not.toHaveBeenCalled()
  })

  it('throws badRequest when trying to transition from a terminal status', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      ...mockOrder,
      status: 'DELIVERED',
    } as never)
    await expect(updateOrderStatus('order-1', 'CANCELLED')).rejects.toMatchObject({
      statusCode: 422,
    })
  })

  it('restores stock when admin cancels a CONFIRMED order', async () => {
    const confirmedOrder = {
      ...mockOrder,
      status: 'CONFIRMED',
      couponCode: null,
      items: [{ id: 'oi-1', variantId: 'var-1', quantity: 3 }],
    }
    vi.mocked(prisma.order.findUnique).mockResolvedValue(confirmedOrder as never)
    let variantUpdateCalled = false
    vi.mocked(prisma.$transaction).mockImplementation(async (cb: unknown) => {
      if (typeof cb === 'function') {
        const tx = {
          productVariant: {
            update: vi.fn().mockImplementation(() => {
              variantUpdateCalled = true
              return {}
            }),
          },
          coupon: { update: vi.fn().mockResolvedValue({}) },
          order: { update: vi.fn().mockResolvedValue({ ...confirmedOrder, status: 'CANCELLED' }) },
        }
        return cb(tx)
      }
      return cb
    })

    const result = await updateOrderStatus('order-1', 'CANCELLED')
    expect(result).toMatchObject({ status: 'CANCELLED' })
    expect(variantUpdateCalled).toBe(true)
  })
})

// ─── cancelOrder ─────────────────────────────────────────────────────────────

describe('cancelOrder', () => {
  it('cancels a PENDING order without restoring stock (payment never collected)', async () => {
    const orderWithItems = {
      ...mockOrder,
      status: 'PENDING',
      couponCode: null,
      items: [{ id: 'oi-1', variantId: 'var-1', quantity: 2 }],
    }
    vi.mocked(prisma.order.findUnique).mockResolvedValue(orderWithItems as never)
    let variantUpdateCalled = false
    vi.mocked(prisma.$transaction).mockImplementation(async (cb: unknown) => {
      if (typeof cb === 'function') {
        const tx = {
          productVariant: {
            update: vi.fn().mockImplementation(() => {
              variantUpdateCalled = true
              return {}
            }),
          },
          coupon: { update: vi.fn().mockResolvedValue({}) },
          order: { update: vi.fn().mockResolvedValue({ ...orderWithItems, status: 'CANCELLED' }) },
        }
        return cb(tx)
      }
      return cb
    })

    const result = await cancelOrder('order-1', 'user-1')
    expect(result).toMatchObject({ status: 'CANCELLED' })
    expect(variantUpdateCalled).toBe(false)
  })

  it('cancels a CONFIRMED order and restores stock', async () => {
    const confirmedOrder = {
      ...mockOrder,
      status: 'CONFIRMED',
      couponCode: null,
      items: [{ id: 'oi-1', variantId: 'var-1', quantity: 2 }],
    }
    vi.mocked(prisma.order.findUnique).mockResolvedValue(confirmedOrder as never)
    let variantUpdateCalled = false
    vi.mocked(prisma.$transaction).mockImplementation(async (cb: unknown) => {
      if (typeof cb === 'function') {
        const tx = {
          productVariant: {
            update: vi.fn().mockImplementation(() => {
              variantUpdateCalled = true
              return {}
            }),
          },
          coupon: { update: vi.fn().mockResolvedValue({}) },
          order: { update: vi.fn().mockResolvedValue({ ...confirmedOrder, status: 'CANCELLED' }) },
        }
        return cb(tx)
      }
      return cb
    })

    const result = await cancelOrder('order-1', 'user-1')
    expect(result).toMatchObject({ status: 'CANCELLED' })
    expect(variantUpdateCalled).toBe(true)
  })

  it('throws notFound when order does not exist', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(null)
    await expect(cancelOrder('missing', 'user-1')).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws forbidden when user does not own the order', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      ...mockOrder,
      userId: 'other-user',
      items: [],
    } as never)
    await expect(cancelOrder('order-1', 'user-1')).rejects.toMatchObject({
      statusCode: 403,
    })
  })

  it('throws badRequest when order is not PENDING or CONFIRMED', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      ...mockOrder,
      status: 'SHIPPED',
      items: [],
    } as never)
    await expect(cancelOrder('order-1', 'user-1')).rejects.toMatchObject({ statusCode: 422 })
  })
})
