import { prisma } from '@/lib/prisma'
import { AppError } from '@/utils/AppError'
import { buildPaginationMeta } from '@/utils/response'
import type { CreateCouponInput, UpdateCouponInput } from '@repo/validation'

// ─── List (admin) ─────────────────────────────────────────────────────────────

export interface CouponQuery {
  page: number
  limit: number
  isActive?: boolean
  search?: string
}

export async function listCoupons(query: CouponQuery) {
  const { page, limit, isActive, search } = query
  const skip = (page - 1) * limit

  const where = {
    ...(isActive !== undefined && { isActive }),
    ...(search && { code: { contains: search.toUpperCase() } }),
  }

  const [coupons, total] = await prisma.$transaction([
    prisma.coupon.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.coupon.count({ where }),
  ])

  return { coupons, meta: buildPaginationMeta(total, page, limit) }
}

// ─── Get one (admin) ──────────────────────────────────────────────────────────

export async function getCouponById(id: string) {
  const coupon = await prisma.coupon.findUnique({ where: { id } })
  if (!coupon) throw AppError.notFound('Coupon not found')
  return coupon
}

// ─── Create (admin) ───────────────────────────────────────────────────────────

export async function createCoupon(data: CreateCouponInput) {
  const existing = await prisma.coupon.findUnique({ where: { code: data.code } })
  if (existing)
    throw new AppError(409, 'COUPON_CODE_TAKEN', `Coupon code "${data.code}" already exists`)

  return prisma.coupon.create({
    data: {
      code: data.code,
      type: data.type,
      value: data.value.toFixed(2),
      minOrderAmount: data.minOrderAmount != null ? data.minOrderAmount.toFixed(2) : null,
      maxUses: data.maxUses ?? null,
      expiresAt: data.expiresAt ?? null,
      isActive: data.isActive,
    },
  })
}

// ─── Update (admin) ───────────────────────────────────────────────────────────

export async function updateCoupon(id: string, data: UpdateCouponInput) {
  const coupon = await prisma.coupon.findUnique({ where: { id } })
  if (!coupon) throw AppError.notFound('Coupon not found')

  // If changing the code, ensure no conflict
  if (data.code && data.code !== coupon.code) {
    const conflict = await prisma.coupon.findUnique({ where: { code: data.code } })
    if (conflict)
      throw new AppError(409, 'COUPON_CODE_TAKEN', `Coupon code "${data.code}" already exists`)
  }

  return prisma.coupon.update({
    where: { id },
    data: {
      ...(data.code && { code: data.code }),
      ...(data.type && { type: data.type }),
      ...(data.value != null && { value: data.value.toFixed(2) }),
      ...(data.minOrderAmount !== undefined && {
        minOrderAmount: data.minOrderAmount != null ? data.minOrderAmount.toFixed(2) : null,
      }),
      ...(data.maxUses !== undefined && { maxUses: data.maxUses ?? null }),
      ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt ?? null }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  })
}

// ─── Delete (admin) ───────────────────────────────────────────────────────────

export async function deleteCoupon(id: string) {
  const coupon = await prisma.coupon.findUnique({ where: { id } })
  if (!coupon) throw AppError.notFound('Coupon not found')
  await prisma.coupon.delete({ where: { id } })
}

// ─── Validate / preview (public) ─────────────────────────────────────────────

export interface ValidateCouponResult {
  code: string
  type: string
  discountAmount: number
  discountLabel: string
}

export async function validateCoupon(
  code: string,
  subtotal: number
): Promise<ValidateCouponResult> {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } })

  if (!coupon || !coupon.isActive) throw new AppError(422, 'COUPON_INVALID', 'Invalid coupon code')
  if (coupon.expiresAt && coupon.expiresAt < new Date())
    throw new AppError(422, 'COUPON_INVALID', 'Coupon has expired')
  if (coupon.maxUses !== null && coupon.usesCount >= coupon.maxUses)
    throw new AppError(422, 'COUPON_INVALID', 'Coupon has reached its usage limit')
  if (coupon.minOrderAmount !== null && subtotal < Number(coupon.minOrderAmount))
    throw new AppError(
      422,
      'COUPON_INVALID',
      `Minimum order amount for this coupon is $${Number(coupon.minOrderAmount).toFixed(2)}`
    )

  const discountAmount =
    coupon.type === 'PERCENTAGE'
      ? (subtotal * Number(coupon.value)) / 100
      : Math.min(Number(coupon.value), subtotal)

  const discountLabel =
    coupon.type === 'PERCENTAGE'
      ? `${Number(coupon.value)}% off`
      : `$${Number(coupon.value).toFixed(2)} off`

  return {
    code: coupon.code,
    type: coupon.type,
    discountAmount: Number(discountAmount.toFixed(2)),
    discountLabel,
  }
}
