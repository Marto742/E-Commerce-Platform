import { Router } from 'express'
import { requireAdmin } from '@/middleware/authenticate'
import { writeLimiter } from '@/middleware/rateLimiter'
import * as controller from './uploads.controller'

const router: Router = Router()

router.use(requireAdmin)

// Returns a presigned PUT URL — browser uploads directly to R2
router.post('/presign', writeLimiter, controller.presign)

// Deletes an object from R2 by key
router.delete('/', writeLimiter, controller.remove)

export default router
