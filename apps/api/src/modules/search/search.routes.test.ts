import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '@/app'
import type { searchProducts } from './search.service'
import * as searchService from './search.service'

type SearchResult = Awaited<ReturnType<typeof searchProducts>>

vi.mock('./search.service')

vi.mock('@/middleware/rateLimiter', () => {
  const noop = (_req: unknown, _res: unknown, next: () => void) => next()
  return {
    globalLimiter: noop,
    authLimiter: noop,
    loginLimiter: noop,
    registerLimiter: noop,
    passwordResetLimiter: noop,
    resendVerificationLimiter: noop,
    writeLimiter: noop,
    searchLimiter: noop,
    checkoutLimiter: noop,
  }
})

const app = createApp()

const mockHit = {
  id: 'prod-1',
  name: 'Blue Widget',
  slug: 'blue-widget',
  categoryId: 'cat-1',
  categoryName: 'Electronics',
  basePrice: 29.99,
  comparePrice: null,
  imageUrl: null,
  inStock: true,
  isFeatured: false,
  minPrice: 29.99,
  maxPrice: 49.99,
  rating: 4.5,
  reviewCount: 12,
}

const mockResult: SearchResult = {
  hits: [mockHit] as SearchResult['hits'],
  meta: { query: 'widget', page: 1, limit: 20, total: 1, totalPages: 1, processingTimeMs: 2 },
  facets: {
    categories: { 'cat-1': 1 },
    ratings: { '4': 1 },
  },
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /v1/search', () => {
  it('returns search results', async () => {
    vi.mocked(searchService.searchProducts).mockResolvedValue(mockResult)

    const res = await request(app).get('/v1/search?q=widget')

    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([mockHit])
    expect(res.body.meta.query).toBe('widget')
    expect(res.body.meta.total).toBe(1)
  })

  it('returns facet counts', async () => {
    vi.mocked(searchService.searchProducts).mockResolvedValue(mockResult)

    const res = await request(app).get('/v1/search?q=widget')

    expect(res.status).toBe(200)
    expect(res.body.facets).toEqual({
      categories: { 'cat-1': 1 },
      ratings: { '4': 1 },
    })
  })

  it('passes filters to service', async () => {
    vi.mocked(searchService.searchProducts).mockResolvedValue(mockResult)

    await request(app).get(
      '/v1/search?q=widget&categoryId=cat-1&minPrice=10&maxPrice=100&minRating=4&inStock=true'
    )

    expect(searchService.searchProducts).toHaveBeenCalledWith(
      expect.objectContaining({
        q: 'widget',
        categoryId: 'cat-1',
        minPrice: 10,
        maxPrice: 100,
        minRating: 4,
        inStock: true,
      })
    )
  })

  it('rejects an out-of-range minRating', async () => {
    const res = await request(app).get('/v1/search?q=widget&minRating=9')
    expect(res.status).toBe(422)
  })

  it('accepts rating as a sort option', async () => {
    vi.mocked(searchService.searchProducts).mockResolvedValue(mockResult)

    const res = await request(app).get('/v1/search?q=widget&sortBy=rating&sortOrder=desc')

    expect(res.status).toBe(200)
    expect(searchService.searchProducts).toHaveBeenCalledWith(
      expect.objectContaining({ sortBy: 'rating', sortOrder: 'desc' })
    )
  })

  it('rejects an unknown sort field', async () => {
    const res = await request(app).get('/v1/search?q=widget&sortBy=bogus')
    expect(res.status).toBe(422)
  })

  it('returns 422 when q is missing', async () => {
    const res = await request(app).get('/v1/search')
    expect(res.status).toBe(422)
  })

  it('returns 422 when q is empty', async () => {
    const res = await request(app).get('/v1/search?q=')
    expect(res.status).toBe(422)
  })
})
