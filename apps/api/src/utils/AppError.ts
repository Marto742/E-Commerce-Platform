export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RESOURCE_NOT_FOUND'
  | 'CONFLICT'
  | 'INSUFFICIENT_STOCK'
  | 'COUPON_INVALID'
  | 'PAYMENT_FAILED'
  | 'ACCOUNT_SUSPENDED'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'

export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: ErrorCode

  constructor(statusCode: number, code: ErrorCode, message: string) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
    Error.captureStackTrace(this, this.constructor)
  }

  // Shorthand factories
  static notFound(message = 'Resource not found') {
    return new AppError(404, 'RESOURCE_NOT_FOUND', message)
  }

  static unauthorized(message = 'Authentication required') {
    return new AppError(401, 'UNAUTHORIZED', message)
  }

  static forbidden(message = 'Insufficient permissions') {
    return new AppError(403, 'FORBIDDEN', message)
  }

  static conflict(message: string) {
    return new AppError(409, 'CONFLICT', message)
  }

  static badRequest(message: string) {
    return new AppError(422, 'VALIDATION_ERROR', message)
  }

  static insufficientStock(message = 'Insufficient stock') {
    return new AppError(422, 'INSUFFICIENT_STOCK', message)
  }

  static couponInvalid(message = 'Coupon is invalid or expired') {
    return new AppError(422, 'COUPON_INVALID', message)
  }

  static tooManyRequests(message = 'Too many requests, please try again later') {
    return new AppError(429, 'RATE_LIMITED', message)
  }

  static internal(message = 'An unexpected error occurred') {
    return new AppError(500, 'INTERNAL_ERROR', message)
  }
}
