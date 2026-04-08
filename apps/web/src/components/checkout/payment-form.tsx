'use client'

import { useState } from 'react'
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'
import { ShieldCheck, LockKeyhole } from 'lucide-react'
import { cn } from '@repo/ui'
import { loadOrderSnapshot } from '@/lib/order-snapshot'

interface PaymentFormProps {
  orderId: string
  returnUrl: string
}

export function PaymentForm({ orderId, returnUrl }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setError(null)
    setIsProcessing(true)

    // Billing address is collected on the checkout page — pass it through
    // since the Payment Element is configured with fields.billingDetails.address: 'never'
    const snapshot = loadOrderSnapshot(orderId)
    const address = snapshot?.shippingAddress

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${returnUrl}?orderId=${orderId}`,
        payment_method_data: {
          billing_details: {
            address: address
              ? {
                  line1: address.line1,
                  line2: address.line2 ?? '',
                  city: address.city,
                  state: address.state,
                  postal_code: address.postalCode,
                  country: address.country,
                }
              : undefined,
          },
        },
      },
    })

    // confirmPayment only returns here if there's an immediate error.
    // On success, Stripe redirects to return_url automatically.
    if (stripeError) {
      setError(stripeError.message ?? 'Payment failed. Please try again.')
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Stripe Payment Element */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-5 text-base font-semibold">Payment details</h2>
        <PaymentElement
          options={{
            layout: 'tabs',
            fields: {
              billingDetails: { address: 'never' },
            },
          }}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!stripe || !elements || isProcessing}
        className={cn(
          'inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-8 text-base font-medium text-primary-foreground shadow',
          'transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:cursor-not-allowed disabled:opacity-60'
        )}
      >
        {isProcessing ? (
          <>
            <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
            Processing payment…
          </>
        ) : (
          <>
            <LockKeyhole className="size-4" />
            Pay now
          </>
        )}
      </button>

      {/* Trust badge */}
      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5 text-emerald-500" />
        Payments are encrypted and processed securely by Stripe.
      </p>
    </form>
  )
}
