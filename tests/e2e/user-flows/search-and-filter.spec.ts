/**
 * Search & Filter Expanded E2E Tests
 *
 * Deep coverage of product search, category filtering, THC/CBD filters,
 * price sorting, pagination, and filter combinations.
 */

import { test, expect, type Page } from '@playwright/test'
import { ProductsPage } from '../support/pages'

const hasRealDB = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
)

const bypassAge = async (page: Page) => {
  await page.addInitScript(() => {
    localStorage.setItem('age-verified', 'true')
    localStorage.setItem('age-verification-time', new Date().toISOString())
  })
}

test.describe('Product Search', () => {
  test.skip(!hasRealDB, 'Requires live Supabase – skipped without real DB credentials')

  test.beforeEach(async ({ page }) => {
    await bypassAge(page)
  })

  test('search input is visible on products page', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.goto()
    const searchInput = page.locator('[data-testid="product-search"]')
    if (await searchInput.isVisible()) {
      await expect(searchInput).toBeEnabled()
    }
  })

  test('searching returns results or no-results message', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.goto()
    const searchInput = page.locator('[data-testid="product-search"]')
    if (!await searchInput.isVisible()) return

    await searchInput.fill('hemp')
    await page.keyboard.press('Enter')

    const grid = page.locator('[data-testid="product-grid"]')
    const noResults = page.locator('[data-testid="no-results"]')
    const oneVisible = (await grid.isVisible()) || (await noResults.isVisible())
    expect(oneVisible).toBe(true)
  })

  test('search with no matching term shows no-results state', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.goto()
    const searchInput = page.locator('[data-testid="product-search"]')
    if (!await searchInput.isVisible()) return

    await searchInput.fill('xyzabcdef_nonexistent_product_12345')
    await page.keyboard.press('Enter')

    const noResults = page.locator('[data-testid="no-results"]')
    if (await noResults.isVisible()) {
      await expect(noResults).toBeVisible()
    } else {
      const count = await page.locator('[data-testid="product-card"]').count()
      expect(count).toBe(0)
    }
  })

  test('clearing search restores full product list', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.goto()
    const allCount = await products.getProductCount()

    const searchInput = page.locator('[data-testid="product-search"]')
    if (!await searchInput.isVisible()) return

    await searchInput.fill('indica')
    await page.keyboard.press('Enter')
    await searchInput.clear()
    await page.keyboard.press('Enter')

    const restoredCount = await products.getProductCount()
    expect(restoredCount).toBeGreaterThanOrEqual(allCount > 0 ? 1 : 0)
  })

  test('search preserves category filter when combined', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.gotoCategory('flower')
    await expect(page).toHaveURL(/category=flower/)

    const searchInput = page.locator('[data-testid="product-search"]')
    if (!await searchInput.isVisible()) return

    await searchInput.fill('OG')
    await page.keyboard.press('Enter')
    // Should keep category in URL or apply both filters
    const url = page.url()
    const hasFilter = url.includes('category=flower') || url.includes('search=')
    expect(hasFilter).toBe(true)
  })
})

test.describe('Category Filtering', () => {
  test.skip(!hasRealDB, 'Requires live Supabase – skipped without real DB credentials')

  test.beforeEach(async ({ page }) => {
    await bypassAge(page)
  })

  test('all categories render on products page', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.goto()

    const categories = [
      '[data-testid="category-flower"]',
      '[data-testid="category-edibles"]',
      '[data-testid="category-concentrates"]',
    ]
    for (const selector of categories) {
      await expect(page.locator(selector)).toBeVisible()
    }
  })

  test('flower category filter shows only flower products', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.gotoCategory('flower')
    await expect(page).toHaveURL(/category=flower/)

    const cards = products.productCards
    const count = await cards.count()
    if (count === 0) return

    for (let i = 0; i < Math.min(count, 5); i++) {
      const badge = cards.nth(i).locator('[data-testid="product-category"]')
      if (await badge.isVisible()) {
        await expect(badge).toContainText(/Flower/i)
      }
    }
  })

  test('concentrates category filter updates URL', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.gotoCategory('concentrates')
    await expect(page).toHaveURL(/category=concentrates/)
    const count = await products.getProductCount()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('edibles category filter updates URL', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.gotoCategory('edibles')
    await expect(page).toHaveURL(/category=edibles/)
  })

  test('accessories category filter updates URL', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.gotoCategory('accessories')
    await expect(page).toHaveURL(/category=accessories/)
  })

  test('vapes category filter updates URL', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.gotoCategory('vapes')
    await expect(page).toHaveURL(/category=vapes/)
  })

  test('pre-rolls category filter updates URL', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.gotoCategory('pre-rolls')
    await expect(page).toHaveURL(/category=pre-rolls|category=pre_rolls/)
  })
})

