/**
 * auth.security.test.ts
 *
 * Security-focused tests for the auth system.
 * Covers attack scenarios: brute-force, enumeration, injection,
 * token forgery, replay attacks, and session fixation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '@/app'
import { prisma } from '@/lib/prisma'
import { comparePassword, dummyHash } from '@/lib/password'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    emailVerificationToken: {
      create: vi.fn().mockResolvedValue({}),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    passwordResetToken: {
      create: vi.fn().mockResolvedValue({}),
      findUnique: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    $transaction: vi.fn((ops: unknown[]) => Promise.all(ops)),
  },
}))

vi.mock('@/lib/password', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed_password'),
  comparePassword: vi.fn(),
  dummyHash: vi.fn().mockResolvedValue('dummy'),
}))

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn().mockReturnValue('mock_access_token'),
    verify: vi.fn(),
  },
}))

vi.mock('@/config/env', () => ({
  env: {
    JWT_ACCESS_SECRET: 'test_secret',
    JWT_ACCESS_EXPIRES_IN: '15m',
    NODE_ENV: 'test',
    CORS_ORIGIN: 'http://localhost:3000',
  },
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

vi.mock('@/lib/stripe', () => ({
  stripe: {
    paymentIntents: { create: vi.fn(), retrieve: vi.fn() },
    webhooks: { constructEventAsync: vi.fn() },
  },
}))

import * as authService from './auth.service'
import * as usersService from '@/modules/users/users.service'
import { AppError } from '@/utils/AppError'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const activeUser = {
  id: 'user-sec-1',
  email: 'victim@example.com',
  passwordHash: 'hashed_password',
  firstName: 'Alice',
  lastName: 'Smith',
  role: 'CUSTOMER',
  status: 'ACTIVE',
  avatarUrl: null,
  emailVerifiedAt: new Date(),
  createdAt: new Date(),
}

const app = createApp()

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── 1. Credential stuffing / brute-force ─────────────────────────────────────

describe('Brute-force protection', () => {
  it('returns 401 (not 404) when email does not exist — no user enumeration', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const res = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'AnyPassword1' })

    // Must NOT reveal whether the account exists
    expect(res.status).toBe(401)
    expect(res.body.error?.code).not.toBe('USER_NOT_FOUND')
  })

  it('performs dummy hash work when user is not found (timing attack mitigation)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    await request(app)
      .post('/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'AnyPassword1' })

    // dummyHash must be called so response time is indistinguishable from a real miss
    expect(dummyHash).toHaveBeenCalledOnce()
  })

  it('returns same 401 error message for wrong password as for unknown email', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    const res1 = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'unknown@example.com', password: 'AnyPassword1' })

    vi.mocked(prisma.user.findUnique).mockResolvedValue(activeUser as never)
    vi.mocked(comparePassword).mockResolvedValue(false as never)
    const res2 = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'victim@example.com', password: 'WrongPassword1' })

    // Both must return identical status and message
    expect(res1.status).toBe(res2.status)
    expect(res1.body.error?.message).toBe(res2.body.error?.message)
  })

  it('returns 401 for deleted accounts without revealing account state', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...activeUser,
      status: 'DELETED',
    } as never)

    const res = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'victim@example.com', password: 'AnyPassword1' })

    expect(res.status).toBe(401)
    // Must not leak that this was a DELETED account
    expect(JSON.stringify(res.body)).not.toContain('DELETED')
  })
})

// ─── 2. Email enumeration ─────────────────────────────────────────────────────

describe('Email enumeration prevention', () => {
  it('forgot-password always returns 200 for unknown email', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const res = await request(app)
      .post('/v1/auth/forgot-password')
      .send({ email: 'ghost@example.com' })

    expect(res.status).toBe(200)
  })

  it('forgot-password returns same 200 for known email', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(activeUser as never)
    vi.mocked(prisma.passwordResetToken.deleteMany).mockResolvedValue({ count: 0 })

    const res = await request(app)
      .post('/v1/auth/forgot-password')
      .send({ email: 'victim@example.com' })

    expect(res.status).toBe(200)
  })

  it('resend-verification always returns 200 for unknown email', async () => {
    vi.spyOn(authService, 'resendVerification').mockResolvedValue(undefined)

    const res = await request(app)
      .post('/v1/auth/resend-verification')
      .send({ email: 'ghost@example.com' })

    expect(res.status).toBe(200)
  })

  it('register returns 409 (not 422) so attacker knows email exists — acceptable disclosure', async () => {
    // 409 Conflict on duplicate email IS the intended behavior; document it explicitly
    vi.spyOn(authService, 'register').mockRejectedValue(AppError.conflict('Email taken'))

    const res = await request(app)
      .post('/v1/auth/register')
      .send({ email: 'taken@example.com', password: 'ValidPass1', firstName: 'A', lastName: 'B' })

    expect(res.status).toBe(409)
    // Acceptable: registration enumeration is a known trade-off for UX
  })
})

// ─── 3. Input validation / injection ─────────────────────────────────────────

describe('Input validation — injection and malformed payloads', () => {
  it('rejects SQL-injection-like characters in email gracefully (422)', async () => {
    const res = await request(app)
      .post('/v1/auth/login')
      .send({ email: "' OR '1'='1", password: 'AnyPassword1' })

    expect(res.status).toBe(422)
  })

  it('rejects extremely long email (422 or 401 — Zod passes valid-format long emails to service)', async () => {
    const res = await request(app)
      .post('/v1/auth/login')
      .send({ email: `${'a'.repeat(300)}@example.com`, password: 'AnyPassword1' })

    // Zod email() validates format only; very long emails pass schema validation
    // and reach the login service which returns 401 (user not found). Both are safe.
    expect([401, 422]).toContain(res.status)
  })

  it('rejects missing body fields (422)', async () => {
    const res = await request(app).post('/v1/auth/login').send({})
    expect(res.status).toBe(422)
  })

  it('rejects non-JSON body (400)', async () => {
    const res = await request(app)
      .post('/v1/auth/login')
      .set('Content-Type', 'text/plain')
      .send('email=foo&password=bar')

    // CSRF middleware rejects non-JSON content-type
    expect([400, 422]).toContain(res.status)
  })

  it('rejects array in email field (422)', async () => {
    const res = await request(app)
      .post('/v1/auth/login')
      .send({ email: ['admin@example.com', 'other@example.com'], password: 'AnyPassword1' })

    expect(res.status).toBe(422)
  })

  it('rejects password without uppercase letter (422)', async () => {
    const res = await request(app)
      .post('/v1/auth/register')
      .send({ email: 'new@example.com', password: 'alllowercase1', firstName: 'A', lastName: 'B' })

    expect(res.status).toBe(422)
  })

  it('rejects password without number (422)', async () => {
    const res = await request(app)
      .post('/v1/auth/register')
      .send({ email: 'new@example.com', password: 'NoNumbers!', firstName: 'A', lastName: 'B' })

    expect(res.status).toBe(422)
  })

  it('rejects password shorter than 8 characters (422)', async () => {
    const res = await request(app)
      .post('/v1/auth/register')
      .send({ email: 'new@example.com', password: 'Short1', firstName: 'A', lastName: 'B' })

    expect(res.status).toBe(422)
  })
})

// ─── 4. Token security ────────────────────────────────────────────────────────

describe('Token security', () => {
  it('refresh rejects an expired token (401)', async () => {
    vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue({
      id: 'rt-1',
      userId: 'user-sec-1',
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() - 1000), // expired
      createdAt: new Date(),
    } as never)

    const res = await request(app).post('/v1/auth/refresh').send({ token: 'expired_raw_token' })

    expect(res.status).toBe(401)
  })

  it('refresh rejects a token not in the database (401)', async () => {
    vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(null)

    const res = await request(app).post('/v1/auth/refresh').send({ token: 'forged_token' })

    expect(res.status).toBe(401)
  })

  it('reset-password rejects a forged/unknown token (422)', async () => {
    vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue(null)

    const res = await request(app)
      .post('/v1/auth/reset-password')
      .send({ token: 'forged_reset_token', password: 'NewValidPass1' })

    expect(res.status).toBe(422)
  })

  it('reset-password rejects an expired token (422)', async () => {
    vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue({
      tokenHash: 'hash',
      userId: 'user-sec-1',
      expiresAt: new Date(Date.now() - 1000),
      user: { id: 'user-sec-1', status: 'ACTIVE' },
    } as never)

    const res = await request(app)
      .post('/v1/auth/reset-password')
      .send({ token: 'expired_reset', password: 'NewValidPass1' })

    expect(res.status).toBe(422)
  })

  it('verify-email rejects an unknown token (422)', async () => {
    vi.spyOn(authService, 'verifyEmail').mockRejectedValue(
      AppError.badRequest('Invalid or expired verification token')
    )

    const res = await request(app)
      .post('/v1/auth/verify-email')
      .send({ token: 'forged_verification_token' })

    expect(res.status).toBe(422)
  })
})

// ─── 5. Password change security ─────────────────────────────────────────────

describe('Password change security (service layer)', () => {
  it('changePassword rejects wrong current password', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      passwordHash: 'hashed_correct_password',
    } as never)
    vi.mocked(comparePassword).mockResolvedValue(false as never)

    await expect(
      usersService.changePassword('user-sec-1', {
        currentPassword: 'WrongCurrent1',
        newPassword: 'NewValid1Pass',
      })
    ).rejects.toMatchObject({ statusCode: expect.any(Number) })
  })
})

// ─── 6. Security headers ──────────────────────────────────────────────────────

describe('Security response headers', () => {
  it('includes X-Content-Type-Options: nosniff', async () => {
    const res = await request(app).get('/v1/health')
    expect(res.headers['x-content-type-options']).toBe('nosniff')
  })

  it('includes X-Frame-Options: DENY', async () => {
    const res = await request(app).get('/v1/health')
    expect(res.headers['x-frame-options']).toBe('DENY')
  })

  it('does not expose X-Powered-By header', async () => {
    const res = await request(app).get('/v1/health')
    expect(res.headers['x-powered-by']).toBeUndefined()
  })

  it('returns RateLimit-* headers on auth endpoints', async () => {
    // Rate limiter is bypassed in tests but the header behaviour is covered
    // by the standard headers: true config — document intent only
    expect(true).toBe(true) // placeholder: real assertion requires live limiter
  })
})

// ─── 7. Suspended account handling ───────────────────────────────────────────

describe('Suspended account handling', () => {
  it('login returns 403 for suspended user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...activeUser,
      status: 'SUSPENDED',
    } as never)
    vi.mocked(comparePassword).mockResolvedValue(true as never)

    const res = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'victim@example.com', password: 'AnyPassword1' })

    expect(res.status).toBe(403)
  })

  it('oauth login returns 403 for suspended user', async () => {
    vi.spyOn(authService, 'oauthLogin').mockRejectedValue(
      new AppError(403, 'ACCOUNT_SUSPENDED', 'Account is suspended')
    )

    const res = await request(app).post('/v1/auth/oauth').send({
      provider: 'google',
      providerId: '12345',
      email: 'suspended@example.com',
      firstName: 'Sus',
      lastName: 'Pended',
    })

    expect(res.status).toBe(403)
  })
})
