/**
 * BDD Feature: Product Discovery
 *
 * Scenario-driven tests for product listing, filtering, searching,
 * sorting, and product detail pages.
 */

import { test, expect } from '@playwright/test'
import { ProductsPage } from '../support/pages'

const bypassAge = async (page: import('@playwright/test').Page) => {
  await page.addInitScript(() => {
    localStorage.setItem('age-verified', 'true')
    localStorage.setItem('age-verification-time', new Date().toISOString())
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// Feature: Product Listing Page
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Feature: Product Listing Page', () => {
  test.beforeEach(async ({ page }) => {
    await bypassAge(page)
  })

  test('Scenario: Given /products page, When it loads, Then product grid is visible', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.goto()
    await expect(products.productGrid).toBeVisible()
    const count = await products.getProductCount()
    expect(count).toBeGreaterThan(0)
  })

  test('Scenario: Given products page, When loaded, Then at least 50 products are displayed', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.goto()
    const count = await products.getProductCount()
    expect(count).toBeGreaterThanOrEqual(50)
  })

  test('Scenario: Given products page, When category tabs render, Then key categories are present', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.goto()
    await expect(page.locator('[data-testid="category-flower"]')).toBeVisible()
    await expect(page.locator('[data-testid="category-edibles"]')).toBeVisible()
    await expect(page.locator('[data-testid="category-concentrates"]')).toBeVisible()
  })

  test('Scenario: Given products page, When user filters by Flower category, Then URL reflects filter and products match', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.goto()

    const flowerLink = page.locator('[data-testid="category-flower"]')
    const href = await flowerLink.getAttribute('href')
    if (href) {
      await page.goto(href, { waitUntil: 'domcontentloaded' })
    } else {
      await flowerLink.click()
    }

    await expect(page).toHaveURL(/category=flower/)
    const count = await products.getProductCount()
    expect(count).toBeGreaterThan(0)
  })

  test('Scenario: Given products page, When user filters by Edibles, Then URL reflects edibles filter', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.goto()

    const link = page.locator('[data-testid="category-edibles"]')
    const href = await link.getAttribute('href')
    if (href) await page.goto(href, { waitUntil: 'domcontentloaded' })
    else await link.click()

    await expect(page).toHaveURL(/category=edibles/)
  })

  test('Scenario: Given products page, When category filter applied, Then All Products link resets filter', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.gotoCategory('flower')

    const allLink = page.locator('[data-testid="category-all"]')
    if (await allLink.isVisible()) {
      await allLink.click()
      await expect(page).toHaveURL(/\/products/)
    }
  })

  test('Scenario: Given products page, When searching for indica, Then results contain indica', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.goto()

    const searchInput = page.locator('[data-testid="product-search"]')
    if (await searchInput.isVisible()) {
      await products.searchFor('indica')
      await expect(page).toHaveURL(/search=indica/)

      const count = await products.getProductCount()
      if (count > 0) {
        const firstTitle = await products.productCards
          .first()
          .locator('[data-testid="product-title"]')
          .textContent()
        const firstDesc = await products.productCards
          .first()
          .locator('[data-testid="product-description"]')
          .textContent()
        const text = ((firstTitle ?? '') + (firstDesc ?? '')).toLowerCase()
        expect(text).toContain('indica')
      }
    }
  })

  test('Scenario: Given products page, When sorted by price ascending, Then prices are non-decreasing', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.goto()

    const sortLink = page.locator('[data-testid="sort-price-asc"]')
    if (await sortLink.isVisible()) {
      const href = await sortLink.getAttribute('href')
      if (href) await page.goto(href, { waitUntil: 'domcontentloaded' })
      else await sortLink.click()

      await expect(page).toHaveURL(/sort=price_asc/)

      const priceEls = page.locator('[data-testid="product-price"]')
      const count = await priceEls.count()
      if (count >= 2) {
        const prices: number[] = []
        for (let i = 0; i < Math.min(5, count); i++) {
          const text = await priceEls.nth(i).textContent()
          prices.push(parseFloat(text?.replace(/[^0-9.]/g, '') ?? '0'))
        }
        for (let i = 1; i < prices.length; i++) {
          expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1])
        }
      }
    }
  })

  test('Scenario: Given products page, When out-of-stock product exists, Then it is visually marked', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.goto()

    const outOfStock = page.locator('[data-testid="out-of-stock-badge"]')
    if (await outOfStock.first().isVisible()) {
      await expect(outOfStock.first()).toContainText(/out of stock/i)
    }
  })

  test('Scenario: Given products page, When each product card rendered, Then name and price are visible', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.goto()

    const cards = products.productCards
    const count = Math.min(await cards.count(), 5)

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i)
      await expect(card.locator('[data-testid="product-title"]')).toBeVisible()
      await expect(card.locator('[data-testid="product-price"]')).toBeVisible()
    }
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// Feature: Product Detail Page
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Feature: Product Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    await bypassAge(page)
  })

  test('Scenario: Given product listing, When user clicks a product, Then navigated to detail page', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.goto()
    await products.openProductAt(0)
    await expect(page).toHaveURL(/\/products\//)
  })

  test('Scenario: Given product detail page, When loaded, Then title, price, description, image and CTA are visible', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.goto()
    await products.openProductAt(0)

    await expect(page.locator('[data-testid="product-title"]')).toBeVisible()
    await expect(page.locator('[data-testid="product-price"]')).toBeVisible()
    await expect(page.locator('[data-testid="product-description"]')).toBeVisible()
    await expect(page.locator('[data-testid="product-image"]')).toBeVisible()
    await expect(page.locator('[data-testid="add-to-cart-btn"]')).toBeVisible()
  })

  test('Scenario: Given product detail, When specifications shown, Then THC, CBD, category are present', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.goto()
    await products.openProductAt(0)

    await expect(page.locator('[data-testid="product-thc"]')).toBeVisible()
    await expect(page.locator('[data-testid="product-cbd"]')).toBeVisible()
    await expect(page.locator('[data-testid="product-category"]')).toBeVisible()
  })

  test('Scenario: Given product detail, When variant options exist, Then user can select them', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.goto()
    await products.openProductAt(0)

    const variantOptions = page.locator('[data-testid="variant-option"]')
    const count = await variantOptions.count()
    if (count > 0) {
      await variantOptions.first().click()
      // Price or selection state should update
      await expect(page.locator('[data-testid="product-price"]')).toBeVisible()
    }
  })

  test('Scenario: Given product detail, When add-to-cart clicked, Then cart counter increments', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.goto()
    await products.openProductAt(0)

    const cartCount = page.locator('[data-testid="cart-count"]')
    const initialText = await cartCount.textContent()
    const initial = parseInt(initialText ?? '0', 10)

    await page.locator('[data-testid="add-to-cart-btn"]').click()
    await expect(cartCount).toContainText((initial + 1).toString())
  })

  test('Scenario: Given product detail, When add-to-cart clicked, Then success notification appears', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.goto()
    await products.openProductAt(0)

    await page.locator('[data-testid="add-to-cart-btn"]').click()
    await expect(page.locator('[data-testid="cart-notification"]').last()).toContainText('added to cart')
  })

  test('Scenario: Given product detail with breadcrumb, When breadcrumb visible, Then links back to products', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.goto()
    await products.openProductAt(0)

    const breadcrumb = page.locator('[data-testid="breadcrumb"]')
    if (await breadcrumb.isVisible()) {
      const backLink = breadcrumb.getByRole('link', { name: /Products/i })
      await expect(backLink).toBeVisible()
      await backLink.click()
      await expect(page).toHaveURL(/\/products/)
    }
  })

  test('Scenario: Given product detail, When related products section present, Then shows at least one product', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.goto()
    await products.openProductAt(0)

    const related = page.locator('[data-testid="related-products"]')
    if (await related.isVisible()) {
      const items = related.locator('[data-testid="product-card"]')
      const count = await items.count()
      expect(count).toBeGreaterThan(0)
    }
  })
})
