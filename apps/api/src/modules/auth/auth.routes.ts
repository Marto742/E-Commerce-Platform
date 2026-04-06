import { Router } from 'express'
import { validate } from '@/middleware/validate'
import {
  authLimiter,
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  resendVerificationLimiter,
} from '@/middleware/rateLimiter'
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  oauthLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@repo/validation'
import * as controller from './auth.controller'

const router: Router = Router()

// POST /auth/register — 5 accounts/hr per IP
router.post('/register', registerLimiter, validate(registerSchema), controller.register)

// POST /auth/login — 5 failures/15min per IP (successes not counted)
router.post('/login', loginLimiter, validate(loginSchema), controller.login)

// POST /auth/refresh — general auth limit (20/15min)
router.post('/refresh', authLimiter, validate(refreshTokenSchema), controller.refreshToken)

// POST /auth/verify-email — general auth limit
router.post(
  '/verify-email',
  authLimiter,
  validate(refreshTokenSchema), // reuses { token: string } shape
  controller.verifyEmail
)

// POST /auth/resend-verification — 3 emails/hr per IP
router.post(
  '/resend-verification',
  resendVerificationLimiter,
  validate(loginSchema.pick({ email: true })),
  controller.resendVerification
)

// POST /auth/oauth — general auth limit
router.post('/oauth', authLimiter, validate(oauthLoginSchema), controller.oauthLogin)

// POST /auth/logout — no rate limit needed (invalidates token, no sensitive data)
router.post('/logout', controller.logout)

// POST /auth/forgot-password — 3 reset emails/hr per IP
router.post(
  '/forgot-password',
  passwordResetLimiter,
  validate(forgotPasswordSchema),
  controller.forgotPassword
)

// POST /auth/reset-password — general auth limit
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), controller.resetPassword)

export default router
