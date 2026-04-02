import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '@/app'
import * as inventoryService from './inventory.service'
import { AppError } from '@/utils/AppError'

vi.mock('./inventory.service')

const app = createApp()

// Valid CUID-format IDs (z.string().cuid() requires /^c[^\s-]{8,}$/i)
const VAR_ID = 'clhvariant0000000000000001'

const mockVariant = {
  id: VAR_ID,
  sku: 'SKU-001',
  name: 'Default',
  stock: 25,
  isActive: true,
  product: {
    id: 'clhproduct0000000000000001',
    name: 'Widget',
    slug: 'widget',
    isActive: true,
    images: [],
  },
}

const paginatedResult = {
  variants: [mockVariant],
  meta: { page: 1, limit: 20, total: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false },
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── GET /v1/inventory ────────────────────────────────────────────────────────

describe('GET /v1/inventory', () => {
  it('returns 200 with paginated variants', async () => {
    vi.mocked(inventoryService.listInventory).mockResolvedValue(paginatedResult as never)
    const res = await request(app).get('/v1/inventory')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.meta.total).toBe(1)
  })

  it('passes query params to the service', async () => {
    vi.mocked(inventoryService.listInventory).mockResolvedValue({
      variants: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false },
    } as never)
    await request(app).get('/v1/inventory?search=sku&minStock=5')
    expect(inventoryService.listInventory).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'sku' })
    )
  })
})

// ─── GET /v1/inventory/summary ────────────────────────────────────────────────

describe('GET /v1/inventory/summary', () => {
  it('returns 200 with stock summary', async () => {
    vi.mocked(inventoryService.getStockSummary).mockResolvedValue({
      total: 100,
      outOfStock: 5,
      lowStock: 12,
      threshold: 10,
    })
    const res = await request(app).get('/v1/inventory/summary')
    expect(res.status).toBe(200)
    expect(res.body.data.total).toBe(100)
    expect(res.body.data.outOfStock).toBe(5)
    expect(res.body.data.threshold).toBe(10)
  })
})

// ─── GET /v1/inventory/low-stock ──────────────────────────────────────────────

describe('GET /v1/inventory/low-stock', () => {
  it('returns 200 with low-stock variants', async () => {
    vi.mocked(inventoryService.listLowStock).mockResolvedValue(paginatedResult as never) // eslint-disable-line
    const res = await request(app).get('/v1/inventory/low-stock')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
  })
})

// ─── GET /v1/inventory/sku/:sku ───────────────────────────────────────────────

describe('GET /v1/inventory/sku/:sku', () => {
  it('returns 200 with variant', async () => {
    vi.mocked(inventoryService.getVariantBySku).mockResolvedValue(mockVariant as never)
    const res = await request(app).get('/v1/inventory/sku/SKU-001')
    expect(res.status).toBe(200)
    expect(res.body.data.sku).toBe('SKU-001')
  })

  it('returns 404 for unknown SKU', async () => {
    vi.mocked(inventoryService.getVariantBySku).mockRejectedValue(
      AppError.notFound('No variant found with SKU "GHOST"')
    )
    const res = await request(app).get('/v1/inventory/sku/GHOST')
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND')
  })
})

// ─── PATCH /v1/inventory/bulk ─────────────────────────────────────────────────

describe('PATCH /v1/inventory/bulk', () => {
  const validBody = {
    updates: [{ variantId: VAR_ID, operation: 'set', quantity: 100 }],
  }

  it('returns 200 with updated variants', async () => {
    vi.mocked(inventoryService.bulkUpdateStock).mockResolvedValue([
      { id: VAR_ID, sku: 'SKU-001', name: 'Default', stock: 100 },
    ] as never)
    const res = await request(app).patch('/v1/inventory/bulk').send(validBody)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
  })

  it('returns 422 when updates array is empty', async () => {
    const res = await request(app).patch('/v1/inventory/bulk').send({ updates: [] })
    expect(res.status).toBe(422)
    expect(inventoryService.bulkUpdateStock).not.toHaveBeenCalled()
  })

  it('returns 422 for invalid operation value', async () => {
    const res = await request(app)
      .patch('/v1/inventory/bulk')
      .send({ updates: [{ variantId: VAR_ID, operation: 'multiply', quantity: 2 }] })
    expect(res.status).toBe(422)
  })

  it('returns 422 when service throws badRequest', async () => {
    vi.mocked(inventoryService.bulkUpdateStock).mockRejectedValue(
      AppError.badRequest('Cannot subtract 10 from SKU "SKU-001" (stock: 3)')
    )
    const res = await request(app).patch('/v1/inventory/bulk').send(validBody)
    expect(res.status).toBe(422)
  })
})
