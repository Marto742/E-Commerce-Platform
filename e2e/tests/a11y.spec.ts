import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Accessibility audit (task 10.17) — WCAG 2.1 A/AA, no serious/critical violations.
// Run once (on chromium) since axe results are engine-independent.
const PAGES = ['/', '/products', '/auth/login', '/auth/register']

for (const path of PAGES) {
  test(`a11y: ${path} has no serious/critical WCAG violations`, async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Accessibility is audited once, on Chromium')

    await page.goto(path)
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()

    const blocking = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical'
    )
    expect(blocking.map((v) => v.id)).toEqual([])
  })
}
