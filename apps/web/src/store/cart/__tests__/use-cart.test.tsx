import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import React from 'react'
import { CartProvider } from '../cart-provider'
import {
  useCart,
  useCartItemCount,
  useCartLineCount,
  useCartItemQuantity,
  useCartTotals,
  useIsInCart,
} from '../use-cart'
import type { CartVariant } from '../types'

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

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>{children}</CartProvider>
)

beforeEach(() => {
  localStorage.clear()
})

describe('useCart selectors', () => {
  it('throws when used outside of a CartProvider', () => {
    expect(() => renderHook(() => useCart())).toThrow(/CartProvider/)
  })

  it('exposes state + actions and derives counts', () => {
    const { result } = renderHook(
      () => ({
        cart: useCart(),
        itemCount: useCartItemCount(),
        lineCount: useCartLineCount(),
      }),
      { wrapper }
    )

    act(() => {
      result.current.cart.addItem(variant('v1'), 2)
      result.current.cart.addItem(variant('v2'), 1)
    })

    expect(result.current.lineCount).toBe(2)
    expect(result.current.itemCount).toBe(3)
  })

  it('computes subtotal and savings from compare prices', () => {
    const { result } = renderHook(() => ({ cart: useCart(), totals: useCartTotals() }), { wrapper })

    act(() => {
      // unit 10, compare 15 -> 5 savings/unit, x2 = 10 savings; subtotal 20
      result.current.cart.addItem(variant('v1', '10.00', '15.00'), 2)
    })

    expect(result.current.totals.subtotal).toBe(20)
    expect(result.current.totals.savings).toBe(10)
    expect(result.current.totals.itemCount).toBe(2)
    expect(result.current.totals.lineCount).toBe(1)
  })

  it('reports membership and per-variant quantity', () => {
    const { result } = renderHook(
      () => ({
        cart: useCart(),
        inCart: useIsInCart('v1'),
        qty: useCartItemQuantity('v1'),
      }),
      { wrapper }
    )

    expect(result.current.inCart).toBe(false)
    act(() => {
      result.current.cart.addItem(variant('v1'), 4)
    })
    expect(result.current.inCart).toBe(true)
    expect(result.current.qty).toBe(4)
  })
})
