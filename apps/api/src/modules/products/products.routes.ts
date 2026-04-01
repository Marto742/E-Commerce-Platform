import { Router } from 'express'
import { z } from 'zod'
import { validate } from '@/middleware/validate'
import { parsePagination } from '@/middleware/pagination'
import {
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  updateVariantSchema,
  productQuerySchema,
  idParamSchema,
  slugParamSchema,
} from '@repo/validation'
import * as controller from './products.controller'

const stockAdjustSchema = z.object({
  operation: z.enum(['set', 'add', 'subtract']),
  quantity: z.number().int().min(0),
})

const router: Router = Router()

// ── Products ──────────────────────────────────────────────

// Public
router.get('/', validate(productQuerySchema, 'query'), parsePagination, controller.list)
router.get('/slug/:slug', validate(slugParamSchema, 'params'), controller.getBySlug)
router.get('/:id', validate(idParamSchema, 'params'), controller.getOne)

// Admin-only (auth guard wired in Phase 3)
router.post('/', validate(createProductSchema), controller.create)
router.patch(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(updateProductSchema),
  controller.update
)
router.delete('/:id', validate(idParamSchema, 'params'), controller.remove)

// ── Variants ──────────────────────────────────────────────

// Public
router.get('/:id/variants', validate(idParamSchema, 'params'), controller.listVariants)
router.get('/:id/variants/:variantId', validate(idParamSchema, 'params'), controller.getVariant)

// Admin-only (auth guard wired in Phase 3)
router.post(
  '/:id/variants',
  validate(idParamSchema, 'params'),
  validate(createVariantSchema.omit({ productId: true })),
  controller.createVariant
)
router.patch(
  '/:id/variants/:variantId',
  validate(idParamSchema, 'params'),
  validate(updateVariantSchema),
  controller.updateVariant
)
router.patch(
  '/:id/variants/:variantId/stock',
  validate(idParamSchema, 'params'),
  validate(stockAdjustSchema),
  controller.adjustStock
)
router.delete(
  '/:id/variants/:variantId',
  validate(idParamSchema, 'params'),
  controller.removeVariant
)

export default router
