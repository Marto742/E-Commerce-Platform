import { meili } from '@/lib/meilisearch'
import { PRODUCTS_INDEX, type ProductDocument } from '@/lib/search-schema'
import type { SearchQueryInput } from '@repo/validation'

// Attributes Meilisearch returns facet counts for. ratingBucket = floor(avg rating).
const FACET_ATTRIBUTES = ['categoryId', 'ratingBucket']

export async function searchProducts(query: SearchQueryInput) {
  const {
    q,
    page,
    limit,
    categoryId,
    minPrice,
    maxPrice,
    minRating,
    inStock,
    isFeatured,
    sortBy,
    sortOrder,
  } = query

  const filters: string[] = ['isActive = true']
  if (categoryId) filters.push(`categoryId = "${categoryId}"`)
  if (inStock !== undefined) filters.push(`inStock = ${inStock}`)
  if (isFeatured !== undefined) filters.push(`isFeatured = ${isFeatured}`)
  if (minPrice !== undefined) filters.push(`minPrice >= ${minPrice}`)
  if (maxPrice !== undefined) filters.push(`maxPrice <= ${maxPrice}`)
  // floor(rating) >= n is equivalent to rating >= n for the integer thresholds the UI offers
  if (minRating !== undefined) filters.push(`ratingBucket >= ${minRating}`)

  const sort = sortBy ? [`${sortBy}:${sortOrder}`] : undefined

  const result = await meili.index<ProductDocument>(PRODUCTS_INDEX).search(q, {
    offset: (page - 1) * limit,
    limit,
    filter: filters.join(' AND '),
    facets: FACET_ATTRIBUTES,
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
      'rating',
      'reviewCount',
    ],
  })

  const distribution = result.facetDistribution ?? {}

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
    // Facet counts for the current result set: { value: count }
    facets: {
      categories: distribution['categoryId'] ?? {},
      ratings: distribution['ratingBucket'] ?? {},
    },
  }
}
