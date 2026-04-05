import { Router } from 'express'
import { validate } from '@/middleware/validate'
import { authLimiter } from '@/middleware/rateLimiter'
import { registerSchema, loginSchema, refreshTokenSchema, oauthLoginSchema } from '@repo/validation'
import * as controller from './auth.controller'

const router: Router = Router()

// POST /auth/register — create a new customer account
router.post('/register', authLimiter, validate(registerSchema), controller.register)

// POST /auth/login — exchange email + password for access + refresh tokens
router.post('/login', authLimiter, validate(loginSchema), controller.login)

// POST /auth/refresh — exchange refresh token for a new access token (rotates refresh)
router.post('/refresh', authLimiter, validate(refreshTokenSchema), controller.refreshToken)

// POST /auth/verify-email — consume a verification token, activate the account
router.post(
  '/verify-email',
  authLimiter,
  validate(refreshTokenSchema), // reuses { token: string } shape
  controller.verifyEmail
)

// POST /auth/resend-verification — send a new verification email
router.post(
  '/resend-verification',
  authLimiter,
  validate(loginSchema.pick({ email: true })),
  controller.resendVerification
)

// POST /auth/oauth — find-or-create user from OAuth provider, issue our tokens
router.post('/oauth', authLimiter, validate(oauthLoginSchema), controller.oauthLogin)

// POST /auth/logout — invalidate the current refresh token
router.post('/logout', controller.logout)

export default router
