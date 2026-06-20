import { test, expect } from '@playwright/test'
import { ADMIN_URL, SEEDED_ADMIN } from '../helpers/fixtures'

// Admin panel flows (task 10.6). The admin app runs on its own origin (ADMIN_URL).
test.describe('admin panel', () => {
  test('rejects invalid admin credentials', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/login`)
    await page.getByLabel('Email').fill('nobody@example.com')
    await page.getByLabel('Password').fill('WrongPass1')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page.getByText(/invalid|denied|incorrect|wrong/i)).toBeVisible({ timeout: 15_000 })
  })

  test('admin signs in and reaches the dashboard', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/login`)
    await page.getByLabel('Email').fill(SEEDED_ADMIN.email)
    await page.getByLabel('Password').fill(SEEDED_ADMIN.password)
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })
    await expect(page.getByRole('navigation')).toBeVisible()
  })
})
