import { Router } from 'express'
import { requireAdmin } from '@/middleware/authenticate'
import * as analyticsController from './analytics.controller'

const router: Router = Router()

router.use(requireAdmin)

router.get('/analytics/overview', analyticsController.overview)

export default router
