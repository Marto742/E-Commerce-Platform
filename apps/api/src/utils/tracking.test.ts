import { describe, it, expect } from 'vitest'
import { generateTrackingNumber } from './tracking'

describe('generateTrackingNumber', () => {
  it('matches the TRK-XXXXXXXX format (8 uppercase hex chars)', () => {
    expect(generateTrackingNumber()).toMatch(/^TRK-[0-9A-F]{8}$/)
  })

  it('produces (effectively) unique values', () => {
    const values = new Set(Array.from({ length: 200 }, () => generateTrackingNumber()))
    expect(values.size).toBeGreaterThan(195)
  })
})
