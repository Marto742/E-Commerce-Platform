import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '@/app'
import * as reviewsService from './reviews.service'
import { AppError } from '@/utils/AppError'

vi.mock('./reviews.service')

const app = createApp()

// Valid CUID-format IDs (z.string().cuid() requires /^c[^\s-]{8,}$/i)
const REVIEW_ID = 'clhreview000000000000000001'
const PROD_ID = 'clhproduct0000000000000001'

const mockReview = {
  id: REVIEW_ID,
  userId: 'clhuser0000000000000000001',
  productId: PROD_ID,
  rating: 5,
  title: 'Great product',
  body: 'Loved it',
  isVerifiedPurchase: false,
}

const paginatedResult = {
  reviews: [mockReview],
  meta: { page: 1, limit: 10, total: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false },
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── GET /v1/reviews/:id (public) ─────────────────────────────────────────────

describe('GET /v1/reviews/:id', () => {
  it('returns 200 with review', async () => {
    vi.mocked(reviewsService.getReviewById).mockResolvedValue(mockReview as never)
    const res = await request(app).get(`/v1/reviews/${REVIEW_ID}`)
    expect(res.status).toBe(200)
    expect(res.body.data.id).toBe(REVIEW_ID)
  })

  it('returns 404 when review does not exist', async () => {
    vi.mocked(reviewsService.getReviewById).mockRejectedValue(AppError.notFound('Review not found'))
    const res = await request(app).get(`/v1/reviews/${REVIEW_ID}`)
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND')
  })

  it('returns 422 for non-CUID id', async () => {
    const res = await request(app).get('/v1/reviews/not-a-cuid')
    expect(res.status).toBe(422)
  })
})

// ─── Auth-gated endpoints ─────────────────────────────────────────────────────

describe('Reviews auth guard', () => {
  it('GET /v1/reviews/my returns 401 without auth', async () => {
    const res = await request(app).get('/v1/reviews/my')
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('POST /v1/reviews returns 401 without auth (valid body)', async () => {
    // Valid body passes Zod validation, then controller runs requireUser() → 401
    const res = await request(app).post('/v1/reviews').send({
      productId: PROD_ID,
      rating: 5,
      title: 'Great',
      body: 'Nice',
    })
    expect(res.status).toBe(401)
  })

  it('PATCH /v1/reviews/:id returns 401 without auth (valid CUID)', async () => {
    const res = await request(app).patch(`/v1/reviews/${REVIEW_ID}`).send({ title: 'Updated' })
    expect(res.status).toBe(401)
  })

  it('DELETE /v1/reviews/:id returns 401 without auth (valid CUID)', async () => {
    const res = await request(app).delete(`/v1/reviews/${REVIEW_ID}`)
    expect(res.status).toBe(401)
  })
})

// ─── GET /v1/products/:id/reviews (product-scoped, public) ───────────────────

describe('GET /v1/products/:id/reviews', () => {
  it('returns 200 with paginated reviews', async () => {
    vi.mocked(reviewsService.listProductReviews).mockResolvedValue(paginatedResult as never)
    const res = await request(app).get(`/v1/products/${PROD_ID}/reviews`)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.meta.total).toBe(1)
  })

  it('returns 404 when product does not exist', async () => {
    vi.mocked(reviewsService.listProductReviews).mockRejectedValue(
      AppError.notFound('Product not found')
    )
    const res = await request(app).get(`/v1/products/${PROD_ID}/reviews`)
    expect(res.status).toBe(404)
  })
})

// ─── GET /v1/products/:id/reviews/summary (public) ───────────────────────────

describe('GET /v1/products/:id/reviews/summary', () => {
  it('returns 200 with rating summary', async () => {
    vi.mocked(reviewsService.getProductRatingSummary).mockResolvedValue({
      average: 4.5,
      count: 10,
      distribution: { 1: 0, 2: 0, 3: 1, 4: 4, 5: 5 },
    })
    const res = await request(app).get(`/v1/products/${PROD_ID}/reviews/summary`)
    expect(res.status).toBe(200)
    expect(res.body.data.average).toBe(4.5)
    expect(res.body.data.count).toBe(10)
  })
})
