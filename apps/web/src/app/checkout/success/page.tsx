import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Order Confirmation',
  robots: { index: false, follow: false },
}

interface SuccessPageProps {
  searchParams: Promise<{
    orderId?: string
    redirect_status?: string
    payment_intent?: string
  }>
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const { orderId, redirect_status } = await searchParams

  if (!orderId) {
    redirect('/')
  }

  const status = redirect_status ?? 'succeeded'

  if (status === 'succeeded') {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <div className="mb-6 flex justify-center">
          <CheckCircle2 className="size-20 text-emerald-500" />
        </div>
        <h1 className="mb-3 text-2xl font-bold tracking-tight">Order confirmed!</h1>
        <p className="mb-2 text-muted-foreground">
          Thank you for your purchase. Your payment was successful.
        </p>
        <p className="mb-8 text-sm text-muted-foreground">
          Order ID: <span className="font-mono font-medium text-foreground">{orderId}</span>
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={`/orders/${orderId}`}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            View order
          </Link>
          <Link
            href="/products"
            className="inline-flex h-10 items-center justify-center rounded-md border px-6 text-sm font-medium transition-colors hover:bg-accent"
          >
            Continue shopping
          </Link>
        </div>
      </main>
    )
  }

  if (status === 'processing') {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <div className="mb-6 flex justify-center">
          <Clock className="size-20 text-amber-500" />
        </div>
        <h1 className="mb-3 text-2xl font-bold tracking-tight">Payment processing</h1>
        <p className="mb-8 text-muted-foreground">
          Your payment is being processed. We&apos;ll send you a confirmation email shortly.
        </p>
        <p className="mb-8 text-sm text-muted-foreground">
          Order ID: <span className="font-mono font-medium text-foreground">{orderId}</span>
        </p>
        <Link
          href="/products"
          className="inline-flex h-10 items-center justify-center rounded-md border px-6 text-sm font-medium transition-colors hover:bg-accent"
        >
          Continue shopping
        </Link>
      </main>
    )
  }

  // requires_payment_method or any failure
  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
      <div className="mb-6 flex justify-center">
        <XCircle className="size-20 text-destructive" />
      </div>
      <h1 className="mb-3 text-2xl font-bold tracking-tight">Payment failed</h1>
      <p className="mb-8 text-muted-foreground">
        Something went wrong with your payment. Please try again.
      </p>
      <Link
        href="/checkout"
        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
      >
        Try again
      </Link>
    </main>
  )
}
