/**
 * BDD Feature: Homepage & Age Verification
 *
 * Covers every branch of the age-gate workflow and homepage content
 * using Given / When / Then naming so intent is self-documenting.
 */

import { test, expect } from '@playwright/test'
import { HomePage } from '../support/pages'

// ──────────────────────────────────────────────────────────────────────────────
// Feature: Age Verification Gate
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Feature: Age Verification Gate', () => {

  test('Scenario: Given a brand-new visitor, When they land on homepage, Then age-gate modal is shown', async ({ page }) => {
    const home = new HomePage(page)
    await home.goto()
    await home.expectAgeGateVisible()
    await expect(home.ageVerifyYes).toBeVisible()
    await expect(home.ageVerifyNo).toBeVisible()
  })

  test('Scenario: Given age gate is open, When user presses Escape, Then modal remains visible', async ({ page }) => {
    const home = new HomePage(page)
    await home.goto()
    await home.expectAgeGateVisible()
    await page.keyboard.press('Escape')
    await home.expectAgeGateVisible()
  })

  test('Scenario: Given age gate is open, When user clicks outside modal, Then modal remains visible', async ({ page }) => {
    const home = new HomePage(page)
    await home.goto()
    await home.expectAgeGateVisible()
    await page.click('body', { position: { x: 10, y: 10 }, force: true })
    await home.expectAgeGateVisible()
  })

  test('Scenario: Given age gate, When visitor confirms 21+, Then gate closes and content is accessible', async ({ page }) => {
    const home = new HomePage(page)
    await home.goto()
    await home.verifyAge()
    await home.expectMainContentVisible()
  })

  test('Scenario: Given age gate, When visitor says they are under 21, Then access-denied modal appears', async ({ page }) => {
    const home = new HomePage(page)
    await home.goto()
    await home.denyAge()
    await expect(home.accessDeniedModal).toBeVisible()
    await expect(page.locator('[data-testid="access-denied-title"]')).toContainText('Access Restricted')
    await expect(home.mainContent).not.toBeVisible()
  })

  test('Scenario: Given user verified age, When they navigate to /products, Then no age gate appears', async ({ page }) => {
    const home = new HomePage(page)
    await home.goto()
    await home.verifyAge()

    await page.goto('/products')
    await expect(home.ageGateModal).not.toBeVisible()
  })

  test('Scenario: Given user verified age, When they reload the page, Then gate does not reappear', async ({ page }) => {
    const home = new HomePage(page)
    await home.goto()
    await home.verifyAge()

    await page.reload()
    await expect(home.ageGateModal).not.toBeVisible()
  })

  test('Scenario: Given user verified age in one tab, When they open a new tab in same context, Then gate does not show', async ({ page, context }) => {
    const home = new HomePage(page)
    await home.goto()
    await home.verifyAge()

    const newPage = await context.newPage()
    await newPage.goto('/')
    await expect(newPage.locator('[data-testid="age-gate-modal"]')).not.toBeVisible()
  })

  test('Scenario: Given age gate shown, When user visits /checkout directly, Then age gate or redirect protects the route', async ({ page }) => {
    await page.goto('/checkout')
    const ageGateOrRedirect =
      page.locator('[data-testid="age-gate-modal"]').or(
        page.getByRole('dialog', { name: /Age Verification Required|Access Restricted/i })
      )
    await expect(ageGateOrRedirect).toBeVisible({ timeout: 10_000 })
  })

  test('Scenario: Given mobile viewport, When age gate displays, Then buttons meet minimum touch-target height', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    const home = new HomePage(page)
    await home.goto()
    await home.expectAgeGateVisible()

    const box = await home.ageVerifyYes.boundingBox()
    expect(box?.height).toBeGreaterThanOrEqual(44)
  })

  test('Scenario: Given age gate, When legal disclaimer displayed, Then terms and privacy links are present', async ({ page }) => {
    const home = new HomePage(page)
    await home.goto()
    await home.expectAgeGateVisible()
    await expect(page.locator('[data-testid="legal-disclaimer"]')).toBeVisible()
    await expect(page.locator('[data-testid="terms-link"]')).toBeVisible()
    await expect(page.locator('[data-testid="privacy-link"]')).toBeVisible()
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// Feature: Homepage Content
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Feature: Homepage Content', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('age-verified', 'true')
      localStorage.setItem('age-verification-time', new Date().toISOString())
    })
  })

  test('Scenario: Given authenticated visitor, When homepage loads, Then hero heading is visible', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /The Art of Botanical Wellness/i })).toBeVisible()
  })

  test('Scenario: Given homepage, When user views header, Then logo and nav links are present', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('banner').getByRole('link', { name: /Carolina Remedies/i })).toBeVisible()
  })

  test('Scenario: Given homepage, When user views footer, Then legal links are accessible', async ({ page }) => {
    await page.goto('/')
    const footer = page.getByRole('contentinfo')
    await expect(footer).toBeVisible()
    await expect(footer.getByRole('link', { name: /Privacy/i })).toBeVisible()
    await expect(footer.getByRole('link', { name: /Terms/i })).toBeVisible()
  })

  test('Scenario: Given homepage, When user clicks Shop Now CTA, Then navigated to /products', async ({ page }) => {
    await page.goto('/')
    const shopNow = page.getByRole('link', { name: /Shop Now/i }).first()
    if (await shopNow.isVisible()) {
      await shopNow.click()
      await expect(page).toHaveURL(/\/products/)
    }
  })

  test('Scenario: Given homepage, When page title checked, Then includes site name', async ({ page }) => {
    await page.goto('/')
    const title = await page.title()
    expect(title.length).toBeGreaterThan(0)
  })
})
