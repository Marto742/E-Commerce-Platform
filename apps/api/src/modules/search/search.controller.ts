import type { RequestHandler } from 'express'
import { searchQuerySchema, searchEventSchema } from '@repo/validation'
import { searchProducts } from './search.service'
import { recordSearchEvent } from './search-events.service'

export const search: RequestHandler = async (req, res, next) => {
  try {
    const query = searchQuerySchema.parse(req.query)
    const result = await searchProducts(query)
    res.set('X-Cache', result.cached ? 'HIT' : 'MISS')
    res.status(200).json({ data: result.hits, meta: result.meta, facets: result.facets })
  } catch (err) {
    next(err)
  }
}

/**
 * Records a search for analytics. Public endpoint with optional auth — attaches
 * the user id when a valid token is present, otherwise tracks anonymously.
 */
export const trackSearch: RequestHandler = (req, res, next) => {
  try {
    const { query, resultCount } = searchEventSchema.parse(req.body)
    recordSearchEvent({ query, resultCount, userId: req.user?.id ?? null })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
