import { Router } from 'express'
import { validate } from '@/middleware/validate'
import { writeLimiter } from '@/middleware/rateLimiter'
import { addToWishlistSchema, productIdParamSchema } from '@repo/validation'
import * as controller from './wishlist.controller'

const router: Router = Router()

// All routes require authentication (auth guard wired in Phase 3).

router.get('/', controller.getWishlist)
router.delete('/', writeLimiter, controller.clearWishlist)

router.post('/items', writeLimiter, validate(addToWishlistSchema), controller.addItem)
router.get('/items/:productId', validate(productIdParamSchema, 'params'), controller.checkItem)
router.delete(
  '/items/:productId',
  writeLimiter,
  validate(productIdParamSchema, 'params'),
  controller.removeItem
)

export default router
