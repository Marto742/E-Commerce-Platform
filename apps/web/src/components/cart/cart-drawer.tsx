'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X, Trash2, ShoppingBag } from 'lucide-react'
import { cn } from '@repo/ui'
import { useCart, useCartTotals } from '@/store/cart'
import { useCartMutations } from '@/hooks/use-cart-mutations'
import { QuantityPicker } from '@/components/ui/quantity-picker'
import { useCartDrawer } from './cart-drawer-context'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

// ─── Cart item row ────────────────────────────────────────────────────────────

function CartItemRow({ item }: { item: ReturnType<typeof useCart>['items'][number] }) {
  const { removeItem, updateQuantity } = useCartMutations()
  const unitPrice = parseFloat(item.variant.price)
  const lineTotal = unitPrice * item.quantity

  return (
    <li className="flex gap-3 py-4">
      {/* Thumbnail */}
      <div className="relative size-20 shrink-0 overflow-hidden rounded-md border bg-muted">
        {item.variant.product.imageUrl ? (
          <Image
            src={item.variant.product.imageUrl}
            alt={item.variant.product.name}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl">📦</div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/products/${item.variant.product.slug}`}
            className="line-clamp-2 text-sm font-medium leading-snug text-foreground hover:underline"
          >
            {item.variant.product.name}
          </Link>
          <button
            onClick={() => removeItem(item.variantId)}
            className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
            aria-label="Remove item"
          >
            <Trash2 className="size-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground">{item.variant.name}</p>

        <div className="mt-auto flex items-center justify-between pt-1">
          <QuantityPicker
            value={item.quantity}
            min={1}
            max={item.variant.stock}
            size="sm"
            debounce={400}
            onChange={(qty) =>
              qty <= 0 ? removeItem(item.variantId) : updateQuantity(item.variantId, qty)
            }
          />
          <span className="text-sm font-semibold text-foreground">{fmt(lineTotal)}</span>
        </div>
      </div>
    </li>
  )
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

export function CartDrawer() {
  const { isOpen, close } = useCartDrawer()
  const { items } = useCart()
  const { subtotal, savings, itemCount } = useCartTotals()
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, close])

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={close}
        className={cn(
          'fixed inset-0 z-40 bg-background/60 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-background shadow-2xl transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-4">
          <h2 className="text-base font-semibold">
            Shopping Cart
            {itemCount > 0 && (
              <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {itemCount}
              </span>
            )}
          </h2>
          <button
            onClick={close}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close cart"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Item list */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
            <ShoppingBag className="size-12 text-muted-foreground/40" />
            <p className="font-medium text-foreground">Your cart is empty</p>
            <p className="text-sm text-muted-foreground">Add items to get started.</p>
            <Link
              href="/products"
              onClick={close}
              className="inline-flex h-8 items-center justify-center rounded-md border px-3 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Browse products
            </Link>
          </div>
        ) : (
          <ul className="flex-1 divide-y overflow-y-auto px-4">
            {items.map((item) => (
              <CartItemRow key={item.variantId} item={item} />
            ))}
          </ul>
        )}

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t px-4 py-4 space-y-3">
            {savings > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>You save</span>
                <span className="font-medium">-{fmt(savings)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold text-foreground">{fmt(subtotal)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Shipping and taxes calculated at checkout.
            </p>
            <Link
              href="/checkout"
              onClick={close}
              className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-8 text-base font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              Proceed to checkout
            </Link>
            <Link
              href="/products"
              onClick={close}
              className="inline-flex h-10 w-full items-center justify-center rounded-md border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Continue shopping
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
