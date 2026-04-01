import express, { type Application } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { env } from '@/config/env'
import router from '@/routes'
import { notFound } from '@/middleware/notFound'
import { errorHandler } from '@/middleware/error'
import { requestId } from '@/middleware/requestId'
import { requestLogger } from '@/middleware/requestLogger'
import { globalLimiter } from '@/middleware/rateLimiter'

export function createApp(): Application {
  const app = express()

  // Trust Railway/Vercel reverse proxy — required for rate limiting to work correctly
  app.set('trust proxy', 1)

  // ── Request ID (first — all subsequent middleware can use req.id) ─
  app.use(requestId)

  // ── Security headers ────────────────────────────────────
  app.use(helmet())

  // ── CORS ────────────────────────────────────────────────
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  )

  // ── Body parsing ────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true }))

  // ── HTTP request logging (skip in test) ─────────────────
  if (env.NODE_ENV !== 'test') {
    app.use(requestLogger)
  }

  // ── Global rate limit (permissive — tightened per route) ─
  // authLimiter:     10 req/15min  → applied in Phase 3 on /auth routes
  // writeLimiter:    30 req/min    → applied on cart, orders, reviews, wishlist
  // checkoutLimiter:  5 req/min   → applied in Phase 5 on /checkout routes
  app.use(globalLimiter)

  // ── API routes (all under /v1) ───────────────────────────
  app.use('/v1', router)

  // ── 404 + global error handler (must be last) ───────────
  app.use(notFound)
  app.use(errorHandler)

  return app
}
