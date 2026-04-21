/**
 * Complete Purchase Flow E2E Test
 * Tests the critical user journey from product discovery to order completion
 */

import { test, expect, type Locator, type Page } from '@playwright/test'

const getCartButton = (page: Page) =>
  page.getByRole('button', { name: /Cart/i }).first()

const gotoFromLink = async (page: Page, link: Locator) => {
  const href =
    (await link.getAttribute('href')) ||
    (await link.locator('a').first().getAttribute('href').catch(() => null))
  expect(href).toBeTruthy()
  await page.goto(href!, { waitUntil: 'domcontentloaded' })
}

const openProductsListing = async (page: Page) => {
  await page.goto('/products')
  await expect(page.locator('[data-testid="product-grid"]')).toBeVisible()
}

const openProductAt = async (page: Page, index = 0) => {
  await gotoFromLink(page, page.locator('[data-testid="product-card-link"]').nth(index))
}

const goToCheckout = async (page: Page) => {
  const checkoutLink = page.locator('[data-testid="checkout-btn"]')
  await expect(checkoutLink).toBeVisible()
  await Promise.all([
    page.waitForURL(/checkout/),
    checkoutLink.click(),
  ])
  await expect(page).toHaveURL(/checkout/)
}

const selectCheckoutState = async (page: Page, stateCode: string) => {
  const stateSelect = page.locator('[data-testid="shipping-state"]')
  await expect(stateSelect).toBeVisible()
  await stateSelect.selectOption(stateCode)
}

