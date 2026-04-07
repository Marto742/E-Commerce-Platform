import { Router } from 'express'
import { validate } from '@/middleware/validate'
import { parsePagination } from '@/middleware/pagination'
import { writeLimiter } from '@/middleware/rateLimiter'
import { authenticate } from '@/middleware/authenticate'
import {
  createReviewSchema,
  updateReviewSchema,
  reviewQuerySchema,
  idParamSchema,
} from '@repo/validation'
import * as controller from './reviews.controller'

const router: Router = Router()

// ── Authenticated — static paths first (must precede /:id) ───────────────────
router.get(
  '/my',
  authenticate,
  validate(reviewQuerySchema, 'query'),
  parsePagination,
  controller.listMine
)
router.post('/', authenticate, writeLimiter, validate(createReviewSchema), controller.create)

// ── Public ────────────────────────────────────────────────
router.get('/:id', validate(idParamSchema, 'params'), controller.getOne)

// ── Authenticated — dynamic paths ────────────────────────
router.patch(
  '/:id',
  authenticate,
  writeLimiter,
  validate(idParamSchema, 'params'),
  validate(updateReviewSchema),
  controller.update
)
router.delete(
  '/:id',
  authenticate,
  writeLimiter,
  validate(idParamSchema, 'params'),
  controller.remove
)

export default router
