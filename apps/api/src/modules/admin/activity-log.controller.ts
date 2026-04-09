import type { RequestHandler } from 'express'
import { sendPaginated } from '@/utils/response'
import * as activityLogService from './activity-log.service'

export const list: RequestHandler = async (req, res, next) => {
  try {
    const { page = '1', limit = '50', entity, adminId } = req.query as Record<string, string>
    const { logs, meta } = await activityLogService.listActivityLogs({
      page: Number(page),
      limit: Number(limit),
      entity: entity || undefined,
      adminId: adminId || undefined,
    })
    sendPaginated(res, logs, meta)
  } catch (err) {
    next(err)
  }
}
