import { meili } from '@/lib/meilisearch'
import { PRODUCTS_INDEX, type ProductDocument } from '@/lib/search-schema'
import type { SearchQueryInput } from '@repo/validation'

export async function searchProducts(query: SearchQueryInput) {
  const { q, page, limit, categoryId, minPrice, maxPrice, inStock, isFeatured, sortBy, sortOrder } =
    query

  const filters: string[] = ['isActive = true']
  if (categoryId) filters.push(`categoryId = "${categoryId}"`)
  if (inStock !== undefined) filters.push(`inStock = ${inStock}`)
  if (isFeatured !== undefined) filters.push(`isFeatured = ${isFeatured}`)
  if (minPrice !== undefined) filters.push(`minPrice >= ${minPrice}`)
  if (maxPrice !== undefined) filters.push(`maxPrice <= ${maxPrice}`)

  const sort = sortBy ? [`${sortBy}:${sortOrder}`] : undefined

  const result = await meili.index<ProductDocument>(PRODUCTS_INDEX).search(q, {
    offset: (page - 1) * limit,
    limit,
    filter: filters.join(' AND '),
    ...(sort && { sort }),
    attributesToRetrieve: [
      'id',
      'name',
      'slug',
      'description',
      'categoryId',
      'categoryName',
      'basePrice',
      'comparePrice',
      'imageUrl',
      'inStock',
      'isFeatured',
      'minPrice',
      'maxPrice',
    ],
  })

  return {
    hits: result.hits,
    meta: {
      query: q,
      page,
      limit,
      total: result.estimatedTotalHits ?? 0,
      totalPages: Math.ceil((result.estimatedTotalHits ?? 0) / limit),
      processingTimeMs: result.processingTimeMs,
    },
  }
}
