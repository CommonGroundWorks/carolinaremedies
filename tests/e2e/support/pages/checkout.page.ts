import { Page, Locator, expect } from '@playwright/test'
import { BasePage } from './base.page'

export interface CustomerInfo {
  email: string
  firstName: string
  lastName: string
  phone?: string
  addressLine1: string
  city: string
  state: string
  postalCode: string
}

export class CheckoutPage extends BasePage {
  readonly emailInput: Locator
  readonly firstNameInput: Locator
  readonly lastNameInput: Locator
  readonly phoneInput: Locator
  readonly addressLine1Input: Locator
  readonly cityInput: Locator
  readonly stateSelect: Locator
  readonly postalCodeInput: Locator
  readonly codPaymentOption: Locator
  readonly placeOrderBtn: Locator
  readonly orderSubtotal: Locator
  readonly orderTax: Locator
  readonly orderTotal: Locator

  constructor(page: Page) {
    super(page)
    this.emailInput = page.locator('[data-testid="customer-email"]')
    this.firstNameInput = page.locator('[data-testid="customer-first-name"]')
    this.lastNameInput = page.locator('[data-testid="customer-last-name"]')
    this.phoneInput = page.locator('[data-testid="customer-phone"]')
    this.addressLine1Input = page.locator('[data-testid="shipping-address-line-1"]')
    this.cityInput = page.locator('[data-testid="shipping-city"]')
    this.stateSelect = page.locator('[data-testid="shipping-state"]')
    this.postalCodeInput = page.locator('[data-testid="shipping-postal-code"]')
    this.codPaymentOption = page.locator('[data-testid="payment-method-cod"]')
    this.placeOrderBtn = page.locator('[data-testid="place-order-btn"]')
    this.orderSubtotal = page.locator('[data-testid="order-subtotal"]')
    this.orderTax = page.locator('[data-testid="order-tax"]')
    this.orderTotal = page.locator('[data-testid="order-total"]')
  }

  async goto() {
    await this.page.goto('/checkout')
    await expect(this.page).toHaveURL(/checkout/)
  }

  async fillCustomerInfo(info: CustomerInfo) {
    await this.emailInput.fill(info.email)
    await this.firstNameInput.fill(info.firstName)
    await this.lastNameInput.fill(info.lastName)
    if (info.phone) await this.phoneInput.fill(info.phone)
    await this.addressLine1Input.fill(info.addressLine1)
    await this.cityInput.fill(info.city)
    await this.stateSelect.selectOption(info.state)
    await this.postalCodeInput.fill(info.postalCode)
  }

  async selectCOD() {
    await this.codPaymentOption.check()
  }

  async placeOrder() {
    await this.placeOrderBtn.click()
    await expect(this.page).toHaveURL(/order-confirmation/, { timeout: 15_000 })
  }

  async expectOrderSummaryVisible() {
    await expect(this.orderSubtotal).toBeVisible()
    await expect(this.orderTax).toBeVisible()
    await expect(this.orderTotal).toBeVisible()
  }
}
