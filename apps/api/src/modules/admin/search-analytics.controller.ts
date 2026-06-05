import type { RequestHandler } from 'express'
import { sendSuccess } from '@/utils/response'
import { getSearchAnalytics } from './search-analytics.service'

export const searchAnalytics: RequestHandler = async (req, res, next) => {
  try {
    const days = Math.min(Math.max(Number(req.query['days']) || 30, 1), 365)
    const data = await getSearchAnalytics(days)
    sendSuccess(res, data)
  } catch (err) {
    next(err)
  }
}
