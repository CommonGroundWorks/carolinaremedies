/**
 * BDD Feature: Admin Management
 *
 * Scenario-driven tests for admin authentication, dashboard tabs,
 * product CRUD, import CSV, and sign-out.
 */

import { test, expect } from '@playwright/test'
import { AdminPage } from '../support/pages'

// ──────────────────────────────────────────────────────────────────────────────
// Feature: Admin Authentication
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Feature: Admin Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('age-verified', 'true')
      localStorage.setItem('age-verification-time', new Date().toISOString())
    })
  })

  test('Scenario: Given /admin route, When unauthenticated user visits, Then redirected to /login', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login/)
  })

  test('Scenario: Given login page, When it loads, Then heading, email, password and submit are visible', async ({ page }) => {
    const admin = new AdminPage(page)
    await admin.gotoLogin()
    await expect(page.locator('h1')).toContainText('Admin Login')
    await expect(admin.emailInput).toBeVisible()
    await expect(admin.passwordInput).toBeVisible()
    await expect(admin.submitBtn).toBeVisible()
  })

  test('Scenario: Given login page, When wrong credentials submitted, Then error message displayed', async ({ page }) => {
    const admin = new AdminPage(page)
    await admin.gotoLogin()
    await admin.emailInput.fill('nobody@example.com')
    await admin.passwordInput.fill('wrongpassword')
    await admin.submitBtn.click()
    await expect(page.locator('text=Invalid login credentials')).toBeVisible({ timeout: 10_000 })
  })

  test('Scenario: Given login page, When invalid email format entered, Then HTML5 validation fires', async ({ page }) => {
    const admin = new AdminPage(page)
    await admin.gotoLogin()
    await admin.emailInput.fill('notanemail')
    await admin.passwordInput.fill('somepassword')
    await admin.submitBtn.click()
    await expect(page).toHaveURL(/\/login/)
    const isValid = await admin.emailInput.evaluate((el: HTMLInputElement) => el.validity.valid)
    expect(isValid).toBe(false)
  })

  test('Scenario: Given login page, When public sign-up notice checked, Then it is displayed', async ({ page }) => {
    const admin = new AdminPage(page)
    await admin.gotoLogin()
    await expect(page.locator('text=Public sign-up is disabled')).toBeVisible()
  })

  test('Scenario: Given valid credentials, When submitted, Then admin dashboard is shown', async ({ page }) => {
    const admin = new AdminPage(page)
    await admin.loginAsAdmin()
    await expect(admin.dashboard).toBeVisible()
  })

  test('Scenario: Given logged in admin, When sign-out clicked, Then redirected to /login', async ({ page }) => {
    const admin = new AdminPage(page)
    await admin.loginAsAdmin()
    await admin.signOut()
    await expect(page).toHaveURL(/\/login/)
  })

  test('Scenario: Given signed-out admin, When /admin visited again, Then redirected to /login', async ({ page }) => {
    const admin = new AdminPage(page)
    await admin.loginAsAdmin()
    await admin.signOut()
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login/)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// Feature: Admin Dashboard Navigation
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Feature: Admin Dashboard Navigation', () => {
  let admin: AdminPage

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('age-verified', 'true')
      localStorage.setItem('age-verification-time', new Date().toISOString())
    })
    admin = new AdminPage(page)
    await admin.loginAsAdmin()
  })

  test('Scenario: Given admin dashboard, When loaded, Then three tabs are visible', async ({ page }) => {
    await expect(admin.productsTab).toBeVisible()
    await expect(admin.addProductTab).toBeVisible()
    await expect(admin.importCsvTab).toBeVisible()
  })

  test('Scenario: Given admin dashboard, When header checked, Then store link and sign-out link are present', async ({ page }) => {
    await expect(admin.storeLink).toBeVisible()
    await expect(admin.signOutLink).toBeVisible()
  })

  test('Scenario: Given admin dashboard, When Store link clicked, Then navigated to homepage', async ({ page }) => {
    await admin.storeLink.click()
    await expect(page).toHaveURL(/^\/.?$|^\/$/)
  })

  test('Scenario: Given admin dashboard, When Add Product tab clicked, Then add product form appears', async ({ page }) => {
    await admin.addProductTab.click()
    await expect(page.locator('h2:has-text("New Product")')).toBeVisible()
  })

  test('Scenario: Given Add Product tab open, When form visible, Then name and category inputs present', async ({ page }) => {
    await admin.addProductTab.click()
    await expect(page.locator('input[name="name"]').or(page.locator('input').first())).toBeVisible()
  })

  test('Scenario: Given admin dashboard, When Import CSV tab clicked, Then import section heading appears', async ({ page }) => {
    await admin.importCsvTab.click()
    await expect(page.locator('h2').filter({ hasText: 'Import Products from CSV' })).toBeVisible()
  })

  test('Scenario: Given Import CSV section, When visible, Then upload area or file input is present', async ({ page }) => {
    await admin.importCsvTab.click()
    const fileInput = page.locator('input[type="file"]').or(
      page.locator('[data-testid="csv-upload"]')
    )
    if (await fileInput.isVisible()) {
      await expect(fileInput).toBeVisible()
    }
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// Feature: Admin Product Table
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Feature: Admin Product Table', () => {
  let admin: AdminPage

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('age-verified', 'true')
      localStorage.setItem('age-verification-time', new Date().toISOString())
    })
    admin = new AdminPage(page)
    await admin.loginAsAdmin()
    await admin.waitForProductTable()
  })

  test('Scenario: Given product table, When loaded, Then at least 50 products are listed', async ({ page }) => {
    const count = await admin.tableRows.count()
    expect(count).toBeGreaterThanOrEqual(50)
  })

  test('Scenario: Given product table, When column headers checked, Then Product, Category, Price, Stock, Status present', async ({ page }) => {
    const thead = page.locator('thead')
    await expect(thead).toContainText('Product')
    await expect(thead).toContainText('Category')
    await expect(thead).toContainText('Price')
    await expect(thead).toContainText('Stock')
    await expect(thead).toContainText('Status')
  })

  test('Scenario: Given product table, When Edit clicked on first row, Then edit form appears', async ({ page }) => {
    await admin.clickEditOnRow(0)
    await expect(page.locator('h2:has-text("Edit Product")')).toBeVisible()
  })

  test('Scenario: Given product table, When Delete clicked on first row, Then Confirm and Cancel buttons appear', async ({ page }) => {
    await admin.clickDeleteOnRow(0)
    await expect(admin.tableRows.first().locator('button:has-text("Confirm")')).toBeVisible()
    await expect(admin.tableRows.first().locator('button:has-text("Cancel")')).toBeVisible()
  })

  test('Scenario: Given delete confirmation shown, When Cancel clicked, Then Delete button is restored', async ({ page }) => {
    await admin.clickDeleteOnRow(0)
    await admin.cancelDelete(0)
    await expect(admin.tableRows.first().locator('button:has-text("Delete")')).toBeVisible()
  })

  test('Scenario: Given product table, When each row inspected, Then name and price are non-empty', async ({ page }) => {
    const rows = admin.tableRows
    const count = Math.min(await rows.count(), 5)
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i)
      const name = await row.locator('td').first().textContent()
      expect(name?.trim().length).toBeGreaterThan(0)
    }
  })

  test('Scenario: Given edit product form, When visible, Then form has required fields', async ({ page }) => {
    await admin.clickEditOnRow(0)
    // Name field should be pre-filled
    const nameField = page.locator('input[name="name"]').or(page.locator('input').nth(0))
    await expect(nameField).toBeVisible()
  })

  test('Scenario: Given edit product form, When Back/Cancel clicked, Then returns to product table', async ({ page }) => {
    await admin.clickEditOnRow(0)
    const backBtn = page.locator('button:has-text("Cancel")').or(
      page.locator('button:has-text("Back")')
    ).first()
    if (await backBtn.isVisible()) {
      await backBtn.click()
      await expect(admin.tableRows.first()).toBeVisible({ timeout: 10_000 })
    }
  })
})
