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

// POST /auth/oauth — find-or-create user from OAuth provider, issue our tokens
router.post('/oauth', authLimiter, validate(oauthLoginSchema), controller.oauthLogin)

// POST /auth/logout — invalidate the current refresh token
router.post('/logout', controller.logout)

export default router