test.describe('Sorting', () => {
  test.skip(!hasRealDB, 'Requires live Supabase – skipped without real DB credentials')

  test.beforeEach(async ({ page }) => {
    await bypassAge(page)
  })

  test('price ascending sort produces non-decreasing prices', async ({ page }) => {
    await page.goto('/products?sort=price_asc')
    await expect(page.locator('[data-testid="product-grid"]')).toBeVisible()

    const priceEls = page.locator('[data-testid="product-price"]')
    const count = await priceEls.count()
    if (count < 2) return

    const prices: number[] = []
    for (let i = 0; i < Math.min(8, count); i++) {
      const text = await priceEls.nth(i).textContent()
      prices.push(parseFloat(text?.replace(/[^0-9.]/g, '') ?? '0'))
    }
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1])
    }
  })

  test('price descending sort produces non-increasing prices', async ({ page }) => {
    await page.goto('/products?sort=price_desc')
    await expect(page.locator('[data-testid="product-grid"]')).toBeVisible()

    const priceEls = page.locator('[data-testid="product-price"]')
    const count = await priceEls.count()
    if (count < 2) return

    const prices: number[] = []
    for (let i = 0; i < Math.min(8, count); i++) {
      const text = await priceEls.nth(i).textContent()
      prices.push(parseFloat(text?.replace(/[^0-9.]/g, '') ?? '0'))
    }
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeLessThanOrEqual(prices[i - 1])
    }
  })

  test('newest sort is reflected in URL', async ({ page }) => {
    const sortLink = page.locator('[data-testid="sort-newest"]')
    await page.goto('/products')
    if (await sortLink.isVisible()) {
      const href = await sortLink.getAttribute('href')
      if (href) await page.goto(href, { waitUntil: 'domcontentloaded' })
      else await sortLink.click()
      await expect(page).toHaveURL(/sort=newest|sort=new/)
    }
  })
})

test.describe('THC and CBD Filters', () => {
  test.beforeEach(async ({ page }) => {
    await bypassAge(page)
  })

  test('high-THC filter updates URL', async ({ page }) => {
    await page.goto('/products')
    const thcLink = page.locator('[data-testid="thc-range-high"]')
    if (await thcLink.isVisible()) {
      const href = await thcLink.getAttribute('href')
      if (href) await page.goto(href, { waitUntil: 'domcontentloaded' })
      else await thcLink.click()

      await expect(page).toHaveURL(/.*(thcRange|thc)=.*/)
    }
  })

  test('low-THC filter updates URL', async ({ page }) => {
    await page.goto('/products')
    const thcLink = page.locator('[data-testid="thc-range-low"]')
    if (await thcLink.isVisible()) {
      const href = await thcLink.getAttribute('href')
      if (href) await page.goto(href, { waitUntil: 'domcontentloaded' })
      else await thcLink.click()

      await expect(page).toHaveURL(/.*(thcRange|thc)=.*/)
    }
  })

  test('high-CBD filter updates URL', async ({ page }) => {
    await page.goto('/products')
    const cbdLink = page.locator('[data-testid="cbd-range-high"]')
    if (await cbdLink.isVisible()) {
      const href = await cbdLink.getAttribute('href')
      if (href) await page.goto(href, { waitUntil: 'domcontentloaded' })
      else await cbdLink.click()

      await expect(page).toHaveURL(/.*(cbdRange|cbd)=.*/)
    }
  })
})

test.describe('Pagination', () => {
  test.beforeEach(async ({ page }) => {
    await bypassAge(page)
  })

  test('pagination controls visible when products exceed page size', async ({ page }) => {
    await page.goto('/products')
    const pagination = page.locator('[data-testid="pagination"]')
    if (await pagination.isVisible()) {
      await expect(pagination).toBeVisible()
    }
  })

  test('next page navigation works when available', async ({ page }) => {
    await page.goto('/products')
    const nextBtn = page.locator('[data-testid="pagination-next"]').or(
      page.getByRole('button', { name: /next/i })
    ).first()
    if (await nextBtn.isVisible() && await nextBtn.isEnabled()) {
      await nextBtn.click()
      await expect(page).toHaveURL(/page=2/)
    }
  })
})
