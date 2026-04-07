import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '@/app'

vi.mock('./orders.service')

const app = createApp()

// Valid CUID-format IDs (z.string().cuid() requires /^c[^\s-]{8,}$/i)
const ORDER_ID = 'clhorder000000000000000001'

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── Auth guard (all order endpoints require req.user) ────────────────────────
// authenticate middleware runs at router level — before any validation.
// All unauthenticated requests return 401 regardless of body validity.

describe('Order auth guard', () => {
  it('GET /v1/orders returns 401 without auth', async () => {
    const res = await request(app).get('/v1/orders')
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('GET /v1/orders/:id returns 401 without auth (valid CUID)', async () => {
    const res = await request(app).get(`/v1/orders/${ORDER_ID}`)
    expect(res.status).toBe(401)
  })

  it('POST /v1/orders returns 401 without auth', async () => {
    // authenticate middleware runs before validation — 401 fires regardless of body.
    const res = await request(app).post('/v1/orders').send({})
    expect(res.status).toBe(401)
  })

  it('PATCH /v1/orders/:id/status returns 401 without auth (valid body)', async () => {
    // Validation middleware (idParam + status enum) runs before requireUser().
    // A valid CUID + valid status → passes validation → controller runs → 401.
    const res = await request(app)
      .patch(`/v1/orders/${ORDER_ID}/status`)
      .send({ status: 'CONFIRMED' })
    expect(res.status).toBe(401)
  })

  it('PATCH /v1/orders/:id/status returns 401 for invalid status value (auth fires first)', async () => {
    // authenticate middleware runs before validation — 401 fires regardless of body.
    const res = await request(app)
      .patch(`/v1/orders/${ORDER_ID}/status`)
      .send({ status: 'INVALID_STATUS' })
    expect(res.status).toBe(401)
  })

  it('POST /v1/orders/:id/cancel returns 401 without auth (valid CUID)', async () => {
    const res = await request(app).post(`/v1/orders/${ORDER_ID}/cancel`)
    expect(res.status).toBe(401)
  })
})
