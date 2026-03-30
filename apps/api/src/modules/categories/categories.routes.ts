import { Router } from 'express'
import { validate } from '@/middleware/validate'
import { createCategorySchema, updateCategorySchema, idParamSchema } from '@repo/validation'
import * as controller from './categories.controller'

const router: Router = Router()

// Public
router.get('/', controller.list)
router.get('/:id', validate(idParamSchema, 'params'), controller.getOne)

// Admin-only (auth guard wired in Phase 3)
router.post('/', validate(createCategorySchema), controller.create)
router.patch(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(updateCategorySchema),
  controller.update
)
router.delete('/:id', validate(idParamSchema, 'params'), controller.remove)

export default router
