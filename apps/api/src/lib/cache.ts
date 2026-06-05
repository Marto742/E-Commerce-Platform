/**
 * Minimal in-process TTL + LRU cache.
 *
 * Mirrors the rate limiter's in-memory approach (see middleware/rateLimiter.ts):
 * zero external dependencies and fine for a single instance. Swapping in Redis
 * later only requires reimplementing this class's get/set/delete against the
 * `@/lib/redis` client.
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

export interface TTLCacheOptions {
  /** Default time-to-live for entries, in milliseconds. */
  ttlMs: number
  /** Maximum number of entries before the least-recently-used one is evicted. */
  maxEntries?: number
}

export class TTLCache<T> {
  private store = new Map<string, CacheEntry<T>>()
  private readonly ttlMs: number
  private readonly maxEntries: number
  private hits = 0
  private misses = 0

  constructor(opts: TTLCacheOptions) {
    this.ttlMs = opts.ttlMs
    this.maxEntries = opts.maxEntries ?? 1000
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key)
    if (!entry) {
      this.misses++
      return undefined
    }
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key)
      this.misses++
      return undefined
    }
    // Mark as most-recently-used by reinserting at the end.
    this.store.delete(key)
    this.store.set(key, entry)
    this.hits++
    return entry.value
  }

  set(key: string, value: T, ttlMs: number = this.ttlMs): void {
    // Reinsert so the entry counts as most-recently-used.
    this.store.delete(key)
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs })

    if (this.store.size > this.maxEntries) {
      // Map preserves insertion order — the first key is the LRU one.
      const oldest = this.store.keys().next().value
      if (oldest !== undefined) this.store.delete(oldest)
    }
  }

  delete(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }

  get size(): number {
    return this.store.size
  }

  /** Hit/miss counters — useful for diagnostics. */
  stats(): { size: number; hits: number; misses: number } {
    return { size: this.store.size, hits: this.hits, misses: this.misses }
  }
}
