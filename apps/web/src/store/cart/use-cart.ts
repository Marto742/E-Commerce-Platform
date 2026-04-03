'use client'

import { useContext } from 'react'
import { useStore } from 'zustand'
import { useShallow } from 'zustand/shallow'
import { CartStoreContext } from './cart-provider'
import type { CartState, CartTotals } from './types'

// ─── Base hook ────────────────────────────────────────────────────────────────

function useCartStore<T>(selector: (state: CartState) => T): T {
  const store = useContext(CartStoreContext)
  if (!store) {
    throw new Error('useCart must be used inside <CartProvider>')
  }
  return useStore(store, selector)
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Access the full cart state and all actions. */
export function useCart() {
  return useCartStore((state) => state)
}

/** Number of distinct line items in the cart. */
export function useCartLineCount() {
  return useCartStore((state) => state.items.length)
}

/** Total number of units across all lines (shown in cart badge). */
export function useCartItemCount() {
  return useCartStore((state) => state.items.reduce((acc, item) => acc + item.quantity, 0))
}

/** Whether a specific variant is in the cart. */
export function useIsInCart(variantId: string) {
  return useCartStore((state) => state.items.some((item) => item.variantId === variantId))
}

/** Quantity of a specific variant in the cart (0 if not present). */
export function useCartItemQuantity(variantId: string) {
  return useCartStore(
    (state) => state.items.find((item) => item.variantId === variantId)?.quantity ?? 0
  )
}

/** Derived price totals for the cart summary / checkout. */
export function useCartTotals(): CartTotals {
  return useCartStore(
    useShallow((state) => {
      let subtotal = 0
      let savings = 0

      for (const item of state.items) {
        const unitPrice = parseFloat(item.variant.price)
        const comparePrice = item.variant.product.comparePrice
          ? parseFloat(item.variant.product.comparePrice)
          : null

        subtotal += unitPrice * item.quantity

        if (comparePrice !== null && comparePrice > unitPrice) {
          savings += (comparePrice - unitPrice) * item.quantity
        }
      }

      return {
        subtotal,
        savings,
        itemCount: state.items.reduce((acc, item) => acc + item.quantity, 0),
        lineCount: state.items.length,
      }
    })
  )
}

/** Just the cart actions — stable reference, won't cause re-renders on item changes. */
export function useCartActions() {
  return useCartStore(
    useShallow((state) => ({
      addItem: state.addItem,
      removeItem: state.removeItem,
      updateQuantity: state.updateQuantity,
      clearCart: state.clearCart,
      syncFromServer: state.syncFromServer,
      setSyncing: state.setSyncing,
    }))
  )
}
