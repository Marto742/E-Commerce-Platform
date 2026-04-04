export const FREE_SHIPPING_THRESHOLD = 75.0

export type ShippingMethod = 'STANDARD' | 'EXPRESS' | 'OVERNIGHT'

export interface ShippingRate {
  method: ShippingMethod
  label: string
  estimatedDays: string
  cost: number
}

// ─── Rate tables ───────────────────────────────────────────────────────────────

const RATES: Record<
  'domestic' | 'international',
  Partial<Record<ShippingMethod, Omit<ShippingRate, 'method'>>>
> = {
  domestic: {
    STANDARD: { label: 'Standard Shipping', estimatedDays: '5–7 business days', cost: 5.99 },
    EXPRESS: { label: 'Express Shipping', estimatedDays: '2–3 business days', cost: 14.99 },
    OVERNIGHT: { label: 'Overnight Shipping', estimatedDays: '1 business day', cost: 24.99 },
  },
  international: {
    STANDARD: {
      label: 'International Standard',
      estimatedDays: '10–20 business days',
      cost: 14.99,
    },
    EXPRESS: { label: 'International Express', estimatedDays: '5–7 business days', cost: 29.99 },
  },
}

const DOMESTIC_COUNTRIES = new Set(['US'])

function region(country: string): 'domestic' | 'international' {
  return DOMESTIC_COUNTRIES.has(country.toUpperCase()) ? 'domestic' : 'international'
}

// ─── Get all available rates ───────────────────────────────────────────────────

export function getShippingRates(country: string, subtotal: number): ShippingRate[] {
  const r = region(country)
  const table = RATES[r]

  return (Object.entries(table) as [ShippingMethod, Omit<ShippingRate, 'method'>][]).map(
    ([method, details]) => ({
      method,
      ...details,
      // Free shipping threshold applies to STANDARD only
      cost: method === 'STANDARD' && subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : details.cost,
    })
  )
}

// ─── Calculate cost for a specific method ─────────────────────────────────────

export function calculateShipping(
  country: string,
  subtotal: number,
  method: ShippingMethod = 'STANDARD'
): number {
  const r = region(country)
  const table = RATES[r]
  const rate = table[method]

  if (!rate) {
    // Overnight not available internationally — fall back to EXPRESS
    const fallback = table['EXPRESS']!
    return fallback.cost
  }

  if (method === 'STANDARD' && subtotal >= FREE_SHIPPING_THRESHOLD) return 0

  return rate.cost
}
