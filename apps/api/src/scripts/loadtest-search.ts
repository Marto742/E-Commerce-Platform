import 'dotenv/config'

/**
 * Fires concurrent search requests at the live API and reports latency
 * percentiles, throughput, status codes, and cache hit ratio.
 *
 *   pnpm --filter @repo/api loadtest:search
 *
 * Tunables (env): LOADTEST_URL, LOADTEST_REQUESTS, LOADTEST_CONCURRENCY.
 * Note: the global rate limiter (500 req / 15 min per IP) caps sustained
 * throughput — keep REQUESTS modest for clean latency numbers.
 */

const BASE = process.env.LOADTEST_URL ?? 'http://localhost:4000/v1'
const TOTAL = Number(process.env.LOADTEST_REQUESTS ?? 400)
const CONCURRENCY = Number(process.env.LOADTEST_CONCURRENCY ?? 25)

const TERMS = [
  'wireless',
  'blue',
  'pro',
  'cotton',
  'steel',
  'leather',
  'organic',
  'smart',
  'headphones',
  'speaker',
  'backpack',
  'jacket',
  'watch',
  'lamp',
  'bottle',
  'keyboard',
  'camera',
  'sneakers',
  'monitor',
  'premium',
  'classic',
  'eco',
  'portable',
  'vintage',
  'compact',
  'electronics',
  'apparel',
  'kitchen',
]
const SORTS = ['', 'rating:desc', 'basePrice:asc', 'basePrice:desc']

function randomPath(): string {
  const term = TERMS[Math.floor(Math.random() * TERMS.length)]
  const params = new URLSearchParams({
    q: term,
    page: String(1 + Math.floor(Math.random() * 5)),
    limit: '24',
  })
  if (Math.random() < 0.3) params.set('minRating', String(1 + Math.floor(Math.random() * 4)))
  const sort = SORTS[Math.floor(Math.random() * SORTS.length)]
  if (sort) {
    const [sortBy, sortOrder] = sort.split(':')
    params.set('sortBy', sortBy)
    params.set('sortOrder', sortOrder)
  }
  return `/search?${params.toString()}`
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.min(sorted.length - 1, Math.floor((sorted.length * p) / 100))
  return sorted[idx]
}

async function main(): Promise<void> {
  const latencies: number[] = []
  const statusCounts: Record<string, number> = {}
  let cacheHits = 0
  let cacheMisses = 0
  let next = 0

  console.log(`Load test → ${BASE}/search | ${TOTAL} requests @ concurrency ${CONCURRENCY}\n`)

  const startedAt = performance.now()

  async function worker(): Promise<void> {
    while (next < TOTAL) {
      next++
      const path = randomPath()
      const t0 = performance.now()
      try {
        const res = await fetch(`${BASE}${path}`)
        await res.text()
        latencies.push(performance.now() - t0)
        statusCounts[res.status] = (statusCounts[res.status] ?? 0) + 1
        const cache = res.headers.get('x-cache')
        if (cache === 'HIT') cacheHits++
        else if (cache === 'MISS') cacheMisses++
      } catch (err) {
        statusCounts['ERR'] = (statusCounts['ERR'] ?? 0) + 1
        void err
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  const wallMs = performance.now() - startedAt

  latencies.sort((a, b) => a - b)
  const sum = latencies.reduce((a, b) => a + b, 0)
  const round = (n: number) => Math.round(n * 100) / 100

  console.log('Status codes:', statusCounts)
  console.log(
    `Cache:        ${cacheHits} HIT / ${cacheMisses} MISS` +
      (cacheHits + cacheMisses > 0
        ? ` (${round((cacheHits / (cacheHits + cacheMisses)) * 100)}% hit rate)`
        : '')
  )
  console.log('')
  console.log(`Requests:     ${latencies.length} completed in ${round(wallMs)} ms`)
  console.log(`Throughput:   ${round((latencies.length / wallMs) * 1000)} req/s`)
  console.log('')
  console.log('Latency (ms):')
  console.log(`  avg   ${round(sum / (latencies.length || 1))}`)
  console.log(`  p50   ${round(percentile(latencies, 50))}`)
  console.log(`  p90   ${round(percentile(latencies, 90))}`)
  console.log(`  p95   ${round(percentile(latencies, 95))}`)
  console.log(`  p99   ${round(percentile(latencies, 99))}`)
  console.log(`  max   ${round(latencies[latencies.length - 1] ?? 0)}`)
}

main().catch((err) => {
  console.error('Load test failed:', err)
  process.exit(1)
})
