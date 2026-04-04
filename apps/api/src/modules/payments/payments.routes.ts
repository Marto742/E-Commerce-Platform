import { Router } from 'express'
import { validate } from '@/middleware/validate'
import { writeLimiter } from '@/middleware/rateLimiter'
import { createPaymentIntentSchema } from '@repo/validation'
import * as controller from './payments.controller'

const router: Router = Router()

// POST /payments/intent — create a Stripe PaymentIntent and a PENDING order
router.post('/intent', writeLimiter, validate(createPaymentIntentSchema), controller.createIntent)

export default router
