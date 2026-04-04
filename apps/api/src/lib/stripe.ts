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

if (!env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required for payment features')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports
const stripeFactory: any = require('stripe')

export const stripe: StripeClient = stripeFactory(env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-03-25.dahlia',
  typescript: true,
})
