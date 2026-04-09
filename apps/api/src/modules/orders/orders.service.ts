import { prisma } from '@/lib/prisma'
import { AppError } from '@/utils/AppError'
import { buildPaginationMeta } from '@/utils/response'
import { generateTrackingNumber } from '@/utils/tracking'
import { calculateShipping, type ShippingMethod } from '@/utils/shipping'
import type { CreateOrderInput, OrderQueryInput } from '@repo/validation'

const TAX_RATE = 0.08

const ORDER_DETAIL_INCLUDE = {
  items: {
    include: {
      variant: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: {
                take: 1,
                orderBy: { sortOrder: 'asc' as const },
                select: { url: true, altText: true },
              },
            },
          },
        },
      },
    },
  },
} as const

const ORDER_LIST_INCLUDE = {
  items: { select: { id: true, productName: true, quantity: true, price: true } },
  _count: { select: { items: true } },
} as const

export async function listOrders(userId: string, isAdmin: boolean, query: OrderQueryInput) {
  const { page, limit, status, userId: filterUserId } = query
  const skip = (page - 1) * limit

  const where = {
    ...(isAdmin ? (filterUserId ? { userId: filterUserId } : {}) : { userId }),
    ...(status && { status }),
  }

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: ORDER_LIST_INCLUDE,
    }),
    prisma.order.count({ where }),
  ])

  return { orders, meta: buildPaginationMeta(total, page, limit) }
}

export async function getOrderById(id: string, userId: string, isAdmin: boolean) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: ORDER_DETAIL_INCLUDE,
  })

  if (!order) throw AppError.notFound('Order not found')
  if (!isAdmin && (!order.userId || order.userId !== userId)) throw AppError.forbidden()

  return order
}

export async function createOrder(userId: string, data: CreateOrderInput) {
  const { items, shippingAddressId, billingAddressId, couponCode, shippingMethod, notes } = data

  // 1. Validate all variants in one query
  const variantIds = items.map((i) => i.variantId)
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds }, isActive: true },
    include: { product: { select: { name: true } } },
  })

  if (variants.length !== variantIds.length) {
    throw AppError.badRequest('One or more product variants are unavailable')
  }

  for (const item of items) {
    const variant = variants.find((v) => v.id === item.variantId)!
    if (variant.stock < item.quantity) {
      throw new AppError(
        409,
        'INSUFFICIENT_STOCK',
        `Only ${variant.stock} unit(s) of "${variant.name}" available`
      )
    }
  }

  // 2. Build order items + subtotal
  let subtotal = 0
  const orderItemsData = items.map((item) => {
    const variant = variants.find((v) => v.id === item.variantId)!
    const price = Number(variant.price)
    subtotal += price * item.quantity
    return {
      variantId: item.variantId,
      productName: variant.product.name,
      variantName: variant.name,
      price: price.toFixed(2),
      quantity: item.quantity,
    }
  })

  // 3. Apply coupon
  let discountAmount = 0
  let appliedCoupon: Awaited<ReturnType<typeof prisma.coupon.findUnique>> = null

  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode.toUpperCase() },
    })

    if (!coupon || !coupon.isActive)
      throw new AppError(422, 'COUPON_INVALID', 'Invalid coupon code')
    if (coupon.expiresAt && coupon.expiresAt < new Date())
      throw new AppError(422, 'COUPON_INVALID', 'Coupon has expired')
    if (coupon.maxUses !== null && coupon.usesCount >= coupon.maxUses)
      throw new AppError(422, 'COUPON_INVALID', 'Coupon has reached its usage limit')
    if (coupon.minOrderAmount !== null && subtotal < Number(coupon.minOrderAmount))
      throw new AppError(
        422,
        'COUPON_INVALID',
        `Minimum order amount for this coupon is ${Number(coupon.minOrderAmount).toFixed(2)}`
      )

    discountAmount =
      coupon.type === 'PERCENTAGE'
        ? (subtotal * Number(coupon.value)) / 100
        : Math.min(Number(coupon.value), subtotal)

    appliedCoupon = coupon
  }

  // 4. Resolve shipping address (needed for country-based shipping rate)
  const shippingAddr = await prisma.address.findFirst({
    where: { id: shippingAddressId, userId },
  })
  if (!shippingAddr) throw AppError.notFound('Shipping address not found')

  let billingAddr = shippingAddr
  if (billingAddressId) {
    const found = await prisma.address.findFirst({
      where: { id: billingAddressId, userId },
    })
    if (!found) throw AppError.notFound('Billing address not found')
    billingAddr = found
  }

  const snapshotAddress = (addr: typeof shippingAddr) => ({
    line1: addr.line1,
    line2: addr.line2 ?? null,
    city: addr.city,
    state: addr.state,
    postalCode: addr.postalCode,
    country: addr.country,
  })

  // 5. Final totals
  const shippingCost = calculateShipping(
    shippingAddr.country,
    subtotal,
    shippingMethod as ShippingMethod
  )
  const tax = (subtotal - discountAmount) * TAX_RATE
  const total = subtotal + shippingCost + tax - discountAmount

  // 6. Persist everything in a single transaction
  // Note: stock is NOT decremented here — it is decremented atomically in the
  // payment_intent.succeeded webhook (task 5.16). This prevents stock from
  // being held against orders that never complete payment.
  return prisma.$transaction(async (tx) => {
    if (appliedCoupon) {
      await tx.coupon.update({
        where: { id: appliedCoupon.id },
        data: { usesCount: { increment: 1 } },
      })
    }

    return tx.order.create({
      data: {
        userId,
        status: 'PENDING',
        subtotal: subtotal.toFixed(2),
        shippingCost: shippingCost.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
        discountAmount: discountAmount.toFixed(2),
        couponCode: appliedCoupon?.code ?? null,
        shippingAddress: snapshotAddress(shippingAddr),
        billingAddress: snapshotAddress(billingAddr),
        notes: notes ?? null,
        items: { createMany: { data: orderItemsData } },
      },
      include: ORDER_DETAIL_INCLUDE,
    })
  })
}

