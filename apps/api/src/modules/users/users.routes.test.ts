/**
 * HTTP-layer integration tests for /v1/users.
 * Service logic is mocked — this exercises auth guards, validation, status codes,
 * routing, and the controllers' response shaping.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { createApp } from '@/app'
import { env } from '@/config/env'
import { AppError } from '@/utils/AppError'

vi.mock('./users.service')
vi.mock('./addresses.service')
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

import * as usersService from './users.service'
import * as addressesService from './addresses.service'

const app = createApp()
const bearer = (role = 'CUSTOMER', sub = 'user-1') =>
  `Bearer ${jwt.sign({ sub, role, status: 'ACTIVE' }, env.JWT_ACCESS_SECRET)}`

beforeEach(() => {
  vi.clearAllMocks()
})

describe('auth guard', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/v1/users/me')
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('returns 401 for an invalid token', async () => {
    const res = await request(app).get('/v1/users/me').set('Authorization', 'Bearer not-a-jwt')
    expect(res.status).toBe(401)
  })
})

describe('GET /v1/users/me', () => {
  it('returns the profile for an authenticated user', async () => {
    const profile = { id: 'user-1', email: 'a@b.com', firstName: 'Ada' }
    vi.mocked(usersService.getProfile).mockResolvedValue(profile as never)

    const res = await request(app).get('/v1/users/me').set('Authorization', bearer())

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ success: true, data: profile })
    expect(usersService.getProfile).toHaveBeenCalledWith('user-1')
  })

  it('propagates a 404 when the service throws notFound', async () => {
    vi.mocked(usersService.getProfile).mockRejectedValue(AppError.notFound('User not found'))
    const res = await request(app).get('/v1/users/me').set('Authorization', bearer())
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND')
  })
})

describe('PATCH /v1/users/me', () => {
  it('updates the profile with a valid body', async () => {
    vi.mocked(usersService.updateProfile).mockResolvedValue({ id: 'user-1' } as never)
    const res = await request(app)
      .patch('/v1/users/me')
      .set('Authorization', bearer())
      .send({ firstName: 'New' })
    expect(res.status).toBe(200)
    expect(usersService.updateProfile).toHaveBeenCalledWith('user-1', { firstName: 'New' })
  })

  it('rejects an invalid avatar URL with 422', async () => {
    const res = await request(app)
      .patch('/v1/users/me')
      .set('Authorization', bearer())
      .send({ avatarUrl: 'not-a-url' })
    expect(res.status).toBe(422)
    expect(usersService.updateProfile).not.toHaveBeenCalled()
  })
})

describe('PATCH /v1/users/me/password', () => {
  it('returns 422 when required fields are missing', async () => {
    const res = await request(app)
      .patch('/v1/users/me/password')
      .set('Authorization', bearer())
      .send({})
    expect(res.status).toBe(422)
  })

  it('changes the password with a valid body', async () => {
    vi.mocked(usersService.changePassword).mockResolvedValue(undefined as never)
    const res = await request(app)
      .patch('/v1/users/me/password')
      .set('Authorization', bearer())
      .send({ currentPassword: 'OldPass1', newPassword: 'NewPass1' })
    expect(res.status).toBe(200)
    expect(usersService.changePassword).toHaveBeenCalled()
  })
})

describe('DELETE /v1/users/me', () => {
  it('returns 422 when no password is supplied', async () => {
    const res = await request(app).delete('/v1/users/me').set('Authorization', bearer()).send({})
    expect(res.status).toBe(422)
    expect(usersService.deleteAccount).not.toHaveBeenCalled()
  })

  it('soft-deletes the account when a password is supplied', async () => {
    vi.mocked(usersService.deleteAccount).mockResolvedValue(undefined as never)
    const res = await request(app)
      .delete('/v1/users/me')
      .set('Authorization', bearer())
      .send({ password: 'OldPass1' })
    expect(res.status).toBe(200)
    expect(usersService.deleteAccount).toHaveBeenCalledWith('user-1', 'OldPass1')
  })
})

describe('addresses', () => {
  it('GET /v1/users/me/addresses returns the list', async () => {
    vi.mocked(addressesService.listAddresses).mockResolvedValue([{ id: 'a1' }] as never)
    const res = await request(app).get('/v1/users/me/addresses').set('Authorization', bearer())
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([{ id: 'a1' }])
  })

  it('POST creates an address (201) with a valid body', async () => {
    vi.mocked(addressesService.createAddress).mockResolvedValue({ id: 'a1' } as never)
    const res = await request(app)
      .post('/v1/users/me/addresses')
      .set('Authorization', bearer())
      .send({ line1: '1 Main St', city: 'London', state: 'LDN', postalCode: 'EC1', country: 'GB' })
    expect(res.status).toBe(201)
    expect(addressesService.createAddress).toHaveBeenCalled()
  })

  it('POST returns 422 for an invalid body', async () => {
    const res = await request(app)
      .post('/v1/users/me/addresses')
      .set('Authorization', bearer())
      .send({})
    expect(res.status).toBe(422)
  })

  it('PATCH /:id updates an address', async () => {
    vi.mocked(addressesService.updateAddress).mockResolvedValue({ id: 'a1' } as never)
    const res = await request(app)
      .patch('/v1/users/me/addresses/a1')
      .set('Authorization', bearer())
      .send({ city: 'Paris' })
    expect(res.status).toBe(200)
  })

  it('PATCH /:id propagates a 403 from the service', async () => {
    vi.mocked(addressesService.updateAddress).mockRejectedValue(AppError.forbidden())
    const res = await request(app)
      .patch('/v1/users/me/addresses/a1')
      .set('Authorization', bearer())
      .send({ city: 'Paris' })
    expect(res.status).toBe(403)
  })

  it('DELETE /:id removes an address', async () => {
    vi.mocked(addressesService.deleteAddress).mockResolvedValue(undefined as never)
    const res = await request(app)
      .delete('/v1/users/me/addresses/a1')
      .set('Authorization', bearer())
    expect(res.status).toBe(200)
  })

  it('PATCH /:id/default sets the default address', async () => {
    vi.mocked(addressesService.setDefault).mockResolvedValue(undefined as never)
    const res = await request(app)
      .patch('/v1/users/me/addresses/a1/default')
      .set('Authorization', bearer())
    expect(res.status).toBe(200)
    expect(addressesService.setDefault).toHaveBeenCalledWith('a1', 'user-1')
  })
})
