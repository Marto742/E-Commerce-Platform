import { Router } from 'express'
import { z } from 'zod'
import { validate } from '@/middleware/validate'
import * as controller from './inventory.controller'

const router: Router = Router()

const bulkUpdateSchema = z.object({
  updates: z
    .array(
      z.object({
        variantId: z.string().cuid(),
        operation: z.enum(['set', 'add', 'subtract']),
        quantity: z.number().int().min(0),
      })
    )
    .min(1)
    .max(100),
})

// Admin-only (auth guard wired in Phase 3)
router.get('/', controller.list)
router.get('/summary', controller.summary)
router.get('/low-stock', controller.lowStock)
router.get('/sku/:sku', controller.getBySku)
router.patch('/bulk', validate(bulkUpdateSchema), controller.bulkUpdate)

export default router
