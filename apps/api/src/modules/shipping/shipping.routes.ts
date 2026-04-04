import { Router } from 'express'
import { z } from 'zod'
import { validate } from '@/middleware/validate'
import { writeLimiter } from '@/middleware/rateLimiter'
import { getShippingRates } from '@/utils/shipping'
import { sendSuccess } from '@/utils/response'
import { shippingEstimateSchema } from '@repo/validation'

const router: Router = Router()

// POST /shipping/estimate — return all available rates for a country + subtotal
router.post('/estimate', writeLimiter, validate(shippingEstimateSchema), (req, res, next) => {
  try {
    const { country, subtotal } = req.body as z.infer<typeof shippingEstimateSchema>
    const rates = getShippingRates(country, subtotal)
    sendSuccess(res, { rates, freeShippingThreshold: 75 })
  } catch (err) {
    next(err)
  }
})

export default router
