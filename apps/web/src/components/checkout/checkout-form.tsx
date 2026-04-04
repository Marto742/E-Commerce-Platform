'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { ChevronRight, Tag, X } from 'lucide-react'
import { cn } from '@repo/ui'
import { useCart } from '@/store/cart'
import { api } from '@/lib/api-client'
import { AddressForm } from './address-form'
import { OrderSummary } from './order-summary'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddressFields {
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

interface CheckoutFormValues {
  shippingAddress: AddressFields
  sameAsBilling: boolean
  billingAddress: AddressFields
}

interface PaymentIntentResponse {
  data: {
    clientSecret: string
    orderId: string
    amount: number
    currency: string
    breakdown: {
      subtotal: number
      shipping: number
      tax: number
      discount: number
      total: number
    }
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CheckoutForm() {
  const router = useRouter()
  const { items } = useCart()
  const [couponInput, setCouponInput] = useState('')
  const [couponCode, setCouponCode] = useState<string | undefined>(undefined)
  const [couponError, setCouponError] = useState('')
  const [serverError, setServerError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    defaultValues: {
      sameAsBilling: true,
      shippingAddress: { country: 'US' },
      billingAddress: { country: 'US' },
    },
  })

  const sameAsBilling = watch('sameAsBilling')

  function applyCoupon() {
    setCouponError('')
    const trimmed = couponInput.trim().toUpperCase()
    if (!trimmed) return
    setCouponCode(trimmed)
    setCouponInput('')
  }

  function removeCoupon() {
    setCouponCode(undefined)
    setCouponError('')
  }

  async function onSubmit(values: CheckoutFormValues) {
    setServerError('')
    setIsSubmitting(true)

    try {
      const payload = {
        items: items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        shippingAddress: values.shippingAddress,
        billingAddress: values.sameAsBilling ? undefined : values.billingAddress,
        couponCode,
      }

      const res = await api.post<PaymentIntentResponse>('/payments/intent', payload)
      const { clientSecret, orderId } = res.data

      router.push(
        `/checkout/payment?clientSecret=${encodeURIComponent(clientSecret)}&orderId=${orderId}`
      )
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      if (message.includes('COUPON')) {
        setCouponError(message)
        setCouponCode(undefined)
      } else {
        setServerError(message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-medium">Your cart is empty.</p>
        <a href="/products" className="mt-4 text-sm text-primary underline">
          Browse products
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* ── Left column ── */}
        <div className="space-y-8">
          {/* Shipping */}
          <section className="rounded-lg border bg-card p-6">
            <h2 className="mb-5 text-base font-semibold">Shipping address</h2>
            <AddressForm
              prefix="shippingAddress"
              register={register}
              errors={errors}
              watch={watch}
              required
              disabled={isSubmitting}
            />
          </section>

          {/* Billing */}
          <section className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Billing address</h2>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground select-none">
                <input
                  type="checkbox"
                  {...register('sameAsBilling')}
                  disabled={isSubmitting}
                  className="size-4 rounded border-input accent-primary"
                />
                Same as shipping
              </label>
            </div>

            {!sameAsBilling && (
              <div className="mt-5">
                <AddressForm
                  prefix="billingAddress"
                  register={register}
                  errors={errors}
                  watch={watch}
                  required
                  disabled={isSubmitting}
                />
              </div>
            )}
          </section>

          {/* Coupon */}
          <section className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-base font-semibold">Discount code</h2>

            {couponCode ? (
              <div className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <Tag className="size-4 shrink-0" />
                <span className="flex-1 font-medium">{couponCode} applied</span>
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400"
                  aria-label="Remove coupon"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyCoupon())}
                  placeholder="Enter coupon code"
                  disabled={isSubmitting}
                  className={cn(
                    'h-10 flex-1 rounded-md border bg-background px-3 text-sm placeholder:text-muted-foreground',
                    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    couponError && 'border-destructive'
                  )}
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={isSubmitting || !couponInput.trim()}
                  className="h-10 rounded-md border px-4 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
            )}

            {couponError && <p className="mt-2 text-xs text-destructive">{couponError}</p>}
          </section>

          {serverError && (
            <p className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              'inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-8 text-base font-medium text-primary-foreground shadow',
              'transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'disabled:cursor-not-allowed disabled:opacity-60'
            )}
          >
            {isSubmitting ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                Processing…
              </>
            ) : (
              <>
                Continue to payment
                <ChevronRight className="size-4" />
              </>
            )}
          </button>
        </div>

        {/* ── Right column ── */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <OrderSummary />
        </div>
      </div>
    </form>
  )
}
