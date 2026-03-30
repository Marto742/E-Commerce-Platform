import { Router } from 'express'
import { validate } from '@/middleware/validate'
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

const router: Router = Router()

// ── Products ──────────────────────────────────────────────

// Public
router.get('/', validate(productQuerySchema, 'query'), controller.list)
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
router.delete(
  '/:id/variants/:variantId',
  validate(idParamSchema, 'params'),
  controller.removeVariant
)

export default router
