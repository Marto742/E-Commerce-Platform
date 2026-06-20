import { defineConfig, devices } from '@playwright/test'

// URLs of the running stack. Override via env in CI / different environments.
const WEB = process.env.E2E_WEB_URL ?? 'http://localhost:3000'
const ADMIN = process.env.E2E_ADMIN_URL ?? 'http://localhost:3001'
const API = process.env.E2E_API_URL ?? 'http://localhost:4000'

// By default the suite assumes the stack is already running (CI starts it, or you run
// `pnpm dev`). Set E2E_START_SERVERS=1 to have Playwright boot the dev stack itself.
const startServers = process.env.E2E_START_SERVERS === '1'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: WEB,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  // Cross-browser matrix (task 10.18). Visual snapshots (10.7) are per-project.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  expect: {
    // Tolerance for visual regression snapshots across browsers/OSes.
    toHaveScreenshot: { maxDiffPixelRatio: 0.02 },
  },
  webServer: startServers
    ? [
        {
          command: 'pnpm --filter @repo/api dev',
          url: `${API}/v1/health`,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
        {
          command: 'pnpm --filter @repo/web dev',
          url: WEB,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
        {
          command: 'pnpm --filter @repo/admin dev',
          url: ADMIN,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      ]
    : undefined,
})
