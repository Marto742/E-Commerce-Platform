import { Router } from 'express'
import { z } from 'zod'
import { validate } from '@/middleware/validate'
import { parsePagination } from '@/middleware/pagination'
import { searchLimiter, writeLimiter } from '@/middleware/rateLimiter'
import { requireAdmin } from '@/middleware/authenticate'
import {
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  updateVariantSchema,
  productQuerySchema,
  reviewQuerySchema,
  idParamSchema,
  slugParamSchema,
} from '@repo/validation'
import * as controller from './products.controller'
import * as reviewsController from '@/modules/reviews/reviews.controller'

const stockAdjustSchema = z.object({
  operation: z.enum(['set', 'add', 'subtract']),
  quantity: z.number().int().min(0),
})

const router: Router = Router()

// ── Products ──────────────────────────────────────────────

// Public
router.get(
  '/',
  searchLimiter,
  validate(productQuerySchema, 'query'),
  parsePagination,
  controller.list
)
router.get('/slug/:slug', validate(slugParamSchema, 'params'), controller.getBySlug)
router.get('/:id', validate(idParamSchema, 'params'), controller.getOne)

// Admin-only
router.post('/', requireAdmin, writeLimiter, validate(createProductSchema), controller.create)
router.patch(
  '/:id',
  requireAdmin,
  writeLimiter,
  validate(idParamSchema, 'params'),
  validate(updateProductSchema),
  controller.update
)
router.delete(
  '/:id',
  requireAdmin,
  writeLimiter,
  validate(idParamSchema, 'params'),
  controller.remove
)

// ── Reviews (product-scoped) ──────────────────────────────

// Public
router.get(
  '/:id/reviews',
  validate(idParamSchema, 'params'),
  validate(reviewQuerySchema, 'query'),
  parsePagination,
  reviewsController.listForProduct
)
router.get(
  '/:id/reviews/summary',
  validate(idParamSchema, 'params'),
  reviewsController.productSummary
)

// ── Variants ──────────────────────────────────────────────

// Public
router.get('/:id/variants', validate(idParamSchema, 'params'), controller.listVariants)
router.get('/:id/variants/:variantId', validate(idParamSchema, 'params'), controller.getVariant)

// Admin-only
router.post(
  '/:id/variants',
  requireAdmin,
  validate(idParamSchema, 'params'),
  validate(createVariantSchema.omit({ productId: true })),
  controller.createVariant
)
router.patch(
  '/:id/variants/:variantId',
  requireAdmin,
  validate(idParamSchema, 'params'),
  validate(updateVariantSchema),
  controller.updateVariant
)
router.patch(
  '/:id/variants/:variantId/stock',
  requireAdmin,
  validate(idParamSchema, 'params'),
  validate(stockAdjustSchema),
  controller.adjustStock
)
router.delete(
  '/:id/variants/:variantId',
  requireAdmin,
  validate(idParamSchema, 'params'),
  controller.removeVariant
)

export default router
