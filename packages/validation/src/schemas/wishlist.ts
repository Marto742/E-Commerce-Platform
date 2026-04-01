import { z } from 'zod'

export const addToWishlistSchema = z.object({
  productId: z.string().cuid(),
})

export type AddToWishlistInput = z.infer<typeof addToWishlistSchema>
