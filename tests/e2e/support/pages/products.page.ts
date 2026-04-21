import { Page, Locator, expect } from '@playwright/test'
import { BasePage } from './base.page'

export class ProductsPage extends BasePage {
  readonly productGrid: Locator
  readonly productCards: Locator
  readonly productSearch: Locator
  readonly categoryFilter: Locator

  constructor(page: Page) {
    super(page)
    this.productGrid = page.locator('[data-testid="product-grid"]')
    this.productCards = page.locator('[data-testid="product-card"]')
    this.productSearch = page.locator('[data-testid="product-search"]')
    this.categoryFilter = page.locator('[data-testid^="category-"]')
  }

  async goto() {
    await this.page.goto('/products')
    await expect(this.productGrid).toBeVisible()
  }

  async gotoCategory(slug: string) {
    await this.page.goto(`/products?category=${slug}`)
  }

  async searchFor(term: string) {
    await this.productSearch.fill(term)
    await this.page.keyboard.press('Enter')
    await this.page.waitForURL(/search=/)
  }

  async openProductAt(index = 0) {
    const link = this.page.locator('[data-testid="product-card-link"]').nth(index)
    const href =
      (await link.getAttribute('href')) ??
      (await link.locator('a').first().getAttribute('href').catch(() => null))
    expect(href).toBeTruthy()
    await this.page.goto(href!, { waitUntil: 'domcontentloaded' })
  }

  async quickAddToCart(cardIndex = 0) {
    const btn = this.productCards.nth(cardIndex).locator('[data-testid="quick-add-to-cart"]')
    await btn.click()
  }

  async getProductCount(): Promise<number> {
    return this.productCards.count()
  }
}
