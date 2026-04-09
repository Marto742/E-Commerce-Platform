import type { RequestHandler } from 'express'
import { sendPaginated } from '@/utils/response'
import { logActivity } from './activity-log.service'
import * as productsService from './products.service'

export const list: RequestHandler = async (req, res, next) => {
  try {
    const query = productsService.adminProductQuerySchema.parse(req.query)
    const { products, meta } = await productsService.listAdminProducts(query)
    sendPaginated(res, products, meta)
  } catch (err) {
    next(err)
  }
}

export const importProducts: RequestHandler = async (req, res, next) => {
  try {
    const body = productsService.importProductsBodySchema.parse(req.body)
    const result = await productsService.importProducts(body)
    if (req.user?.id)
      logActivity(req.user.id, 'product.import', 'product', undefined, {
        imported: result.imported,
        skipped: result.skipped,
      })
    res.status(200).json({ data: result })
  } catch (err) {
    next(err)
  }
}
