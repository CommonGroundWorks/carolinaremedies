import { Page, Locator, expect } from '@playwright/test'

/**
 * BasePage - shared page helpers used by all Page Object Models
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /** Bypass age gate via localStorage (call before page.goto) */
  async bypassAgeGate() {
    await this.page.addInitScript(() => {
      localStorage.setItem('age-verified', 'true')
      localStorage.setItem('age-verification-time', new Date().toISOString())
    })
  }

  get header(): Locator {
    return this.page.getByRole('banner')
  }

  get footer(): Locator {
    return this.page.getByRole('contentinfo')
  }

  get cartButton(): Locator {
    return this.page.getByRole('button', { name: /Cart/i }).first()
  }

  get cartCount(): Locator {
    return this.page.locator('[data-testid="cart-count"]')
  }

  get cartCounter(): Locator {
    return this.page.locator('[data-testid="cart-counter"]')
  }

  async getCartItemCount(): Promise<number> {
    const text = await this.cartCount.textContent()
    return parseInt(text ?? '0', 10)
  }

  async openCart() {
    await this.cartButton.click()
    await expect(this.page.locator('[data-testid="cart-drawer"]')).toBeVisible()
  }

  async clickNavLink(name: string) {
    await this.header.getByRole('link', { name }).click()
  }

  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle')
  }
}
