'use client'

import { useContext, useEffect } from 'react'
import { CartStoreContext } from '@/store/cart/cart-provider'
import { useCartActions } from '@/store/cart/use-cart'
import type { CartVariant } from '@/store/cart/types'
import { fetchCart, apiAddItem, apiUpdateItem, apiRemoveItem, apiClearCart } from '@/lib/cart-api'

// ─── Initial cart load ────────────────────────────────────────────────────────

/**
 * Fetches the server cart once on mount and syncs it into the Zustand store.
 * Call this once at the app root (CartDrawerProvider or layout).
 */
export function useCartInit() {
  const { syncFromServer, setSyncing } = useCartActions()

  useEffect(() => {
    setSyncing(true)
    fetchCart()
      .then(syncFromServer)
      .catch(() => {
        // Server unavailable — local cart from localStorage remains active
      })
      .finally(() => setSyncing(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Returns cart action functions that:
 * 1. Update Zustand immediately (optimistic)
 * 2. Fire the corresponding API call in the background
 * 3. Replace optimistic state with the server's authoritative response
 * 4. Roll back to the pre-action snapshot on API error
 */
export function useCartMutations() {
  const store = useContext(CartStoreContext)
  const { addItem, removeItem, updateQuantity, clearCart, syncFromServer, setSyncing } =
    useCartActions()

  function snapshot() {
    return store?.getState().items ?? []
  }

  async function syncAddItem(variant: CartVariant, quantity = 1) {
    const prev = snapshot()
    addItem(variant, quantity)
    try {
      setSyncing(true)
      const items = await apiAddItem(variant.id, quantity)
      syncFromServer(items)
    } catch {
      syncFromServer(prev)
    } finally {
      setSyncing(false)
    }
  }

  async function syncRemoveItem(variantId: string) {
    const prev = snapshot()
    const item = snapshot().find((i) => i.variantId === variantId)
    removeItem(variantId)
    if (!item?.id || item.id.startsWith('optimistic-')) return
    try {
      setSyncing(true)
      const items = await apiRemoveItem(item.id)
      syncFromServer(items)
    } catch {
      syncFromServer(prev)
    } finally {
      setSyncing(false)
    }
  }

  async function syncUpdateQuantity(variantId: string, quantity: number) {
    if (quantity <= 0) {
      await syncRemoveItem(variantId)
      return
    }
    const prev = snapshot()
    const item = snapshot().find((i) => i.variantId === variantId)
    updateQuantity(variantId, quantity)
    if (!item?.id || item.id.startsWith('optimistic-')) return
    try {
      setSyncing(true)
      const items = await apiUpdateItem(item.id, quantity)
      syncFromServer(items)
    } catch {
      syncFromServer(prev)
    } finally {
      setSyncing(false)
    }
  }

  async function syncClearCart() {
    const prev = snapshot()
    clearCart()
    try {
      setSyncing(true)
      const items = await apiClearCart()
      syncFromServer(items)
    } catch {
      syncFromServer(prev)
    } finally {
      setSyncing(false)
    }
  }

  return {
    addItem: syncAddItem,
    removeItem: syncRemoveItem,
    updateQuantity: syncUpdateQuantity,
    clearCart: syncClearCart,
  }
}
