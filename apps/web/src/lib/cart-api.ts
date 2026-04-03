import { api } from './api-client'
import { getSessionId } from './session'
import type { ServerCart } from '@/types/api'
import type { CartItem } from '@/store/cart/types'

// ─── Headers ──────────────────────────────────────────────────────────────────

function cartHeaders(): Record<string, string> {
  const sessionId = getSessionId()
  return sessionId ? { 'X-Session-ID': sessionId } : {}
}

// ─── Response mapper ──────────────────────────────────────────────────────────

export function mapServerCart(cart: ServerCart): CartItem[] {
  return cart.items.map((item) => ({
    id: item.id,
    variantId: item.variantId,
    quantity: item.quantity,
    variant: {
      id: item.variant.id,
      sku: item.variant.sku,
      name: item.variant.name,
      price: String(item.variant.price),
      stock: item.variant.stock,
      attributes: item.variant.attributes,
      product: {
        id: item.variant.product.id,
        name: item.variant.product.name,
        slug: item.variant.product.slug,
        basePrice: String(item.variant.product.basePrice),
        comparePrice: item.variant.product.comparePrice
          ? String(item.variant.product.comparePrice)
          : null,
        imageUrl: item.variant.product.images[0]?.url ?? null,
      },
    },
  }))
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function fetchCart(): Promise<CartItem[]> {
  const res = await api.get<{ data: ServerCart }>('/cart', { headers: cartHeaders() })
  return mapServerCart(res.data)
}

export async function apiAddItem(variantId: string, quantity: number): Promise<CartItem[]> {
  const res = await api.post<{ data: ServerCart }>(
    '/cart/items',
    { variantId, quantity },
    { headers: cartHeaders() }
  )
  return mapServerCart(res.data)
}

export async function apiUpdateItem(itemId: string, quantity: number): Promise<CartItem[]> {
  const res = await api.patch<{ data: ServerCart }>(
    `/cart/items/${itemId}`,
    { quantity },
    { headers: cartHeaders() }
  )
  return mapServerCart(res.data)
}

export async function apiRemoveItem(itemId: string): Promise<CartItem[]> {
  const res = await api.delete<{ data: ServerCart }>(`/cart/items/${itemId}`, {
    headers: cartHeaders(),
  })
  return mapServerCart(res.data)
}

export async function apiClearCart(): Promise<CartItem[]> {
  const res = await api.delete<{ data: ServerCart }>('/cart', { headers: cartHeaders() })
  return mapServerCart(res.data)
}
