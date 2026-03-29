import type { RequestHandler } from 'express'
import { AppError } from '@/utils/AppError'

export const notFound: RequestHandler = (req, _res, next) => {
  next(
    new AppError(
      404,
      'RESOURCE_NOT_FOUND',
      `Route ${req.method} ${req.path} not found`
    )
  )
}
