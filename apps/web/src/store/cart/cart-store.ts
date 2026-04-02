import { createStore } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CartItem, CartState, CartVariant } from './types'

// ─── Factory ──────────────────────────────────────────────────────────────────
// We use `createStore` (not `create`) so the store can be instantiated inside a
// React context — this is the Next.js App Router recommended pattern, which
// avoids sharing a single global store across server requests.

export type CartStore = ReturnType<typeof createCartStore>

export function createCartStore(initialItems: CartItem[] = []) {
  return createStore<CartState>()(
    persist(
      (set) => ({
        items: initialItems,
        isSyncing: false,

        addItem: (variant: CartVariant, quantity = 1) =>
          set((state) => {
            const existing = state.items.find((item) => item.variantId === variant.id)
            if (existing) {
              return {
                items: state.items.map((item) =>
                  item.variantId === variant.id
                    ? { ...item, quantity: item.quantity + quantity }
                    : item
                ),
              }
            }
            const optimisticItem: CartItem = {
              // Temporary ID until the server confirms; replaced by syncFromServer
              id: `optimistic-${variant.id}`,
              variantId: variant.id,
              quantity,
              variant,
            }
            return { items: [...state.items, optimisticItem] }
          }),

        removeItem: (variantId: string) =>
          set((state) => ({
            items: state.items.filter((item) => item.variantId !== variantId),
          })),

        updateQuantity: (variantId: string, quantity: number) =>
          set((state) => {
            if (quantity <= 0) {
              return {
                items: state.items.filter((item) => item.variantId !== variantId),
              }
            }
            return {
              items: state.items.map((item) =>
                item.variantId === variantId ? { ...item, quantity } : item
              ),
            }
          }),

        clearCart: () => set({ items: [] }),

        syncFromServer: (items: CartItem[]) => set({ items, isSyncing: false }),

        setSyncing: (value: boolean) => set({ isSyncing: value }),
      }),
      {
        name: 'cart-storage',
        storage: createJSONStorage(() => localStorage),
        // Only persist the items array — isSyncing is transient UI state
        partialize: (state) => ({ items: state.items }),
        // Bump version when CartItem shape changes to avoid stale cache bugs
        version: 1,
        migrate: (_state, _version) => ({ items: [] }),
      }
    )
  )
}
