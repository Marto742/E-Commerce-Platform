import { z } from 'zod'

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional(),
  phoneNumber: z.string().min(1).max(30).optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

export const createAddressSchema = z.object({
  line1: z.string().min(1).max(255),
  line2: z.string().max(255).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  postalCode: z.string().min(1).max(20),
  country: z.string().length(2).default('US'),
  isDefault: z.boolean().default(false),
})

export type CreateAddressInput = z.infer<typeof createAddressSchema>

export const updateAddressSchema = createAddressSchema.partial()

export type UpdateAddressInput = z.infer<typeof updateAddressSchema>
