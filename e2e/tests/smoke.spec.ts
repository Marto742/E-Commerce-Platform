import { test, expect } from '@playwright/test'

// Basic availability across the storefront — the cheapest signal that the stack is up
// and pages render on every browser project.
test.describe('storefront smoke', () => {
  test('home page renders', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/shop/i)
    await expect(page.getByRole('navigation')).toBeVisible()
  })

  test('products page lists items', async ({ page }) => {
    await page.goto('/products')
    // At least one product card links into a product detail page.
    const productLinks = page.locator('a[href*="/products/"]')
    await expect(productLinks.first()).toBeVisible({ timeout: 15_000 })
  })

  test('a product detail page opens', async ({ page }) => {
    await page.goto('/products')
    await page.locator('a[href*="/products/"]').first().click()
    await expect(page).toHaveURL(/\/products\/.+/)
    await expect(page.getByRole('button', { name: /add to (cart|bag)/i })).toBeVisible()
  })
})
