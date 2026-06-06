import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SearchQueryInput } from '@repo/validation'
import { AppError } from '@/utils/AppError'

const searchMock = vi.fn()

vi.mock('@/lib/meilisearch', () => ({
  meili: { index: () => ({ search: searchMock }) },
}))

vi.mock('./spellcheck.service', () => ({
  suggestCorrection: vi.fn().mockResolvedValue(null),
}))

import { searchProducts, invalidateSearchCache } from './search.service'

const meiliResponse = {
  hits: [
    {
      id: 'p1',
      name: 'Blue Widget',
      slug: 'blue-widget',
      description: 'A widget',
      categoryId: 'c1',
      categoryName: 'Gadgets',
      basePrice: 10,
      comparePrice: null,
      imageUrl: null,
      inStock: true,
      isFeatured: false,
      minPrice: 10,
      maxPrice: 10,
      rating: 0,
      reviewCount: 0,
      _formatted: { name: 'Blue Widget', description: 'A widget', categoryName: 'Gadgets' },
    },
  ],
  estimatedTotalHits: 1,
  processingTimeMs: 2,
  facetDistribution: { categoryId: { c1: 1 }, ratingBucket: { '0': 1 } },
}

const baseQuery: SearchQueryInput = { q: 'widget', page: 1, limit: 20, sortOrder: 'asc' }

beforeEach(() => {
  vi.clearAllMocks()
  invalidateSearchCache()
  searchMock.mockResolvedValue(meiliResponse)
})

describe('searchProducts caching', () => {
  it('queries Meilisearch on a miss and serves the cache on a repeat', async () => {
    const first = await searchProducts(baseQuery)
    expect(first.cached).toBe(false)
    expect(searchMock).toHaveBeenCalledTimes(1)

    const second = await searchProducts(baseQuery)
    expect(second.cached).toBe(true)
    expect(searchMock).toHaveBeenCalledTimes(1) // no second Meilisearch call
    expect(second.hits).toEqual(first.hits)
  })

  it('treats different filters as separate cache entries', async () => {
    await searchProducts({ ...baseQuery, categoryId: 'c1' })
    await searchProducts({ ...baseQuery, categoryId: 'c2' })
    expect(searchMock).toHaveBeenCalledTimes(2)
  })

  it('recomputes after the cache is invalidated', async () => {
    await searchProducts(baseQuery)
    invalidateSearchCache()
    await searchProducts(baseQuery)
    expect(searchMock).toHaveBeenCalledTimes(2)
  })
})

describe('searchProducts robustness', () => {
  it('escapes quotes in the category filter (no filter injection)', async () => {
    await searchProducts({ ...baseQuery, q: 'escape-test', categoryId: 'x"y' })
    const [, options] = searchMock.mock.calls[0]
    expect(options.filter).toContain('categoryId = "x\\"y"')
  })

  it('degrades to a clean 503 when Meilisearch fails (no raw error leak)', async () => {
    searchMock.mockReset()
    searchMock.mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:7700'))

    const error = await searchProducts({ ...baseQuery, q: 'boom' }).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(AppError)
    expect(error).toMatchObject({ statusCode: 503, code: 'SEARCH_UNAVAILABLE' })
    expect((error as AppError).message).not.toContain('ECONNREFUSED')
  })
})
