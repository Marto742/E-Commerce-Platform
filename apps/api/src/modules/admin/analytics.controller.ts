import type { RequestHandler } from 'express'
import { sendSuccess } from '@/utils/response'
import * as analyticsService from './analytics.service'

export const overview: RequestHandler = async (_req, res, next) => {
  try {
    const data = await analyticsService.getOverview()
    sendSuccess(res, data)
  } catch (err) {
    next(err)
  }
}
