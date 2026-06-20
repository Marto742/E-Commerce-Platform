/** Shared E2E helpers and known-seeded credentials. */

export const ADMIN_URL = process.env.E2E_ADMIN_URL ?? 'http://localhost:3001'

/** Seeded super-admin (apps/api/prisma/seed.ts). */
export const SEEDED_ADMIN = {
  email: 'admin@example.com',
  password: 'Admin123!',
}

/** A unique email per run so register flows don't collide across retries. */
export function uniqueEmail(prefix = 'e2e'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`
}

/** Stripe test cards (test mode only). */
export const STRIPE_TEST_CARDS = {
  success: '4242424242424242',
  declined: '4000000000000002',
}
