import { z } from 'zod'

const CouponType = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED_AMOUNT: 'FIXED_AMOUNT',
} as const

export const createCouponSchema = z.object({
  code: z.string().min(1).max(50).toUpperCase(),
  type: z.nativeEnum(CouponType),
  value: z.number().positive(),
  minOrderAmount: z.number().positive().optional(),
  maxUses: z.number().int().positive().optional(),
  expiresAt: z.coerce.date().optional(),
  isActive: z.boolean().default(true),
})

export type CreateCouponInput = z.infer<typeof createCouponSchema>

export const updateCouponSchema = createCouponSchema.partial()

export type UpdateCouponInput = z.infer<typeof updateCouponSchema>

export const applyCouponSchema = z.object({
  code: z.string().min(1),
})

export type ApplyCouponInput = z.infer<typeof applyCouponSchema>
