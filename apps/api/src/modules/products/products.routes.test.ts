import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '@/app'
import * as productsService from './products.service'
import { AppError } from '@/utils/AppError'

vi.mock('./products.service')

const app = createApp()

// Valid CUID-format IDs (z.string().cuid() requires /^c[^\s-]{8,}$/i)
const PROD_ID = 'clhproduct0000000000000001'
const VAR_ID = 'clhvariant0000000000000001'
const CAT_ID = 'clhcategory000000000000001'

const mockProduct = {
  id: PROD_ID,
  name: 'Widget',
  slug: 'widget',
  basePrice: 9.99,
  isActive: true,
  category: { id: CAT_ID, name: 'Electronics', slug: 'electronics' },
  images: [],
  variants: [],
  _count: { variants: 0, reviews: 0 },
}

const mockVariant = {
  id: VAR_ID,
  productId: PROD_ID,
  sku: 'WGT-001',
  name: 'Default',
  price: 9.99,
  stock: 50,
  isActive: true,
  attributes: {},
}

const paginatedResult = {
  products: [mockProduct],
  meta: { page: 1, limit: 10, total: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false },
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── GET /v1/products ─────────────────────────────────────────────────────────

describe('GET /v1/products', () => {
  it('returns 200 with paginated products', async () => {
    vi.mocked(productsService.listProducts).mockResolvedValue(paginatedResult as never)

    const res = await request(app).get('/v1/products?page=1&limit=10')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.meta.total).toBe(1)
  })

  it('passes query filters to the service', async () => {
    vi.mocked(productsService.listProducts).mockResolvedValue({
      products: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false },
    } as never)

    await request(app).get('/v1/products?search=widget&minPrice=5&maxPrice=50')
    expect(productsService.listProducts).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'widget' })
    )
  })
})

// ─── GET /v1/products/:id ─────────────────────────────────────────────────────

describe('GET /v1/products/:id', () => {
  it('returns 200 with product', async () => {
    vi.mocked(productsService.getProductById).mockResolvedValue(mockProduct as never)
    const res = await request(app).get(`/v1/products/${PROD_ID}`)
    expect(res.status).toBe(200)
    expect(res.body.data.id).toBe(PROD_ID)
  })

  it('returns 404 when product does not exist', async () => {
    vi.mocked(productsService.getProductById).mockRejectedValue(
      AppError.notFound('Product not found')
    )
    const res = await request(app).get(`/v1/products/${PROD_ID}`)
    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
    expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND')
  })

  it('returns 422 for a non-CUID id param', async () => {
    const res = await request(app).get('/v1/products/not-a-cuid')
    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

// ─── GET /v1/products/slug/:slug ──────────────────────────────────────────────

describe('GET /v1/products/slug/:slug', () => {
  it('returns 200 with product', async () => {
    vi.mocked(productsService.getProductBySlug).mockResolvedValue(mockProduct as never)
    const res = await request(app).get('/v1/products/slug/widget')
    expect(res.status).toBe(200)
    expect(res.body.data.slug).toBe('widget')
  })

  it('returns 404 for unknown slug', async () => {
    vi.mocked(productsService.getProductBySlug).mockRejectedValue(
      AppError.notFound('Product not found')
    )
    const res = await request(app).get('/v1/products/slug/ghost')
    expect(res.status).toBe(404)
  })
})

// ─── POST /v1/products ────────────────────────────────────────────────────────

describe('POST /v1/products', () => {
  const validBody = {
    name: 'Gadget',
    slug: 'gadget',
    categoryId: CAT_ID,
    basePrice: '19.99', // decimalSchema expects a string matching /^\d+(\.\d{1,2})?$/
    description: 'A gadget',
  }

  it('returns 201 with created product', async () => {
    vi.mocked(productsService.createProduct).mockResolvedValue(mockProduct as never)
    const res = await request(app).post('/v1/products').send(validBody)
    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
  })

  it('returns 422 when required fields are missing', async () => {
    const res = await request(app).post('/v1/products').send({ name: 'Incomplete' })
    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
    expect(productsService.createProduct).not.toHaveBeenCalled()
  })

  it('returns 409 when service throws conflict', async () => {
    vi.mocked(productsService.createProduct).mockRejectedValue(
      AppError.conflict('Slug "gadget" is already taken')
    )
    const res = await request(app).post('/v1/products').send(validBody)
    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('CONFLICT')
  })
})

// ─── PATCH /v1/products/:id ───────────────────────────────────────────────────

describe('PATCH /v1/products/:id', () => {
  it('returns 200 with updated product', async () => {
    vi.mocked(productsService.updateProduct).mockResolvedValue({
      ...mockProduct,
      name: 'Updated',
    } as never)
    const res = await request(app).patch(`/v1/products/${PROD_ID}`).send({ name: 'Updated' })
    expect(res.status).toBe(200)
    expect(res.body.data.name).toBe('Updated')
  })

  it('returns 422 for invalid id param', async () => {
    const res = await request(app).patch('/v1/products/bad-id').send({ name: 'X' })
    expect(res.status).toBe(422)
  })
})

// ─── DELETE /v1/products/:id ──────────────────────────────────────────────────

describe('DELETE /v1/products/:id', () => {
  it('returns 204 on success', async () => {
    vi.mocked(productsService.deleteProduct).mockResolvedValue(undefined)
    const res = await request(app).delete(`/v1/products/${PROD_ID}`)
    expect(res.status).toBe(204)
  })

  it('returns 404 when product does not exist', async () => {
    vi.mocked(productsService.deleteProduct).mockRejectedValue(
      AppError.notFound('Product not found')
    )
    const res = await request(app).delete(`/v1/products/${PROD_ID}`)
    expect(res.status).toBe(404)
  })
})

// ─── GET /v1/products/:id/variants ───────────────────────────────────────────

describe('GET /v1/products/:id/variants', () => {
  it('returns 200 with variants array', async () => {
    vi.mocked(productsService.listVariants).mockResolvedValue([mockVariant] as never)
    const res = await request(app).get(`/v1/products/${PROD_ID}/variants`)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
  })
})

// ─── PATCH /v1/products/:id/variants/:variantId/stock ────────────────────────

describe('PATCH /v1/products/:id/variants/:variantId/stock', () => {
  it('returns 200 with updated variant', async () => {
    vi.mocked(productsService.adjustStock).mockResolvedValue({
      ...mockVariant,
      stock: 60,
    } as never)
    const res = await request(app)
      .patch(`/v1/products/${PROD_ID}/variants/${VAR_ID}/stock`)
      .send({ operation: 'add', quantity: 10 })
    expect(res.status).toBe(200)
    expect(res.body.data.stock).toBe(60)
  })

  it('returns 422 for invalid operation', async () => {
    const res = await request(app)
      .patch(`/v1/products/${PROD_ID}/variants/${VAR_ID}/stock`)
      .send({ operation: 'multiply', quantity: 2 })
    expect(res.status).toBe(422)
  })
})
