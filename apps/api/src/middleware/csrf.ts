import type { RequestHandler } from 'express'
import { AppError } from '@/utils/AppError'

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

/**
 * Defense-in-depth CSRF protection for the REST API.
 *
 * The primary protection is Bearer-token auth (browsers cannot auto-include
 * Authorization headers in cross-origin requests). This middleware adds two
 * secondary layers for state-mutating requests:
 *
 *   1. Require `Content-Type: application/json` — blocks classic HTML form
 *      submissions and <img>/<script> injection which cannot set this header.
 *
 *   2. Require `X-Requested-With: XMLHttpRequest` — a custom header browsers
 *      block for cross-origin requests without an explicit CORS preflight.
 *
 * The Stripe webhook endpoint is excluded (it uses raw body + signature).
 */
export const csrfProtection: RequestHandler = (req, _res, next) => {
  // Skip entirely in test environment — route tests verify business logic,
  // not infrastructure-level security headers.
  if (process.env.NODE_ENV === 'test') return next()

  if (!MUTATION_METHODS.has(req.method)) return next()

  // Skip Stripe webhook — it uses raw body and its own signature verification
  if (req.path === '/v1/payments/webhook') return next()

  const contentType = req.headers['content-type'] ?? ''
  if (!contentType.includes('application/json')) {
    return next(AppError.badRequest('Content-Type must be application/json'))
  }

  const xrw = req.headers['x-requested-with']
  if (xrw !== 'XMLHttpRequest') {
    return next(new AppError(403, 'FORBIDDEN', 'Missing X-Requested-With header'))
  }

  next()
}
