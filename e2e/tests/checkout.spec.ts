import { test, expect } from '@playwright/test'
import { STRIPE_TEST_CARDS } from '../helpers/fixtures'

// Checkout flow (task 10.4). Requires Stripe TEST mode on the running stack.
// Stripe Elements render inside a cross-origin iframe, so card fields are filled via
// frameLocator. This is the most environment-sensitive spec.
test.describe('checkout', () => {
  test('guest can add a product to the cart and reach checkout', async ({ page }) => {
    await page.goto('/products')
    await page.locator('a[href*="/products/"]').first().click()
    await expect(page).toHaveURL(/\/products\/.+/)

    await page.getByRole('button', { name: /add to (cart|bag)/i }).click()

    // Cart badge / drawer should reflect the added item.
    await page.goto('/checkout')
    await expect(
      page.getByRole('heading', { name: /checkout|shipping|payment|order/i }).first()
    ).toBeVisible({ timeout: 15_000 })
  })

  test('completes payment with a Stripe test card', async ({ page }) => {
    test.slow() // payment + redirect can be slow

    await page.goto('/products')
    await page.locator('a[href*="/products/"]').first().click()
    await page.getByRole('button', { name: /add to (cart|bag)/i }).click()
    await page.goto('/checkout')

    // Shipping details — labels are resilient regexes; adjust if the form copy changes.
    const fill = async (label: RegExp, value: string) => {
      const field = page.getByLabel(label).first()
      if (await field.isVisible().catch(() => false)) await field.fill(value)
    }
    await fill(/email/i, 'guest@example.com')
    await fill(/first name|full name|name/i, 'Guest')
    await fill(/last name/i, 'Buyer')
    await fill(/address|line 1/i, '1 Test Street')
    await fill(/city/i, 'London')
    await fill(/state|province|county/i, 'LDN')
    await fill(/postal|zip/i, 'EC1A 1BB')

    // Stripe card iframe.
    const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first()
    await stripeFrame.locator('[name="number"]').fill(STRIPE_TEST_CARDS.success)
    await stripeFrame.locator('[name="expiry"]').fill('12 / 34')
    await stripeFrame.locator('[name="cvc"]').fill('123')

    await page.getByRole('button', { name: /pay|place order|complete/i }).click()

    // Success redirect → confirmation page references the order.
    await expect(page).toHaveURL(/order|success|confirm/i, { timeout: 30_000 })
  })
})
