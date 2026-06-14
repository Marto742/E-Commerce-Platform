/**
 * Security regression tests (Phase 10 — tasks 10.9 SQLi, 10.10 XSS, 10.8 OWASP controls).
 *
 * Exercises the cross-cutting security middleware: Helmet headers, CORS allow-list, JSON
 * body handling, error envelopes, input-validation rejection of injection payloads, and
 * the CSRF middleware (unit-tested directly since it is bypassed under NODE_ENV=test).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import type { Request, Response } from 'express'
import { createApp } from '@/app'
import { csrfProtection } from '@/middleware/csrf'

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

const SQLI = "'; DROP TABLE users; --"
const XSS = '<script>alert(1)</script>'

describe('security headers (Helmet)', () => {
  it('sets hardening headers and hides x-powered-by', async () => {
    const res = await request(app).get('/v1/health')
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['x-frame-options']).toBe('DENY')
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(res.headers['content-security-policy']).toBeTruthy()
    expect(res.headers['x-powered-by']).toBeUndefined()
  })
})

describe('CORS', () => {
  it('reflects an allow-listed origin', async () => {
    const res = await request(app).get('/v1/health').set('Origin', 'http://localhost:3000')
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000')
    expect(res.headers['access-control-allow-credentials']).toBe('true')
  })
})

describe('error handling', () => {
  it('returns a clean JSON 404 envelope for unknown routes (no HTML reflection)', async () => {
    const res = await request(app).get('/v1/this-route-does-not-exist')
    expect(res.status).toBe(404)
    expect(res.headers['content-type']).toContain('application/json')
    expect(res.body.success).toBe(false)
    expect(res.body.error).toBeTruthy()
  })

  it('rejects a malformed JSON body with 400', async () => {
    const res = await request(app)
      .post('/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{ not valid json')
    expect(res.status).toBe(400)
  })
})

describe('injection resilience (input validation)', () => {
  it('rejects SQLi in an email field with 422 (never reaches the data layer)', async () => {
    const res = await request(app)
      .post('/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: SQLI, password: 'whatever' })
    expect(res.status).toBe(422)
  })

  it('rejects an XSS payload in an email field with 422', async () => {
    const res = await request(app)
      .post('/v1/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: `${XSS}@x.com`, password: 'whatever' })
    expect(res.status).toBe(422)
  })

  it('does not reflect an injected path back as executable HTML', async () => {
    const res = await request(app).get(`/v1/products/${encodeURIComponent(XSS)}`)
    // Whatever the status, the body is JSON — script payloads cannot execute.
    expect(res.headers['content-type']).toContain('application/json')
    expect(res.text).not.toContain('<script>alert(1)</script>')
  })
})

// ─── CSRF middleware (bypassed under NODE_ENV=test, so unit-test it directly) ────

describe('csrfProtection middleware', () => {
  const realEnv = process.env.NODE_ENV

  function run(method: string, headers: Record<string, string> = {}, path = '/v1/orders') {
    const next = vi.fn()
    const req = { method, path, headers } as unknown as Request
    csrfProtection(req, {} as Response, next)
    return next
  }

  beforeEach(() => {
    process.env.NODE_ENV = 'development' // enable the middleware
  })
  afterEach(() => {
    process.env.NODE_ENV = realEnv
  })

  it('allows safe (non-mutating) methods', () => {
    const next = run('GET')
    expect(next).toHaveBeenCalledWith()
  })

  it('blocks mutations without a JSON content-type (422)', () => {
    const next = run('POST', { 'content-type': 'text/plain' })
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 422 }))
  })

  it('blocks mutations missing the X-Requested-With header (403)', () => {
    const next = run('POST', { 'content-type': 'application/json' })
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }))
  })

  it('allows a well-formed mutation request', () => {
    const next = run('POST', {
      'content-type': 'application/json',
      'x-requested-with': 'XMLHttpRequest',
    })
    expect(next).toHaveBeenCalledWith()
  })

  it('skips the Stripe webhook endpoint', () => {
    const next = run('POST', {}, '/v1/payments/webhook')
    expect(next).toHaveBeenCalledWith()
  })

  it('is bypassed entirely under NODE_ENV=test', () => {
    process.env.NODE_ENV = 'test'
    const next = run('POST', {}) // no headers, would otherwise be blocked
    expect(next).toHaveBeenCalledWith()
  })
})
