import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '@/app'
import * as categoriesService from './categories.service'
import { AppError } from '@/utils/AppError'

vi.mock('./categories.service')

const app = createApp()

// Valid CUID-format IDs (z.string().cuid() requires /^c[^\s-]{8,}$/i)
const CAT_ID = 'clhcategory000000000000001'

const mockCategory = {
  id: CAT_ID,
  name: 'Electronics',
  slug: 'electronics',
  parentId: null,
  isActive: true,
  sortOrder: 0,
  _count: { products: 3 },
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── GET /v1/categories ───────────────────────────────────────────────────────

describe('GET /v1/categories', () => {
  it('returns 200 with nested category tree by default', async () => {
    vi.mocked(categoriesService.listCategories).mockResolvedValue([mockCategory] as never)
    const res = await request(app).get('/v1/categories')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toHaveLength(1)
    expect(categoriesService.listCategories).toHaveBeenCalledWith(false)
  })

  it('passes flat=true to the service', async () => {
    vi.mocked(categoriesService.listCategories).mockResolvedValue([mockCategory] as never)
    await request(app).get('/v1/categories?flat=true')
    expect(categoriesService.listCategories).toHaveBeenCalledWith(true)
  })
})

// ─── GET /v1/categories/:id ───────────────────────────────────────────────────

describe('GET /v1/categories/:id', () => {
  it('returns 200 with category', async () => {
    vi.mocked(categoriesService.getCategoryById).mockResolvedValue(mockCategory as never)
    const res = await request(app).get(`/v1/categories/${CAT_ID}`)
    expect(res.status).toBe(200)
    expect(res.body.data.id).toBe(CAT_ID)
  })

  it('returns 404 when category does not exist', async () => {
    vi.mocked(categoriesService.getCategoryById).mockRejectedValue(
      AppError.notFound('Category not found')
    )
    const res = await request(app).get(`/v1/categories/${CAT_ID}`)
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND')
  })

  it('returns 422 for non-CUID id param', async () => {
    const res = await request(app).get('/v1/categories/not-a-cuid')
    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

// ─── POST /v1/categories ──────────────────────────────────────────────────────

describe('POST /v1/categories', () => {
  const validBody = { name: 'Laptops', slug: 'laptops' }

  it('returns 201 with created category', async () => {
    vi.mocked(categoriesService.createCategory).mockResolvedValue(mockCategory as never)
    const res = await request(app).post('/v1/categories').send(validBody)
    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
  })

  it('returns 422 when required fields are missing', async () => {
    const res = await request(app).post('/v1/categories').send({})
    expect(res.status).toBe(422)
    expect(categoriesService.createCategory).not.toHaveBeenCalled()
  })

  it('returns 409 when slug is already taken', async () => {
    vi.mocked(categoriesService.createCategory).mockRejectedValue(
      AppError.conflict('Slug "laptops" is already taken')
    )
    const res = await request(app).post('/v1/categories').send(validBody)
    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('CONFLICT')
  })
})

// ─── PATCH /v1/categories/:id ─────────────────────────────────────────────────

describe('PATCH /v1/categories/:id', () => {
  it('returns 200 with updated category', async () => {
    vi.mocked(categoriesService.updateCategory).mockResolvedValue({
      ...mockCategory,
      name: 'Updated',
    } as never)
    const res = await request(app).patch(`/v1/categories/${CAT_ID}`).send({ name: 'Updated' })
    expect(res.status).toBe(200)
    expect(res.body.data.name).toBe('Updated')
  })

  it('returns 422 for non-CUID id', async () => {
    const res = await request(app).patch('/v1/categories/bad-id').send({ name: 'X' })
    expect(res.status).toBe(422)
  })
})

// ─── DELETE /v1/categories/:id ────────────────────────────────────────────────

describe('DELETE /v1/categories/:id', () => {
  it('returns 204 on success', async () => {
    vi.mocked(categoriesService.deleteCategory).mockResolvedValue(undefined)
    const res = await request(app).delete(`/v1/categories/${CAT_ID}`)
    expect(res.status).toBe(204)
  })

  it('returns 422 when category has products', async () => {
    vi.mocked(categoriesService.deleteCategory).mockRejectedValue(
      AppError.badRequest('Cannot delete a category that has products assigned to it')
    )
    const res = await request(app).delete(`/v1/categories/${CAT_ID}`)
    expect(res.status).toBe(422)
  })
})
