import { env } from '../config/env'

// Minimal type surface — expand as needed when consuming specific APIs.
// We deliberately avoid importing from the `stripe` package types to prevent
// TypeScript from loading Stripe's enormous type graph (causes heap OOM on tsc).
export interface StripeClient {
  paymentIntents: {
    create: (params: Record<string, unknown>) => Promise<{
      id: string
      client_secret: string | null
    }>
    retrieve: (id: string) => Promise<{
      id: string
      status: string
      client_secret: string | null
    }>
  }
  webhooks: {
    constructEventAsync: (
      body: Buffer | string,
      sig: string,
      secret: string
    ) => Promise<{
      id: string
      type: string
      data: { object: unknown }
    }>
  }
}

// Instantiated lazily so the app boots even without a key (payments are optional
// until Stripe is configured). The missing-key error is thrown only when a payment
// feature is actually used, not at import time.
let _stripe: StripeClient | null = null

function getStripe(): StripeClient {
  if (_stripe) return _stripe
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is required for payment features')
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports
  const stripeFactory: any = require('stripe')
  const client: StripeClient = stripeFactory(env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-03-25.dahlia',
    typescript: true,
  })
  _stripe = client
  return client
}

// Proxy keeps the `stripe` import working for all consumers while deferring both
// construction and the missing-key error until the first property access.
export const stripe: StripeClient = new Proxy({} as StripeClient, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

export function isStripeConfigured(): boolean {
  return Boolean(env.STRIPE_SECRET_KEY)
}
