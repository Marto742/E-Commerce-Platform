import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { env } from '@/config/env'
import router from '@/routes'
import { notFound } from '@/middleware/notFound'
import { errorHandler } from '@/middleware/error'

export function createApp() {
  const app = express()

  // Trust Railway/Vercel reverse proxy — required for rate limiting to work correctly
  app.set('trust proxy', 1)

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
    app.use(morgan('dev'))
  }

  // ── Global rate limit (permissive — tightened per route) ─
  // Auth endpoints: 10 req/15min (applied in Phase 3)
  // Checkout: 5 req/min (applied in Phase 5)
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests, please try again later',
        details: [],
      },
    },
  })
  app.use(globalLimiter)

  // ── API routes (all under /v1) ───────────────────────────
  app.use('/v1', router)

  // ── 404 + global error handler (must be last) ───────────
  app.use(notFound)
  app.use(errorHandler)

  return app
}
