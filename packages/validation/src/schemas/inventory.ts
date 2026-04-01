import { z } from 'zod'
import { paginationSchema } from './common'

export const inventoryQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  productId: z.string().cuid().optional(),
  minStock: z.coerce.number().int().min(0).optional(),
  maxStock: z.coerce.number().int().min(0).optional(),
  isActive: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['stock', 'name', 'sku', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

export const lowStockQuerySchema = paginationSchema.extend({
  threshold: z.coerce.number().int().min(0).optional(),
})

export type InventoryQueryInput = z.infer<typeof inventoryQuerySchema>
export type LowStockQueryInput = z.infer<typeof lowStockQuerySchema>
