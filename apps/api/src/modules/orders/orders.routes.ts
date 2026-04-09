import { Router } from 'express'
import { z } from 'zod'
import { validate } from '@/middleware/validate'
import { parsePagination } from '@/middleware/pagination'
import { writeLimiter } from '@/middleware/rateLimiter'
import { authenticate } from '@/middleware/authenticate'
import { createOrderSchema, orderQuerySchema, idParamSchema } from '@repo/validation'
import * as controller from './orders.controller'

const router: Router = Router()

// All order endpoints require authentication
router.use(authenticate)

const updateStatusBodySchema = z.object({
  status: z.enum(['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
})

const updateTrackingBodySchema = z.object({
  trackingNumber: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[A-Z0-9-]+$/, 'Tracking number must be uppercase alphanumeric with hyphens'),
})

router.get('/', validate(orderQuerySchema, 'query'), parsePagination, controller.list)
router.get('/:id', validate(idParamSchema, 'params'), controller.getOne)
router.post('/', writeLimiter, validate(createOrderSchema), controller.create)

// Admin: advance status through the pipeline
router.patch(
  '/:id/status',
  writeLimiter,
  validate(idParamSchema, 'params'),
  validate(updateStatusBodySchema),
  controller.updateStatus
)

// Admin: process a full refund on a delivered order
const refundBodySchema = z.object({
  reason: z.string().max(500).optional(),
})

router.post(
  '/:id/refund',
  writeLimiter,
  validate(idParamSchema, 'params'),
  validate(refundBodySchema),
  controller.refund
)

// Admin: set or override tracking number
router.patch(
  '/:id/tracking',
  writeLimiter,
  validate(idParamSchema, 'params'),
  validate(updateTrackingBodySchema),
  controller.updateTracking
)

// User: cancel their own order
router.post('/:id/cancel', writeLimiter, validate(idParamSchema, 'params'), controller.cancel)

export default router
