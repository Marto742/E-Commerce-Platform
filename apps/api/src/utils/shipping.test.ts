import { describe, it, expect } from 'vitest'
import { getShippingRates, calculateShipping, FREE_SHIPPING_THRESHOLD } from './shipping'

describe('getShippingRates', () => {
  it('returns 3 methods for US', () => {
    const rates = getShippingRates('US', 50)
    expect(rates.map((r) => r.method)).toEqual(['STANDARD', 'EXPRESS', 'OVERNIGHT'])
  })

  it('returns 2 methods for international (no OVERNIGHT)', () => {
    const rates = getShippingRates('GB', 50)
    expect(rates.map((r) => r.method)).toEqual(['STANDARD', 'EXPRESS'])
  })

  it('sets STANDARD cost to 0 when subtotal meets free threshold', () => {
    const rates = getShippingRates('US', FREE_SHIPPING_THRESHOLD)
    const standard = rates.find((r) => r.method === 'STANDARD')!
    expect(standard.cost).toBe(0)
  })

  it('does not apply free shipping to EXPRESS', () => {
    const rates = getShippingRates('US', FREE_SHIPPING_THRESHOLD)
    const express = rates.find((r) => r.method === 'EXPRESS')!
    expect(express.cost).toBeGreaterThan(0)
  })
})

describe('calculateShipping', () => {
  it('returns domestic STANDARD rate', () => {
    expect(calculateShipping('US', 50, 'STANDARD')).toBe(5.99)
  })

  it('returns 0 for STANDARD when subtotal >= threshold', () => {
    expect(calculateShipping('US', FREE_SHIPPING_THRESHOLD, 'STANDARD')).toBe(0)
  })

  it('returns domestic EXPRESS rate', () => {
    expect(calculateShipping('US', 50, 'EXPRESS')).toBe(14.99)
  })

  it('returns domestic OVERNIGHT rate', () => {
    expect(calculateShipping('US', 50, 'OVERNIGHT')).toBe(24.99)
  })

  it('returns international STANDARD rate', () => {
    expect(calculateShipping('DE', 50, 'STANDARD')).toBe(14.99)
  })

  it('returns international EXPRESS rate', () => {
    expect(calculateShipping('DE', 50, 'EXPRESS')).toBe(29.99)
  })

  it('falls back to EXPRESS when OVERNIGHT requested for international', () => {
    expect(calculateShipping('DE', 50, 'OVERNIGHT')).toBe(29.99)
  })

  it('defaults to STANDARD when no method provided', () => {
    expect(calculateShipping('US', 50)).toBe(5.99)
  })
})
