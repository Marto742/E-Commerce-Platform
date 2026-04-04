import { Router } from 'express'
import { validate } from '@/middleware/validate'
import { writeLimiter } from '@/middleware/rateLimiter'
import { createPaymentIntentSchema } from '@repo/validation'
import * as controller from './payments.controller'

const router: Router = Router()

// POST /payments/intent — create a Stripe PaymentIntent and a PENDING order
// Note: POST /payments/webhook is mounted directly in app.ts before express.json()
//       so it receives the raw body needed for Stripe signature verification.
router.post('/intent', writeLimiter, validate(createPaymentIntentSchema), controller.createIntent)

export default router
