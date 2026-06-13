import { createClient } from 'redis'
import { env } from '@/config/env'
import { logger } from '@/lib/logger'

/**
 * Shared Redis client (node-redis).
 *
 * Used as the backing store for rate limiting so counters are shared across API
 * instances behind a load balancer. The client is created lazily and is `null`
 * in the test environment (rate limiting falls back to an in-memory store there).
 *
 * Connection is non-blocking: the server boots even if Redis is briefly
 * unavailable, and the rate limiter degrades to in-memory until Redis recovers
 * (see `HybridStore` in middleware/rateLimiter.ts).
 */
let client: ReturnType<typeof createClient> | null = null

function getRedis(): ReturnType<typeof createClient> | null {
  if (env.NODE_ENV === 'test') return null
  if (!client) {
    client = createClient({
      url: env.REDIS_URL,
      socket: {
        // Exponential-ish backoff, capped at 3s between attempts.
        reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
      },
    })
    client.on('error', (err: Error) => logger.error('[redis] client error', { error: err.message }))
    client.on('ready', () => logger.info('[redis] ready'))
  }
  return client
}

export const redis = getRedis()

export async function connectRedis(): Promise<void> {
  if (redis && !redis.isOpen) {
    await redis.connect()
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redis?.isOpen) {
    await redis.quit()
  }
}

export function isRedisReady(): boolean {
  return redis?.isReady ?? false
}
