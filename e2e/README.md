# E2E tests (Playwright)

End-to-end tests for the storefront (`apps/web`), admin (`apps/admin`), and API
(`apps/api`). Covers critical flows (checkout, auth, admin), accessibility (axe), visual
regression, and cross-browser (Chromium, Firefox, WebKit).

## Prerequisites

E2E needs the **full stack running** against a **seeded** database, with Stripe in **test
mode** for the payment flow.

## Run locally

```bash
# 1) Install browsers once
pnpm --filter @repo/e2e e2e:install

# 2a) Against an already-running stack (pnpm dev in another terminal):
pnpm --filter @repo/e2e e2e

# 2b) …or let Playwright boot the dev stack for you:
E2E_START_SERVERS=1 pnpm --filter @repo/e2e e2e
```

From the repo root, `pnpm test:e2e` runs the suite via Turbo.

## Configuration (env)

| Var                 | Default                 | Purpose                              |
| ------------------- | ----------------------- | ------------------------------------ |
| `E2E_WEB_URL`       | `http://localhost:3000` | storefront base URL                  |
| `E2E_ADMIN_URL`     | `http://localhost:3001` | admin base URL                       |
| `E2E_API_URL`       | `http://localhost:4000` | API base URL                         |
| `E2E_START_SERVERS` | _unset_                 | `1` → Playwright boots api/web/admin |

The checkout payment spec also needs `STRIPE_SECRET_KEY` (API) and
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (web) set to **test** keys.

## CI

`.github/workflows/e2e.yml` runs the suite on PRs to `main`: spins up Postgres + Redis,
migrates + seeds, installs Playwright browsers, boots the stack, and runs all projects.
The HTML report is uploaded as an artifact.
