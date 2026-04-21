/**
 * Admin Flow E2E Tests
 * Tests admin authentication, product listing, edit, and sign out.
 */

import { test, expect } from '@playwright/test'

const ADMIN_EMAIL = 'admin@carolinaremedies.com'
const ADMIN_PASSWORD = 'Admin@2026!'

test.describe('Admin Authentication & Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Bypass age gate
    await page.addInitScript(() => {
      localStorage.setItem('age-verified', 'true')
      localStorage.setItem('age-verification-time', new Date().toISOString())
    })
  })

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('h1')).toContainText('Admin Login')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('redirects unauthenticated users from /admin to /login', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login/)
  })

  test('shows error for wrong credentials', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'wrong@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Invalid login credentials')).toBeVisible({ timeout: 10_000 })
  })

  test('admin can log in and view dashboard with 50 products', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')

    // Should redirect to /admin after login
    await expect(page).toHaveURL(/\/admin/, { timeout: 15_000 })

    // Dashboard header visible
    await expect(page.locator('h1').filter({ hasText: 'Admin Dashboard' })).toBeVisible()

    // Products tab is default, wait for table to load
    const rows = page.locator('tbody tr')
    await expect(rows.first()).toBeVisible({ timeout: 15_000 })
    const count = await rows.count()
    expect(count).toBeGreaterThanOrEqual(50)
  })

  test('admin can switch to Add Product tab', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/admin/, { timeout: 15_000 })

    await page.click('button:has-text("Add Product")')
    await expect(page.locator('h2:has-text("New Product")')).toBeVisible()
    await expect(page.locator('input[name="name"]').or(page.locator('input').first())).toBeVisible()
  })

  test('admin can switch to Import CSV tab', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/admin/, { timeout: 15_000 })

    await page.click('button:has-text("Import CSV")')
    await expect(page.locator('h2').filter({ hasText: 'Import Products from CSV' })).toBeVisible()
  })

  test('admin can click Edit on a product', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/admin/, { timeout: 15_000 })

    const rows = page.locator('tbody tr')
    await expect(rows.first()).toBeVisible({ timeout: 15_000 })

    // Click Edit on first product
    await rows.first().locator('button:has-text("Edit")').click()
    await expect(page.locator('h2:has-text("Edit Product")')).toBeVisible()
  })

  test('admin can sign out and is redirected to /login', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/admin/, { timeout: 15_000 })

    // Click Sign Out
    await page.click('a:has-text("Sign Out")')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })

    // Verify can't access /admin anymore
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login/)
  })

  test('login page shows subtitle text and public signup disabled message', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('p').filter({ hasText: /Sign in to manage/i })).toBeVisible()
    await expect(page.locator('text=Public sign-up is disabled')).toBeVisible()
  })

  test('invalid email format prevents form submission', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'notanemail')
    await page.fill('input[type="password"]', 'somepassword')
    await page.click('button[type="submit"]')
    // HTML5 validation prevents submission — we should still be on login
    await expect(page).toHaveURL(/\/login/)
    const isValid = await page.locator('input[type="email"]').evaluate(
      (el: HTMLInputElement) => el.validity.valid
    )
    expect(isValid).toBe(false)
  })

  test('admin header shows store link and sign out link', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/admin/, { timeout: 15_000 })

    await expect(page.locator('a:has-text("← Store")')).toBeVisible()
    await expect(page.locator('a:has-text("Sign Out")')).toBeVisible()
  })

  test('admin dashboard shows Products Add Product and Import CSV tabs', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/admin/, { timeout: 15_000 })

    await expect(page.locator('button:has-text("Products")')).toBeVisible()
    await expect(page.locator('button:has-text("Add Product")')).toBeVisible()
    await expect(page.locator('button:has-text("Import CSV")')).toBeVisible()
  })

  test('admin products table has correct column headers', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/admin/, { timeout: 15_000 })

    const rows = page.locator('tbody tr')
    await expect(rows.first()).toBeVisible({ timeout: 15_000 })

    const thead = page.locator('thead')
    await expect(thead).toContainText('Product')
    await expect(thead).toContainText('Category')
    await expect(thead).toContainText('Price')
    await expect(thead).toContainText('Stock')
    await expect(thead).toContainText('Status')
  })

  test('admin delete shows confirm and cancel buttons', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/admin/, { timeout: 15_000 })

    const rows = page.locator('tbody tr')
    await expect(rows.first()).toBeVisible({ timeout: 15_000 })

    // Click Delete on first row
    await rows.first().locator('button:has-text("Delete")').click()

    // Should show Confirm and Cancel options
    await expect(rows.first().locator('button:has-text("Confirm")')).toBeVisible()
    await expect(rows.first().locator('button:has-text("Cancel")')).toBeVisible()

    // Cancel restores Delete button
    await rows.first().locator('button:has-text("Cancel")').click()
    await expect(rows.first().locator('button:has-text("Delete")')).toBeVisible()
  })

  test('store link from admin navigates to homepage', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/admin/, { timeout: 15_000 })

    await page.click('a:has-text("← Store")')
    await expect(page).not.toHaveURL(/\/admin/)
  })

  test('add product form has name and category fields', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/admin/, { timeout: 15_000 })

    await page.click('button:has-text("Add Product")')
    await expect(page.locator('h2:has-text("New Product")')).toBeVisible()
    await expect(page.locator('input[name="name"]')).toBeVisible()
    await expect(page.locator('select[name="category_id"]').or(page.locator('select').first())).toBeVisible()
  })
})
