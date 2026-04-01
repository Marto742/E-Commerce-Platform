import { Router } from 'express'
import { validate } from '@/middleware/validate'
import { parsePagination } from '@/middleware/pagination'
import {
  createReviewSchema,
  updateReviewSchema,
  reviewQuerySchema,
  idParamSchema,
} from '@repo/validation'
import * as controller from './reviews.controller'

const router: Router = Router()

// ── Authenticated — static paths first (must precede /:id) ───────────────────
// Auth guard wired in Phase 3; returns 401 until then.
router.get('/my', validate(reviewQuerySchema, 'query'), parsePagination, controller.listMine)
router.post('/', validate(createReviewSchema), controller.create)

// ── Public ────────────────────────────────────────────────
router.get('/:id', validate(idParamSchema, 'params'), controller.getOne)

// ── Authenticated — dynamic paths ────────────────────────
router.patch(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(updateReviewSchema),
  controller.update
)
router.delete('/:id', validate(idParamSchema, 'params'), controller.remove)

export default router
