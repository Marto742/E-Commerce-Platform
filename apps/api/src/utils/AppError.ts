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
}
