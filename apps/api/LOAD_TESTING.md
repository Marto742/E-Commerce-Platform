# Search Load Testing

Tooling to validate search performance with a large catalogue (10k+ products),
plus the results of a baseline run.

## Scripts

| Command                                   | Purpose                                                           |
| ----------------------------------------- | ----------------------------------------------------------------- |
| `pnpm --filter @repo/api loadtest:seed`   | Add synthetic products to the Meilisearch index (`lt-` id prefix) |
| `pnpm --filter @repo/api loadtest:search` | Fire concurrent search requests and report latency/throughput     |
| `pnpm --filter @repo/api loadtest:clean`  | Remove the synthetic products                                     |

Tunable via env vars:

- `LOADTEST_COUNT` (default `10000`) — number of synthetic products
- `LOADTEST_REQUESTS` (default `400`) — total requests in a run
- `LOADTEST_CONCURRENCY` (default `25`) — concurrent workers
- `LOADTEST_URL` (default `http://localhost:4000/v1`)

The seeder writes directly to the Meilisearch index, so it does **not** touch the
database — load tests run against the real `GET /v1/search` endpoint (caching,
faceting, highlighting, spell-check all included) without polluting the catalogue.
Always run `loadtest:clean` afterwards.

> Prerequisites: Meilisearch running (`start-meilisearch.bat`) and the API on
> `:4000`.

## Baseline results

Environment: local dev (Windows, `tsx` — not a production build), Meilisearch
0.58, index of **10,007 documents**.

### Meilisearch engine latency (direct, bypassing the API)

| Query      | Matches | `processingTimeMs` |
| ---------- | ------- | ------------------ |
| `wireless` | 1000    | 6 ms               |
| `blue`     | 1000    | 7 ms               |
| `pro`      | 1000    | 5 ms               |
| `cotton`   | 502     | 3 ms               |

The engine handles 10k documents in **single-digit milliseconds** — it is not the
bottleneck.

### Endpoint load test (`/v1/search`, 400 requests @ concurrency 25, varied queries)

| Metric         | Value                              |
| -------------- | ---------------------------------- |
| Status codes   | 400 × `200` (0 errors)             |
| Cache hit rate | 14% (varied queries — mostly cold) |
| Throughput     | ~86 req/s                          |
| Latency avg    | 282 ms                             |
| Latency p50    | 289 ms                             |
| Latency p90    | 378 ms                             |
| Latency p95    | 489 ms                             |
| Latency p99    | 718 ms                             |
| Latency max    | 1048 ms                            |

### Interpretation

- **Search scales fine to 10k+.** No errors; p95 stays under 500 ms even under
  25 concurrent workers on a dev build.
- The gap between the 3–7 ms engine time and the ~280 ms endpoint p50 is
  application overhead: the single-process dev server under heavy concurrency,
  HTTP, JSON serialisation, plus per-request faceting/highlighting. A production
  build and horizontal scaling reduce this substantially.
- The **cache layer** (see `lib/cache.ts`) serves repeat queries from memory —
  `X-Cache: HIT` responses skip Meilisearch entirely. Real traffic (with popular,
  repeated terms) sees a far higher hit rate than this deliberately-varied test.

## Notes / caveats

- The global rate limiter is **500 requests / 15 min per IP**, so sustained
  high-volume runs will hit `429`s. Keep `LOADTEST_REQUESTS` modest, or raise the
  limit temporarily when stress-testing throughput specifically.
- Re-run `loadtest:clean` when finished so the storefront only shows real products.
