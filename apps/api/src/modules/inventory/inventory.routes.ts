import { Router } from 'express'
import * as controller from './inventory.controller'

const router: Router = Router()

// Admin-only (auth guard wired in Phase 3)
router.get('/summary', controller.summary)
router.get('/low-stock', controller.lowStock)

export default router
