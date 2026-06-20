import { describe, it, expect, beforeEach } from 'vitest'
import {
  saveOrderSnapshot,
  loadOrderSnapshot,
  clearOrderSnapshot,
  type OrderSnapshot,
} from '../order-snapshot'

const snapshot: OrderSnapshot = {
  orderId: 'order-1',
  items: [{ name: 'Tee', variantName: 'Red', imageUrl: null, quantity: 1, unitPrice: 10 }],
  shippingAddress: {
    line1: '1 St',
    city: 'London',
    state: 'LDN',
    postalCode: 'EC1',
    country: 'GB',
  },
  breakdown: { subtotal: 10, shipping: 5, tax: 1, discount: 0, total: 16 },
}

beforeEach(() => {
  sessionStorage.clear()
})

describe('order snapshot', () => {
  it('saves and loads a snapshot by matching order id', () => {
    saveOrderSnapshot(snapshot)
    expect(loadOrderSnapshot('order-1')).toEqual(snapshot)
  })

  it('returns null when the order id does not match', () => {
    saveOrderSnapshot(snapshot)
    expect(loadOrderSnapshot('other-order')).toBeNull()
  })

  it('returns null when nothing is stored', () => {
    expect(loadOrderSnapshot('order-1')).toBeNull()
  })

  it('returns null when the stored value is malformed JSON', () => {
    sessionStorage.setItem('order_snapshot', '{not valid json')
    expect(loadOrderSnapshot('order-1')).toBeNull()
  })

  it('clears the snapshot', () => {
    saveOrderSnapshot(snapshot)
    clearOrderSnapshot()
    expect(loadOrderSnapshot('order-1')).toBeNull()
  })
})
