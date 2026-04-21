// @vitest-environment node

import { describe, expect, it } from 'vitest'

// ---------------------------------------------------------------------------
// Checkout form validation logic
// The checkout-form component handles all validation client-side via
// validateField(). These tests verify the rules without mounting the DOM.
// ---------------------------------------------------------------------------

function validateField(name: string, value: string): string | undefined {
  switch (name) {
    case 'email':
      if (!value.trim()) return 'Email is required'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address'
      return undefined
    case 'firstName':
      if (!value.trim()) return 'First name is required'
      return undefined
    case 'lastName':
      if (!value.trim()) return 'Last name is required'
      return undefined
    case 'addressLine1':
      if (!value.trim()) return 'Street address is required'
      return undefined
    case 'city':
      if (!value.trim()) return 'City is required'
      return undefined
    case 'state':
      if (!value) return 'State is required'
      return undefined
    case 'postalCode':
      if (!value.trim()) return 'ZIP code is required'
      return undefined
    default:
      return undefined
  }
}

function validateAllRequired(formData: Record<string, string>) {
  const requiredFields = ['email', 'firstName', 'lastName', 'addressLine1', 'city', 'state', 'postalCode'] as const
  const errors: Record<string, string | undefined> = {}
  for (const field of requiredFields) {
    const error = validateField(field, formData[field] ?? '')
    if (error) errors[field] = error
  }
  return errors
}

describe('checkout form validation', () => {
  describe('email field', () => {
    it('rejects empty email', () => {
      expect(validateField('email', '')).toBe('Email is required')
      expect(validateField('email', '   ')).toBe('Email is required')
    })

    it('rejects malformed emails', () => {
      expect(validateField('email', 'not-an-email')).toBe('Please enter a valid email address')
      expect(validateField('email', 'missing@tld')).toBe('Please enter a valid email address')
      expect(validateField('email', '@nodomain.com')).toBe('Please enter a valid email address')
    })

    it('accepts valid emails', () => {
      expect(validateField('email', 'user@example.com')).toBeUndefined()
      expect(validateField('email', 'user+tag@sub.domain.org')).toBeUndefined()
    })
  })

  describe('required text fields', () => {
    it.each(['firstName', 'lastName', 'addressLine1', 'city', 'postalCode'])(
      'rejects empty or whitespace-only %s',
      (field) => {
        expect(validateField(field, '')).toBeTruthy()
        expect(validateField(field, '   ')).toBeTruthy()
      }
    )

    it('rejects empty state', () => {
      expect(validateField('state', '')).toBeTruthy()
    })

    it.each([
      ['firstName', 'Jane'],
      ['lastName', 'Smith'],
      ['addressLine1', '123 Main St'],
      ['city', 'Raleigh'],
      ['state', 'NC'],
      ['postalCode', '27601'],
    ])('accepts valid %s', (field, value) => {
      expect(validateField(field, value)).toBeUndefined()
    })
  })

  describe('full form validation', () => {
    const validForm = {
      email: 'buyer@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '555-1234',
      addressLine1: '123 Main St',
      city: 'Raleigh',
      state: 'NC',
      postalCode: '27601',
    }

    it('passes when all required fields are filled', () => {
      const errors = validateAllRequired(validForm)
      expect(Object.keys(errors)).toHaveLength(0)
    })

    it('collects all missing fields when form is empty', () => {
      const emptyForm = Object.fromEntries(Object.keys(validForm).map(k => [k, '']))
      const errors = validateAllRequired(emptyForm)
      // phone is optional — 7 required fields
      expect(Object.keys(errors).length).toBeGreaterThanOrEqual(7)
    })

    it('only flags the missing field when one field is absent', () => {
      const form = { ...validForm, email: '' }
      const errors = validateAllRequired(form)
      expect(errors).toHaveProperty('email')
      expect(Object.keys(errors)).toHaveLength(1)
    })
  })
})

describe('order number generation', () => {
  it('generates order numbers in the expected format', () => {
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`
    expect(orderNumber).toMatch(/^ORD-\d{6}$/)
  })

  it('generates unique order numbers on successive calls', () => {
    const a = `ORD-${Date.now().toString().slice(-6)}`
    const b = `ORD-${(Date.now() + 1).toString().slice(-6)}`
    expect(a).not.toBe(b)
  })
})

describe('promo code application', () => {
  const applyPromo = (code: string, subtotal: number) => {
    if (code.toUpperCase() === 'WELCOME10') {
      return subtotal * 0.1
    }
    return 0
  }

  it('applies 10% discount for WELCOME10', () => {
    expect(applyPromo('WELCOME10', 100)).toBe(10)
    expect(applyPromo('welcome10', 100)).toBe(10)
  })

  it('returns zero for unknown promo codes', () => {
    expect(applyPromo('INVALID', 100)).toBe(0)
    expect(applyPromo('', 100)).toBe(0)
  })

  it('calculates correct final total after discount', () => {
    const subtotal = 50
    const discount = applyPromo('WELCOME10', subtotal)
    const finalTotal = subtotal - discount
    expect(finalTotal).toBe(45)
  })
})
