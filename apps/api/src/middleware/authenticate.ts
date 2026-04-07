import type { RequestHandler } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '@/config/env'
import { AppError } from '@/utils/AppError'

interface AccessTokenPayload {
  sub: string
  role: 'GUEST' | 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN'
  status?: 'UNVERIFIED' | 'ACTIVE' | 'SUSPENDED' | 'DELETED'
}

/**
 * Verifies the Bearer access token from the Authorization header
 * and populates req.user. Returns 401 if missing or invalid.
 */
export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return next(AppError.unauthorized('Authentication required'))
  }

  const token = header.slice(7)

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload
    req.user = {
      id: payload.sub,
      role: payload.role,
      status: payload.status ?? 'ACTIVE',
    }
    next()
  } catch {
    next(AppError.unauthorized('Invalid or expired token'))
  }
}

/**
 * Like authenticate, but only requires admin role.
 */
export const requireAdmin: RequestHandler = (req, _res, next) => {
  authenticate(req, _res, (err) => {
    if (err) return next(err)
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
      return next(AppError.forbidden('Admin access required'))
    }
    next()
  })
}
