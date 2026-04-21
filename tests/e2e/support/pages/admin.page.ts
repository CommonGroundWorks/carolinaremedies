import { Page, Locator, expect } from '@playwright/test'
import { BasePage } from './base.page'

const ADMIN_EMAIL = 'admin@carolinaremedies.com'
const ADMIN_PASSWORD = 'Admin@2026!'

export class AdminPage extends BasePage {
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitBtn: Locator
  readonly dashboard: Locator
  readonly productsTable: Locator
  readonly tableRows: Locator
  readonly addProductTab: Locator
  readonly importCsvTab: Locator
  readonly productsTab: Locator
  readonly signOutLink: Locator
  readonly storeLink: Locator

  constructor(page: Page) {
    super(page)
    this.emailInput = page.locator('input[type="email"]')
    this.passwordInput = page.locator('input[type="password"]')
    this.submitBtn = page.locator('button[type="submit"]')
    this.dashboard = page.locator('h1').filter({ hasText: 'Admin Dashboard' })
    this.productsTable = page.locator('tbody')
    this.tableRows = page.locator('tbody tr')
    this.addProductTab = page.locator('button:has-text("Add Product")')
    this.importCsvTab = page.locator('button:has-text("Import CSV")')
    this.productsTab = page.locator('button:has-text("Products")')
    this.signOutLink = page.locator('a:has-text("Sign Out")')
    this.storeLink = page.locator('a:has-text("← Store")')
  }

  async gotoLogin() {
    await this.page.goto('/login')
  }

  async loginAsAdmin(
    email = ADMIN_EMAIL,
    password = ADMIN_PASSWORD,
  ) {
    await this.gotoLogin()
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitBtn.click()
    await expect(this.page).toHaveURL(/\/admin/, { timeout: 15_000 })
    await expect(this.dashboard).toBeVisible()
  }

  async waitForProductTable() {
    await expect(this.tableRows.first()).toBeVisible({ timeout: 15_000 })
  }

  async clickEditOnRow(index = 0) {
    await this.tableRows.nth(index).locator('button:has-text("Edit")').click()
    await expect(this.page.locator('h2:has-text("Edit Product")')).toBeVisible()
  }

  async clickDeleteOnRow(index = 0) {
    await this.tableRows.nth(index).locator('button:has-text("Delete")').click()
  }

  async confirmDelete(index = 0) {
    await this.tableRows.nth(index).locator('button:has-text("Confirm")').click()
  }

  async cancelDelete(index = 0) {
    await this.tableRows.nth(index).locator('button:has-text("Cancel")').click()
  }

  async signOut() {
    await this.signOutLink.click()
    await expect(this.page).toHaveURL(/\/login/, { timeout: 10_000 })
  }
}
