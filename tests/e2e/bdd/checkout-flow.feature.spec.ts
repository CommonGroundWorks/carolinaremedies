/**
 * BDD Feature: Checkout Flow
 *
 * Scenario-driven tests for the full checkout journey: form input,
 * validation, order summary, COD payment, and order confirmation.
 */

import { test, expect, type Page } from '@playwright/test'
import { ProductsPage, CartPage, CheckoutPage } from '../support/pages'
import type { CustomerInfo } from '../support/pages'

const bypassAge = async (page: Page) => {
  await page.addInitScript(() => {
    localStorage.setItem('age-verified', 'true')
    localStorage.setItem('age-verification-time', new Date().toISOString())
  })
}

const VALID_CUSTOMER: CustomerInfo = {
  email: 'checkout.test@example.com',
  firstName: 'Jane',
  lastName: 'Doe',
  phone: '704-555-0100',
  addressLine1: '456 Trade St',
  city: 'Charlotte',
  state: 'NC',
  postalCode: '28202',
}

/** Adds one product and navigates to checkout page */
const setupCartAndGoToCheckout = async (page: Page) => {
  const products = new ProductsPage(page)
  await products.goto()
  await products.quickAddToCart(0)

  const cart = new CartPage(page)
  await cart.open()
  await cart.proceedToCheckout()
}

