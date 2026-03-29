import type { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'
import { AppError } from '@/utils/AppError'

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // Zod validation errors (from validate() middleware or manual .parse() calls)
  if (err instanceof ZodError) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.flatten().fieldErrors,
      },
    })
  }

  // Known application errors (thrown via AppError or its factory methods)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: [],
      },
    })
  }

  // Unexpected errors — log the full stack, never expose internals
  console.error('[Unhandled Error]', err)

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      details: [],
    },
  })
}
