import {
  rateLimit,
  MemoryStore,
  type Options,
  type RateLimitRequestHandler,
  type Store,
  type IncrementResponse,
} from 'express-rate-limit'
import { RedisStore } from 'rate-limit-redis'
import { redis, isRedisReady } from '@/lib/redis'

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

// ─── Hybrid store ─────────────────────────────────────────────────────────────
//
// Uses Redis (shared across instances — correct behind a load balancer / multiple
// Railway replicas) whenever a Redis client is connected, and transparently falls
// back to an in-memory store when Redis is unavailable: local dev without Redis, a
// transient outage, or tests (where no client is created). Each limiter passes a
// distinct name so Redis keys don't collide across rate-limited surfaces.

class HybridStore implements Store {
  private memory = new MemoryStore()
  private redisStore?: RedisStore
  private readonly keyPrefix: string

  constructor(name: string) {
    this.keyPrefix = `rl:${name}:`
  }

  init(options: Options): void {
    this.memory.init(options)
    if (redis) {
      const client = redis
      this.redisStore = new RedisStore({
        prefix: this.keyPrefix,
        sendCommand: (...args: string[]) => client.sendCommand(args),
      })
      this.redisStore.init(options)
    }
  }

  private active(): Store {
    return this.redisStore && isRedisReady() ? this.redisStore : this.memory
  }

  increment(key: string): Promise<IncrementResponse> | IncrementResponse {
    return this.active().increment(key)
  }

  decrement(key: string): Promise<void> | void {
    return this.active().decrement(key)
  }

  resetKey(key: string): Promise<void> | void {
    return this.active().resetKey(key)
  }

  async resetAll(): Promise<void> {
    await this.memory.resetAll?.()
    // RedisStore (v4) doesn't implement resetAll; call it only if present.
    const redisStore = this.redisStore as { resetAll?: () => Promise<void> } | undefined
    await redisStore?.resetAll?.()
  }
}

// ─── Base factory ─────────────────────────────────────────────────────────────

function makeLimiter(name: string, opts: Partial<Options>): RateLimitRequestHandler {
  return rateLimit({
    standardHeaders: true, // Return RateLimit-* headers (RFC 6585)
    legacyHeaders: false,
    store: new HybridStore(name),
    ...opts,
  })
}

// ─── Tiered limiters ──────────────────────────────────────────────────────────

/**
 * Global catch-all — applied to every request.
 * Permissive; per-route limiters below tighten specific surfaces.
 */
export const globalLimiter = makeLimiter('global', {
  windowMs: 15 * 60 * 1000, // 15 min
  limit: 500,
  message: limitedResponse('Too many requests, please try again later'),
})

/**
 * Auth endpoints — general catch-all for auth routes.
 * Tighter limiters below override this for sensitive operations.
 */
export const authLimiter = makeLimiter('auth', {
  windowMs: 15 * 60 * 1000, // 15 min
  limit: 20,
  message: limitedResponse('Too many authentication attempts, please try again later'),
})

/**
 * Login — per-IP brute force protection.
 * 5 failed attempts per 15 min should be enough for any legitimate user.
 */
export const loginLimiter = makeLimiter('login', {
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
export const registerLimiter = makeLimiter('register', {
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5,
  message: limitedResponse('Too many accounts created from this IP. Please try again later.'),
})

/**
 * Password reset request — strict to prevent email flooding.
 */
export const passwordResetLimiter = makeLimiter('password-reset', {
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 3,
  message: limitedResponse(
    'Too many password reset requests. Please wait an hour before trying again.'
  ),
})

/**
 * Resend verification email — prevent inbox spam.
 */
export const resendVerificationLimiter = makeLimiter('resend-verification', {
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
export const writeLimiter = makeLimiter('write', {
  windowMs: 60 * 1000, // 1 min
  limit: 30,
  message: limitedResponse('Too many requests, please slow down'),
})

/**
 * Search / list endpoints — heavier DB work.
 * Prevents scraping and runaway pagination loops.
 */
export const searchLimiter = makeLimiter('search', {
  windowMs: 60 * 1000, // 1 min
  limit: 60,
  message: limitedResponse('Too many search requests, please slow down'),
})

/**
 * Checkout / payment endpoints.
 * Very tight — financial operations.
 * Applied in Phase 5 when checkout is wired up.
 */
export const checkoutLimiter = makeLimiter('checkout', {
  windowMs: 60 * 1000, // 1 min
  limit: 5,
  message: limitedResponse('Too many checkout attempts, please try again later'),
})