// Admin: advance order through the status pipeline
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
}

// Orders whose stock has been decremented (i.e. payment was collected)
const STOCK_HELD_STATUSES = new Set(['CONFIRMED', 'PROCESSING', 'SHIPPED'])

export async function updateOrderStatus(id: string, status: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  })
  if (!order) throw AppError.notFound('Order not found')

  const allowed = ALLOWED_TRANSITIONS[order.status] ?? []
  if (!allowed.includes(status)) {
    throw AppError.badRequest(`Cannot transition order from ${order.status} to ${status}`)
  }

  // Auto-assign a tracking number when transitioning to SHIPPED (if not already set)
  const extraData: Record<string, string> = {}
  if (status === 'SHIPPED' && !order.trackingNumber) {
    extraData.trackingNumber = generateTrackingNumber()
  }

  // Restore stock when admin cancels an order that had already been paid
  if (status === 'CANCELLED' && STOCK_HELD_STATUSES.has(order.status)) {
    return prisma.$transaction(async (tx) => {
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
      return tx.order.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: ORDER_DETAIL_INCLUDE,
      })
    })
  }

  return prisma.order.update({
    where: { id },
    data: { status: status as never, ...extraData },
    include: ORDER_DETAIL_INCLUDE,
  })
}

// Admin: set or update tracking number on any non-terminal order
export async function setTrackingNumber(id: string, trackingNumber: string) {
  const order = await prisma.order.findUnique({ where: { id } })
  if (!order) throw AppError.notFound('Order not found')

  if (['CANCELLED', 'REFUNDED'].includes(order.status)) {
    throw AppError.badRequest('Cannot set tracking number on a cancelled or refunded order')
  }

  return prisma.order.update({
    where: { id },
    data: { trackingNumber },
    include: ORDER_DETAIL_INCLUDE,
  })
}

// Admin: refund a delivered order
export async function refundOrder(id: string, reason?: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  })
  if (!order) throw AppError.notFound('Order not found')
  if (order.status !== 'DELIVERED') {
    throw AppError.badRequest('Only delivered orders can be refunded')
  }

  const refundNote = reason ? `REFUNDED: ${reason}` : 'REFUNDED'
  const updatedNotes = order.notes ? `${order.notes}\n${refundNote}` : refundNote

  return prisma.$transaction(async (tx) => {
    // Restore stock
    for (const item of order.items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } },
      })
    }
    // Decrement coupon usage
    if (order.couponCode) {
      await tx.coupon.update({
        where: { code: order.couponCode },
        data: { usesCount: { decrement: 1 } },
      })
    }
    return tx.order.update({
      where: { id },
      data: { status: 'REFUNDED', notes: updatedNotes },
      include: ORDER_DETAIL_INCLUDE,
    })
  })
}

// User: cancel their own order (only PENDING or CONFIRMED)
export async function cancelOrder(id: string, userId: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  })

  if (!order) throw AppError.notFound('Order not found')
  // Guest orders have no userId — they cannot be cancelled through this endpoint
  if (!order.userId || order.userId !== userId) throw AppError.forbidden()
  if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
    throw AppError.badRequest('Only pending or confirmed orders can be cancelled')
  }

  return prisma.$transaction(async (tx) => {
    // Stock was decremented by the payment webhook only for CONFIRMED orders.
    // PENDING orders were never paid — no stock to restore.
    if (order.status === 'CONFIRMED') {
      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        })
      }
    }

    // Decrement coupon usage
    if (order.couponCode) {
      await tx.coupon.update({
        where: { code: order.couponCode },
        data: { usesCount: { decrement: 1 } },
      })
    }

    return tx.order.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: ORDER_DETAIL_INCLUDE,
    })
  })
}
