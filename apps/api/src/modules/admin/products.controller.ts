import type { RequestHandler } from 'express'
import { sendPaginated } from '@/utils/response'
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
