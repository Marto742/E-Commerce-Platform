// ─── Domain types ─────────────────────────────────────────────────────────────
// These mirror the shapes returned by the API (cart item with variant + product
// data included). Keep in sync with the API response types when they're generated.

export interface CartProduct {
  id: string
  name: string
  slug: string
  basePrice: string
  comparePrice: string | null
  imageUrl: string | null
}

export interface CartVariant {
  id: string
  sku: string
  name: string
  price: string
  stock: number
  attributes: Record<string, unknown>
  product: CartProduct
}

export interface CartItem {
  /** Cart item ID (from server, undefined for optimistic items) */
  id: string
  variantId: string
  quantity: number
  variant: CartVariant
}

// ─── Store shape ──────────────────────────────────────────────────────────────

export interface CartState {
  items: CartItem[]
  /** True while a server sync is in flight */
  isSyncing: boolean

  // ── Actions ──
  addItem: (variant: CartVariant, quantity?: number) => void
  removeItem: (variantId: string) => void
  updateQuantity: (variantId: string, quantity: number) => void
  clearCart: () => void
  /** Replaces local items with authoritative data from the server */
  syncFromServer: (items: CartItem[]) => void
  setSyncing: (value: boolean) => void
}

// ─── Derived helpers (used in useCart selectors) ──────────────────────────────

export interface CartTotals {
  subtotal: number
  savings: number
  itemCount: number
  lineCount: number
}
