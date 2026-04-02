'use client'

import * as React from 'react'
import { useRef } from 'react'
import { type CartStore, createCartStore } from './cart-store'
import type { CartItem } from './types'

// ─── Context ──────────────────────────────────────────────────────────────────

export const CartStoreContext = React.createContext<CartStore | null>(null)

interface CartProviderProps {
  children: React.ReactNode
  /** Server-fetched initial items — injected on first render to avoid hydration flash */
  initialItems?: CartItem[]
}

export function CartProvider({ children, initialItems }: CartProviderProps) {
  const storeRef = useRef<CartStore | null>(null)

  if (!storeRef.current) {
    storeRef.current = createCartStore(initialItems)
  }

  return <CartStoreContext.Provider value={storeRef.current}>{children}</CartStoreContext.Provider>
}
