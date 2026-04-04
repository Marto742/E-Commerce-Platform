'use client'

import { Elements } from '@stripe/react-stripe-js'
import { getStripe } from '@/lib/stripe'

interface StripeElementsProviderProps {
  clientSecret: string
  children: React.ReactNode
}

export function StripeElementsProvider({ clientSecret, children }: StripeElementsProviderProps) {
  return (
    <Elements
      stripe={getStripe()}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            borderRadius: '6px',
            fontFamily: 'inherit',
          },
        },
      }}
    >
      {children}
    </Elements>
  )
}
