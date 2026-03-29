import 'dotenv/config'
import { createApp } from './app'
import { env } from './config/env'

const app = createApp()

const server = app.listen(env.PORT, () => {
  console.log(`\n🚀  API server started`)
  console.log(`   URL:         http://localhost:${env.PORT}/v1`)
  console.log(`   Health:      http://localhost:${env.PORT}/v1/health`)
  console.log(`   Environment: ${env.NODE_ENV}\n`)
})

// Graceful shutdown — closes existing connections before exiting
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...')
  server.close(() => {
    console.log('Server closed.')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  server.close(() => process.exit(0))
})
