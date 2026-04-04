import { randomBytes } from 'crypto'

/**
 * Generates a human-readable tracking number in the format:
 *   TRK-XXXXXXXX  (e.g. TRK-A3F92C01)
 *
 * 8 uppercase hex characters from a cryptographically random source
 * gives ~4 billion possible values — sufficient for tracking IDs.
 */
export function generateTrackingNumber(): string {
  return `TRK-${randomBytes(4).toString('hex').toUpperCase()}`
}
