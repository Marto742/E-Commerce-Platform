'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle2, Package, MapPin, Receipt, ArrowRight } from 'lucide-react'
import { loadOrderSnapshot, clearOrderSnapshot, type OrderSnapshot } from '@/lib/order-snapshot'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

// ─── Sub-sections ─────────────────────────────────────────────────────────────

function ItemsSection({ snapshot }: { snapshot: OrderSnapshot }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        <Package className="size-4" />
        Items ordered
      </h2>
      <ul className="divide-y">
        {snapshot.items.map((item, i) => (
          <li key={i} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-md border bg-muted">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xl">📦</div>
              )}
            </div>
            <div className="flex flex-1 justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.variantName}</p>
                <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
              </div>
              <p className="shrink-0 text-sm font-semibold">
                {fmt(item.unitPrice * item.quantity)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function BreakdownSection({ snapshot }: { snapshot: OrderSnapshot }) {
  const { breakdown, couponCode } = snapshot
  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        <Receipt className="size-4" />
        Order total
      </h2>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>{fmt(breakdown.subtotal)}</span>
        </div>
        {breakdown.discount > 0 && (
          <div className="flex justify-between text-emerald-600">
            <span>Discount{couponCode ? ` (${couponCode})` : ''}</span>
            <span>-{fmt(breakdown.discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-muted-foreground">
          <span>Shipping</span>
          <span>{fmt(breakdown.shipping)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Tax</span>
          <span>{fmt(breakdown.tax)}</span>
        </div>
        <div className="flex justify-between border-t pt-2 text-base font-bold text-foreground">
          <span>Total paid</span>
          <span>{fmt(breakdown.total)}</span>
        </div>
      </div>
    </div>
  )
}

function AddressSection({ snapshot }: { snapshot: OrderSnapshot }) {
  const a = snapshot.shippingAddress
  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        <MapPin className="size-4" />
        Shipping to
      </h2>
      <address className="not-italic text-sm text-foreground leading-relaxed">
        <p>{a.line1}</p>
        {a.line2 && <p>{a.line2}</p>}
        <p>
          {a.city}, {a.state} {a.postalCode}
        </p>
        <p>{a.country}</p>
      </address>
    </div>
  )
}

function NextStepsSection() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        What happens next
      </h2>
      <ol className="space-y-3 text-sm text-muted-foreground">
        {[
          'Your order is confirmed and payment received.',
          "We'll pick, pack, and dispatch your items.",
          "You'll receive a shipping notification with tracking info.",
          'Delivery typically takes 3–5 business days.',
        ].map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface OrderConfirmationProps {
  orderId: string
}

export function OrderConfirmation({ orderId }: OrderConfirmationProps) {
  const [snapshot, setSnapshot] = useState<OrderSnapshot | null>(null)

  useEffect(() => {
    const data = loadOrderSnapshot(orderId)
    setSnapshot(data)
    clearOrderSnapshot()
  }, [orderId])

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="mb-4 flex justify-center">
          <CheckCircle2 className="size-16 text-emerald-500" />
        </div>
        <h1 className="mb-2 text-2xl font-bold tracking-tight">Order confirmed!</h1>
        <p className="text-muted-foreground">
          Thank you for your purchase. A confirmation email is on its way.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Order ID: <span className="font-mono font-semibold text-foreground">{orderId}</span>
        </p>
      </div>

      {/* Detail sections */}
      <div className="space-y-4">
        {snapshot ? (
          <>
            <ItemsSection snapshot={snapshot} />
            <div className="grid gap-4 sm:grid-cols-2">
              <BreakdownSection snapshot={snapshot} />
              <AddressSection snapshot={snapshot} />
            </div>
          </>
        ) : (
          <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
            Sign in to view full order details.
          </div>
        )}

        <NextStepsSection />
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/products"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          Continue shopping
          <ArrowRight className="size-4" />
        </Link>
        <Link
          href={`/orders/${orderId}`}
          className="inline-flex h-10 items-center justify-center rounded-md border px-6 text-sm font-medium transition-colors hover:bg-accent"
        >
          View order
        </Link>
      </div>
    </main>
  )
}
