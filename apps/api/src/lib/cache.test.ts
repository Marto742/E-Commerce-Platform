import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TTLCache } from './cache'

describe('TTLCache', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('returns undefined on a miss', () => {
    const cache = new TTLCache<number>({ ttlMs: 1000 })
    expect(cache.get('nope')).toBeUndefined()
  })

  it('stores and retrieves a value', () => {
    const cache = new TTLCache<number>({ ttlMs: 1000 })
    cache.set('x', 42)
    expect(cache.get('x')).toBe(42)
  })

  it('expires entries after the TTL', () => {
    const cache = new TTLCache<number>({ ttlMs: 1000 })
    cache.set('x', 42)
    vi.advanceTimersByTime(1001)
    expect(cache.get('x')).toBeUndefined()
  })

  it('evicts the least-recently-used entry beyond capacity', () => {
    const cache = new TTLCache<number>({ ttlMs: 10_000, maxEntries: 2 })
    cache.set('a', 1)
    cache.set('b', 2)
    cache.get('a') // 'a' is now most-recently-used
    cache.set('c', 3) // over capacity → evicts LRU ('b')

    expect(cache.get('b')).toBeUndefined()
    expect(cache.get('a')).toBe(1)
    expect(cache.get('c')).toBe(3)
  })

  it('clear() empties the cache', () => {
    const cache = new TTLCache<number>({ ttlMs: 1000 })
    cache.set('x', 1)
    cache.set('y', 2)
    cache.clear()
    expect(cache.size).toBe(0)
  })

  it('delete() removes a single key', () => {
    const cache = new TTLCache<number>({ ttlMs: 1000 })
    cache.set('x', 1)
    cache.delete('x')
    expect(cache.get('x')).toBeUndefined()
  })

  it('tracks hit and miss counts', () => {
    const cache = new TTLCache<number>({ ttlMs: 1000 })
    cache.set('x', 1)
    cache.get('x') // hit
    cache.get('y') // miss
    expect(cache.stats()).toMatchObject({ hits: 1, misses: 1, size: 1 })
  })
})
