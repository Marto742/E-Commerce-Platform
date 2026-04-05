/**
 * auth.routes.test.ts
 *
 * HTTP-layer integration tests for the auth endpoints.
 * All service logic is mocked — this tests validation, status codes, and routing.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '@/app'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/modules/auth/auth.service', () => ({
  register: vi.fn(),
  login: vi.fn(),
  refresh: vi.fn(),
  logout: vi.fn(),
  verifyEmail: vi.fn(),
  resendVerification: vi.fn(),
  oauthLogin: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
}))

vi.mock('@/middleware/rateLimiter', () => ({
  globalLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
  writeLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
  authLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
  searchLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
}))

vi.mock('@/lib/stripe', () => ({
  stripe: {
    paymentIntents: { create: vi.fn(), retrieve: vi.fn() },
    webhooks: { constructEventAsync: vi.fn() },
  },
}))

import * as authService from '@/modules/auth/auth.service'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const app = createApp()

const validRegisterBody = {
  email: 'new@example.com',
  password: 'Password1',
  firstName: 'John',
  lastName: 'Doe',
}

const validLoginBody = { email: 'user@example.com', password: 'Password1' }

const mockUser = {
  id: 'user-1',
  email: 'new@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'CUSTOMER',
  status: 'UNVERIFIED',
  avatarUrl: null,
}

const mockTokenResult = {
  accessToken: 'access_token',
  refreshToken: 'refresh_token',
  user: mockUser,
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── POST /v1/auth/register ───────────────────────────────────────────────────

describe('POST /v1/auth/register', () => {
  it('returns 201 with user data on valid input', async () => {
    vi.mocked(authService.register).mockResolvedValue(mockUser as never)

    const res = await request(app).post('/v1/auth/register').send(validRegisterBody)

    expect(res.status).toBe(201)
    expect(res.body.data).toMatchObject({ email: 'new@example.com' })
    expect(res.body.data).not.toHaveProperty('passwordHash')
  })

  it('returns 422 when email is missing', async () => {
    const { email: _, ...noEmail } = validRegisterBody
    const res = await request(app).post('/v1/auth/register').send(noEmail)
    expect(res.status).toBe(422)
  })

  it('returns 422 when password is too short', async () => {
    const res = await request(app)
      .post('/v1/auth/register')
      .send({ ...validRegisterBody, password: 'short' })
    expect(res.status).toBe(422)
  })

  it('returns 422 when password has no uppercase letter', async () => {
    const res = await request(app)
      .post('/v1/auth/register')
      .send({ ...validRegisterBody, password: 'password1' })
    expect(res.status).toBe(422)
  })

  it('returns 409 when email is already registered', async () => {
    const { AppError } = await import('@/utils/AppError')
    vi.mocked(authService.register).mockRejectedValue(
      new AppError(409, 'CONFLICT', 'Email already registered')
    )

    const res = await request(app).post('/v1/auth/register').send(validRegisterBody)
    expect(res.status).toBe(409)
  })
})

// ─── POST /v1/auth/login ──────────────────────────────────────────────────────

describe('POST /v1/auth/login', () => {
  it('returns 200 with tokens on valid credentials', async () => {
    vi.mocked(authService.login).mockResolvedValue(mockTokenResult as never)

    const res = await request(app).post('/v1/auth/login').send(validLoginBody)

    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({ accessToken: 'access_token' })
  })

  it('returns 422 when email is missing', async () => {
    const res = await request(app).post('/v1/auth/login').send({ password: 'Password1' })
    expect(res.status).toBe(422)
  })

  it('returns 401 for invalid credentials', async () => {
    const { AppError } = await import('@/utils/AppError')
    vi.mocked(authService.login).mockRejectedValue(
      AppError.unauthorized('Invalid email or password')
    )

    const res = await request(app).post('/v1/auth/login').send(validLoginBody)
    expect(res.status).toBe(401)
  })

  it('returns 403 for suspended account', async () => {
    const { AppError } = await import('@/utils/AppError')
    vi.mocked(authService.login).mockRejectedValue(
      new AppError(403, 'ACCOUNT_SUSPENDED', 'Account suspended')
    )

    const res = await request(app).post('/v1/auth/login').send(validLoginBody)
    expect(res.status).toBe(403)
  })
})

// ─── POST /v1/auth/refresh ────────────────────────────────────────────────────

describe('POST /v1/auth/refresh', () => {
  it('returns 200 with new tokens', async () => {
    vi.mocked(authService.refresh).mockResolvedValue({
      accessToken: 'new_access_token',
      refreshToken: 'new_refresh_token',
    })

    const res = await request(app).post('/v1/auth/refresh').send({ token: 'raw_refresh_token' })

    expect(res.status).toBe(200)
    expect(res.body.data.accessToken).toBe('new_access_token')
  })

  it('returns 422 when token is missing', async () => {
    const res = await request(app).post('/v1/auth/refresh').send({})
    expect(res.status).toBe(422)
  })

  it('returns 401 for expired refresh token', async () => {
    const { AppError } = await import('@/utils/AppError')
    vi.mocked(authService.refresh).mockRejectedValue(
      AppError.unauthorized('Refresh token is expired or invalid')
    )

    const res = await request(app).post('/v1/auth/refresh').send({ token: 'expired' })
    expect(res.status).toBe(401)
  })
})

// ─── POST /v1/auth/verify-email ───────────────────────────────────────────────

describe('POST /v1/auth/verify-email', () => {
  it('returns 200 when token is valid', async () => {
    vi.mocked(authService.verifyEmail).mockResolvedValue(undefined)

    const res = await request(app).post('/v1/auth/verify-email').send({ token: 'valid_token' })

    expect(res.status).toBe(200)
    expect(authService.verifyEmail).toHaveBeenCalledWith('valid_token')
  })

  it('returns 422 when token is missing', async () => {
    const res = await request(app).post('/v1/auth/verify-email').send({})
    expect(res.status).toBe(422)
  })

  it('returns 422 when token is expired', async () => {
    const { AppError } = await import('@/utils/AppError')
    vi.mocked(authService.verifyEmail).mockRejectedValue(
      AppError.badRequest('Verification link is invalid or has expired')
    )

    const res = await request(app).post('/v1/auth/verify-email').send({ token: 'expired' })
    expect(res.status).toBe(422)
  })
})

// ─── POST /v1/auth/resend-verification ───────────────────────────────────────

describe('POST /v1/auth/resend-verification', () => {
  it('returns 200 regardless of whether email exists (anti-enumeration)', async () => {
    vi.mocked(authService.resendVerification).mockResolvedValue(undefined)

    const res = await request(app)
      .post('/v1/auth/resend-verification')
      .send({ email: 'anyone@example.com' })

    expect(res.status).toBe(200)
  })

  it('returns 422 when email is invalid', async () => {
    const res = await request(app)
      .post('/v1/auth/resend-verification')
      .send({ email: 'not-an-email' })
    expect(res.status).toBe(422)
  })
})

// ─── POST /v1/auth/logout ─────────────────────────────────────────────────────

describe('POST /v1/auth/logout', () => {
  it('returns 200 and invalidates the token', async () => {
    vi.mocked(authService.logout).mockResolvedValue(undefined)

    const res = await request(app).post('/v1/auth/logout').send({ token: 'refresh_token' })

    expect(res.status).toBe(200)
    expect(authService.logout).toHaveBeenCalledWith('refresh_token')
  })

  it('returns 200 even without a token (graceful logout)', async () => {
    const res = await request(app).post('/v1/auth/logout').send({})
    expect(res.status).toBe(200)
  })
})

// ─── POST /v1/auth/forgot-password ───────────────────────────────────────────

describe('POST /v1/auth/forgot-password', () => {
  it('returns 200 regardless of whether email exists (anti-enumeration)', async () => {
    vi.mocked(authService.forgotPassword).mockResolvedValue(undefined)

    const res = await request(app)
      .post('/v1/auth/forgot-password')
      .send({ email: 'anyone@example.com' })

    expect(res.status).toBe(200)
    expect(authService.forgotPassword).toHaveBeenCalledWith('anyone@example.com')
  })

  it('returns 422 when email is invalid', async () => {
    const res = await request(app).post('/v1/auth/forgot-password').send({ email: 'not-an-email' })
    expect(res.status).toBe(422)
  })
})

// ─── POST /v1/auth/reset-password ────────────────────────────────────────────

describe('POST /v1/auth/reset-password', () => {
  it('returns 200 on valid token and password', async () => {
    vi.mocked(authService.resetPassword).mockResolvedValue(undefined)

    const res = await request(app)
      .post('/v1/auth/reset-password')
      .send({ token: 'valid_token', password: 'NewPassword1' })

    expect(res.status).toBe(200)
  })

  it('returns 422 when token is missing', async () => {
    const res = await request(app)
      .post('/v1/auth/reset-password')
      .send({ password: 'NewPassword1' })
    expect(res.status).toBe(422)
  })

  it('returns 422 when token is expired', async () => {
    const { AppError } = await import('@/utils/AppError')
    vi.mocked(authService.resetPassword).mockRejectedValue(
      AppError.badRequest('Reset link is invalid or has expired')
    )

    const res = await request(app)
      .post('/v1/auth/reset-password')
      .send({ token: 'expired', password: 'NewPassword1' })
    expect(res.status).toBe(422)
  })
})
