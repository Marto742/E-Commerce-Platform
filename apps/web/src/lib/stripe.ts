import { loadStripe, type Stripe } from '@stripe/stripe-js'

const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

if (!key) {
  throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set')
}

let stripePromise: Promise<Stripe | null> | null = null

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = loadStripe(key!)
  }
  return stripePromise
}
