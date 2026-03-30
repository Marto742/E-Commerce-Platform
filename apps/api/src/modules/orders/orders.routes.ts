import { Router } from 'express'
import { z } from 'zod'
import { validate } from '@/middleware/validate'
import { createOrderSchema, orderQuerySchema, idParamSchema } from '@repo/validation'
import * as controller from './orders.controller'

const router: Router = Router()

// All order endpoints require authentication (wired in Phase 3).
// Until then they return 401 UNAUTHORIZED.

const updateStatusBodySchema = z.object({
  status: z.enum(['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
})

router.get('/', validate(orderQuerySchema, 'query'), controller.list)
router.get('/:id', validate(idParamSchema, 'params'), controller.getOne)
router.post('/', validate(createOrderSchema), controller.create)

// Admin: advance status through the pipeline
router.patch(
  '/:id/status',
  validate(idParamSchema, 'params'),
  validate(updateStatusBodySchema),
  controller.updateStatus
)

// User: cancel their own order
router.post('/:id/cancel', validate(idParamSchema, 'params'), controller.cancel)

export default router
