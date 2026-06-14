# Load & performance testing (Artillery)

Load/stress tests for the API (tasks 10.12–10.14). Artillery is run via `npx` — no
workspace dependency, so nothing is added to the app bundles.

## Scenarios

| File         | Purpose                                                              |
| ------------ | -------------------------------------------------------------------- |
| `browse.yml` | Sustained read-heavy load with a p95/p99 + error-rate budget (10.13) |
| `stress.yml` | Stair-step arrival rate to find the breaking point (10.14)           |

## Run

```bash
# Local (start the API first: pnpm --filter @repo/api dev)
npx artillery run load/browse.yml

# Against a deployed target, with an HTML report
npx artillery run load/browse.yml \
  --target https://repoapi-production-6115.up.railway.app \
  --output report.json
npx artillery report report.json   # -> report.json.html
```

> Targets default to `http://localhost:4000`. Only point load tests at production
> deliberately — free hosting tiers have low ceilings, and a 800/s stress run will trip
> rate limits and may briefly degrade the live site.

## Interpreting results

- `http.response_time` p50/p95/p99 — latency distribution.
- `http.codes.2xx` vs `4xx/5xx` — error rate (429s are expected under stress = rate
  limiting working).
- `vusers.completed` / `vusers.failed` — session success.

Record runs in [`docs/performance-report.md`](../docs/performance-report.md).

## CI

`.github/workflows/load.yml` runs `browse.yml` on demand (and nightly) against a chosen
target and uploads the HTML report.
