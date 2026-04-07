import { Router } from 'express'
import { validate } from '@/middleware/validate'
import { writeLimiter } from '@/middleware/rateLimiter'
import { authenticate } from '@/middleware/authenticate'
import {
  updateProfileSchema,
  changePasswordSchema,
  createAddressSchema,
  updateAddressSchema,
} from '@repo/validation'
import * as controller from './users.controller'
import * as addressesController from './addresses.controller'

const router: Router = Router()

// All /users routes require a valid access token
router.use(authenticate)

// GET  /users/me          — fetch current user profile
router.get('/me', controller.getMe)

// PATCH /users/me         — update profile fields
router.patch('/me', writeLimiter, validate(updateProfileSchema), controller.updateMe)

// PATCH /users/me/password — change password
router.patch(
  '/me/password',
  writeLimiter,
  validate(changePasswordSchema),
  controller.changePassword
)

// DELETE /users/me               — soft-delete account
router.delete('/me', writeLimiter, controller.deleteMe)

// GET    /users/me/addresses        — list addresses
router.get('/me/addresses', addressesController.list)

// POST   /users/me/addresses        — create address
router.post(
  '/me/addresses',
  writeLimiter,
  validate(createAddressSchema),
  addressesController.create
)

// PATCH  /users/me/addresses/:id   — update address
router.patch(
  '/me/addresses/:id',
  writeLimiter,
  validate(updateAddressSchema),
  addressesController.update
)

// DELETE /users/me/addresses/:id   — delete address
router.delete('/me/addresses/:id', addressesController.remove)

// PATCH  /users/me/addresses/:id/default — set as default
router.patch('/me/addresses/:id/default', addressesController.setDefault)

export default router
