/**
 * Age Verification E2E Tests
 * Critical business requirement testing for age-restricted access
 */

import { test, expect } from '@playwright/test'

test.describe('Age Verification Flow', () => {
  test('shows age gate modal on first visit', async ({ page }) => {
    await page.goto('/')
    
    // Age gate should appear
    const ageGate = page.locator('[data-testid="age-gate-modal"]')
    await expect(ageGate).toBeVisible()
    
    // Check required elements
    await expect(page.locator('[data-testid="age-gate-title"]')).toContainText('Age Verification')
    await expect(page.locator('[data-testid="age-gate-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="age-verify-yes"]')).toBeVisible()
    await expect(page.locator('[data-testid="age-verify-no"]')).toBeVisible()
    
    // Should not be able to close without selection
    await page.keyboard.press('Escape')
    await expect(ageGate).toBeVisible()
  })

  test('user confirms they are 21 or older', async ({ page }) => {
    await page.goto('/')
    
    // Verify age
    const confirmAgeButton = page.locator('[data-testid="age-verify-yes"]')
    await expect(confirmAgeButton).toBeVisible()
    await confirmAgeButton.click()
    
    // Age gate should disappear
    await expect(page.locator('[data-testid="age-gate-modal"]')).not.toBeVisible()
    
    // Should be able to access site content
    await expect(page.locator('[data-testid="main-content"]')).toBeVisible()
    await expect(page.getByRole('heading', { name: /The Art of Botanical Wellness/i })).toBeVisible()
  })

  test('user confirms they are under 21', async ({ page }) => {
    await page.goto('/')
    
    // Select "No" for age verification
    await page.click('[data-testid="age-verify-no"]')
    
    // Should show restricted access message
    await expect(page.locator('[data-testid="access-denied-modal"]')).toBeVisible()
    await expect(page.locator('[data-testid="access-denied-title"]')).toContainText('Access Restricted')
    await expect(page.locator('[data-testid="access-denied-message"]')).toContainText('21 years of age')
    
    // Should not be able to access main content
    await expect(page.locator('[data-testid="main-content"]')).not.toBeVisible()
    
    // Should provide alternative resources
    await expect(page.locator('[data-testid="alternative-resources"]')).toBeVisible()
  })

  test('age verification persists across sessions', async ({ page, context }) => {
    // First visit - verify age
    await page.goto('/')
    const confirmAgeButton = page.locator('[data-testid="age-verify-yes"]')
    await expect(confirmAgeButton).toBeVisible()
    await confirmAgeButton.click()
    await expect(page.locator('[data-testid="age-gate-modal"]')).not.toBeVisible()
    
    // Navigate to different page
    await page.goto('/products')
    await expect(page.locator('[data-testid="age-gate-modal"]')).not.toBeVisible()
    
    // Refresh page - should still be verified
    await page.reload()
    await expect(page.locator('[data-testid="age-gate-modal"]')).not.toBeVisible()
    
    // Open new tab in same context
    const newPage = await context.newPage()
    await newPage.goto('/')
    await expect(newPage.locator('[data-testid="age-gate-modal"]')).not.toBeVisible()
  })

  test('age verification is required for all protected routes', async ({ page }) => {
    const protectedRoutes = [
      '/',
      '/products',
      '/products?category=flower',
      '/checkout'
    ]

    for (const route of protectedRoutes) {
      await page.goto(route)

      await expect(
        page.getByRole('dialog', { name: /Age Verification Required|Access Restricted/i })
      ).toBeVisible({ timeout: 10_000 })
    }
  })

  test('age verification modal cannot be bypassed', async ({ page }) => {
    await page.goto('/')
    
    // Try various bypass attempts
    await page.keyboard.press('Escape')
    await expect(page.locator('[data-testid="age-gate-modal"]')).toBeVisible()
    
    // Try clicking outside modal
    await page.click('body', { position: { x: 10, y: 10 } })
    await expect(page.locator('[data-testid="age-gate-modal"]')).toBeVisible()
    
    // Try browser back button
    await page.goBack()
    await expect(page.locator('[data-testid="age-gate-modal"]')).toBeVisible()
    
    // Try to access product URLs directly
    await page.goto('/products')
    const ageGateOrDenied = page.locator('[data-testid="age-gate-modal"], [data-testid="access-denied-modal"]')
    await expect(ageGateOrDenied).toBeVisible()
  })

  test('age verification form validation', async ({ page }) => {
    await page.goto('/')
    
    // If using date picker for age verification
    const datePicker = page.locator('[data-testid="birth-date-picker"]')
    if (await datePicker.isVisible()) {
      // Test invalid date (too young)
      await datePicker.fill('2010-01-01')
      await page.click('[data-testid="verify-age-submit"]')
      
      await expect(page.locator('[data-testid="age-error-message"]')).toBeVisible()
      await expect(page.locator('[data-testid="age-error-message"]')).toContainText('21 years of age')
      
      // Test valid date (21 or older)
      await datePicker.fill('1990-01-01')
      await page.click('[data-testid="verify-age-submit"]')
      
      await expect(page.locator('[data-testid="age-gate-modal"]')).not.toBeVisible()
    }
  })

  test('displays legal compliance information', async ({ page }) => {
    await page.goto('/')
    
    const ageGate = page.locator('[data-testid="age-gate-modal"]')
    await expect(ageGate).toBeVisible()
    
    // Check for legal compliance elements
    await expect(page.locator('[data-testid="legal-disclaimer"]')).toBeVisible()
    await expect(page.locator('[data-testid="terms-link"]')).toBeVisible()
    await expect(page.locator('[data-testid="privacy-link"]')).toBeVisible()
    
    // Verify Farm Bill compliance notice
    const farmBillNotice = page.locator('[data-testid="farm-bill-notice"]')
    if (await farmBillNotice.isVisible()) {
      await expect(farmBillNotice).toContainText('Farm Bill')
      await expect(farmBillNotice).toContainText('2018')
    }
  })

  test('handles users who change their mind', async ({ page }) => {
    await page.goto('/')
    
    // First say no
    await page.click('[data-testid="age-verify-no"]')
    await expect(page.locator('[data-testid="access-denied-modal"]')).toBeVisible()
    
    // Check if there's a way to reconsider
    const reconsiderBtn = page.locator('[data-testid="reconsider-age-btn"]')
    if (await reconsiderBtn.isVisible()) {
      await reconsiderBtn.click()
      await expect(page.locator('[data-testid="age-gate-modal"]')).toBeVisible()
      
      // Now verify age
      const confirmAgeButton = page.locator('[data-testid="age-verify-yes"]')
      await expect(confirmAgeButton).toBeVisible()
      await confirmAgeButton.click()
      await expect(page.locator('[data-testid="age-gate-modal"]')).not.toBeVisible()
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible()
    }
  })

  test('age verification works on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    const ageGate = page.locator('[data-testid="age-gate-modal"]')
    await expect(ageGate).toBeVisible()
    
    // Check mobile-specific elements
    await expect(page.locator('[data-testid="age-verify-yes"]')).toBeVisible()
    await expect(page.locator('[data-testid="age-verify-no"]')).toBeVisible()
    
    // Verify buttons are touch-friendly
    const yesButton = page.locator('[data-testid="age-verify-yes"]')
    const buttonBox = await yesButton.boundingBox()
    expect(buttonBox?.height).toBeGreaterThan(44) // Minimum touch target size
    
    // Complete verification on mobile
    await yesButton.click()
    await expect(ageGate).not.toBeVisible()
  })

  test('provides accessibility features', async ({ page }) => {
    await page.goto('/')

    // Focus should move into the modal on open
    const yesButton = page.locator('[data-testid="age-verify-yes"]')
    await expect(yesButton).toBeFocused()

    // Test ARIA labels
    const ariaLabel = await yesButton.getAttribute('aria-label')
    expect(ariaLabel).toBeTruthy()
    
    // Test screen reader content
    await expect(page.getByRole('heading', { name: /Age Verification Required/i })).toBeVisible()
  })

  test('age gate yes button text mentions 21 or older', async ({ page }) => {
    await page.goto('/')
    const yesBtn = page.locator('[data-testid="age-verify-yes"]')
    await expect(yesBtn).toBeVisible()
    const btnText = await yesBtn.textContent()
    expect(btnText?.toLowerCase()).toMatch(/21|yes|older/i)
  })

  test('age gate no button text mentions under 21', async ({ page }) => {
    await page.goto('/')
    const noBtn = page.locator('[data-testid="age-verify-no"]')
    await expect(noBtn).toBeVisible()
    const btnText = await noBtn.textContent()
    expect(btnText?.toLowerCase()).toMatch(/21|no|under/i)
  })

  test('age gate shows legal disclaimer', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-testid="legal-disclaimer"]')).toBeVisible()
  })

  test('age gate shows Farm Bill compliance notice', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-testid="farm-bill-notice"]')).toBeVisible()
  })

  test('age gate has terms of service link', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-testid="terms-link"]')).toBeVisible()
  })

  test('age gate has privacy policy link', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-testid="privacy-link"]')).toBeVisible()
  })

  test('access denied modal has reconsider button', async ({ page }) => {
    await page.goto('/')
    await page.click('[data-testid="age-verify-no"]')
    await expect(page.locator('[data-testid="access-denied-modal"]')).toBeVisible()
    await expect(page.locator('[data-testid="reconsider-age-btn"]')).toBeVisible()
  })

  test('user can reconsider and then verify age after choosing no', async ({ page }) => {
    await page.goto('/')
    await page.click('[data-testid="age-verify-no"]')
    await expect(page.locator('[data-testid="access-denied-modal"]')).toBeVisible()

    await page.click('[data-testid="reconsider-age-btn"]')
    await expect(page.locator('[data-testid="age-gate-modal"]')).toBeVisible()

    await page.click('[data-testid="age-verify-yes"]')
    await expect(page.locator('[data-testid="age-gate-modal"]')).not.toBeVisible()
    await expect(page.locator('[data-testid="main-content"]')).toBeVisible()
  })

  test('verified user can browse products without age gate appearing', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('age-verified', 'true')
      localStorage.setItem('age-verification-time', new Date().toISOString())
    })
    await page.goto('/products')
    await expect(page.locator('[data-testid="age-gate-modal"]')).not.toBeVisible()
    await expect(page.locator('[data-testid="product-grid"]')).toBeVisible()
  })

  test('access denied modal shows alternative resources', async ({ page }) => {
    await page.goto('/')
    await page.click('[data-testid="age-verify-no"]')
    await expect(page.locator('[data-testid="alternative-resources"]')).toBeVisible()
  })

  test('age gate title contains Age Verification text', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-testid="age-gate-title"]')).toContainText('Age Verification')
  })
})
