import { z } from 'zod'

export const addressSchema = z.object({
  line1: z.string().min(1).max(255),
  line2: z.string().max(255).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  postalCode: z.string().min(1).max(20),
  country: z.string().length(2).default('US'),
})

export type AddressInput = z.infer<typeof addressSchema>

export const createPaymentIntentSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string().cuid(),
        quantity: z.number().int().min(1),
      })
    )
    .min(1),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  couponCode: z.string().optional(),
})

export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>
