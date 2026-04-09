import { Router } from 'express'
import { requireAdmin } from '@/middleware/authenticate'
import * as analyticsController from './analytics.controller'
import * as productsController from './products.controller'
import * as customersController from './customers.controller'

const router: Router = Router()

router.use(requireAdmin)

router.get('/analytics/overview', analyticsController.overview)
router.get('/products', productsController.list)
router.post('/products/import', productsController.importProducts)
router.get('/customers', customersController.list)

export default router
