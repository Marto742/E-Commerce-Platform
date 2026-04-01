import { Router } from 'express'
import { validate } from '@/middleware/validate'
import { addToWishlistSchema, productIdParamSchema } from '@repo/validation'
import * as controller from './wishlist.controller'

const router: Router = Router()

// All routes require authentication (auth guard wired in Phase 3).

router.get('/', controller.getWishlist)
router.delete('/', controller.clearWishlist)

router.post('/items', validate(addToWishlistSchema), controller.addItem)
router.get('/items/:productId', validate(productIdParamSchema, 'params'), controller.checkItem)
router.delete('/items/:productId', validate(productIdParamSchema, 'params'), controller.removeItem)

export default router
