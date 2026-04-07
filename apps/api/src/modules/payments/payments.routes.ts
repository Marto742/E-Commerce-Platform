import { Router } from 'express'
import { validate } from '@/middleware/validate'
import { writeLimiter, searchLimiter } from '@/middleware/rateLimiter'
import { authenticate } from '@/middleware/authenticate'
import { createPaymentIntentSchema, guestCreatePaymentIntentSchema } from '@repo/validation'
import * as controller from './payments.controller'

const router: Router = Router()

// POST /payments/intent — create a Stripe PaymentIntent and a PENDING order (authenticated)
// Note: POST /payments/webhook is mounted directly in app.ts before express.json()
//       so it receives the raw body needed for Stripe signature verification.
router.post(
  '/intent',
  authenticate,
  writeLimiter,
  validate(createPaymentIntentSchema),
  controller.createIntent
)

// POST /payments/guest-intent — same flow for unauthenticated guests (requires email)
router.post(
  '/guest-intent',
  writeLimiter,
  validate(guestCreatePaymentIntentSchema),
  controller.createGuestIntent
)

// GET /payments/status/:orderId — check order + PI status after 3DS redirect
router.get('/status/:orderId', searchLimiter, controller.getStatus)

export default router
