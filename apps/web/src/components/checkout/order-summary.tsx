'use client'

import Image from 'next/image'
import { useCart, useCartTotals } from '@/store/cart'

const SHIPPING = 5
const TAX_RATE = 0.08

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

interface OrderSummaryProps {
  couponDiscount?: number
}

export function OrderSummary({ couponDiscount = 0 }: OrderSummaryProps) {
  const { items } = useCart()
  const { subtotal } = useCartTotals()

  const discountedSubtotal = subtotal - couponDiscount
  const tax = discountedSubtotal * TAX_RATE
  const total = discountedSubtotal + SHIPPING + tax

  return (
    <div className="rounded-lg border bg-card p-6 space-y-6">
      <h2 className="text-base font-semibold">Order summary</h2>

      {/* Items */}
      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item.variantId} className="flex items-start gap-3">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-md border bg-muted">
              {item.variant.product.imageUrl ? (
                <Image
                  src={item.variant.product.imageUrl}
                  alt={item.variant.product.name}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xl">📦</div>
              )}
              <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-muted-foreground text-[10px] font-semibold text-background">
                {item.quantity}
              </span>
            </div>
            <div className="flex flex-1 justify-between gap-2 text-sm">
              <div>
                <p className="font-medium leading-snug">{item.variant.product.name}</p>
                <p className="text-xs text-muted-foreground">{item.variant.name}</p>
              </div>
              <p className="shrink-0 font-medium">
                {fmt(parseFloat(item.variant.price) * item.quantity)}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {/* Totals */}
      <div className="space-y-2 border-t pt-4 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>{fmt(subtotal)}</span>
        </div>

        {couponDiscount > 0 && (
          <div className="flex justify-between text-emerald-600">
            <span>Discount</span>
            <span>-{fmt(couponDiscount)}</span>
          </div>
        )}

        <div className="flex justify-between text-muted-foreground">
          <span>Shipping</span>
          <span>{fmt(SHIPPING)}</span>
        </div>

        <div className="flex justify-between text-muted-foreground">
          <span>Tax (8%)</span>
          <span>{fmt(tax)}</span>
        </div>

        <div className="flex justify-between border-t pt-2 text-base font-semibold text-foreground">
          <span>Total</span>
          <span>{fmt(total)}</span>
        </div>
      </div>
    </div>
  )
}
