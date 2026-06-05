import { meili } from '@/lib/meilisearch'
import { PRODUCTS_INDEX, type ProductDocument } from '@/lib/search-schema'
import { TTLCache } from '@/lib/cache'
import { suggestCorrection } from './spellcheck.service'
import type { SearchQueryInput } from '@repo/validation'

// Attributes Meilisearch returns facet counts for. ratingBucket = floor(avg rating).
const FACET_ATTRIBUTES = ['categoryId', 'ratingBucket']

// Only offer a "did you mean" suggestion when the query returned few results —
// a plentiful result set means the query worked, typo or not.
const SUGGESTION_MAX_RESULTS = 5

// Non-HTML sentinels wrapped around query matches. The web client parses these
// into <mark> elements — using plain HTML tags would be an XSS vector because
// Meilisearch does not escape the surrounding content in `_formatted`.
// Keep in sync with apps/web/src/components/ui/highlighted-text.tsx
const HL_PRE = '[[hl]]'
const HL_POST = '[[/hl]]'

async function computeSearch(query: SearchQueryInput) {
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
    attributesToHighlight: ['name', 'description', 'categoryName'],
    attributesToCrop: ['description'],
    cropLength: 25,
    highlightPreTag: HL_PRE,
    highlightPostTag: HL_POST,
  })

  const distribution = result.facetDistribution ?? {}

  // Surface a slim `highlight` payload. The description snippet is only included
  // when the query actually matched it (otherwise it's just the cropped lead-in).
  const hits = result.hits.map((hit) => {
    const { _formatted, ...product } = hit
    const description = _formatted?.description
    return {
      ...product,
      highlight: {
        name: _formatted?.name ?? hit.name,
        categoryName: _formatted?.categoryName ?? hit.categoryName,
        description: description?.includes(HL_PRE) ? description : null,
      },
    }
  })

  const total = result.estimatedTotalHits ?? 0
  const suggestion = total < SUGGESTION_MAX_RESULTS ? await suggestCorrection(q) : null

  return {
    hits,
    meta: {
      query: q,
      suggestion,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      processingTimeMs: result.processingTimeMs,
    },
    // Facet counts for the current result set: { value: count }
    facets: {
      categories: distribution['categoryId'] ?? {},
      ratings: distribution['ratingBucket'] ?? {},
    },
  }
}

// ─── Cache layer ──────────────────────────────────────────────────────────────
//
// Identical queries are common (popular terms, pagination, autocomplete repeats)
// and Meilisearch results only change on re-index, so a short-lived cache cuts
// most of the search latency. Entries are invalidated immediately on any index
// write and expire after the TTL as a backstop.

type SearchResult = Awaited<ReturnType<typeof computeSearch>>

const SEARCH_CACHE_TTL_MS = 60_000

const searchCache = new TTLCache<SearchResult>({ ttlMs: SEARCH_CACHE_TTL_MS, maxEntries: 500 })

/** Stable key over every parameter that affects the result set. */
function buildCacheKey(q: SearchQueryInput): string {
  return JSON.stringify([
    q.q.trim().toLowerCase(),
    q.page,
    q.limit,
    q.categoryId ?? '',
    q.minPrice ?? '',
    q.maxPrice ?? '',
    q.minRating ?? '',
    q.inStock ?? '',
    q.isFeatured ?? '',
    q.sortBy ?? '',
    q.sortOrder,
  ])
}

/** Drop all cached search results. Called whenever the index changes. */
export function invalidateSearchCache(): void {
  searchCache.clear()
}

export async function searchProducts(
  query: SearchQueryInput
): Promise<SearchResult & { cached: boolean }> {
  const key = buildCacheKey(query)

  const cached = searchCache.get(key)
  if (cached) return { ...cached, cached: true }

  const result = await computeSearch(query)
  searchCache.set(key, result)
  return { ...result, cached: false }
}
