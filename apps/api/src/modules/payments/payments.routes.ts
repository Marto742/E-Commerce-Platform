import { Router } from 'express'
import { validate } from '@/middleware/validate'
import { writeLimiter } from '@/middleware/rateLimiter'
import { createPaymentIntentSchema, guestCreatePaymentIntentSchema } from '@repo/validation'
import * as controller from './payments.controller'

const router: Router = Router()

// POST /payments/intent — create a Stripe PaymentIntent and a PENDING order (authenticated)
// Note: POST /payments/webhook is mounted directly in app.ts before express.json()
//       so it receives the raw body needed for Stripe signature verification.
router.post('/intent', writeLimiter, validate(createPaymentIntentSchema), controller.createIntent)

// POST /payments/guest-intent — same flow for unauthenticated guests (requires email)
router.post(
  '/guest-intent',
  writeLimiter,
  validate(guestCreatePaymentIntentSchema),
  controller.createGuestIntent
)

export default router
