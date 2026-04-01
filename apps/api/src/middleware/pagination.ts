import type { RequestHandler } from 'express'
import { paginationSchema } from '@repo/validation'

/**
 * Parses and validates `page` and `limit` from `req.query`, then attaches
 * `req.pagination` with the computed `skip` value.
 *
 * Safe to use standalone or after `validate(schema, 'query')` — Zod coercion
 * handles both raw strings and pre-coerced numbers.
 *
 * Defaults: page=1, limit=20, max limit=100.
 */
export const parsePagination: RequestHandler = (req, _res, next) => {
  const result = paginationSchema.safeParse(req.query)
  if (!result.success) return next(result.error)
  const { page, limit } = result.data
  req.pagination = { page, limit, skip: (page - 1) * limit }
  next()
}