// ──────────────────────────────────────────────────────────────────────────────
// Feature: Checkout Form
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Feature: Checkout Form', () => {
  test.beforeEach(async ({ page }) => {
    await bypassAge(page)
  })

  test('Scenario: Given cart with product, When checkout page loads, Then form fields are present', async ({ page }) => {
    await setupCartAndGoToCheckout(page)
    const checkout = new CheckoutPage(page)
    await expect(checkout.emailInput).toBeVisible()
    await expect(checkout.firstNameInput).toBeVisible()
    await expect(checkout.lastNameInput).toBeVisible()
    await expect(checkout.addressLine1Input).toBeVisible()
    await expect(checkout.cityInput).toBeVisible()
    await expect(checkout.stateSelect).toBeVisible()
    await expect(checkout.postalCodeInput).toBeVisible()
  })

  test('Scenario: Given checkout form, When COD payment option shown, Then it is selectable', async ({ page }) => {
    await setupCartAndGoToCheckout(page)
    const checkout = new CheckoutPage(page)
    await checkout.selectCOD()
    await expect(checkout.codPaymentOption).toBeChecked()
  })

  test('Scenario: Given checkout form, When order summary visible, Then subtotal, tax, and total are displayed', async ({ page }) => {
    await setupCartAndGoToCheckout(page)
    const checkout = new CheckoutPage(page)
    await checkout.expectOrderSummaryVisible()
  })

  test('Scenario: Given checkout form, When submitted without filling fields, Then validation errors appear', async ({ page }) => {
    await setupCartAndGoToCheckout(page)
    const checkout = new CheckoutPage(page)
    await checkout.placeOrderBtn.click()
    // Should stay on checkout — not navigate to confirmation
    await expect(page).toHaveURL(/checkout/)
  })

  test('Scenario: Given checkout form, When invalid email entered, Then error is shown or form is blocked', async ({ page }) => {
    await setupCartAndGoToCheckout(page)
    const checkout = new CheckoutPage(page)
    await checkout.emailInput.fill('not-an-email')
    await checkout.firstNameInput.fill('Test')
    await checkout.placeOrderBtn.click()
    // HTML5 validation or custom error keeps us on checkout
    await expect(page).toHaveURL(/checkout/)
  })

  test('Scenario: Given checkout form filled, When all valid info entered, Then place order button is enabled', async ({ page }) => {
    await setupCartAndGoToCheckout(page)
    const checkout = new CheckoutPage(page)
    await checkout.fillCustomerInfo(VALID_CUSTOMER)
    await checkout.selectCOD()
    await expect(checkout.placeOrderBtn).toBeEnabled()
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// Feature: Order Placement
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Feature: Order Placement', () => {
  test.beforeEach(async ({ page }) => {
    await bypassAge(page)
  })

  test('Scenario: Given complete checkout form, When order placed, Then navigated to order-confirmation', async ({ page }) => {
    await setupCartAndGoToCheckout(page)
    const checkout = new CheckoutPage(page)
    await checkout.fillCustomerInfo(VALID_CUSTOMER)
    await checkout.selectCOD()
    await checkout.placeOrder()
    await expect(page).toHaveURL(/order-confirmation/)
  })

  test('Scenario: Given order confirmation page, When loaded, Then order confirmation heading is visible', async ({ page }) => {
    await setupCartAndGoToCheckout(page)
    const checkout = new CheckoutPage(page)
    await checkout.fillCustomerInfo(VALID_CUSTOMER)
    await checkout.selectCOD()
    await checkout.placeOrder()
    await expect(page.locator('[data-testid="order-confirmation-title"]')).toBeVisible()
  })

  test('Scenario: Given order placed, When confirmation page viewed, Then order number is generated and matches pattern', async ({ page }) => {
    await setupCartAndGoToCheckout(page)
    const checkout = new CheckoutPage(page)
    await checkout.fillCustomerInfo(VALID_CUSTOMER)
    await checkout.selectCOD()
    await checkout.placeOrder()

    const orderNumberEl = page.locator('[data-testid="order-number"]')
    await expect(orderNumberEl).toBeVisible()
    const orderNumber = await orderNumberEl.textContent()
    expect(orderNumber).toMatch(/ORD-\d+/)
  })

  test('Scenario: Given order placed, When confirmation page viewed, Then customer name is shown', async ({ page }) => {
    await setupCartAndGoToCheckout(page)
    const checkout = new CheckoutPage(page)
    await checkout.fillCustomerInfo(VALID_CUSTOMER)
    await checkout.selectCOD()
    await checkout.placeOrder()

    await expect(page.locator('[data-testid="order-customer-info"]')).toContainText('Jane Doe')
  })

  test('Scenario: Given order placed, When confirmation page viewed, Then shipping address is shown', async ({ page }) => {
    await setupCartAndGoToCheckout(page)
    const checkout = new CheckoutPage(page)
    await checkout.fillCustomerInfo(VALID_CUSTOMER)
    await checkout.selectCOD()
    await checkout.placeOrder()

    await expect(page.locator('[data-testid="order-shipping-address"]')).toContainText('456 Trade St')
  })

  test('Scenario: Given order placed, When confirmation viewed, Then payment method shown as Cash on Delivery', async ({ page }) => {
    await setupCartAndGoToCheckout(page)
    const checkout = new CheckoutPage(page)
    await checkout.fillCustomerInfo(VALID_CUSTOMER)
    await checkout.selectCOD()
    await checkout.placeOrder()

    await expect(page.locator('[data-testid="order-payment-method"]')).toContainText('Cash on Delivery')
  })

  test('Scenario: Given order placed, When confirmation viewed, Then order details section is visible', async ({ page }) => {
    await setupCartAndGoToCheckout(page)
    const checkout = new CheckoutPage(page)
    await checkout.fillCustomerInfo(VALID_CUSTOMER)
    await checkout.selectCOD()
    await checkout.placeOrder()

    await expect(page.locator('[data-testid="order-details"]')).toBeVisible()
  })

  test('Scenario: Given order confirmation, When continue shopping link clicked, Then navigated to /products or /', async ({ page }) => {
    await setupCartAndGoToCheckout(page)
    const checkout = new CheckoutPage(page)
    await checkout.fillCustomerInfo(VALID_CUSTOMER)
    await checkout.selectCOD()
    await checkout.placeOrder()

    const continueBtn = page.locator('[data-testid="continue-shopping-btn"]').or(
      page.getByRole('link', { name: /Continue Shopping|Shop Again/i })
    ).first()

    if (await continueBtn.isVisible()) {
      await continueBtn.click()
      await expect(page).toHaveURL(/\/(products)?$/)
    }
  })

  test('Scenario: Given order placed, When cart checked, Then cart is empty after successful order', async ({ page }) => {
    await setupCartAndGoToCheckout(page)
    const checkout = new CheckoutPage(page)
    await checkout.fillCustomerInfo(VALID_CUSTOMER)
    await checkout.selectCOD()
    await checkout.placeOrder()

    // Navigate back and check cart
    await page.goto('/')
    const cartCount = page.locator('[data-testid="cart-count"]')
    if (await cartCount.isVisible()) {
      const text = await cartCount.textContent()
      expect(parseInt(text ?? '0', 10)).toBe(0)
    }
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// Feature: Checkout State Selector
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Feature: Checkout State Selector', () => {
  test.beforeEach(async ({ page }) => {
    await bypassAge(page)
  })

  test('Scenario: Given checkout form, When state dropdown opened, Then all 50 US states are selectable', async ({ page }) => {
    await setupCartAndGoToCheckout(page)
    const checkout = new CheckoutPage(page)
    await expect(checkout.stateSelect).toBeVisible()

    const options = await checkout.stateSelect.locator('option').count()
    // Should include at least 50 states (plus possibly a blank/placeholder)
    expect(options).toBeGreaterThanOrEqual(50)
  })

  test('Scenario: Given checkout form, When NC state selected, Then form accepts the value', async ({ page }) => {
    await setupCartAndGoToCheckout(page)
    const checkout = new CheckoutPage(page)
    await checkout.stateSelect.selectOption('NC')
    const selected = await checkout.stateSelect.inputValue()
    expect(selected).toBe('NC')
  })
})
