import { z } from 'zod'
import { paginationSchema } from './common'

const decimalSchema = z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal number')

export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  description: z.string().optional(),
  categoryId: z.string().cuid(),
  basePrice: decimalSchema,
  comparePrice: decimalSchema.optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
})

export type CreateProductInput = z.infer<typeof createProductSchema>

export const updateProductSchema = createProductSchema.partial()

export type UpdateProductInput = z.infer<typeof updateProductSchema>

export const createVariantSchema = z.object({
  productId: z.string().cuid(),
  sku: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  price: decimalSchema,
  stock: z.number().int().min(0),
  attributes: z.record(z.unknown()),
  isActive: z.boolean().default(true),
})

export type CreateVariantInput = z.infer<typeof createVariantSchema>

export const updateVariantSchema = createVariantSchema.partial()

export type UpdateVariantInput = z.infer<typeof updateVariantSchema>

export const createCategorySchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  imageUrl: z.string().url().optional(),
  parentId: z.string().cuid().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>

export const updateCategorySchema = createCategorySchema.partial()

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>

const SortBy = z.enum(['name', 'basePrice', 'createdAt', 'isFeatured'])
const SortOrder = z.enum(['asc', 'desc'])

export const productQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  categoryId: z.string().cuid().optional(),
  isFeatured: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  minPrice: decimalSchema.optional(),
  maxPrice: decimalSchema.optional(),
  minRating: z.coerce.number().int().min(1).max(5).optional(),
  sortBy: SortBy.optional(),
  sortOrder: SortOrder.optional(),
})

export type ProductQueryInput = z.infer<typeof productQuerySchema>
