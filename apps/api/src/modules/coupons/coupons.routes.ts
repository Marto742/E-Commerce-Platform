import { Router } from 'express'
import { validate } from '@/middleware/validate'
import { writeLimiter } from '@/middleware/rateLimiter'
import {
  createCouponSchema,
  updateCouponSchema,
  validateCouponSchema,
  idParamSchema,
} from '@repo/validation'
import * as controller from './coupons.controller'

const router: Router = Router()

// ── Admin: coupon management ──────────────────────────────────────────────────
router.get('/', controller.list)
router.get('/:id', validate(idParamSchema, 'params'), controller.getOne)
router.post('/', writeLimiter, validate(createCouponSchema), controller.create)
router.patch(
  '/:id',
  writeLimiter,
  validate(idParamSchema, 'params'),
  validate(updateCouponSchema),
  controller.update
)
router.delete('/:id', writeLimiter, validate(idParamSchema, 'params'), controller.remove)

// ── Public: validate a coupon code before checkout ────────────────────────────
router.post('/validate', writeLimiter, validate(validateCouponSchema), controller.validate)

export default router
