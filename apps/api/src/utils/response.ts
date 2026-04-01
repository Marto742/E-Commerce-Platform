import type { Response } from 'express'

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: PaginationMeta | Record<string, unknown>
) {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(meta && { meta }),
  })
}

export function sendCreated<T>(res: Response, data: T) {
  return sendSuccess(res, data, 201)
}

export function sendPaginated<T>(res: Response, data: T[], meta: PaginationMeta) {
  return sendSuccess(res, data, 200, meta)
}

export function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  const totalPages = Math.ceil(total / limit)
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  }
}
