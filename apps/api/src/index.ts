import 'dotenv/config'
import { createApp } from './app'
import { env } from './config/env'
import { prisma } from './lib/prisma'

const app = createApp()

const server = app.listen(env.PORT, () => {
  console.log(`\n🚀  API server started`)
  console.log(`   URL:         http://localhost:${env.PORT}/v1`)
  console.log(`   Health:      http://localhost:${env.PORT}/v1/health`)
  console.log(`   Environment: ${env.NODE_ENV}\n`)
})

// ─── Graceful shutdown ────────────────────────────────────────────────────────

async function shutdown(signal: string) {
  console.log(`\n${signal} received — shutting down gracefully...`)
  server.close(async () => {
    await prisma.$disconnect()
    console.log('Server and database connections closed.')
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
