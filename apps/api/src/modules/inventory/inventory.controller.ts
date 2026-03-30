import type { RequestHandler } from 'express'
import { sendSuccess, sendPaginated } from '@/utils/response'
import * as inventoryService from './inventory.service'

export const lowStock: RequestHandler = async (req, res, next) => {
  try {
    const threshold = req.query['threshold'] ? Number(req.query['threshold']) : undefined
    const page = req.query['page'] ? Number(req.query['page']) : 1
    const limit = req.query['limit'] ? Number(req.query['limit']) : 20
    const { variants, meta } = await inventoryService.listLowStock(threshold, page, limit)
    sendPaginated(res, variants, meta)
  } catch (err) {
    next(err)
  }
}

export const summary: RequestHandler = async (_req, res, next) => {
  try {
    const data = await inventoryService.getStockSummary()
    sendSuccess(res, data)
  } catch (err) {
    next(err)
  }
}
