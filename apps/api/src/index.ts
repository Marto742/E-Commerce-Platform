import 'dotenv/config'
import './instrument'
import { createApp } from './app'
import { env } from './config/env'
import { prisma } from './lib/prisma'
import { connectRedis, disconnectRedis } from './lib/redis'
import { setupSearchSchema } from './lib/search-schema'

const app = createApp()

const server = app.listen(env.PORT, () => {
  console.log(`\n🚀  API server started`)
  console.log(`   URL:         http://localhost:${env.PORT}/v1`)
  console.log(`   Health:      http://localhost:${env.PORT}/v1/health`)
  console.log(`   Environment: ${env.NODE_ENV}\n`)

  setupSearchSchema().catch((err) => {
    console.error('[search] Failed to configure Meilisearch schema:', err)
  })
})

// Connect Redis in the background — non-fatal so the server still boots if Redis
// is briefly unavailable (rate limiting falls back to in-memory until it recovers).
void connectRedis().catch((err) => {
  console.error(
    '[redis] initial connection failed — using in-memory rate limiting until recovery:',
    err
  )
})

// ─── Graceful shutdown ────────────────────────────────────────────────────────

async function shutdown(signal: string) {
  console.log(`\n${signal} received — shutting down gracefully...`)
  server.close(async () => {
    await Promise.allSettled([prisma.$disconnect(), disconnectRedis()])
    console.log('Server, database, and Redis connections closed.')
    process.exit(0)
  })
  // Force-exit if graceful shutdown stalls (e.g. keep-alive connections)
  setTimeout(() => process.exit(1), 10_000).unref()
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))

// ─── Process-level error guards ───────────────────────────────────────────────

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason)
  // Exit so the process manager (Docker, PM2, Railway) can restart cleanly
  process.exit(1)
})

process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err)
  process.exit(1)
})
