/**
 * HTTP-layer integration tests for /v1/admin.
 * Data services are mocked (schemas kept real for validation); this exercises the
 * requireAdmin RBAC guard, query/body validation, and controller response shaping.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { createApp } from '@/app'
import { env } from '@/config/env'
import type * as ProductsServiceModule from './products.service'
import type * as CustomersServiceModule from './customers.service'

vi.mock('./analytics.service', () => ({ getOverview: vi.fn() }))
vi.mock('./activity-log.service', () => ({ listActivityLogs: vi.fn(), logActivity: vi.fn() }))
vi.mock('./products.service', async (orig) => ({
  ...(await orig<typeof ProductsServiceModule>()),
  listAdminProducts: vi.fn(),
  exportProducts: vi.fn(),
  importProducts: vi.fn(),
}))
vi.mock('./customers.service', async (orig) => ({
  ...(await orig<typeof CustomersServiceModule>()),
  listCustomers: vi.fn(),
}))
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

import * as analyticsService from './analytics.service'
import * as productsService from './products.service'
import * as customersService from './customers.service'
import * as activityLogService from './activity-log.service'

const app = createApp()
const META = { page: 1, limit: 20, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false }
const bearer = (role: string, sub = 'admin-1') =>
  `Bearer ${jwt.sign({ sub, role, status: 'ACTIVE' }, env.JWT_ACCESS_SECRET)}`

beforeEach(() => {
  vi.clearAllMocks()
})

describe('requireAdmin guard', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/v1/admin/analytics/overview')
    expect(res.status).toBe(401)
  })

  it('returns 403 for a non-admin (customer) token', async () => {
    const res = await request(app)
      .get('/v1/admin/analytics/overview')
      .set('Authorization', bearer('CUSTOMER'))
    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })
})

describe('GET /v1/admin/analytics/overview', () => {
  it('returns the overview for an admin', async () => {
    const overview = { revenue: { thisMonth: 1000 } }
    vi.mocked(analyticsService.getOverview).mockResolvedValue(overview as never)
    const res = await request(app)
      .get('/v1/admin/analytics/overview')
      .set('Authorization', bearer('ADMIN'))
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual(overview)
  })
})

describe('GET /v1/admin/products', () => {
  it('returns a paginated product list', async () => {
    vi.mocked(productsService.listAdminProducts).mockResolvedValue({
      products: [{ id: 'p1' }],
      meta: META,
    } as never)
    const res = await request(app).get('/v1/admin/products').set('Authorization', bearer('ADMIN'))
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([{ id: 'p1' }])
    expect(res.body.meta).toMatchObject({ total: 0 })
  })

  it('returns 422 for an out-of-range limit', async () => {
    const res = await request(app)
      .get('/v1/admin/products?limit=999')
      .set('Authorization', bearer('ADMIN'))
    expect(res.status).toBe(422)
  })
})

describe('GET /v1/admin/products/export', () => {
  it('streams a CSV attachment', async () => {
    vi.mocked(productsService.exportProducts).mockResolvedValue('id,name\np1,Tee')
    const res = await request(app)
      .get('/v1/admin/products/export')
      .set('Authorization', bearer('SUPER_ADMIN'))
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain('text/csv')
    expect(res.text).toContain('id,name')
  })
})

describe('POST /v1/admin/products/import', () => {
  it('imports a valid batch and logs the activity', async () => {
    vi.mocked(productsService.importProducts).mockResolvedValue({
      imported: 1,
      skipped: 0,
      errors: [],
    })
    const res = await request(app)
      .post('/v1/admin/products/import')
      .set('Authorization', bearer('ADMIN'))
      .send({ rows: [{ name: 'Tee', slug: 'tee', categorySlug: 'apparel', basePrice: 10 }] })
    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({ imported: 1 })
    expect(activityLogService.logActivity).toHaveBeenCalled()
  })

  it('returns 422 for an empty rows array', async () => {
    const res = await request(app)
      .post('/v1/admin/products/import')
      .set('Authorization', bearer('ADMIN'))
      .send({ rows: [] })
    expect(res.status).toBe(422)
    expect(productsService.importProducts).not.toHaveBeenCalled()
  })
})

describe('GET /v1/admin/customers', () => {
  it('returns a paginated customer list', async () => {
    vi.mocked(customersService.listCustomers).mockResolvedValue({
      customers: [{ id: 'c1' }],
      meta: META,
    } as never)
    const res = await request(app).get('/v1/admin/customers').set('Authorization', bearer('ADMIN'))
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([{ id: 'c1' }])
  })
})

describe('GET /v1/admin/activity-logs', () => {
  it('returns a paginated activity log', async () => {
    vi.mocked(activityLogService.listActivityLogs).mockResolvedValue({
      logs: [{ id: 'log1' }],
      meta: META,
    } as never)
    const res = await request(app)
      .get('/v1/admin/activity-logs')
      .set('Authorization', bearer('ADMIN'))
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([{ id: 'log1' }])
  })
})
