import { test, expect } from '@playwright/test'

// Visual regression (task 10.7). Baselines are created on first run
// (`playwright test --update-snapshots`) and compared per browser project thereafter,
// within the maxDiffPixelRatio set in playwright.config.ts.
const PAGES = [
  { name: 'home', path: '/' },
  { name: 'products', path: '/products' },
  { name: 'login', path: '/auth/login' },
  { name: 'register', path: '/auth/register' },
]

for (const { name, path } of PAGES) {
  test(`visual: ${name} page is stable`, async ({ page }) => {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot(`${name}.png`, {
      fullPage: true,
      animations: 'disabled',
    })
  })
}
