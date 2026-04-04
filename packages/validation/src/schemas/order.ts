import { z } from 'zod'
import { paginationSchema } from './common'

const OrderStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const

export const createOrderSchema = z.object({
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
  shippingMethod: z.enum(['STANDARD', 'EXPRESS', 'OVERNIGHT']).default('STANDARD'),
  notes: z.string().max(1000).optional(),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>

export const updateOrderStatusSchema = z.object({
  orderId: z.string().cuid(),
  status: z.nativeEnum(OrderStatus),
})

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>

export const orderQuerySchema = paginationSchema.extend({
  status: z.nativeEnum(OrderStatus).optional(),
  userId: z.string().cuid().optional(),
})

export type OrderQueryInput = z.infer<typeof orderQuerySchema>
