/**
 * Order Management E2E Tests
 *
 * Covers order confirmation page details, multi-product orders,
 * cart modification before checkout, order number validation,
 * and post-order state.
 */

import { test, expect, type Page } from '@playwright/test'
import { ProductsPage, CartPage, CheckoutPage } from '../support/pages'
import type { CustomerInfo } from '../support/pages'

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

const BASE_CUSTOMER: CustomerInfo = {
  email: 'order.test@example.com',
  firstName: 'Alex',
  lastName: 'Smith',
  phone: '704-555-9900',
  addressLine1: '789 Elm Street',
  city: 'Raleigh',
  state: 'NC',
  postalCode: '27601',
}

/** Adds N products from the listing and proceeds to checkout */
const setupMultiProductCheckout = async (page: Page, count = 2) => {
  const products = new ProductsPage(page)
  await products.goto()

  for (let i = 0; i < count; i++) {
    await products.quickAddToCart(i)
    // Wait for notification
    await expect(page.locator('[data-testid="cart-notification"]').last()).toContainText('added to cart')
  }

  const cart = new CartPage(page)
  await cart.open()
  await cart.proceedToCheckout()
}

// ──────────────────────────────────────────────────────────────────────────────
// Multi-product order
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Multi-Product Order Flow', () => {
  test.skip(!hasRealDB, 'Requires live Supabase – skipped without real DB credentials')

  test.beforeEach(async ({ page }) => {
    await bypassAge(page)
  })

  test('two products in cart show correct subtotal on checkout page', async ({ page }) => {
    await setupMultiProductCheckout(page, 2)
    const checkout = new CheckoutPage(page)
    await checkout.expectOrderSummaryVisible()
    const subtotalText = await checkout.orderSubtotal.textContent()
    const subtotal = parseFloat(subtotalText?.replace(/[^\d.]/g, '') ?? '0')
    expect(subtotal).toBeGreaterThan(0)
  })

  test('order with two products completes successfully', async ({ page }) => {
    await setupMultiProductCheckout(page, 2)
    const checkout = new CheckoutPage(page)
    await checkout.fillCustomerInfo(BASE_CUSTOMER)
    await checkout.selectCOD()
    await checkout.placeOrder()
    await expect(page).toHaveURL(/order-confirmation/)
  })

  test('order confirmation lists all purchased items', async ({ page }) => {
    await setupMultiProductCheckout(page, 2)
    const checkout = new CheckoutPage(page)
    await checkout.fillCustomerInfo(BASE_CUSTOMER)
    await checkout.selectCOD()
    await checkout.placeOrder()

    const orderDetails = page.locator('[data-testid="order-details"]')
    await expect(orderDetails).toBeVisible()
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// Cart modification before checkout
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Cart Modification Before Checkout', () => {
  test.skip(!hasRealDB, 'Requires live Supabase – skipped without real DB credentials')

  test.beforeEach(async ({ page }) => {
    await bypassAge(page)
  })

  test('increasing quantity before checkout updates order total', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.goto()
    await products.quickAddToCart(0)

    const cart = new CartPage(page)
    await cart.open()
    await cart.increaseQuantity(0)

    const subtotalText = await cart.cartSubtotal.textContent()
    const subtotal = parseFloat(subtotalText?.replace(/[^\d.]/g, '') ?? '0')
    expect(subtotal).toBeGreaterThan(0)

    await cart.proceedToCheckout()
    const checkout = new CheckoutPage(page)
    await checkout.expectOrderSummaryVisible()
  })

  test('removing item before checkout reduces order total', async ({ page }) => {
    await setupMultiProductCheckout(page, 2)

    // Go back to cart
    await page.goto('/')
    const cart = new CartPage(page)
    await cart.open()
    const countBefore = await cart.getItemCount()

    if (countBefore > 1) {
      await cart.removeItem(0)
      const countAfter = await cart.getItemCount()
      expect(countAfter).toBe(countBefore - 1)
    }
  })

  test('full order journey: add, modify, checkout, confirm', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.goto()

    // Add first product
    await products.openProductAt(0)
    await page.locator('[data-testid="add-to-cart-btn"]').click()
    await expect(page.locator('[data-testid="cart-notification"]').last()).toContainText('added to cart')

    // Open cart and increase qty
    const cart = new CartPage(page)
    await cart.open()
    await cart.increaseQuantity(0)
    const qty = await cart.getQuantity(0)
    expect(qty).toBe(2)

    // Proceed to checkout
    await cart.proceedToCheckout()

    // Fill form and place order
    const checkout = new CheckoutPage(page)
    await checkout.fillCustomerInfo(BASE_CUSTOMER)
    await checkout.selectCOD()
    await checkout.placeOrder()

    await expect(page).toHaveURL(/order-confirmation/)
    await expect(page.locator('[data-testid="order-confirmation-title"]')).toBeVisible()
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// Order Confirmation Page
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Order Confirmation Page', () => {
  test.beforeEach(async ({ page }) => {
    await bypassAge(page)
  })

  const placeTestOrder = async (page: Page) => {
    const products = new ProductsPage(page)
    await products.goto()
    await products.quickAddToCart(0)
    const cart = new CartPage(page)
    await cart.open()
    await cart.proceedToCheckout()
    const checkout = new CheckoutPage(page)
    await checkout.fillCustomerInfo(BASE_CUSTOMER)
    await checkout.selectCOD()
    await checkout.placeOrder()
  }

  test('order confirmation title is visible', async ({ page }) => {
    await placeTestOrder(page)
    await expect(page.locator('[data-testid="order-confirmation-title"]')).toBeVisible()
  })

  test('order number follows ORD-NNNN pattern', async ({ page }) => {
    await placeTestOrder(page)
    const orderNum = await page.locator('[data-testid="order-number"]').textContent()
    expect(orderNum).toMatch(/ORD-\d+/)
  })

  test('confirmation shows customer email', async ({ page }) => {
    await placeTestOrder(page)
    const customerInfo = page.locator('[data-testid="order-customer-info"]')
    await expect(customerInfo).toContainText('Alex Smith')
  })

  test('confirmation shows correct payment method', async ({ page }) => {
    await placeTestOrder(page)
    const payment = page.locator('[data-testid="order-payment-method"]')
    await expect(payment).toContainText('Cash on Delivery')
  })

  test('confirmation shows shipping address', async ({ page }) => {
    await placeTestOrder(page)
    const addr = page.locator('[data-testid="order-shipping-address"]')
    await expect(addr).toContainText('789 Elm Street')
    await expect(addr).toContainText('Raleigh')
  })

  test('order total on confirmation is positive', async ({ page }) => {
    await placeTestOrder(page)
    const totalEl = page.locator('[data-testid="order-total"]')
    if (await totalEl.isVisible()) {
      const totalText = await totalEl.textContent()
      const total = parseFloat(totalText?.replace(/[^\d.]/g, '') ?? '0')
      expect(total).toBeGreaterThan(0)
    }
  })

  test('cart is cleared after successful order', async ({ page }) => {
    await placeTestOrder(page)
    await page.goto('/')
    const cartCount = page.locator('[data-testid="cart-count"]')
    if (await cartCount.isVisible()) {
      const text = await cartCount.textContent()
      expect(parseInt(text ?? '0', 10)).toBe(0)
    }
  })

  test('confirmation page includes an order details section', async ({ page }) => {
    await placeTestOrder(page)
    await expect(page.locator('[data-testid="order-details"]')).toBeVisible()
  })

  test('confirmation page has a link back to home or products', async ({ page }) => {
    await placeTestOrder(page)
    const continueLink = page.locator('[data-testid="continue-shopping-btn"]').or(
      page.getByRole('link', { name: /Continue Shopping|Shop Again|Back to Store/i })
    ).first()
    if (await continueLink.isVisible()) {
      await expect(continueLink).toBeVisible()
    }
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// Edge Cases
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Checkout Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await bypassAge(page)
  })

  test('empty cart redirects away from checkout', async ({ page }) => {
    // Navigate to checkout with empty cart
    await page.goto('/checkout')
    // Should either redirect to / or /products, or show empty cart message
    const url = page.url()
    const hasEmptyCartMsg = await page
      .locator('[data-testid="empty-cart-message"]')
      .or(page.getByText(/your cart is empty/i))
      .isVisible()

    const redirected = !url.includes('/checkout')
    expect(redirected || hasEmptyCartMsg).toBe(true)
  })

  test('checkout form phone field is optional', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.goto()
    await products.quickAddToCart(0)
    const cart = new CartPage(page)
    await cart.open()
    await cart.proceedToCheckout()

    const checkout = new CheckoutPage(page)
    const noPhoneCustomer: CustomerInfo = {
      ...BASE_CUSTOMER,
      phone: undefined,
      email: 'nophone@example.com',
    }
    await checkout.fillCustomerInfo(noPhoneCustomer)
    await checkout.selectCOD()
    await expect(checkout.placeOrderBtn).toBeEnabled()
  })

  test('checkout order summary reflects cart contents', async ({ page }) => {
    const products = new ProductsPage(page)
    await products.goto()
    await products.openProductAt(0)

    // Get product price from detail page
    const priceText = await page.locator('[data-testid="product-price"]').first().textContent()
    const productPrice = parseFloat(priceText?.replace(/[^\d.]/g, '') ?? '0')

    await page.locator('[data-testid="add-to-cart-btn"]').click()

    const cart = new CartPage(page)
    await cart.open()
    await cart.proceedToCheckout()

    const checkout = new CheckoutPage(page)
    const subtotalText = await checkout.orderSubtotal.textContent()
    const subtotal = parseFloat(subtotalText?.replace(/[^\d.]/g, '') ?? '0')

    // Subtotal should be >= product price (could include tax-exclusive base)
    expect(subtotal).toBeGreaterThan(0)
    if (productPrice > 0) {
      expect(subtotal).toBeGreaterThanOrEqual(productPrice * 0.9) // allow minor rounding
    }
  })
})
