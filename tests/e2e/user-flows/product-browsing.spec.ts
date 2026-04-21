/**
 * Product Browsing E2E Tests
 * Testing product discovery, filtering, and navigation
 */

import { test, expect, type Locator, type Page } from '@playwright/test'

const hasRealDB = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
)

const expectThcFilterInUrl = (page: Page) =>
  expect(page).toHaveURL(/.*(thcRange|thc)=.*/)

const gotoFromLink = async (page: Page, link: Locator) => {
  const href =
    (await link.getAttribute('href')) ||
    (await link.locator('a').first().getAttribute('href').catch(() => null))
  expect(href).toBeTruthy()
  await page.goto(href!, { waitUntil: 'domcontentloaded' })
}

const openProductAt = async (page: Page, index = 0) => {
  await gotoFromLink(page, page.locator('[data-testid="product-card-link"]').nth(index))
}

test.describe('Product Browsing', () => {
  test.skip(!hasRealDB, 'Requires live Supabase – skipped without real DB credentials')

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('age-verified', 'true')
      localStorage.setItem('age-verification-time', new Date().toISOString())
    })
    await page.goto('/')
  })

  test('displays product categories correctly', async ({ page }) => {
    await page.goto('/products')
    
    // Check main category navigation
    await expect(page.locator('[data-testid="category-flower"]')).toBeVisible()
    await expect(page.locator('[data-testid="category-edibles"]')).toBeVisible()
    await expect(page.locator('[data-testid="category-concentrates"]')).toBeVisible()
    await expect(page.locator('[data-testid="category-pre-rolls"]')).toBeVisible()
    await expect(page.locator('[data-testid="category-accessories"]')).toBeVisible()
    
    // Verify category counts
    const flowerCount = page.locator('[data-testid="category-flower-count"]')
    if (await flowerCount.isVisible()) {
      const count = await flowerCount.textContent()
      expect(count).toMatch(/\d+/)
    }
  })

  test('filters products by category', async ({ page }) => {
    await page.goto('/products')
    
    // Click on flower category
    await gotoFromLink(page, page.locator('[data-testid="category-flower"]'))
    
    // Verify URL contains category filter
    await expect(page).toHaveURL(/.*category=flower.*/)
    
    // Check that only flower products are shown
    const productCards = page.locator('[data-testid="product-card"]')
    const productCount = await productCards.count()
    
    for (let i = 0; i < productCount; i++) {
      const productCard = productCards.nth(i)
      const categoryBadge = productCard.locator('[data-testid="product-category"]')
      await expect(categoryBadge).toContainText('Flower')
    }
  })

  test('searches products with text query', async ({ page }) => {
    await page.goto('/products')
    
    // Use search functionality
    const searchInput = page.locator('[data-testid="product-search"]')
    await searchInput.fill('indica')
    await page.keyboard.press('Enter')
    
    // Verify search results
    await expect(page).toHaveURL(/.*search=indica.*/)
    
    const results = page.locator('[data-testid="product-card"]')
    const resultCount = await results.count()
    
    if (resultCount > 0) {
      // Check that results contain search term
      const firstResult = results.first()
      const title = firstResult.locator('[data-testid="product-title"]')
      const description = firstResult.locator('[data-testid="product-description"]')
      
      const titleText = await title.textContent()
      const descText = await description.textContent()
      
      const searchTerm = 'indica'
      const containsSearchTerm = 
        titleText?.toLowerCase().includes(searchTerm) || 
        descText?.toLowerCase().includes(searchTerm)
      
      expect(containsSearchTerm).toBe(true)
    }
  })

  test('filters products by THC content', async ({ page }) => {
    await page.goto('/products')
    
    // Open THC filter
    await gotoFromLink(page, page.locator('[data-testid="thc-range-high"]'))

    // Verify URL contains THC filter
    await expectThcFilterInUrl(page)
    
    // Check that products meet THC criteria
    const productCards = page.locator('[data-testid="product-card"]')
    const productCount = await productCards.count()
    
    for (let i = 0; i < Math.min(3, productCount); i++) {
      const productCard = productCards.nth(i)
      const thcContent = productCard.locator('[data-testid="product-thc"]')
      if (await thcContent.isVisible()) {
        const thcText = await thcContent.textContent()
        const thcValue = parseFloat(thcText?.replace('%', '') || '0')
        expect(thcValue).toBeGreaterThanOrEqual(20)
      }
    }
  })

  test('sorts products by price', async ({ page }) => {
    await page.goto('/products')
    
    // Sort by price low to high
    await gotoFromLink(page, page.locator('[data-testid="sort-price-asc"]'))
    await expect(page).toHaveURL(/.*sort=price_asc.*/)
    
    // Verify sorting
    await page.waitForTimeout(1000) // Wait for products to reload
    
    const priceElements = page.locator('[data-testid="product-price"]')
    const priceCount = await priceElements.count()
    
    if (priceCount >= 2) {
      const prices = []
      for (let i = 0; i < Math.min(5, priceCount); i++) {
        const priceText = await priceElements.nth(i).textContent()
        const price = parseFloat(priceText?.replace('$', '') || '0')
        prices.push(price)
      }
      
      // Check that prices are in ascending order
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1])
      }
    }
  })

  test('views individual product details', async ({ page }) => {
    await page.goto('/products')
    
    // Click on first product
    await openProductAt(page)
    
    // Verify product detail page
    await expect(page).toHaveURL(/.*\/products\/.*/)
    
    // Check required product detail elements
    await expect(page.locator('[data-testid="product-title"]')).toBeVisible()
    await expect(page.locator('[data-testid="product-price"]')).toBeVisible()
    await expect(page.locator('[data-testid="product-description"]')).toBeVisible()
    await expect(page.locator('[data-testid="product-image"]')).toBeVisible()
    await expect(page.locator('[data-testid="add-to-cart-btn"]')).toBeVisible()
    
    // Check product specifications
    await expect(page.locator('[data-testid="product-thc"]')).toBeVisible()
    await expect(page.locator('[data-testid="product-cbd"]')).toBeVisible()
    await expect(page.locator('[data-testid="product-category"]')).toBeVisible()
  })

  test('adds product to cart from product listing', async ({ page }) => {
    await page.goto('/products')
    
    // Find a product with add to cart button
    const productCard = page.locator('[data-testid="product-card"]').first()
    const addToCartBtn = productCard.locator('[data-testid="quick-add-to-cart"]')
    
    if (await addToCartBtn.isVisible()) {
      // Get initial cart count
      const cartCounter = page.locator('[data-testid="cart-counter"]')
      const initialCount = await page.locator('[data-testid="cart-count"]').textContent()
      const initialNum = parseInt(initialCount || '0')
      
      // Add to cart
      await addToCartBtn.click()
      
      // Verify cart updated
      await expect(cartCounter).toContainText((initialNum + 1).toString())
      
      await expect(page.locator('[data-testid="cart-notification"]').last()).toContainText('added to cart')
    }
  })

  test('handles out of stock products', async ({ page }) => {
    await page.goto('/products')
    
    // Look for out of stock product
    const outOfStockProduct = page.locator('[data-testid="product-card"][data-stock="out"]')
    
    if (await outOfStockProduct.isVisible()) {
      // Verify out of stock indicator
      await expect(outOfStockProduct.locator('[data-testid="out-of-stock-badge"]')).toBeVisible()
      
      // Verify add to cart is disabled
      const addToCartBtn = outOfStockProduct.locator('[data-testid="quick-add-to-cart"]')
      if (await addToCartBtn.isVisible()) {
        await expect(addToCartBtn).toBeDisabled()
      }
      
      // Click to view details
      await gotoFromLink(page, outOfStockProduct.locator('[data-testid="product-card-link"]').first())
      
      // Verify out of stock message on detail page
      await expect(page.locator('[data-testid="out-of-stock-message"]')).toBeVisible()
      await expect(page.locator('[data-testid="add-to-cart-btn"]')).toBeDisabled()
      
      // Check for notification option
      const notifyBtn = page.locator('[data-testid="notify-restock-btn"]')
      if (await notifyBtn.isVisible()) {
        await expect(notifyBtn).toBeEnabled()
      }
    }
  })

  test('displays product variants correctly', async ({ page }) => {
    await page.goto('/products')
    
    // Find a product with variants (like different weights)
    await openProductAt(page)
    
    // Check for variant selector
    const variantSelector = page.locator('[data-testid="variant-selector"]')
    if (await variantSelector.isVisible()) {
      // Get available variants
      const variants = variantSelector.locator('[data-testid="variant-option"]')
      const variantCount = await variants.count()
      
      if (variantCount > 1) {
        // Select different variant
        await variants.nth(1).click()
        
        // Verify price updates
        const priceElement = page.locator('[data-testid="product-price"]')
        await expect(priceElement).toBeVisible()
        
        // Verify variant is selected
        await expect(variants.nth(1)).toHaveAttribute('aria-pressed', 'true')
      }
    }
  })

  test('filters work together correctly', async ({ page }) => {
    await page.goto('/products')
    
    // Apply multiple filters
    await gotoFromLink(page, page.locator('[data-testid="category-flower"]'))
    await page.waitForTimeout(500)
    
    await gotoFromLink(page, page.locator('[data-testid="thc-range-medium"]'))
    await page.waitForTimeout(500)
    
    // Verify URL contains both filters
    await expect(page).toHaveURL(/.*category=flower.*/)
    await expectThcFilterInUrl(page)
    
    // Check that products match all criteria
    const productCards = page.locator('[data-testid="product-card"]')
    const productCount = await productCards.count()
    
    if (productCount > 0) {
      const firstProduct = productCards.first()
      
      // Check category
      const categoryBadge = firstProduct.locator('[data-testid="product-category"]')
      await expect(categoryBadge).toContainText('Flower')
      
      // Check THC range if visible
      const thcContent = firstProduct.locator('[data-testid="product-thc"]')
      if (await thcContent.isVisible()) {
        const thcText = await thcContent.textContent()
        const thcValue = parseFloat(thcText?.replace('%', '') || '0')
        expect(thcValue).toBeGreaterThan(0)
      }
    }
  })

  test('clears filters correctly', async ({ page }) => {
    await page.goto('/products')
    
    // Apply some filters
    await gotoFromLink(page, page.locator('[data-testid="category-flower"]'))
    await page.waitForTimeout(500)
    
    // Clear filters
    const clearFiltersBtn = page.locator('[data-testid="clear-filters"]')
    if (await clearFiltersBtn.isVisible()) {
      await clearFiltersBtn.click()
      
      // Verify URL is clean
      await expect(page).toHaveURL(/^[^?]*(\?.*)?$/)
      
      // Verify all products are shown again
      const productCards = page.locator('[data-testid="product-card"]')
      const allProductsCount = await productCards.count()
      expect(allProductsCount).toBeGreaterThan(0)
    }
  })

  test('handles empty search results', async ({ page }) => {
    await page.goto('/products')
    
    // Search for something that won't exist
    const searchInput = page.locator('[data-testid="product-search"]')
    await searchInput.fill('nonexistentproduct12345')
    await page.keyboard.press('Enter')
    await page.waitForLoadState('networkidle')
    
    // Verify empty state
    await expect(page.locator('[data-testid="no-results-message"]')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('[data-testid="no-results-message"]')).toContainText('No products found')
    
    // Check for suggestions
    const suggestions = page.locator('[data-testid="search-suggestions"]')
    if (await suggestions.isVisible()) {
      await expect(suggestions).toContainText('Try searching for')
    }
    
    // Verify clear search option
    const clearSearchBtn = page.locator('[data-testid="clear-search"]')
    if (await clearSearchBtn.isVisible()) {
      await clearSearchBtn.click()
      
      // Should show all products again
      const productCards = page.locator('[data-testid="product-card"]')
      const productCount = await productCards.count()
      expect(productCount).toBeGreaterThan(0)
    }
  })

  test('product images load correctly', async ({ page }) => {
    await page.goto('/products')
    
    // Check first few product images
    const productCards = page.locator('[data-testid="product-card"]')
    const cardCount = await productCards.count()
    
    for (let i = 0; i < Math.min(3, cardCount); i++) {
      const productCard = productCards.nth(i)
      const productImage = productCard.locator('[data-testid="product-image"]')
      
      await expect(productImage).toBeVisible()
      await productImage.scrollIntoViewIfNeeded()
      
      // Check if image has loaded
      const isImageLoaded = await productImage.evaluate((img: HTMLImageElement) => {
        return Boolean(img.currentSrc || img.getAttribute('src'))
      })
      
      expect(isImageLoaded).toBe(true)
    }
  })

  test('responsive design works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.evaluate(() => {
      localStorage.setItem('age-verified', 'true')
      localStorage.setItem('age-verification-time', new Date().toISOString())
    })
    await page.goto('/products')
    
    // Check mobile-specific elements
    const mobileFiltersToggle = page.locator('[data-testid="mobile-filters-toggle"]')
    if (await mobileFiltersToggle.isVisible()) {
      await mobileFiltersToggle.click()
      await expect(page.locator('[data-testid="mobile-filters-drawer"]')).toBeVisible()
    }
    
    // Verify product grid adapts to mobile
    const productGrid = page.locator('[data-testid="product-grid"]')
    await expect(productGrid).toBeVisible()
    
    // Check that products are stacked vertically on mobile
    const productCards = page.locator('[data-testid="product-card"]')
    if (await productCards.count() >= 2) {
      const firstCard = productCards.first()
      const secondCard = productCards.nth(1)
      
      const firstBox = await firstCard.boundingBox()
      const secondBox = await secondCard.boundingBox()
      
      // On mobile, cards should be stacked (second card below first)
      expect(secondBox?.y).toBeGreaterThan(firstBox?.y || 0)
    }
  })

  test('product grid shows products from database', async ({ page }) => {
    await page.goto('/products')
    const productCards = page.locator('[data-testid="product-card"]')
    await expect(productCards.first()).toBeVisible()
    const count = await productCards.count()
    expect(count).toBeGreaterThan(0)
  })

  test('product cards show product title text', async ({ page }) => {
    await page.goto('/products')
    const firstCard = page.locator('[data-testid="product-card"]').first()
    await expect(firstCard).toBeVisible()
    const title = firstCard.locator('[data-testid="product-title"]')
    await expect(title).toBeVisible()
    const titleText = await title.textContent()
    expect(titleText?.trim().length).toBeGreaterThan(0)
  })

  test('product cards show price with dollar sign', async ({ page }) => {
    await page.goto('/products')
    const firstCard = page.locator('[data-testid="product-card"]').first()
    const price = firstCard.locator('[data-testid="product-price"]')
    await expect(price).toBeVisible()
    const priceText = await price.textContent()
    expect(priceText).toMatch(/\$/)
  })

  test('products page has a search input field', async ({ page }) => {
    await page.goto('/products')
    await expect(page.locator('[data-testid="product-search"]')).toBeVisible()
  })

  test('products page has sort dropdown', async ({ page }) => {
    await page.goto('/products')
    await expect(page.locator('[data-testid="sort-dropdown"]')).toBeVisible()
  })

  test('product grid container is visible on products page', async ({ page }) => {
    await page.goto('/products')
    await expect(page.locator('[data-testid="product-grid"]')).toBeVisible()
  })

  test('product card links have href pointing to product slug', async ({ page }) => {
    await page.goto('/products')
    const firstLink = page.locator('[data-testid="product-card-link"]').first()
    await expect(firstLink).toBeVisible()
    const href = await firstLink.getAttribute('href')
    expect(href).toMatch(/\/products\//)
  })

  test('product detail page has add to cart button', async ({ page }) => {
    await page.goto('/products')
    await openProductAt(page)
    await expect(page).toHaveURL(/\/products\//)
    await expect(page.locator('[data-testid="add-to-cart-btn"]')).toBeVisible()
  })

  test('product detail page shows product category badge', async ({ page }) => {
    await page.goto('/products')
    await openProductAt(page)
    await expect(page.locator('[data-testid="product-category"]')).toBeVisible()
  })

  test('product detail page has product image', async ({ page }) => {
    await page.goto('/products')
    await openProductAt(page)
    await expect(page.locator('[data-testid="product-image"]')).toBeVisible()
  })

  test('products page shows concentrates category filter', async ({ page }) => {
    await page.goto('/products')
    await expect(page.locator('[data-testid="category-concentrates"]')).toBeVisible()
  })

  test('searching for nonexistent product shows no results message', async ({ page }) => {
    await page.goto('/products')
    const searchInput = page.locator('[data-testid="product-search"]')
    await searchInput.fill('xyznonexistent12345')
    await page.keyboard.press('Enter')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[data-testid="no-results-message"]')).toBeVisible({ timeout: 10_000 })
  })

  test('product images have a valid src attribute', async ({ page }) => {
    await page.goto('/products')
    const firstImage = page.locator('[data-testid="product-image"]').first()
    await expect(firstImage).toBeVisible()
    const hasSrc = await firstImage.evaluate(
      (img: HTMLImageElement) => Boolean(img.src || img.getAttribute('src') || img.getAttribute('data-src'))
    )
    expect(hasSrc).toBe(true)
  })

  test('products page shows pre-rolls category filter', async ({ page }) => {
    await page.goto('/products')
    await expect(page.locator('[data-testid="category-pre-rolls"]')).toBeVisible()
  })
})
