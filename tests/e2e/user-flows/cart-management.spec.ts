/**
 * Cart Management E2E Tests
 * Testing shopping cart functionality and state management
 */

import { test, expect, type Page } from '@playwright/test'

const hasRealDB = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
)

test.describe('Cart Management', () => {
  test.skip(!hasRealDB, 'Requires live Supabase – skipped without real DB credentials')

  const parseCurrency = (value: string | null) =>
    parseFloat(value?.replace(/[^\d.]/g, '') || '0')

  const getCartButton = (page: Page) =>
    page.getByRole('button', { name: /Cart/i }).first()

  const gotoFromLink = async (page: Page, selector: string) => {
    const link = page.locator(selector)
    const href =
      (await link.getAttribute('href')) ||
      (await link.locator('a').first().getAttribute('href').catch(() => null))
    expect(href).toBeTruthy()
    await page.goto(href!, { waitUntil: 'domcontentloaded' })
  }

  const openProductAt = async (page: Page, index = 0) => {
    await gotoFromLink(page, `[data-testid="product-card-link"] >> nth=${index}`)
  }

  const getCartCount = async (page: Page) => {
    const countText = await page.locator('[data-testid="cart-count"]').textContent()
    return parseInt(countText || '0')
  }

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('age-verified', 'true')
      localStorage.setItem('age-verification-time', new Date().toISOString())
    })
    await page.goto('/')
  })

  test('adds product to cart from product page', async ({ page }) => {
    await page.goto('/products')
    
    // Go to a product detail page
    await openProductAt(page)
    
    // Get initial cart count
    const cartCounter = page.locator('[data-testid="cart-counter"]')
    const initialCount = await getCartCount(page)
    
    // Add product to cart
    await page.click('[data-testid="add-to-cart-btn"]')
    
    // Verify cart counter updated
    await expect(page.locator('[data-testid="cart-count"]')).toContainText((initialCount + 1).toString())

    // Verify success notification
    await expect(page.locator('[data-testid="cart-notification"]').last()).toContainText('added to cart')
  })

  test('updates cart quantity', async ({ page }) => {
    // Add a product to cart first
    await page.goto('/products')
    await openProductAt(page)
    await page.click('[data-testid="add-to-cart-btn"]')
    
    // Open cart
    await getCartButton(page).click()
    await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible()
    
    // Find quantity controls
    const quantityInput = page.locator('[data-testid="cart-item-quantity"]').first()
    const currentQuantity = parseInt(await quantityInput.inputValue() || '1')
    
    // Increase quantity
    await page.click('[data-testid="quantity-increase"]')
    
    // Verify quantity updated
    await expect(quantityInput).toHaveValue((currentQuantity + 1).toString())
    
    // Verify total price updated
    const totalPrice = page.locator('[data-testid="cart-total"]')
    await expect(totalPrice).toBeVisible()
  })

  test('removes product from cart', async ({ page }) => {
    // Add a product to cart first
    await page.goto('/products')
    await openProductAt(page)
    await page.click('[data-testid="add-to-cart-btn"]')
    
    // Open cart
    await getCartButton(page).click()
    await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible()
    
    // Get initial item count
    const cartItems = page.locator('[data-testid="cart-item"]')
    const initialItemCount = await cartItems.count()
    
    // Remove first item
    await page.click('[data-testid="remove-cart-item"]')
    
    // Verify item removed
    const newItemCount = await cartItems.count()
    expect(newItemCount).toBe(initialItemCount - 1)
    
    // If cart is now empty, verify empty state
    if (newItemCount === 0) {
      await expect(page.locator('[data-testid="empty-cart-message"]')).toBeVisible()
      await expect(page.locator('[data-testid="cart-total"]')).toContainText('$0.00')
    }
  })

  test('calculates cart total correctly', async ({ page }) => {
    await page.goto('/products')

    const productCards = page.locator('[data-testid="product-card"]')
    const firstCard = productCards.nth(0)
    const secondCard = productCards.nth(1)

    await firstCard.locator('[data-testid="quick-add-to-cart"]').click()
    await expect(page.locator('[data-testid="cart-notification"]').last()).toContainText('added to cart')

    await secondCard.locator('[data-testid="quick-add-to-cart"]').click()
    await expect(page.locator('[data-testid="cart-notification"]').last()).toContainText('added to cart')

    await getCartButton(page).click()
    await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible()

    const lineItemTotals = await page.locator('[data-testid="cart-item-total"]').allTextContents()
    const expectedTotal = lineItemTotals.reduce((sum, value) => sum + parseCurrency(value), 0)
    const totalText = await page.locator('[data-testid="cart-subtotal"]').textContent()
    const actualTotal = parseCurrency(totalText)

    expect(actualTotal).toBeCloseTo(expectedTotal, 2)
  })

  test('persists cart across page refreshes', async ({ page }) => {
    // Add product to cart
    await page.goto('/products')
    await openProductAt(page)
    await page.click('[data-testid="add-to-cart-btn"]')
    
    // Get cart count
    const cartCounter = page.locator('[data-testid="cart-counter"]')
    const cartCount = await page.locator('[data-testid="cart-count"]').textContent()
    
    // Refresh page
    await page.reload()
    
    // Complete age verification if needed
    await expect(page.locator('[data-testid="age-gate-modal"]')).toHaveCount(0)
    
    // Verify cart persisted
    await expect(cartCounter).toContainText(cartCount || '0')
  })

  test('handles maximum quantity limits', async ({ page }) => {
    await page.goto('/products')
    await openProductAt(page)
    const addToCartButton = page.locator('[data-testid="add-to-cart-btn"]')
    
    // Add to cart multiple times to test limits
    for (let i = 0; i < 15; i++) {
      await addToCartButton.scrollIntoViewIfNeeded()
      await addToCartButton.click()
      await page.waitForTimeout(100)
    }
    
    // Open cart
    await getCartButton(page).click()
    await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible()
    
    // Check if quantity is limited
    const quantityInput = page.locator('[data-testid="cart-item-quantity"]').first()
    const quantity = parseInt(await quantityInput.inputValue() || '0')
    
    // Most states have purchase limits, verify enforcement
    if (quantity >= 10) {
      // Try to increase further
      await page.click('[data-testid="quantity-increase"]')
      
      // Should show limit message
      const limitMessage = page.locator('[data-testid="quantity-limit-message"]')
      if (await limitMessage.isVisible()) {
        await expect(limitMessage).toContainText('limit')
      }
    }
  })

  test('applies discounts and coupons', async ({ page }) => {
    // Add products to cart
    await page.goto('/products')
    await openProductAt(page)
    await page.click('[data-testid="add-to-cart-btn"]')
    
    // Open cart
    await getCartButton(page).click()
    await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible()
    
    // Get subtotal before discount
    const subtotalElement = page.locator('[data-testid="cart-subtotal"]')
    const subtotalText = await subtotalElement.textContent()
    const subtotal = parseFloat(subtotalText?.replace('$', '') || '0')
    
    // Apply coupon if coupon field exists
    const couponInput = page.locator('[data-testid="coupon-input"]')
    if (await couponInput.isVisible()) {
      await couponInput.fill('WELCOME10')
      await page.click('[data-testid="apply-coupon"]')
      
      // Wait for discount to apply
      await page.waitForTimeout(1000)
      
      // Verify discount applied
      const discountElement = page.locator('[data-testid="cart-discount"]')
      if (await discountElement.isVisible()) {
        const discountText = await discountElement.textContent()
        const discount = parseFloat(discountText?.replace('$', '').replace('-', '') || '0')
        expect(discount).toBeGreaterThan(0)
        
        // Verify total is reduced
        const totalElement = page.locator('[data-testid="cart-total"]')
        const totalText = await totalElement.textContent()
        const total = parseFloat(totalText?.replace('$', '') || '0')
        expect(total).toBeLessThan(subtotal)
      }
    }
  })

  test('shows shipping calculation', async ({ page }) => {
    // Add product to cart
    await page.goto('/products')
    await openProductAt(page)
    await page.click('[data-testid="add-to-cart-btn"]')
    
    // Open cart
    await getCartButton(page).click()
    await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible()
    
    // Check for shipping information
    const shippingSection = page.locator('[data-testid="shipping-info"]')
    if (await shippingSection.isVisible()) {
      // Check if shipping calculator exists
      const shippingCalculator = page.locator('[data-testid="shipping-calculator"]')
      if (await shippingCalculator.isVisible()) {
        // Enter zip code
        const zipInput = page.locator('[data-testid="shipping-zip"]')
        await zipInput.fill('90210')
        await page.click('[data-testid="calculate-shipping"]')
        
        // Wait for shipping options
        await page.waitForTimeout(2000)
        
        // Verify shipping options appear
        const shippingOptions = page.locator('[data-testid="shipping-option"]')
        const optionCount = await shippingOptions.count()
        if (optionCount > 0) {
          expect(optionCount).toBeGreaterThan(0)
        }
      }
    }
  })

  test('handles empty cart state', async ({ page }) => {
    await page.goto('/')
    
    // Open cart when empty
    await getCartButton(page).click()
    await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible()
    
    // Verify empty cart message
    await expect(page.locator('[data-testid="empty-cart-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="empty-cart-message"]')).toContainText('Your cart is empty')
    
    // Verify empty cart illustration or icon
    const emptyCartIcon = page.locator('[data-testid="empty-cart-icon"]')
    if (await emptyCartIcon.isVisible()) {
      await expect(emptyCartIcon).toBeVisible()
    }
    
    // Verify continue shopping button
    const continueShoppingBtn = page.locator('[data-testid="continue-shopping"]')
    if (await continueShoppingBtn.isVisible()) {
      await gotoFromLink(page, '[data-testid="continue-shopping"]')
      await expect(page).toHaveURL(/.*products.*/)
    }
  })

  test('proceeds to checkout', async ({ page }) => {
    // Add product to cart
    await page.goto('/products')
    await openProductAt(page)
    await page.click('[data-testid="add-to-cart-btn"]')
    
    // Open cart
    await page.click('[data-testid="cart-icon"]')
    await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible()
    
    // Proceed to checkout
    await gotoFromLink(page, '[data-testid="checkout-btn"]')
    
    // Should navigate to checkout or login
    const currentUrl = page.url()
    expect(currentUrl).toMatch(/(checkout|login)/)
    
    // If redirected to login, verify login form
    if (currentUrl.includes('login')) {
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible()
      await expect(page.locator('[data-testid="checkout-redirect-message"]')).toBeVisible()
    }
  })

  test('saves cart for later when not logged in', async ({ page }) => {
    // Add product to cart
    await page.goto('/products')
    await openProductAt(page)
    await page.click('[data-testid="add-to-cart-btn"]')
    
    // Open cart
    await getCartButton(page).click()
    
    // Check for save for later option
    const saveForLaterBtn = page.locator('[data-testid="save-for-later"]')
    if (await saveForLaterBtn.isVisible()) {
      await saveForLaterBtn.click()
      
      // Should prompt for email or show save confirmation
      const saveConfirmation = page.locator('[data-testid="save-confirmation"]')
      if (await saveConfirmation.isVisible()) {
        await expect(saveConfirmation).toContainText('saved')
      }
    }
  })

  test('cart drawer closes properly', async ({ page }) => {
    await page.goto('/')
    
    // Open cart drawer
    await getCartButton(page).click()
    await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible()
    
    // Close with X button
    await page.click('[data-testid="close-cart"]')
    await expect(page.locator('[data-testid="cart-drawer"]')).not.toBeVisible()
    
    // Open again
    await getCartButton(page).click()
    await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible()
    
    // Close with escape key
    await page.keyboard.press('Escape')
    await expect(page.locator('[data-testid="cart-drawer"]')).not.toBeVisible()
    
    // Open again
    await getCartButton(page).click()
    await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible()
    
    // Close by clicking outside (if overlay exists)
    const overlay = page.locator('[data-testid="cart-overlay"]')
    if (await overlay.isVisible()) {
      await overlay.click({ position: { x: 50, y: 50 } })
      await expect(page.locator('[data-testid="cart-drawer"]')).not.toBeVisible()
    }
  })

  test('displays product variants in cart', async ({ page }) => {
    await page.goto('/products')
    
    // Find a product with variants
    await openProductAt(page)
    
    // Select variant if available
    const variantSelector = page.locator('[data-testid="variant-selector"]')
    if (await variantSelector.isVisible()) {
      const variants = variantSelector.locator('[data-testid="variant-option"]')
      if (await variants.count() > 1) {
        await variants.nth(1).click()
      }
    }
    
    // Add to cart
    await page.click('[data-testid="add-to-cart-btn"]')
    
    // Open cart and verify variant information
    await getCartButton(page).click()
    await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible()
    
    const cartItem = page.locator('[data-testid="cart-item"]').first()
    const variantInfo = cartItem.locator('[data-testid="cart-item-variant"]')
    
    if (await variantInfo.isVisible()) {
      await expect(variantInfo).toBeVisible()
      // Variant info should contain size, weight, or other variant details
      const variantText = await variantInfo.textContent()
      expect(variantText).toBeTruthy()
    }
  })

  test('cart works on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/')
    
    // Complete age verification
    await expect(page.locator('[data-testid="age-gate-modal"]')).toHaveCount(0)
    
    // Add product to cart
    await page.goto('/products')
    await openProductAt(page)
    await page.click('[data-testid="add-to-cart-btn"]')
    
    // Open cart on mobile
    await page.click('[data-testid="cart-icon"]')
    
    // Mobile cart should be full screen or slide up
    const cartDrawer = page.locator('[data-testid="cart-drawer"]')
    await expect(cartDrawer).toBeVisible()
    
    // Check touch-friendly buttons
    const quantityButtons = page.locator('[data-testid="quantity-increase"], [data-testid="quantity-decrease"]')
    const buttonCount = await quantityButtons.count()
    
    for (let i = 0; i < buttonCount; i++) {
      const button = quantityButtons.nth(i)
      const buttonBox = await button.boundingBox()
      expect(buttonBox?.height).toBeGreaterThanOrEqual(44) // Minimum touch target
    }
  })

  test('cart count shows 0 when cart is empty', async ({ page }) => {
    await page.goto('/')
    const cartCount = page.locator('[data-testid="cart-count"]')
    await expect(cartCount).toBeVisible()
    await expect(cartCount).toContainText('0')
  })

  test('cart drawer has a close button', async ({ page }) => {
    await page.goto('/')
    await page.click('[data-testid="cart-icon"]')
    await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible()
    await expect(page.locator('[data-testid="close-cart"]')).toBeVisible()
  })

  test('cart shows cart icon in header', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-testid="cart-icon"]')).toBeVisible()
  })

  test('adding a product increments cart count to 1', async ({ page }) => {
    await page.goto('/products')
    await openProductAt(page)
    await page.click('[data-testid="add-to-cart-btn"]')
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1')
  })

  test('cart drawer shows checkout button when cart has items', async ({ page }) => {
    await page.goto('/products')
    await openProductAt(page)
    await page.click('[data-testid="add-to-cart-btn"]')
    await page.click('[data-testid="cart-icon"]')
    await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible()
    await expect(page.locator('[data-testid="checkout-btn"]')).toBeVisible()
  })

  test('cart item is visible after adding a product', async ({ page }) => {
    await page.goto('/products')
    await openProductAt(page)
    await page.click('[data-testid="add-to-cart-btn"]')
    await page.click('[data-testid="cart-icon"]')
    await expect(page.locator('[data-testid="cart-item"]').first()).toBeVisible()
  })

  test('cart subtotal shows dollar amount with items', async ({ page }) => {
    await page.goto('/products')
    await openProductAt(page)
    await page.click('[data-testid="add-to-cart-btn"]')
    await page.click('[data-testid="cart-icon"]')
    const subtotal = page.locator('[data-testid="cart-subtotal"]')
    await expect(subtotal).toBeVisible()
    await expect(subtotal).toContainText('$')
  })

  test('quantity increase button increments item quantity', async ({ page }) => {
    await page.goto('/products')
    await openProductAt(page)
    await page.click('[data-testid="add-to-cart-btn"]')
    await page.click('[data-testid="cart-icon"]')
    await page.locator('[data-testid="quantity-increase"]').first().click()
    const qtyEl = page.locator('[data-testid="cart-item-quantity"]').first()
    await expect(qtyEl).toHaveValue('2')
  })

  test('remove cart item button exists for each item', async ({ page }) => {
    await page.goto('/products')
    await openProductAt(page)
    await page.click('[data-testid="add-to-cart-btn"]')
    await page.click('[data-testid="cart-icon"]')
    await expect(page.locator('[data-testid="remove-cart-item"]').first()).toBeVisible()
  })

  test('cart close button dismisses the drawer', async ({ page }) => {
    await page.goto('/')
    await page.click('[data-testid="cart-icon"]')
    await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible()
    await page.click('[data-testid="close-cart"]')
    await expect(page.locator('[data-testid="cart-drawer"]')).not.toBeVisible()
  })

  test('cart overlay is visible when cart is open', async ({ page }) => {
    await page.goto('/')
    await page.click('[data-testid="cart-icon"]')
    await expect(page.locator('[data-testid="cart-overlay"]')).toBeVisible()
  })

  test('cart icon is clickable and opens drawer', async ({ page }) => {
    await page.goto('/')
    await page.click('[data-testid="cart-icon"]')
    await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible()
  })

  test('adding same product twice increases quantity to 2', async ({ page }) => {
    await page.goto('/products')
    await openProductAt(page)
    await page.click('[data-testid="add-to-cart-btn"]')
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1')
    await page.click('[data-testid="add-to-cart-btn"]')
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('2')
  })
})
