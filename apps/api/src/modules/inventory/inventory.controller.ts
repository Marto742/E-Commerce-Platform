import type { RequestHandler } from 'express'
import { sendSuccess, sendPaginated } from '@/utils/response'
import * as inventoryService from './inventory.service'
import type { InventoryQuery } from './inventory.service'

export const list: RequestHandler = async (req, res, next) => {
  try {
    const q = req.query as Record<string, string>
    const query: InventoryQuery = {
      page: q['page'] ? Number(q['page']) : 1,
      limit: q['limit'] ? Math.min(Number(q['limit']), 100) : 20,
      search: q['search'],
      productId: q['productId'],
      minStock: q['minStock'] !== undefined ? Number(q['minStock']) : undefined,
      maxStock: q['maxStock'] !== undefined ? Number(q['maxStock']) : undefined,
      isActive: q['isActive'] as InventoryQuery['isActive'],
      sortBy: q['sortBy'] as InventoryQuery['sortBy'],
      sortOrder: q['sortOrder'] as InventoryQuery['sortOrder'],
    }
    const { variants, meta } = await inventoryService.listInventory(query)
    sendPaginated(res, variants, meta)
  } catch (err) {
    next(err)
  }
}

export const lowStock: RequestHandler = async (req, res, next) => {
  try {
    const q = req.query as Record<string, string>
    const threshold = q['threshold'] ? Number(q['threshold']) : undefined
    const page = q['page'] ? Number(q['page']) : 1
    const limit = q['limit'] ? Number(q['limit']) : 20
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

export const getBySku: RequestHandler = async (req, res, next) => {
  try {
    const variant = await inventoryService.getVariantBySku(req.params['sku'] as string)
    sendSuccess(res, variant)
  } catch (err) {
    next(err)
  }
}

export const bulkUpdate: RequestHandler = async (req, res, next) => {
  try {
    const results = await inventoryService.bulkUpdateStock(req.body.updates)
    sendSuccess(res, results)
  } catch (err) {
    next(err)
  }
}
