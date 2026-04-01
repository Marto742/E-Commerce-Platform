import morgan, { type StreamOptions } from 'morgan'
import type { Request } from 'express'
import { env } from '@/config/env'
import { logger } from '@/lib/logger'

// Register a custom token that pulls req.id (set by requestId middleware)
morgan.token('request-id', (req) => (req as Request).id ?? '-')

// Stream morgan output through the structured logger
const stream: StreamOptions = {
  write: (message: string) => {
    logger.info(message.trimEnd(), { source: 'http' })
  },
}

// Development: human-readable coloured format
// Production: structured JSON-friendly format including requestId
const format =
  env.NODE_ENV === 'production'
    ? ':request-id :method :url :status :res[content-length] - :response-time ms'
    : ':request-id :method :url :status :response-time ms'

export const requestLogger = morgan(format, {
  stream,
  // Skip successful health-check noise in production
  skip: (req, res) =>
    env.NODE_ENV === 'production' && (req as Request).path === '/v1/health' && res.statusCode < 400,
})
