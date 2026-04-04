import { z } from 'zod'

export const createPaymentIntentSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string().cuid(),
        quantity: z.number().int().min(1),
      })
    )
    .min(1),
  shippingAddressId: z.string().cuid(),
  billingAddressId: z.string().cuid().optional(),
  couponCode: z.string().optional(),
})

export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>
