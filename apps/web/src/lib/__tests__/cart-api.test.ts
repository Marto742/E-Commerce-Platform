import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../api-client', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))
vi.mock('../session', () => ({ getSessionId: vi.fn() }))

import { api } from '../api-client'
import { getSessionId } from '../session'
import {
  mapServerCart,
  fetchCart,
  apiAddItem,
  apiUpdateItem,
  apiRemoveItem,
  apiClearCart,
} from '../cart-api'

function serverCart() {
  return {
    items: [
      {
        id: 'ci1',
        variantId: 'v1',
        quantity: 2,
        variant: {
          id: 'v1',
          sku: 'SKU1',
          name: 'Red / M',
          price: 29.99,
          stock: 10,
          attributes: { color: 'red' },
          product: {
            id: 'p1',
            name: 'Tee',
            slug: 'tee',
            basePrice: 29.99,
            comparePrice: 39.99,
            images: [{ url: 'https://cdn/x.png' }],
          },
        },
      },
    ],
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('mapServerCart', () => {
  it('maps server items to client cart items, stringifying decimals', () => {
    const [item] = mapServerCart(serverCart() as never)
    expect(item).toMatchObject({
      id: 'ci1',
      variantId: 'v1',
      quantity: 2,
      variant: {
        price: '29.99',
        product: { basePrice: '29.99', comparePrice: '39.99', imageUrl: 'https://cdn/x.png' },
      },
    })
  })

  it('falls back to null imageUrl and comparePrice when absent', () => {
    const cart = serverCart()
    cart.items[0]!.variant.product.images = []
    cart.items[0]!.variant.product.comparePrice = 0 as never
    const [item] = mapServerCart(cart as never)
    expect(item!.variant.product.imageUrl).toBeNull()
    expect(item!.variant.product.comparePrice).toBeNull()
  })
})

describe('cart API calls', () => {
  it('includes the X-Session-ID header when a session id exists', async () => {
    vi.mocked(getSessionId).mockReturnValue('sess-1')
    vi.mocked(api.get).mockResolvedValue({ data: serverCart() } as never)
    await fetchCart()
    expect(api.get).toHaveBeenCalledWith('/cart', { headers: { 'X-Session-ID': 'sess-1' } })
  })

  it('omits the session header when there is no session id', async () => {
    vi.mocked(getSessionId).mockReturnValue('')
    vi.mocked(api.post).mockResolvedValue({ data: serverCart() } as never)
    await apiAddItem('v1', 2)
    expect(api.post).toHaveBeenCalledWith(
      '/cart/items',
      { variantId: 'v1', quantity: 2 },
      { headers: {} }
    )
  })

  it('updates an item by id', async () => {
    vi.mocked(getSessionId).mockReturnValue('')
    vi.mocked(api.patch).mockResolvedValue({ data: serverCart() } as never)
    const items = await apiUpdateItem('ci1', 3)
    expect(api.patch).toHaveBeenCalledWith('/cart/items/ci1', { quantity: 3 }, { headers: {} })
    expect(items).toHaveLength(1)
  })

  it('removes an item by id', async () => {
    vi.mocked(getSessionId).mockReturnValue('')
    vi.mocked(api.delete).mockResolvedValue({ data: serverCart() } as never)
    await apiRemoveItem('ci1')
    expect(api.delete).toHaveBeenCalledWith('/cart/items/ci1', { headers: {} })
  })

  it('clears the cart', async () => {
    vi.mocked(getSessionId).mockReturnValue('')
    vi.mocked(api.delete).mockResolvedValue({ data: { items: [] } } as never)
    const items = await apiClearCart()
    expect(api.delete).toHaveBeenCalledWith('/cart', { headers: {} })
    expect(items).toEqual([])
  })
})
