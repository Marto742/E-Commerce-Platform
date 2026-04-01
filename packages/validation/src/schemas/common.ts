import { z } from 'zod'

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type PaginationInput = z.infer<typeof paginationSchema>

export const idParamSchema = z.object({
  id: z.string().cuid(),
})

export type IdParamInput = z.infer<typeof idParamSchema>

export const slugParamSchema = z.object({
  slug: z.string().min(1),
})

export type SlugParamInput = z.infer<typeof slugParamSchema>

export const productIdParamSchema = z.object({
  productId: z.string().cuid(),
})

export type ProductIdParamInput = z.infer<typeof productIdParamSchema>
