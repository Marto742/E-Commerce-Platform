import { env } from '../config/env'
import type { Stripe as StripeType } from 'stripe/cjs/stripe.core.js'

// stripe v22 exports a callable constructor via `export =`, not a class.
// With module:commonjs + esModuleInterop, use `import =` to get the raw export.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const stripeFactory = require('stripe') as (
  key: string,
  config?: Record<string, unknown>
) => StripeType

if (!env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required for payment features')
}

export const stripe = stripeFactory(env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-03-25.dahlia',
  typescript: true,
})

export type { StripeType as Stripe }
