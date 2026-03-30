import { z } from 'zod'

export const createReviewSchema = z.object({
  productId: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(255).optional(),
  body: z.string().optional(),
})

export type CreateReviewInput = z.infer<typeof createReviewSchema>

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().max(255).optional(),
  body: z.string().optional(),
})

export type UpdateReviewInput = z.infer<typeof updateReviewSchema>
