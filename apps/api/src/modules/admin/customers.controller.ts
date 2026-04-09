import type { RequestHandler } from 'express'
import { sendPaginated } from '@/utils/response'
import * as customersService from './customers.service'

export const list: RequestHandler = async (req, res, next) => {
  try {
    const query = customersService.adminCustomerQuerySchema.parse(req.query)
    const { customers, meta } = await customersService.listCustomers(query)
    sendPaginated(res, customers, meta)
  } catch (err) {
    next(err)
  }
}
