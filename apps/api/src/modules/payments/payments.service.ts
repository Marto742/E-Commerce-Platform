import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { AppError } from '@/utils/AppError'
import { calculateShipping, type ShippingMethod } from '@/utils/shipping'
import type { CreatePaymentIntentInput, GuestCreatePaymentIntentInput } from '@repo/validation'

const TAX_RATE = 0.08

// ─── Shared helpers ───────────────────────────────────────────────────────────

async function resolveCartItems(items: Array<{ variantId: string; quantity: number }>) {
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

  return { subtotal, orderItemsData }
}

async function resolveCoupon(couponCode: string | undefined, subtotal: number) {
  if (!couponCode) return { discountAmount: 0, appliedCoupon: null }

  const coupon = await prisma.coupon.findUnique({
    where: { code: couponCode.toUpperCase() },
  })

  if (!coupon || !coupon.isActive) throw new AppError(422, 'COUPON_INVALID', 'Invalid coupon code')
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

  const discountAmount =
    coupon.type === 'PERCENTAGE'
      ? (subtotal * Number(coupon.value)) / 100
      : Math.min(Number(coupon.value), subtotal)

  return { discountAmount, appliedCoupon: coupon }
}

function snapshotAddress(addr: {
  line1: string
  line2?: string | null
  city: string
  state: string
  postalCode: string
  country: string
}) {
  return {
    line1: addr.line1,
    line2: addr.line2 ?? null,
    city: addr.city,
    state: addr.state,
    postalCode: addr.postalCode,
    country: addr.country,
  }
}

function buildBreakdown(subtotal: number, discountAmount: number, shippingCost: number) {
  const tax = (subtotal - discountAmount) * TAX_RATE
  const total = subtotal + shippingCost + tax - discountAmount
  return { tax, total, totalInCents: Math.round(total * 100) }
}

async function persistOrder(data: {
  userId?: string | null
  guestEmail?: string | null
  subtotal: number
  shippingCost: number
  discountAmount: number
  tax: number
  total: number
  couponCode: string | null
  appliedCouponId: string | null
  shippingAddress: ReturnType<typeof snapshotAddress>
  billingAddress: ReturnType<typeof snapshotAddress>
  orderItemsData: Array<{
    variantId: string
    productName: string
    variantName: string
    price: string
    quantity: number
  }>
}) {
  // Note: stock is NOT decremented here — deduction happens atomically in the
  // payment_intent.succeeded webhook to avoid holding stock against unpaid orders.
  return prisma.$transaction(async (tx) => {
    if (data.appliedCouponId) {
      await tx.coupon.update({
        where: { id: data.appliedCouponId },
        data: { usesCount: { increment: 1 } },
      })
    }

    return tx.order.create({
      data: {
        userId: data.userId ?? null,
        guestEmail: data.guestEmail ?? null,
        status: 'PENDING',
        subtotal: data.subtotal.toFixed(2),
        shippingCost: data.shippingCost.toFixed(2),
        tax: data.tax.toFixed(2),
        total: data.total.toFixed(2),
        discountAmount: data.discountAmount.toFixed(2),
        couponCode: data.couponCode,
        shippingAddress: data.shippingAddress,
        billingAddress: data.billingAddress,
        items: { createMany: { data: data.orderItemsData } },
      },
    })
  })
}

async function attachPaymentIntent(
  order: { id: string },
  totalInCents: number,
  metadata: Record<string, string>
) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalInCents,
    currency: 'usd',
    metadata,
    automatic_payment_methods: { enabled: true },
  })

  await prisma.order.update({
    where: { id: order.id },
    data: { stripePaymentIntentId: paymentIntent.id },
  })

  return paymentIntent
}

function formatResult(
  paymentIntent: { client_secret: string | null },
  orderId: string,
  totalInCents: number,
  subtotal: number,
  shippingCost: number,
  discountAmount: number,
  tax: number,
  total: number
) {
  return {
    clientSecret: paymentIntent.client_secret,
    orderId,
    amount: totalInCents,
    currency: 'usd',
    breakdown: {
      subtotal: Number(subtotal.toFixed(2)),
      shipping: Number(shippingCost.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      discount: Number(discountAmount.toFixed(2)),
      total: Number(total.toFixed(2)),
    },
  }
}

// ─── Authenticated checkout ───────────────────────────────────────────────────

export async function createPaymentIntent(userId: string, data: CreatePaymentIntentInput) {
  const { items, shippingAddress, billingAddress, couponCode, shippingMethod } = data

  const { subtotal, orderItemsData } = await resolveCartItems(items)
  const { discountAmount, appliedCoupon } = await resolveCoupon(couponCode, subtotal)
  const shippingCost = calculateShipping(
    shippingAddress.country,
    subtotal,
    shippingMethod as ShippingMethod
  )
  const { tax, total, totalInCents } = buildBreakdown(subtotal, discountAmount, shippingCost)

  const order = await persistOrder({
    userId,
    subtotal,
    shippingCost,
    discountAmount,
    tax,
    total,
    couponCode: appliedCoupon?.code ?? null,
    appliedCouponId: appliedCoupon?.id ?? null,
    shippingAddress: snapshotAddress(shippingAddress),
    billingAddress: billingAddress
      ? snapshotAddress(billingAddress)
      : snapshotAddress(shippingAddress),
    orderItemsData,
  })

  const paymentIntent = await attachPaymentIntent(order, totalInCents, {
    orderId: order.id,
    userId,
  })

  return formatResult(
    paymentIntent,
    order.id,
    totalInCents,
    subtotal,
    shippingCost,
    discountAmount,
    tax,
    total
  )
}

// ─── Guest checkout ───────────────────────────────────────────────────────────

export async function createGuestPaymentIntent(data: GuestCreatePaymentIntentInput) {
  const {
    items,
    shippingAddress,
    billingAddress,
    couponCode,
    shippingMethod,
    email,
    firstName,
    lastName,
  } = data

  const { subtotal, orderItemsData } = await resolveCartItems(items)
  const { discountAmount, appliedCoupon } = await resolveCoupon(couponCode, subtotal)
  const shippingCost = calculateShipping(
    shippingAddress.country,
    subtotal,
    shippingMethod as ShippingMethod
  )
  const { tax, total, totalInCents } = buildBreakdown(subtotal, discountAmount, shippingCost)

  const order = await persistOrder({
    guestEmail: email,
    subtotal,
    shippingCost,
    discountAmount,
    tax,
    total,
    couponCode: appliedCoupon?.code ?? null,
    appliedCouponId: appliedCoupon?.id ?? null,
    shippingAddress: snapshotAddress(shippingAddress),
    billingAddress: billingAddress
      ? snapshotAddress(billingAddress)
      : snapshotAddress(shippingAddress),
    orderItemsData,
  })

  const paymentIntent = await attachPaymentIntent(order, totalInCents, {
    orderId: order.id,
    guestEmail: email,
    guestName: `${firstName} ${lastName}`.trim(),
  })

  return formatResult(
    paymentIntent,
    order.id,
    totalInCents,
    subtotal,
    shippingCost,
    discountAmount,
    tax,
    total
  )
}
