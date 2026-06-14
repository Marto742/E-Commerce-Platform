import { describe, it, expect, beforeEach } from 'vitest'
import { createCartStore } from '../cart-store'
import type { CartItem, CartVariant } from '../types'

function variant(id: string, price = '10.00', comparePrice: string | null = null): CartVariant {
  return {
    id,
    sku: `SKU-${id}`,
    name: 'Variant',
    price,
    stock: 100,
    attributes: {},
    product: {
      id: `p-${id}`,
      name: 'Product',
      slug: `product-${id}`,
      basePrice: price,
      comparePrice,
      imageUrl: null,
    },
  }
}

function serverItem(id: string): CartItem {
  return { id, variantId: 'v1', quantity: 2, variant: variant('v1') }
}

beforeEach(() => {
  localStorage.clear()
})

describe('cart store', () => {
  it('adds a new optimistic item with a temporary id', () => {
    const store = createCartStore()
    store.getState().addItem(variant('v1'), 2)
    expect(store.getState().items).toHaveLength(1)
    expect(store.getState().items[0]).toMatchObject({
      variantId: 'v1',
      quantity: 2,
      id: 'optimistic-v1',
    })
  })

  it('defaults quantity to 1', () => {
    const store = createCartStore()
    store.getState().addItem(variant('v1'))
    expect(store.getState().items[0]!.quantity).toBe(1)
  })

  it('merges quantity when the same variant is added again', () => {
    const store = createCartStore()
    store.getState().addItem(variant('v1'), 1)
    store.getState().addItem(variant('v1'), 3)
    expect(store.getState().items).toHaveLength(1)
    expect(store.getState().items[0]!.quantity).toBe(4)
  })

  it('removes an item by variant id', () => {
    const store = createCartStore()
    store.getState().addItem(variant('v1'))
    store.getState().removeItem('v1')
    expect(store.getState().items).toHaveLength(0)
  })

  it('updates the quantity of a line', () => {
    const store = createCartStore()
    store.getState().addItem(variant('v1'), 1)
    store.getState().updateQuantity('v1', 5)
    expect(store.getState().items[0]!.quantity).toBe(5)
  })

  it('removes the line when quantity is set to 0 or less', () => {
    const store = createCartStore()
    store.getState().addItem(variant('v1'), 1)
    store.getState().updateQuantity('v1', 0)
    expect(store.getState().items).toHaveLength(0)
  })

  it('clears the cart', () => {
    const store = createCartStore()
    store.getState().addItem(variant('v1'))
    store.getState().addItem(variant('v2'))
    store.getState().clearCart()
    expect(store.getState().items).toHaveLength(0)
  })

  it('syncs authoritative items from the server and clears isSyncing', () => {
    const store = createCartStore()
    store.getState().setSyncing(true)
    store.getState().syncFromServer([serverItem('s1')])
    expect(store.getState().items).toEqual([serverItem('s1')])
    expect(store.getState().isSyncing).toBe(false)
  })

  it('can be initialised with server items', () => {
    const store = createCartStore([serverItem('s1')])
    expect(store.getState().items).toHaveLength(1)
  })
})
