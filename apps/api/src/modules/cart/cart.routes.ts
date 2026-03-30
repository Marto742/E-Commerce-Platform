import { Router } from 'express'
import { validate } from '@/middleware/validate'
import { addToCartSchema, updateCartItemSchema, idParamSchema } from '@repo/validation'
import * as controller from './cart.controller'

const router: Router = Router()

// All cart endpoints require either auth (Phase 3) or X-Session-ID header.
// resolveIdentifier() in the controller enforces this.

router.get('/', controller.getCart)
router.delete('/', controller.clearCart)

router.post('/items', validate(addToCartSchema), controller.addItem)
router.patch(
  '/items/:itemId',
  validate(idParamSchema.extend({ itemId: idParamSchema.shape.id }).omit({ id: true }), 'params'),
  validate(updateCartItemSchema),
  controller.updateItem
)
router.delete(
  '/items/:itemId',
  validate(idParamSchema.extend({ itemId: idParamSchema.shape.id }).omit({ id: true }), 'params'),
  controller.removeItem
)

export default router
