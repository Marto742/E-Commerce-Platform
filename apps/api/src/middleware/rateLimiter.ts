import rateLimit, { type Options, type RateLimitRequestHandler } from 'express-rate-limit'

// ─── Shared error response ────────────────────────────────────────────────────

function limitedResponse(message: string): Options['message'] {
  return {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message,
      details: [],
    },
  }
}

// ─── Base factory ─────────────────────────────────────────────────────────────
//
// To swap in a Redis store (e.g. when wiring up `rate-limit-redis`):
//   import { RedisStore } from 'rate-limit-redis'
//   import { redis } from '@/lib/redis'
//   pass `store: new RedisStore({ sendCommand: (...args) => redis.sendCommand(args) })`
// All limiters below share this factory so the store swap is a one-liner.

function makeLimiter(opts: Partial<Options>): RateLimitRequestHandler {
  return rateLimit({
    standardHeaders: true, // Return RateLimit-* headers (RFC 6585)
    legacyHeaders: false,
    ...opts,
  })
}

// ─── Tiered limiters ──────────────────────────────────────────────────────────

/**
 * Global catch-all — applied to every request.
 * Permissive; per-route limiters below tighten specific surfaces.
 */
export const globalLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000, // 15 min
  limit: 500,
  message: limitedResponse('Too many requests, please try again later'),
})

/**
 * Auth endpoints — general catch-all for auth routes.
 * Tighter limiters below override this for sensitive operations.
 */
export const authLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000, // 15 min
  limit: 20,
  message: limitedResponse('Too many authentication attempts, please try again later'),
})

/**
 * Login — per-IP brute force protection.
 * 5 failed attempts per 15 min should be enough for any legitimate user.
 */
export const loginLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000, // 15 min
  limit: 5,
  skipSuccessfulRequests: true, // only count failures toward the limit
  message: limitedResponse(
    'Too many failed login attempts. Please wait 15 minutes before trying again.'
  ),
})

/**
 * Register — prevent account creation spam per IP.
 */
export const registerLimiter = makeLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5,
  message: limitedResponse('Too many accounts created from this IP. Please try again later.'),
})

/**
 * Password reset request — strict to prevent email flooding.
 */
export const passwordResetLimiter = makeLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 3,
  message: limitedResponse(
    'Too many password reset requests. Please wait an hour before trying again.'
  ),
})

/**
 * Resend verification email — prevent inbox spam.
 */
export const resendVerificationLimiter = makeLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 3,
  message: limitedResponse(
    'Too many verification email requests. Please wait an hour before trying again.'
  ),
})

/**
 * Write / mutation endpoints (cart, orders, reviews, wishlist).
 * Prevents abuse of state-changing operations.
 */
export const writeLimiter = makeLimiter({
  windowMs: 60 * 1000, // 1 min
  limit: 30,
  message: limitedResponse('Too many requests, please slow down'),
})

/**
 * Search / list endpoints — heavier DB work.
 * Prevents scraping and runaway pagination loops.
 */
export const searchLimiter = makeLimiter({
  windowMs: 60 * 1000, // 1 min
  limit: 60,
  message: limitedResponse('Too many search requests, please slow down'),
})

/**
 * Checkout / payment endpoints.
 * Very tight — financial operations.
 * Applied in Phase 5 when checkout is wired up.
 */
export const checkoutLimiter = makeLimiter({
  windowMs: 60 * 1000, // 1 min
  limit: 5,
  message: limitedResponse('Too many checkout attempts, please try again later'),
})
