// Persists order data in sessionStorage so the confirmation page
// can display full details after Stripe redirects back.

const KEY = 'order_snapshot'

export interface OrderSnapshotItem {
  name: string
  variantName: string
  imageUrl: string | null
  quantity: number
  unitPrice: number
}

export interface OrderSnapshot {
  orderId: string
  items: OrderSnapshotItem[]
  shippingAddress: {
    line1: string
    line2?: string | null
    city: string
    state: string
    postalCode: string
    country: string
  }
  breakdown: {
    subtotal: number
    shipping: number
    tax: number
    discount: number
    total: number
  }
  couponCode?: string
}

export function saveOrderSnapshot(snapshot: OrderSnapshot): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(snapshot))
  } catch {
    // sessionStorage unavailable — confirmation page will degrade gracefully
  }
}

export function loadOrderSnapshot(orderId: string): OrderSnapshot | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const snapshot = JSON.parse(raw) as OrderSnapshot
    // Only return if it matches the current order
    return snapshot.orderId === orderId ? snapshot : null
  } catch {
    return null
  }
}

export function clearOrderSnapshot(): void {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