test.describe('Complete Purchase Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('age-verified', 'true')
      localStorage.setItem('age-verification-time', new Date().toISOString())
    })
    await page.goto('/')
  })

  test('new customer completes first purchase successfully', async ({ page }) => {
    // Step 1: Browse products by category
    await openProductsListing(page)

    // Step 2: Select a category (flower products)
    await gotoFromLink(page, page.locator('[data-testid="category-flower"]'))
    await expect(page.locator('[data-testid="category-title"]')).toContainText('Flower')

    // Step 3: Select a specific product
    const firstProduct = page.locator('[data-testid="product-card"]').first()
    await expect(firstProduct).toBeVisible()
    await openProductAt(page)
    await expect(page).toHaveURL(/.*\/products\/.*/)

    // Step 4: Verify product details page
    await expect(page.locator('[data-testid="product-title"]')).toBeVisible()
    await expect(page.locator('[data-testid="product-price"]')).toBeVisible()
    await expect(page.locator('[data-testid="product-description"]')).toBeVisible()

    // Step 6: Select product variant (if available)
    const variantOptions = page.locator('[data-testid="variant-option"]')
    if (await variantOptions.first().isVisible()) {
      await variantOptions.first().click()
    }

    // Step 7: Add product to cart
    await page.click('[data-testid="add-to-cart-btn"]')
    
    // Verify cart updated
    const cartCount = page.locator('[data-testid="cart-count"]')
    await expect(cartCount).toBeVisible()
    await expect(cartCount).toContainText('1')

    // Step 8: View cart
    await page.click('[data-testid="cart-icon"]')
    await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible()
    await expect(page.locator('[data-testid="cart-item"]')).toBeVisible()

    // Step 9: Proceed to checkout
    await goToCheckout(page)

    // Step 10: Fill customer information
    await page.fill('[data-testid="customer-email"]', 'test.customer@example.com')
    await page.fill('[data-testid="customer-first-name"]', 'John')
    await page.fill('[data-testid="customer-last-name"]', 'Doe')
    await page.fill('[data-testid="customer-phone"]', '555-123-4567')

    // Step 11: Fill shipping address
    await page.fill('[data-testid="shipping-address-line-1"]', '123 Main St')
    await page.fill('[data-testid="shipping-city"]', 'Charlotte')
    await selectCheckoutState(page, 'NC')
    await page.fill('[data-testid="shipping-postal-code"]', '28202')

    // Step 12: Select Cash on Delivery payment
    await page.check('[data-testid="payment-method-cod"]')

    // Step 13: Review order summary
    await expect(page.locator('[data-testid="order-subtotal"]')).toBeVisible()
    await expect(page.locator('[data-testid="order-tax"]')).toBeVisible()
    await expect(page.locator('[data-testid="order-total"]')).toBeVisible()

    // Step 14: Complete the order
    await page.locator('[data-testid="place-order-btn"]').click()

    // Step 15: Verify order confirmation
    await expect(page).toHaveURL(/order-confirmation/)
    await expect(page.locator('[data-testid="order-confirmation-title"]')).toBeVisible()
    await expect(page.locator('[data-testid="order-number"]')).toBeVisible()
    await expect(page.locator('[data-testid="order-details"]')).toBeVisible()

    // Step 16: Verify order details
    const orderNumber = await page.locator('[data-testid="order-number"]').textContent()
    expect(orderNumber).toMatch(/ORD-\d+/)
    
    await expect(page.locator('[data-testid="order-customer-info"]')).toContainText('John Doe')
    await expect(page.locator('[data-testid="order-shipping-address"]')).toContainText('123 Main St')
    await expect(page.locator('[data-testid="order-payment-method"]')).toContainText('Cash on Delivery')
  })

  test('customer can modify cart before checkout', async ({ page }) => {
    // Add multiple products to cart
    await openProductsListing(page)
    
    // Add first product
    await openProductAt(page)
    await page.click('[data-testid="add-to-cart-btn"]')
    
    // Go back and add second product
    await page.goBack()
    await openProductAt(page, 1)
    await page.click('[data-testid="add-to-cart-btn"]')

    // Open cart
    await page.click('[data-testid="cart-icon"]')
    
    // Verify multiple items
    const cartItems = page.locator('[data-testid="cart-item"]')
    await expect(cartItems).toHaveCount(2)

    // Update quantity of first item
    const increaseQtyBtn = page.locator('[data-testid="quantity-increase"]').first()
    await increaseQtyBtn.click()
    await expect(page.locator('[data-testid="cart-item-quantity"]').first()).toHaveValue('2')

    // Remove second item
    await page.locator('[data-testid="remove-cart-item"]').nth(1).click()
    await expect(cartItems).toHaveCount(1)

    // Verify cart total updated
    await expect(page.locator('[data-testid="cart-subtotal"]')).toBeVisible()
    
    // Proceed to checkout with modified cart
    await goToCheckout(page)
  })

  test('customer can apply discount code during checkout', async ({ page }) => {
    // Add product to cart
    await openProductsListing(page)
    await openProductAt(page)
    await page.click('[data-testid="add-to-cart-btn"]')
    
    // Go to checkout
    await page.click('[data-testid="cart-icon"]')
    await goToCheckout(page)

    // Fill required customer information
    await page.fill('[data-testid="customer-email"]', 'test@example.com')
    await page.fill('[data-testid="customer-first-name"]', 'Jane')
    await page.fill('[data-testid="customer-last-name"]', 'Smith')

    // Apply discount code
    const promoSection = page.locator('[data-testid="promo-code-section"]')
    if (await promoSection.isVisible()) {
      await page.fill('[data-testid="promo-code-input"]', 'WELCOME10')
      await page.click('[data-testid="apply-promo-btn"]')
      
      // Verify discount applied
      await expect(page.locator('[data-testid="discount-amount"]')).toBeVisible()
      await expect(page.locator('[data-testid="order-total"]')).toBeVisible()
    }
  })

  test('checkout form validation works correctly', async ({ page }) => {
    // Add product to cart and go to checkout
    await openProductsListing(page)
    await openProductAt(page)
    await page.click('[data-testid="add-to-cart-btn"]')
    await page.click('[data-testid="cart-icon"]')
    await goToCheckout(page)

    // Try to submit without filling required fields
    await page.click('[data-testid="place-order-btn"]')

    // Verify validation errors appear
    await expect(page.locator('[data-testid="error-customer-email"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-customer-first-name"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-shipping-address"]')).toBeVisible()

    // Fill invalid email
    await page.fill('[data-testid="customer-email"]', 'invalid-email')
    await page.click('[data-testid="place-order-btn"]')
    await expect(page.locator('[data-testid="error-customer-email"]')).toContainText('valid email')

    // Fill valid email
    await page.fill('[data-testid="customer-email"]', 'valid@example.com')
    await expect(page.locator('[data-testid="error-customer-email"]')).not.toBeVisible()
  })

  test('order confirmation provides all necessary information', async ({ page }) => {
    // Complete a full purchase flow
    await openProductsListing(page)
    await openProductAt(page)
    await page.click('[data-testid="add-to-cart-btn"]')
    await page.click('[data-testid="cart-icon"]')
    await goToCheckout(page)

    // Fill minimal required information
    await page.fill('[data-testid="customer-email"]', 'test@example.com')
    await page.fill('[data-testid="customer-first-name"]', 'Test')
    await page.fill('[data-testid="customer-last-name"]', 'Customer')
    await page.fill('[data-testid="customer-phone"]', '555-0000')
    await page.fill('[data-testid="shipping-address-line-1"]', '123 Test St')
    await page.fill('[data-testid="shipping-city"]', 'Test City')
    await selectCheckoutState(page, 'NC')
    await page.fill('[data-testid="shipping-postal-code"]', '00000')
    await page.check('[data-testid="payment-method-cod"]')

    await page.click('[data-testid="place-order-btn"]')

    // Verify order confirmation page has all required elements
    await expect(page.locator('[data-testid="order-confirmation-title"]')).toContainText('Order Confirmed')
    await expect(page.locator('[data-testid="order-number"]')).toBeVisible()
    await expect(page.locator('[data-testid="order-date"]')).toBeVisible()
    await expect(page.locator('[data-testid="estimated-delivery"]')).toBeVisible()
    await expect(page.locator('[data-testid="order-tracking-info"]')).toBeVisible()
    await expect(page.locator('[data-testid="customer-service-contact"]')).toBeVisible()

    // Verify order summary
    await expect(page.locator('[data-testid="order-items-summary"]')).toBeVisible()
    await expect(page.locator('[data-testid="order-total-summary"]')).toBeVisible()
    await expect(page.locator('[data-testid="shipping-address-summary"]')).toBeVisible()
    await expect(page.locator('[data-testid="payment-method-summary"]')).toBeVisible()
  })

  test('checkout page has a Checkout heading', async ({ page }) => {
    await openProductsListing(page)
    await openProductAt(page)
    await page.click('[data-testid="add-to-cart-btn"]')
    await page.click('[data-testid="cart-icon"]')
    await goToCheckout(page)
    await expect(page.locator('h1').filter({ hasText: 'Checkout' })).toBeVisible()
  })

  test('checkout page shows empty cart message when navigated to without items', async ({ page }) => {
    await page.goto('/checkout')
    await expect(page.locator('h2').filter({ hasText: /Your cart is empty/i })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Browse Products', exact: true })).toBeVisible()
  })

  test('checkout form shows Cash on Delivery payment option', async ({ page }) => {
    await openProductsListing(page)
    await openProductAt(page)
    await page.click('[data-testid="add-to-cart-btn"]')
    await page.click('[data-testid="cart-icon"]')
    await goToCheckout(page)
    const codRadio = page.locator('[data-testid="payment-method-cod"]')
    await expect(codRadio).toBeVisible()
    await expect(codRadio).toBeChecked()
  })

  test('promo code WELCOME10 applies 10% discount', async ({ page }) => {
    await openProductsListing(page)
    await openProductAt(page)
    await page.click('[data-testid="add-to-cart-btn"]')
    await page.click('[data-testid="cart-icon"]')
    await goToCheckout(page)

    const subtotalText = await page.locator('[data-testid="order-subtotal"]').textContent()
    const subtotal = parseFloat(subtotalText?.replace(/[^\d.]/g, '') || '0')

    await page.fill('[data-testid="promo-code-input"]', 'WELCOME10')
    await page.click('[data-testid="apply-promo-btn"]')

    await expect(page.locator('[data-testid="discount-amount"]')).toBeVisible()
    const discountText = await page.locator('[data-testid="discount-amount"]').textContent()
    const discount = parseFloat(discountText?.replace(/[^\d.]/g, '') || '0')
    expect(discount).toBeCloseTo(subtotal * 0.1, 1)
  })

  test('cart is cleared after completing order', async ({ page }) => {
    test.setTimeout(60_000)
    await openProductsListing(page)
    await openProductAt(page)
    await page.click('[data-testid="add-to-cart-btn"]')
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1')

    await page.click('[data-testid="cart-icon"]')
    await goToCheckout(page)

    await page.fill('[data-testid="customer-email"]', 'clear@example.com')
    await page.fill('[data-testid="customer-first-name"]', 'Cart')
    await page.fill('[data-testid="customer-last-name"]', 'Clear')
    await page.fill('[data-testid="shipping-address-line-1"]', '1 Clear St')
    await page.fill('[data-testid="shipping-city"]', 'Raleigh')
    await selectCheckoutState(page, 'NC')
    await page.fill('[data-testid="shipping-postal-code"]', '27601')

    await page.click('[data-testid="place-order-btn"]')
    await expect(page).toHaveURL(/order-confirmation/, { timeout: 15_000 })

    // Cart should be empty after order
    await page.goto('/')
    const cartCount = page.locator('[data-testid="cart-count"]')
    const countText = await cartCount.textContent()
    expect(parseInt(countText || '0')).toBe(0)
  })
})
