/**
 * BDD Feature: Shopping Cart
 *
 * Scenario-driven tests covering cart state, CRUD operations,
 * persistence, totals calculation, and edge cases.
 */

import { test, expect, type Page } from '@playwright/test'
import { CartPage, ProductsPage } from '../support/pages'

const bypassAge = async (page: Page) => {
  await page.addInitScript(() => {
    localStorage.setItem('age-verified', 'true')
    localStorage.setItem('age-verification-time', new Date().toISOString())
  })
}

const addProductToCart = async (page: Page, productIndex = 0) => {
  const products = new ProductsPage(page)
  await products.goto()
  await products.openProductAt(productIndex)
  await page.locator('[data-testid="add-to-cart-btn"]').click()
  await expect(page.locator('[data-testid="cart-notification"]').last()).toContainText('added to cart')
}

// ──────────────────────────────────────────────────────────────────────────────
// Feature: Cart State Management
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Feature: Cart State Management', () => {
  test.beforeEach(async ({ page }) => {
    await bypassAge(page)
  })

  test('Scenario: Given empty cart, When opened, Then empty state message is displayed', async ({ page }) => {
    const cart = new CartPage(page)
    await page.goto('/')
    await cart.open()
    await cart.expectEmpty()
  })

  test('Scenario: Given empty cart, When cart counter visible, Then it shows zero', async ({ page }) => {
    await page.goto('/')
    const countEl = page.locator('[data-testid="cart-count"]')
    if (await countEl.isVisible()) {
      const text = await countEl.textContent()
      expect(parseInt(text ?? '0', 10)).toBe(0)
    }
  })

  test('Scenario: Given product page, When add-to-cart clicked, Then cart counter increments by 1', async ({ page }) => {
    const cart = new CartPage(page)
    await page.goto('/products')
    const initial = await cart.getCartItemCount()

    await addProductToCart(page, 0)
    await expect(page.locator('[data-testid="cart-count"]')).toContainText((initial + 1).toString())
  })

  test('Scenario: Given product in cart, When quick-add on listing clicked, Then count increases again', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.goto()
    const cart = new CartPage(page)
    const before = await cart.getCartItemCount()

    await products.quickAddToCart(0)
    await expect(page.locator('[data-testid="cart-count"]')).toContainText((before + 1).toString())
  })

  test('Scenario: Given product added, When page is refreshed, Then cart persists across reload', async ({ page }) => {
    await addProductToCart(page, 0)
    const countBefore = await page.locator('[data-testid="cart-count"]').textContent()

    await page.reload()
    await expect(page.locator('[data-testid="age-gate-modal"]')).toHaveCount(0)
    await expect(page.locator('[data-testid="cart-count"]')).toContainText(countBefore ?? '1')
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// Feature: Cart Item Operations
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Feature: Cart Item Operations', () => {
  test.beforeEach(async ({ page }) => {
    await bypassAge(page)
  })

  test('Scenario: Given item in cart, When cart drawer opened, Then item is listed', async ({ page }) => {
    await addProductToCart(page, 0)
    const cart = new CartPage(page)
    await cart.open()
    const count = await cart.getItemCount()
    expect(count).toBeGreaterThan(0)
  })

  test('Scenario: Given item in cart, When quantity increased, Then cart item quantity updates', async ({ page }) => {
    await addProductToCart(page, 0)
    const cart = new CartPage(page)
    await cart.open()
    const initial = await cart.getQuantity(0)
    await cart.increaseQuantity(0)
    const updated = await cart.getQuantity(0)
    expect(updated).toBe(initial + 1)
  })

  test('Scenario: Given item in cart with quantity 2, When quantity decreased, Then quantity becomes 1', async ({ page }) => {
    await addProductToCart(page, 0)
    const cart = new CartPage(page)
    await cart.open()
    await cart.increaseQuantity(0)
    await cart.decreaseQuantity(0)
    const qty = await cart.getQuantity(0)
    expect(qty).toBe(1)
  })

  test('Scenario: Given item in cart, When remove button clicked, Then item disappears from cart', async ({ page }) => {
    await addProductToCart(page, 0)
    const cart = new CartPage(page)
    await cart.open()
    const before = await cart.getItemCount()
    await cart.removeItem(0)
    const after = await cart.getItemCount()
    expect(after).toBe(before - 1)
  })

  test('Scenario: Given single item in cart, When item removed, Then empty state is shown', async ({ page }) => {
    await addProductToCart(page, 0)
    const cart = new CartPage(page)
    await cart.open()
    await cart.removeItem(0)
    await cart.expectEmpty()
  })

  test('Scenario: Given multiple items in cart, When subtotal displayed, Then it equals sum of line-item totals', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.goto()
    await products.quickAddToCart(0)
    await products.quickAddToCart(1)

    const cart = new CartPage(page)
    await cart.open()

    const lineItems = await page.locator('[data-testid="cart-item-total"]').allTextContents()
    const expectedTotal = lineItems.reduce(
      (sum, t) => sum + parseFloat(t.replace(/[^\d.]/g, '') || '0'),
      0,
    )
    const subtotalText = await cart.cartSubtotal.textContent()
    const actualTotal = parseFloat(subtotalText?.replace(/[^\d.]/g, '') ?? '0')
    expect(actualTotal).toBeCloseTo(expectedTotal, 2)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// Feature: Cart Navigation
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Feature: Cart Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await bypassAge(page)
  })

  test('Scenario: Given item in cart, When checkout button clicked, Then navigated to /checkout', async ({ page }) => {
    await addProductToCart(page, 0)
    const cart = new CartPage(page)
    await cart.open()
    await cart.proceedToCheckout()
    await expect(page).toHaveURL(/checkout/)
  })

  test('Scenario: Given cart drawer open, When close button clicked, Then drawer closes', async ({ page }) => {
    await page.goto('/products')
    const products = new ProductsPage(page)
    await products.quickAddToCart(0)

    const cart = new CartPage(page)
    await cart.open()

    const closeBtn = page.locator('[data-testid="cart-close-btn"]').or(
      page.getByRole('button', { name: /close/i })
    ).first()
    if (await closeBtn.isVisible()) {
      await closeBtn.click()
      await expect(cart.cartDrawer).not.toBeVisible()
    }
  })

  test('Scenario: Given cart drawer open, When continue shopping link clicked, Then drawer closes or user navigated to products', async ({ page }) => {
    await page.goto('/products')
    const products = new ProductsPage(page)
    await products.quickAddToCart(0)

    const cart = new CartPage(page)
    await cart.open()

    const continueBtn = page.locator('[data-testid="continue-shopping"]')
    if (await continueBtn.isVisible()) {
      await continueBtn.click()
      await expect(page).toHaveURL(/\/products/)
    }
  })
})
