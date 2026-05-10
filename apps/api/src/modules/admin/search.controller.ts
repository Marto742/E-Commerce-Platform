import type { RequestHandler } from 'express'
import { reindexAllProducts, indexProduct } from '@/lib/search-indexer'
import { setupSearchSchema } from '@/lib/search-schema'
import { logActivity } from './activity-log.service'

/** POST /admin/search/reindex — full product reindex */
export const reindex: RequestHandler = async (req, res, next) => {
  try {
    await setupSearchSchema()
    const { indexed } = await reindexAllProducts()
    if (req.user?.id) logActivity(req.user.id, 'search.reindex', 'product', undefined, { indexed })
    res.status(200).json({ data: { indexed } })
  } catch (err) {
    next(err)
  }
}

/** POST /admin/search/reindex/:productId — reindex a single product */
export const reindexOne: RequestHandler = async (req, res, next) => {
  try {
    await indexProduct(String(req.params.productId))
    res.status(200).json({ data: { indexed: 1 } })
  } catch (err) {
    next(err)
  }
}
