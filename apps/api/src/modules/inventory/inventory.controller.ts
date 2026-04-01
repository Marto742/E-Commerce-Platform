import type { RequestHandler } from 'express'
import { sendSuccess, sendPaginated } from '@/utils/response'
import * as inventoryService from './inventory.service'
import type { InventoryQueryInput, LowStockQueryInput } from '@repo/validation'

export const list: RequestHandler = async (req, res, next) => {
  try {
    const { variants, meta } = await inventoryService.listInventory(
      req.query as unknown as InventoryQueryInput
    )
    sendPaginated(res, variants, meta)
  } catch (err) {
    next(err)
  }
}

export const lowStock: RequestHandler = async (req, res, next) => {
  try {
    const { threshold, page, limit } = req.query as unknown as LowStockQueryInput
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
