import type { Metadata } from 'next'
import { ShieldCheck } from 'lucide-react'
import { CheckoutForm } from '@/components/checkout/checkout-form'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'

export const metadata: Metadata = {
  title: 'Checkout',
  robots: { index: false, follow: false },
}

export default function CheckoutPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: 'Checkout' }]} className="mb-6" />

      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Checkout</h1>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <ShieldCheck className="size-4 text-emerald-500" />
          Secure checkout
        </div>
      </div>

      <CheckoutForm />
    </main>
  )
}
