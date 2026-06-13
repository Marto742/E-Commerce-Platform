import { Router } from 'express'
import { sendSuccess } from '@/utils/response'
import { prisma } from '@/lib/prisma'
import { redis, isRedisReady } from '@/lib/redis'
import { meili } from '@/lib/meilisearch'

const router: Router = Router()

// Liveness — cheap, dependency-free. Used by Railway healthcheck + uptime monitors.
router.get('/', (_req, res) => {
  sendSuccess(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV ?? 'development',
  })
})

// Readiness — verifies downstream dependencies. Returns 503 if any are down so
// load balancers / orchestrators can pull the instance out of rotation.
router.get('/ready', async (_req, res) => {
  const [db, cache, search] = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    redis ? redis.ping() : Promise.resolve('skipped'),
    meili.health(),
  ])

  const checks = {
    database: db.status === 'fulfilled' ? 'ok' : 'down',
    redis: !redis ? 'skipped' : cache.status === 'fulfilled' && isRedisReady() ? 'ok' : 'down',
    search: search.status === 'fulfilled' ? 'ok' : 'down',
  }

  const healthy = checks.database === 'ok' && checks.redis !== 'down' && checks.search === 'ok'

  res.status(healthy ? 200 : 503).json({
    success: healthy,
    data: {
      status: healthy ? 'ready' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
    },
  })
})

export default router
