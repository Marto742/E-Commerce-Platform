import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12

/**
 * Hashes a plain-text password using bcrypt.
 */
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

/**
 * Compares a plain-text password against a bcrypt hash.
 * Always runs the full bcrypt comparison to prevent timing attacks.
 */
export function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

/**
 * Performs a dummy bcrypt hash to consume constant time when a user is not
 * found. Prevents timing-based email enumeration.
 */
export function dummyHash(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS)
}
