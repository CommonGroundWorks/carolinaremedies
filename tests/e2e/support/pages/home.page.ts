import { Page, Locator, expect } from '@playwright/test'
import { BasePage } from './base.page'

export class HomePage extends BasePage {
  readonly heroHeading: Locator
  readonly heroCtaButton: Locator
  readonly featuredSection: Locator
  readonly featuredProducts: Locator
  readonly categoryLinks: Locator
  readonly ageGateModal: Locator
  readonly ageVerifyYes: Locator
  readonly ageVerifyNo: Locator
  readonly accessDeniedModal: Locator
  readonly mainContent: Locator

  constructor(page: Page) {
    super(page)
    this.heroHeading = page.locator('[data-testid="hero-heading"]')
    this.heroCtaButton = page.locator('[data-testid="hero-cta"]')
    this.featuredSection = page.locator('[data-testid="featured-section"]')
    this.featuredProducts = page.locator('[data-testid="featured-products"]')
    this.categoryLinks = page.locator('[data-testid="homepage-categories"]')
    this.ageGateModal = page.locator('[data-testid="age-gate-modal"]')
    this.ageVerifyYes = page.locator('[data-testid="age-verify-yes"]')
    this.ageVerifyNo = page.locator('[data-testid="age-verify-no"]')
    this.accessDeniedModal = page.locator('[data-testid="access-denied-modal"]')
    this.mainContent = page.locator('[data-testid="main-content"]')
  }

  async goto() {
    await this.page.goto('/')
  }

  async verifyAge() {
    await expect(this.ageVerifyYes).toBeVisible()
    await this.ageVerifyYes.click()
    await expect(this.ageGateModal).not.toBeVisible()
  }

  async denyAge() {
    await expect(this.ageVerifyNo).toBeVisible()
    await this.ageVerifyNo.click()
  }

  async expectAgeGateVisible() {
    await expect(this.ageGateModal).toBeVisible()
  }

  async expectMainContentVisible() {
    await expect(this.mainContent).toBeVisible()
  }
}
