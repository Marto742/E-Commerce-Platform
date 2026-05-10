import type { RequestHandler } from 'express'
import { searchQuerySchema } from '@repo/validation'
import { searchProducts } from './search.service'

export const search: RequestHandler = async (req, res, next) => {
  try {
    const query = searchQuerySchema.parse(req.query)
    const result = await searchProducts(query)
    res.status(200).json({ data: result.hits, meta: result.meta })
  } catch (err) {
    next(err)
  }
}
