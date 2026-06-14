import { test, expect } from '@playwright/test'
import { SEEDED_ADMIN, uniqueEmail } from '../helpers/fixtures'

// User auth flows (task 10.5): login validation, successful login, registration.
test.describe('storefront auth', () => {
  test('shows an error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill('nobody@example.com')
    await page.getByLabel('Password').fill('WrongPass1')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page.getByText(/invalid email or password/i)).toBeVisible()
  })

  test('logs in with seeded credentials and leaves the login page', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill(SEEDED_ADMIN.email)
    await page.getByLabel('Password').fill(SEEDED_ADMIN.password)
    await page.getByRole('button', { name: /sign in/i }).click()
    // Successful sign-in redirects to the callback (home) — the login heading disappears.
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeHidden({
      timeout: 15_000,
    })
  })

  test('registers a new account', async ({ page }) => {
    await page.goto('/auth/register')
    await page.getByLabel('First name').fill('E2E')
    await page.getByLabel('Last name').fill('Tester')
    await page.getByLabel('Email').fill(uniqueEmail())
    await page.getByLabel('Password', { exact: true }).fill('StrongPass1')
    await page.getByLabel('Confirm password').fill('StrongPass1')
    await page.getByRole('button', { name: /create account/i }).click()
    // Either the "check your email" screen shows or we redirect — the form heading goes away.
    await expect(page.getByRole('heading', { name: 'Create an account' })).toBeHidden({
      timeout: 15_000,
    })
  })

  test('client-side validation rejects mismatched passwords', async ({ page }) => {
    await page.goto('/auth/register')
    await page.getByLabel('First name').fill('E2E')
    await page.getByLabel('Last name').fill('Tester')
    await page.getByLabel('Email').fill(uniqueEmail())
    await page.getByLabel('Password', { exact: true }).fill('StrongPass1')
    await page.getByLabel('Confirm password').fill('Different1')
    await page.getByRole('button', { name: /create account/i }).click()
    await expect(page.getByText(/passwords do not match/i).first()).toBeVisible()
  })
})
