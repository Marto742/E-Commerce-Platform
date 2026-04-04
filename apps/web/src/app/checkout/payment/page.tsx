import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { StripeElementsProvider } from '@/components/checkout/stripe-elements-provider'
import { PaymentForm } from '@/components/checkout/payment-form'

export const metadata: Metadata = {
  title: 'Payment',
  robots: { index: false, follow: false },
}

interface PaymentPageProps {
  searchParams: Promise<{ clientSecret?: string; orderId?: string }>
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export default async function PaymentPage({ searchParams }: PaymentPageProps) {
  const { clientSecret, orderId } = await searchParams

  if (!clientSecret || !orderId) {
    redirect('/checkout')
  }

  const returnUrl = `${APP_URL}/checkout/success`

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[{ label: 'Checkout', href: '/checkout' }, { label: 'Payment' }]}
        className="mb-6"
      />

      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Payment</h1>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <ShieldCheck className="size-4 text-emerald-500" />
          Secure checkout
        </div>
      </div>

      <StripeElementsProvider clientSecret={clientSecret}>
        <PaymentForm orderId={orderId} returnUrl={returnUrl} />
      </StripeElementsProvider>
    </main>
  )
}
