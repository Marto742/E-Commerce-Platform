import { z } from 'zod'

// ─── Postal code patterns per country ─────────────────────────────────────────

const POSTAL_PATTERNS: Record<string, { pattern: RegExp; hint: string }> = {
  US: { pattern: /^\d{5}(-\d{4})?$/, hint: '12345 or 12345-6789' },
  CA: { pattern: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, hint: 'A1A 1A1' },
  GB: {
    pattern: /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$/,
    hint: 'SW1A 1AA',
  },
  AU: { pattern: /^\d{4}$/, hint: '2000' },
  DE: { pattern: /^\d{5}$/, hint: '10115' },
  FR: { pattern: /^\d{5}$/, hint: '75001' },
}

function validatePostalCode(postalCode: string, country: string): boolean {
  const entry = POSTAL_PATTERNS[country]
  if (!entry) return postalCode.length >= 2 && postalCode.length <= 20
  return entry.pattern.test(postalCode.trim())
}

// ─── Address schema ────────────────────────────────────────────────────────────

export const addressSchema = z
  .object({
    line1: z
      .string()
      .min(5, 'Address must be at least 5 characters')
      .max(255)
      .refine((v) => v.trim().length > 0, 'Address is required'),
    line2: z.string().max(255).optional(),
    city: z
      .string()
      .min(2, 'City must be at least 2 characters')
      .max(100)
      .regex(/^[\p{L}\s'\-.,]+$/u, 'City contains invalid characters'),
    state: z.string().min(2, 'State / Province must be at least 2 characters').max(100),
    postalCode: z.string().min(2).max(20),
    country: z.string().length(2, 'Select a valid country'),
  })
  .superRefine((data, ctx) => {
    if (!validatePostalCode(data.postalCode, data.country)) {
      const hint = POSTAL_PATTERNS[data.country]?.hint
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['postalCode'],
        message: hint
          ? `Invalid postal code format for selected country (e.g. ${hint})`
          : 'Invalid postal code',
      })
    }
  })

export type AddressInput = z.infer<typeof addressSchema>

// ─── Payment intent schema ─────────────────────────────────────────────────────

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

// ─── Guest checkout ────────────────────────────────────────────────────────────

export const guestCreatePaymentIntentSchema = createPaymentIntentSchema.extend({
  email: z.string().email('A valid email is required for guest checkout'),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
})

export type GuestCreatePaymentIntentInput = z.infer<typeof guestCreatePaymentIntentSchema>
