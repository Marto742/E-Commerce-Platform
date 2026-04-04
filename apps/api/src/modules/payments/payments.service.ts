import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { AppError } from '@/utils/AppError'
import type { CreatePaymentIntentInput } from '@repo/validation'

const SHIPPING_COST = 5.0
const TAX_RATE = 0.08

export async function createPaymentIntent(userId: string, data: CreatePaymentIntentInput) {
  const { items, shippingAddress, billingAddress, couponCode } = data

  // 1. Validate variants
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

  // 4. Final totals
  const tax = (subtotal - discountAmount) * TAX_RATE
  const total = subtotal + SHIPPING_COST + tax - discountAmount
  const totalInCents = Math.round(total * 100)

  // 5. Snapshot addresses (stored as JSON on the order)
  const snapshotShipping = {
    line1: shippingAddress.line1,
    line2: shippingAddress.line2 ?? null,
    city: shippingAddress.city,
    state: shippingAddress.state,
    postalCode: shippingAddress.postalCode,
    country: shippingAddress.country,
  }
  const snapshotBilling = billingAddress
    ? {
        line1: billingAddress.line1,
        line2: billingAddress.line2 ?? null,
        city: billingAddress.city,
        state: billingAddress.state,
        postalCode: billingAddress.postalCode,
        country: billingAddress.country,
      }
    : snapshotShipping

  // 6. Create order (PENDING) + decrement stock in a transaction
  const order = await prisma.$transaction(async (tx) => {
    for (const item of items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { decrement: item.quantity } },
      })
    }

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
        shippingCost: SHIPPING_COST.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
        discountAmount: discountAmount.toFixed(2),
        couponCode: appliedCoupon?.code ?? null,
        shippingAddress: snapshotShipping,
        billingAddress: snapshotBilling,
        items: { createMany: { data: orderItemsData } },
      },
    })
  })

  // 7. Create Stripe PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalInCents,
    currency: 'usd',
    metadata: { orderId: order.id, userId },
    automatic_payment_methods: { enabled: true },
  })

  // 8. Store paymentIntentId on the order
  await prisma.order.update({
    where: { id: order.id },
    data: { stripePaymentIntentId: paymentIntent.id },
  })

  return {
    clientSecret: paymentIntent.client_secret,
    orderId: order.id,
    amount: totalInCents,
    currency: 'usd',
    breakdown: {
      subtotal: Number(subtotal.toFixed(2)),
      shipping: SHIPPING_COST,
      tax: Number(tax.toFixed(2)),
      discount: Number(discountAmount.toFixed(2)),
      total: Number(total.toFixed(2)),
    },
  }
}
