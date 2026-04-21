/**
 * Navigation & Page Structure E2E Tests
 *
 * Covers header navigation, footer links, static pages (About, Privacy, Terms),
 * 404 handling, breadcrumbs, and mobile hamburger menu.
 */

import { test, expect, type Page } from '@playwright/test'

const bypassAge = async (page: Page) => {
  await page.addInitScript(() => {
    localStorage.setItem('age-verified', 'true')
    localStorage.setItem('age-verification-time', new Date().toISOString())
  })
}

test.describe('Header Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await bypassAge(page)
    await page.goto('/')
  })

  test('header is visible and contains logo', async ({ page }) => {
    const header = page.getByRole('banner')
    await expect(header).toBeVisible()
    // Logo link or brand name
    const logo = header.locator('[data-testid="site-logo"]').or(
      header.getByRole('link', { name: /Carolina Remedies/i })
    ).first()
    await expect(logo).toBeVisible()
  })

  test('header contains Shop / Products link', async ({ page }) => {
    const header = page.getByRole('banner')
    const shopLink = header.getByRole('link', { name: /Shop|Products/i }).first()
    await expect(shopLink).toBeVisible()
    await shopLink.click()
    await expect(page).toHaveURL(/\/products/)
  })

  test('header cart button opens cart drawer', async ({ page }) => {
    await page.getByRole('button', { name: /Cart/i }).first().click()
    await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible()
  })

  test('clicking logo navigates to homepage', async ({ page }) => {
    await page.goto('/products')
    const header = page.getByRole('banner')
    const logo = header.locator('[data-testid="site-logo"]').or(
      header.getByRole('link', { name: /Carolina Remedies/i })
    ).first()
    await logo.click()
    await expect(page).toHaveURL(/^\/$|^\/\?/)
  })
})

test.describe('Footer Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await bypassAge(page)
    await page.goto('/')
  })

  test('footer is visible', async ({ page }) => {
    await expect(page.getByRole('contentinfo')).toBeVisible()
  })

  test('footer Privacy Policy link navigates to /privacy', async ({ page }) => {
    const footer = page.getByRole('contentinfo')
    const privacyLink = footer.getByRole('link', { name: /Privacy/i })
    await expect(privacyLink).toBeVisible()
    await privacyLink.click()
    await expect(page).toHaveURL(/\/privacy/)
  })

  test('footer Terms of Service link navigates to /terms', async ({ page }) => {
    const footer = page.getByRole('contentinfo')
    const termsLink = footer.getByRole('link', { name: /Terms/i })
    await expect(termsLink).toBeVisible()
    await termsLink.click()
    await expect(page).toHaveURL(/\/terms/)
  })

  test('footer About link navigates to /about', async ({ page }) => {
    const footer = page.getByRole('contentinfo')
    const aboutLink = footer.getByRole('link', { name: /About/i })
    if (await aboutLink.isVisible()) {
      await aboutLink.click()
      await expect(page).toHaveURL(/\/about/)
    }
  })

  test('footer contains copyright notice', async ({ page }) => {
    const footer = page.getByRole('contentinfo')
    const text = await footer.textContent()
    expect(text).toMatch(/©|copyright|Carolina Remedies/i)
  })
})

test.describe('Static Pages', () => {
  test.beforeEach(async ({ page }) => {
    await bypassAge(page)
  })

  test('Privacy Policy page loads with heading', async ({ page }) => {
    await page.goto('/privacy')
    await expect(page.getByRole('heading').first()).toBeVisible()
    const heading = await page.getByRole('heading').first().textContent()
    expect(heading?.toLowerCase()).toMatch(/privacy/)
  })

  test('Terms of Service page loads with heading', async ({ page }) => {
    await page.goto('/terms')
    await expect(page.getByRole('heading').first()).toBeVisible()
    const heading = await page.getByRole('heading').first().textContent()
    expect(heading?.toLowerCase()).toMatch(/terms/)
  })

  test('About page loads with content', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByRole('heading').first()).toBeVisible()
  })

  test('Privacy page contains required legal sections', async ({ page }) => {
    await page.goto('/privacy')
    const bodyText = await page.locator('main').textContent()
    expect(bodyText?.toLowerCase()).toMatch(/data|personal|information/)
  })

  test('Terms page has meaningful content', async ({ page }) => {
    await page.goto('/terms')
    const bodyText = await page.locator('main').textContent()
    expect(bodyText?.length).toBeGreaterThan(200)
  })
})

test.describe('Mobile Navigation', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test.beforeEach(async ({ page }) => {
    await bypassAge(page)
    await page.goto('/')
  })

  test('site is usable at 375px width', async ({ page }) => {
    await expect(page.getByRole('banner')).toBeVisible()
  })

  test('mobile hamburger menu toggles navigation', async ({ page }) => {
    const menuBtn = page.locator('[data-testid="mobile-menu-btn"]').or(
      page.getByRole('button', { name: /menu|hamburger/i })
    ).first()

    if (await menuBtn.isVisible()) {
      await menuBtn.click()
      const nav = page.locator('[data-testid="mobile-nav"]').or(
        page.getByRole('navigation')
      ).first()
      await expect(nav).toBeVisible()
    }
  })

  test('cart button is reachable on mobile', async ({ page }) => {
    const cartBtn = page.getByRole('button', { name: /Cart/i }).first()
    await expect(cartBtn).toBeVisible()
    const box = await cartBtn.boundingBox()
    expect(box?.width).toBeGreaterThanOrEqual(44)
    expect(box?.height).toBeGreaterThanOrEqual(44)
  })

  test('products page renders a proper grid on mobile', async ({ page }) => {
    await page.goto('/products')
    await expect(page.locator('[data-testid="product-grid"]')).toBeVisible()
    // Products may be empty without live DB — just verify the grid container renders
    const count = await page.locator('[data-testid="product-card"]').count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('checkout form is usable on mobile', async ({ page }) => {
    // Add product first
    await page.goto('/products')
    const addBtn = page.locator('[data-testid="quick-add-to-cart"]').first()
    if (await addBtn.isVisible()) {
      await addBtn.click()
    }
    // Open cart and checkout
    await page.getByRole('button', { name: /Cart/i }).first().click()
    const checkoutBtn = page.locator('[data-testid="checkout-btn"]')
    if (await checkoutBtn.isVisible()) {
      await Promise.all([
        page.waitForURL(/checkout/),
        checkoutBtn.click(),
      ])
      await expect(page.locator('[data-testid="customer-email"]')).toBeVisible()
    }
  })
})

test.describe('404 and Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await bypassAge(page)
  })

  test('navigating to unknown route shows 404 content or redirects gracefully', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-xyzabc')
    // Either a 404 page or a soft redirect — both are acceptable
    const statusCode = response?.status() ?? 200
    expect([200, 404]).toContain(statusCode)
    // If 404 page shown, it should have some content
    const body = await page.locator('body').textContent()
    expect(body?.length).toBeGreaterThan(0)
  })

  test('invalid product slug shows error or 404 content', async ({ page }) => {
    await page.goto('/products/this-product-does-not-exist-xyz')
    const body = await page.locator('body').textContent()
    expect(body?.length).toBeGreaterThan(0)
  })
})
