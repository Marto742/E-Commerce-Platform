import { Router } from 'express'
import { validate } from '@/middleware/validate'
import { writeLimiter } from '@/middleware/rateLimiter'
import { updateProfileSchema, changePasswordSchema } from '@repo/validation'
import * as controller from './users.controller'

const router: Router = Router()

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

export default router
