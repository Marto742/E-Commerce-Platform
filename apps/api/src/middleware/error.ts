import type { ErrorRequestHandler, Request } from 'express'
import { ZodError } from 'zod'
import { AppError } from '@/utils/AppError'
import { Prisma } from '@/generated/prisma/client'
import { env } from '@/config/env'
import { logger } from '@/lib/logger'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function errorLog(req: Request, statusCode: number, err: unknown) {
  const meta = {
    requestId: req.id,
    method: req.method,
    path: req.path,
    statusCode,
    error: err instanceof Error ? err.message : String(err),
    ...(env.NODE_ENV !== 'production' && err instanceof Error && { stack: err.stack }),
  }

  if (statusCode >= 500) {
    logger.error('Request error', meta)
  } else if (env.NODE_ENV === 'development') {
    logger.warn('Request warning', meta)
  }
}

function buildResponse(
  code: string,
  message: string,
  details: unknown[] = [],
  req?: Request,
  err?: unknown
) {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      requestId: req?.id,
      // Surface stack in development only — never in production
      ...(env.NODE_ENV === 'development' &&
        err instanceof Error && { stack: err.stack?.split('\n').slice(0, 8) }),
    },
  }
}

// ─── Prisma error → HTTP status map ──────────────────────────────────────────

const PRISMA_CODE_MAP: Record<string, { status: number; code: string; message: string }> = {
  P2002: { status: 409, code: 'CONFLICT', message: 'A record with this value already exists' },
  P2025: { status: 404, code: 'RESOURCE_NOT_FOUND', message: 'Record not found' },
  P2003: { status: 422, code: 'VALIDATION_ERROR', message: 'Related record does not exist' },
  P2000: { status: 422, code: 'VALIDATION_ERROR', message: 'Input value is too long' },
  P2011: { status: 422, code: 'VALIDATION_ERROR', message: 'A required field is missing a value' },
  P2014: { status: 422, code: 'VALIDATION_ERROR', message: 'Change violates a required relation' },
}

// ─── Global error handler ─────────────────────────────────────────────────────

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  // ── Zod validation errors ──────────────────────────────
  if (err instanceof ZodError) {
    errorLog(req, 422, err)
    return res
      .status(422)
      .json(
        buildResponse(
          'VALIDATION_ERROR',
          'Validation failed',
          [err.flatten().fieldErrors],
          req,
          err
        )
      )
  }

  // ── Malformed JSON body (thrown by express.json parser) ─
  if (
    err instanceof SyntaxError &&
    'status' in err &&
    (err as { status?: number }).status === 400
  ) {
    errorLog(req, 400, err)
    return res
      .status(400)
      .json(buildResponse('VALIDATION_ERROR', 'Malformed JSON in request body', [], req, err))
  }

  // ── Known Prisma errors ────────────────────────────────
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = PRISMA_CODE_MAP[err.code]
    const status = mapped?.status ?? 500
    const errCode = mapped?.code ?? 'INTERNAL_ERROR'
    const message = mapped?.message ?? `Database error (${err.code})`
    const details = err.meta && typeof err.meta === 'object' ? [err.meta] : []
    errorLog(req, status, err)
    return res.status(status).json(buildResponse(errCode, message, details, req, err))
  }

  // ── Prisma validation errors (malformed query args) ────
  if (err instanceof Prisma.PrismaClientValidationError) {
    errorLog(req, 422, err)
    return res
      .status(422)
      .json(buildResponse('VALIDATION_ERROR', 'Invalid database query', [], req, err))
  }

  // ── Prisma connection / initialisation errors ──────────
  if (err instanceof Prisma.PrismaClientInitializationError) {
    errorLog(req, 503, err)
    return res
      .status(503)
      .json(buildResponse('INTERNAL_ERROR', 'Database connection unavailable', [], req, err))
  }

  // ── Known application errors ───────────────────────────
  if (err instanceof AppError) {
    errorLog(req, err.statusCode, err)
    return res.status(err.statusCode).json(buildResponse(err.code, err.message, [], req, err))
  }

  // ── Unknown / unexpected errors — never leak internals ─
  errorLog(req, 500, err)
  return res
    .status(500)
    .json(buildResponse('INTERNAL_ERROR', 'An unexpected error occurred', [], req, err))
}
