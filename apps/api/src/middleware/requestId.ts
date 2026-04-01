import { randomUUID } from 'crypto'
import type { RequestHandler } from 'express'

/**
 * Assigns a unique request ID to every incoming request.
 * Reuses the client-supplied X-Request-Id header when present,
 * otherwise generates a fresh UUID v4.
 *
 * The ID is stored on req.id and echoed back in the response header
 * so clients and logs can correlate requests to error responses.
 */
export const requestId: RequestHandler = (req, res, next) => {
  const id = (req.headers['x-request-id'] as string | undefined) ?? randomUUID()
  req.id = id
  res.setHeader('X-Request-Id', id)
  next()
}
