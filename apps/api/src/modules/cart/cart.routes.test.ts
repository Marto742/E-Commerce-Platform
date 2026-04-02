import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '@/app'
import * as cartService from './cart.service'
import { AppError } from '@/utils/AppError'

vi.mock('./cart.service')

const app = createApp()

// Valid CUID-format IDs (z.string().cuid() requires /^c[^\s-]{8,}$/i)
const VAR_ID = 'clhvariant0000000000000001'
const ITEM_ID = 'clhcartitem000000000000001'
const SESSION_ID = 'test-session-abc'
const SESSION_HEADER = { 'X-Session-ID': SESSION_ID }

const mockCart = {
  id: 'clhcart000000000000000001',
  userId: null,
  sessionId: SESSION_ID,
  items: [],
}

const mockCartWithItem = {
  ...mockCart,
  items: [{ id: ITEM_ID, cartId: mockCart.id, variantId: VAR_ID, quantity: 2 }],
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── GET /v1/cart ─────────────────────────────────────────────────────────────

describe('GET /v1/cart', () => {
  it('returns 200 with cart when X-Session-ID is provided', async () => {
    vi.mocked(cartService.getCart).mockResolvedValue(mockCart as never)
    const res = await request(app).get('/v1/cart').set(SESSION_HEADER)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.sessionId).toBe(SESSION_ID)
  })

  it('returns 422 without X-Session-ID and no auth', async () => {
    const res = await request(app).get('/v1/cart')
    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

// ─── POST /v1/cart/items ──────────────────────────────────────────────────────

describe('POST /v1/cart/items', () => {
  const validBody = { variantId: VAR_ID, quantity: 2 }

  it('returns 201 with updated cart', async () => {
    vi.mocked(cartService.addItem).mockResolvedValue(mockCartWithItem as never)
    const res = await request(app).post('/v1/cart/items').set(SESSION_HEADER).send(validBody)
    expect(res.status).toBe(201)
    expect(res.body.data.items).toHaveLength(1)
  })

  it('returns 422 when body is invalid', async () => {
    const res = await request(app)
      .post('/v1/cart/items')
      .set(SESSION_HEADER)
      .send({ variantId: 'not-a-cuid', quantity: 0 })
    expect(res.status).toBe(422)
    expect(cartService.addItem).not.toHaveBeenCalled()
  })

  it('returns 422 without session header', async () => {
    const res = await request(app).post('/v1/cart/items').send(validBody)
    expect(res.status).toBe(422)
  })

  it('returns 409 on insufficient stock', async () => {
    vi.mocked(cartService.addItem).mockRejectedValue(
      new AppError(409, 'INSUFFICIENT_STOCK', 'Only 1 unit(s) available')
    )
    const res = await request(app).post('/v1/cart/items').set(SESSION_HEADER).send(validBody)
    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('INSUFFICIENT_STOCK')
  })
})

// ─── PATCH /v1/cart/items/:itemId ─────────────────────────────────────────────

describe('PATCH /v1/cart/items/:itemId', () => {
  it('returns 200 with updated cart', async () => {
    vi.mocked(cartService.updateItem).mockResolvedValue(mockCartWithItem as never)
    const res = await request(app)
      .patch(`/v1/cart/items/${ITEM_ID}`)
      .set(SESSION_HEADER)
      .send({ quantity: 5 })
    expect(res.status).toBe(200)
  })

  it('returns 422 for invalid body', async () => {
    const res = await request(app)
      .patch(`/v1/cart/items/${ITEM_ID}`)
      .set(SESSION_HEADER)
      .send({ quantity: -1 })
    expect(res.status).toBe(422)
  })

  it('returns 404 when item not found in cart', async () => {
    vi.mocked(cartService.updateItem).mockRejectedValue(AppError.notFound('Cart item not found'))
    const res = await request(app)
      .patch(`/v1/cart/items/${ITEM_ID}`)
      .set(SESSION_HEADER)
      .send({ quantity: 2 })
    expect(res.status).toBe(404)
  })
})

// ─── DELETE /v1/cart/items/:itemId ────────────────────────────────────────────

describe('DELETE /v1/cart/items/:itemId', () => {
  it('returns 200 with updated cart', async () => {
    vi.mocked(cartService.removeItem).mockResolvedValue(mockCart as never)
    const res = await request(app).delete(`/v1/cart/items/${ITEM_ID}`).set(SESSION_HEADER)
    expect(res.status).toBe(200)
  })

  it('returns 404 when item not found', async () => {
    vi.mocked(cartService.removeItem).mockRejectedValue(AppError.notFound('Cart item not found'))
    const res = await request(app).delete(`/v1/cart/items/${ITEM_ID}`).set(SESSION_HEADER)
    expect(res.status).toBe(404)
  })
})

// ─── DELETE /v1/cart ──────────────────────────────────────────────────────────

describe('DELETE /v1/cart', () => {
  it('returns 200 with empty cart', async () => {
    vi.mocked(cartService.clearCart).mockResolvedValue(mockCart as never)
    const res = await request(app).delete('/v1/cart').set(SESSION_HEADER)
    expect(res.status).toBe(200)
    expect(res.body.data.items).toEqual([])
  })
})
