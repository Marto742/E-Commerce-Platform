import { z } from 'zod'
import { paginationSchema } from './common'

export const createReviewSchema = z.object({
  productId: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(255).optional(),
  body: z.string().optional(),
})

export type CreateReviewInput = z.infer<typeof createReviewSchema>

export const updateReviewSchema = z
  .object({
    rating: z.number().int().min(1).max(5).optional(),
    title: z.string().max(255).optional(),
    body: z.string().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'At least one field must be provided' })

export type UpdateReviewInput = z.infer<typeof updateReviewSchema>

export const reviewQuerySchema = paginationSchema.extend({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  verified: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['rating', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

export type ReviewQueryInput = z.infer<typeof reviewQuerySchema>
