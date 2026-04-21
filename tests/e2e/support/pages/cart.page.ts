import { Page, Locator, expect } from '@playwright/test'
import { BasePage } from './base.page'

export class CartPage extends BasePage {
  readonly cartDrawer: Locator
  readonly cartItems: Locator
  readonly cartSubtotal: Locator
  readonly emptyCartMessage: Locator
  readonly checkoutBtn: Locator

  constructor(page: Page) {
    super(page)
    this.cartDrawer = page.locator('[data-testid="cart-drawer"]')
    this.cartItems = page.locator('[data-testid="cart-item"]')
    this.cartSubtotal = page.locator('[data-testid="cart-subtotal"]')
    this.emptyCartMessage = page.locator('[data-testid="empty-cart-message"]')
    this.checkoutBtn = page.locator('[data-testid="checkout-btn"]')
  }

  async open() {
    await this.cartButton.click()
    await expect(this.cartDrawer).toBeVisible()
  }

  async removeItem(index = 0) {
    await this.page.locator('[data-testid="remove-cart-item"]').nth(index).click()
  }

  async increaseQuantity(index = 0) {
    await this.page.locator('[data-testid="quantity-increase"]').nth(index).click()
  }

  async decreaseQuantity(index = 0) {
    await this.page.locator('[data-testid="quantity-decrease"]').nth(index).click()
  }

  async getQuantity(index = 0): Promise<number> {
    const val = await this.page
      .locator('[data-testid="cart-item-quantity"]')
      .nth(index)
      .inputValue()
    return parseInt(val, 10)
  }

  async proceedToCheckout() {
    await expect(this.checkoutBtn).toBeVisible()
    await Promise.all([
      this.page.waitForURL(/checkout/),
      this.checkoutBtn.click(),
    ])
    await expect(this.page).toHaveURL(/checkout/)
  }

  async getItemCount(): Promise<number> {
    return this.cartItems.count()
  }

  async expectEmpty() {
    await expect(this.emptyCartMessage).toBeVisible()
  }
}
