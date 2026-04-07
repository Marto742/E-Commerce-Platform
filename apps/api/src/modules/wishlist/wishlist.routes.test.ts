import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '@/app'

vi.mock('./wishlist.service')

const app = createApp()

// Valid CUID-format IDs (z.string().cuid() requires /^c[^\s-]{8,}$/i)
const PROD_ID = 'clhproduct0000000000000001'

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── Auth guard
// authenticate middleware runs at router level — before any validation.
// All unauthenticated requests return 401 regardless of body or param validity.

describe('Wishlist auth guard', () => {
  it('GET /v1/wishlist returns 401 without auth (no validation middleware)', async () => {
    const res = await request(app).get('/v1/wishlist')
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('POST /v1/wishlist/items returns 401 without auth (valid body)', async () => {
    // Valid body passes validate(addToWishlistSchema), then controller runs requireUser() → 401
    const res = await request(app).post('/v1/wishlist/items').send({ productId: PROD_ID })
    expect(res.status).toBe(401)
  })

  it('POST /v1/wishlist/items returns 401 for invalid body (auth fires first)', async () => {
    const res = await request(app).post('/v1/wishlist/items').send({})
    expect(res.status).toBe(401)
  })

  it('GET /v1/wishlist/items/:productId returns 401 without auth (valid CUID)', async () => {
    const res = await request(app).get(`/v1/wishlist/items/${PROD_ID}`)
    expect(res.status).toBe(401)
  })

  it('GET /v1/wishlist/items/:productId returns 401 for non-CUID productId (auth fires first)', async () => {
    const res = await request(app).get('/v1/wishlist/items/not-a-cuid')
    expect(res.status).toBe(401)
  })

  it('DELETE /v1/wishlist/items/:productId returns 401 without auth (valid CUID)', async () => {
    const res = await request(app).delete(`/v1/wishlist/items/${PROD_ID}`)
    expect(res.status).toBe(401)
  })

  it('DELETE /v1/wishlist/items/:productId returns 401 for non-CUID productId (auth fires first)', async () => {
    const res = await request(app).delete('/v1/wishlist/items/not-a-cuid')
    expect(res.status).toBe(401)
  })

  it('DELETE /v1/wishlist returns 401 without auth (no validation middleware)', async () => {
    const res = await request(app).delete('/v1/wishlist')
    expect(res.status).toBe(401)
  })
})
