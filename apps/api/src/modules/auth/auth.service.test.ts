/**
 * auth.service.test.ts
 *
 * Unit tests for register, login, refresh, and logout.
 * bcryptjs and jsonwebtoken are mocked to keep tests fast.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
    compare: vi.fn(),
  },
}))

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn().mockReturnValue('mock_access_token'),
  },
}))

vi.mock('@/config/env', () => ({
  env: {
    JWT_ACCESS_SECRET: 'test_secret',
    JWT_ACCESS_EXPIRES_IN: '15m',
  },
}))

import bcrypt from 'bcryptjs'
import { register, login, oauthLogin, refresh, logout } from './auth.service'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  passwordHash: 'hashed_password',
  firstName: 'John',
  lastName: 'Doe',
  role: 'CUSTOMER',
  status: 'ACTIVE',
  avatarUrl: null,
}

// What prisma.user.create returns after the select (no passwordHash)
const mockUserPublic = {
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'CUSTOMER',
  status: 'ACTIVE',
  avatarUrl: null,
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── register ─────────────────────────────────────────────────────────────────

describe('register', () => {
  it('creates a new user and returns public fields', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.user.create).mockResolvedValue(mockUserPublic as never)

    const result = await register({
      email: 'test@example.com',
      password: 'Password1',
      firstName: 'John',
      lastName: 'Doe',
    })

    expect(prisma.user.create).toHaveBeenCalledOnce()
    expect(result.email).toBe('test@example.com')
    expect(result).not.toHaveProperty('passwordHash')
  })

  it('lowercases the email before saving', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.user.create).mockResolvedValue(mockUserPublic as never)

    await register({
      email: 'TEST@Example.COM',
      password: 'Password1',
      firstName: 'J',
      lastName: 'D',
    })

    const createCall = vi.mocked(prisma.user.create).mock.calls[0]?.[0]
    expect((createCall?.data as { email: string }).email).toBe('test@example.com')
  })

  it('throws 409 CONFLICT when email already exists', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never)

    await expect(
      register({ email: 'test@example.com', password: 'Password1', firstName: 'J', lastName: 'D' })
    ).rejects.toMatchObject({ statusCode: 409, code: 'CONFLICT' })
  })
})

// ─── login ────────────────────────────────────────────────────────────────────

describe('login', () => {
  it('returns accessToken, refreshToken, and user on valid credentials', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never)
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never)
    vi.mocked(prisma.refreshToken.create).mockResolvedValue({} as never)

    const result = await login('test@example.com', 'Password1')

    expect(result.accessToken).toBe('mock_access_token')
    expect(result.refreshToken).toBeTruthy()
    expect(result.user.id).toBe('user-1')
    expect(result.user).not.toHaveProperty('passwordHash')
  })

  it('throws 401 when user does not exist', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    await expect(login('nobody@example.com', 'Password1')).rejects.toMatchObject({
      statusCode: 401,
    })
  })

  it('throws 401 when password is wrong', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never)
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never)

    await expect(login('test@example.com', 'WrongPass')).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 403 ACCOUNT_SUSPENDED for suspended users', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...mockUser,
      status: 'SUSPENDED',
    } as never)

    await expect(login('test@example.com', 'Password1')).rejects.toMatchObject({
      statusCode: 403,
      code: 'ACCOUNT_SUSPENDED',
    })
  })

  it('throws 401 for DELETED users without revealing account exists', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...mockUser,
      status: 'DELETED',
    } as never)

    await expect(login('test@example.com', 'Password1')).rejects.toMatchObject({ statusCode: 401 })
  })
})

// ─── refresh ──────────────────────────────────────────────────────────────────

describe('refresh', () => {
  const mockStoredToken = {
    tokenHash: 'hashed_token',
    expiresAt: new Date(Date.now() + 60_000),
    user: { id: 'user-1', role: 'CUSTOMER', status: 'ACTIVE' },
  }

  it('rotates refresh token and returns new access token', async () => {
    vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(mockStoredToken as never)
    vi.mocked(prisma.refreshToken.delete).mockResolvedValue({} as never)
    vi.mocked(prisma.refreshToken.create).mockResolvedValue({} as never)

    const result = await refresh('raw_refresh_token')

    expect(result.accessToken).toBe('mock_access_token')
    expect(result.refreshToken).toBeTruthy()
    expect(prisma.refreshToken.delete).toHaveBeenCalledOnce()
  })

  it('throws 401 when token not found', async () => {
    vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(null)

    await expect(refresh('bad_token')).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 401 when token is expired', async () => {
    vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue({
      ...mockStoredToken,
      expiresAt: new Date(Date.now() - 1000),
    } as never)

    await expect(refresh('expired_token')).rejects.toMatchObject({ statusCode: 401 })
  })
})

// ─── oauthLogin ───────────────────────────────────────────────────────────────

describe('oauthLogin', () => {
  const oauthData = {
    provider: 'google' as const,
    providerId: 'google-123',
    email: 'oauth@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    avatarUrl: 'https://example.com/avatar.jpg',
  }

  it('creates a new user and returns tokens for a first-time OAuth login', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.user.create).mockResolvedValue({
      ...mockUser,
      email: oauthData.email,
    } as never)
    vi.mocked(prisma.refreshToken.create).mockResolvedValue({} as never)

    const result = await oauthLogin(oauthData)

    expect(prisma.user.create).toHaveBeenCalledOnce()
    expect(result.accessToken).toBe('mock_access_token')
    expect(result.user.email).toBe(mockUser.email)
  })

  it('returns tokens for an existing user without creating a new one', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never)
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser as never)
    vi.mocked(prisma.refreshToken.create).mockResolvedValue({} as never)

    const result = await oauthLogin({ ...oauthData, avatarUrl: null })

    expect(prisma.user.create).not.toHaveBeenCalled()
    expect(result.accessToken).toBe('mock_access_token')
  })

  it('throws 403 ACCOUNT_SUSPENDED for suspended OAuth user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...mockUser,
      status: 'SUSPENDED',
    } as never)

    await expect(oauthLogin(oauthData)).rejects.toMatchObject({
      statusCode: 403,
      code: 'ACCOUNT_SUSPENDED',
    })
  })
})

// ─── logout ───────────────────────────────────────────────────────────────────

describe('logout', () => {
  it('deletes the refresh token from the database', async () => {
    vi.mocked(prisma.refreshToken.deleteMany).mockResolvedValue({ count: 1 })

    await logout('raw_refresh_token')

    expect(prisma.refreshToken.deleteMany).toHaveBeenCalledOnce()
  })
})
