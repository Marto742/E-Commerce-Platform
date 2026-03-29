import type { RequestHandler } from 'express'
import { z } from 'zod'

type ValidateTarget = 'body' | 'params' | 'query'

/**
 * Validate request data against a Zod schema.
 * Throws a ZodError (caught by the global error handler) on failure.
 *
 * Usage:
 *   router.post('/login', validate(loginSchema), loginHandler)
 *   router.get('/:id', validate(idParamsSchema, 'params'), handler)
 */
export function validate(
  schema: z.ZodType,
  target: ValidateTarget = 'body'
): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req[target])
    if (!result.success) {
      return next(result.error)
    }
    // Replace req[target] with the parsed (and potentially transformed) data
    ;(req as unknown as Record<string, unknown>)[target] = result.data
    next()
  }
}
