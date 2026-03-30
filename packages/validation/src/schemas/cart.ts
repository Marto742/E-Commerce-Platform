import { z } from 'zod'

export const addToCartSchema = z.object({
  variantId: z.string().cuid(),
  quantity: z.number().int().min(1),
})

export type AddToCartInput = z.infer<typeof addToCartSchema>

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1),
})

export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>

export const removeFromCartSchema = z.object({
  itemId: z.string().cuid(),
})

export type RemoveFromCartInput = z.infer<typeof removeFromCartSchema>
