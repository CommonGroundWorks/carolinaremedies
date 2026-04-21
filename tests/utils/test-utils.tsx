import React, { ReactElement } from 'react'
import { render, RenderOptions, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

// Custom render function that includes providers if needed
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render, userEvent, screen }

// Common test utilities
export const createMockEvent = (type: string, properties = {}) => ({
  type,
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  target: { value: '' },
  currentTarget: { value: '' },
  ...properties,
})

export const waitForLoadingToFinish = () =>
  new Promise(resolve => setTimeout(resolve, 0))

// Mock data generators
export const createMockProduct = (overrides = {}) => ({
  id: '1',
  name: 'Test Product',
  slug: 'test-product',
  description: 'Test product description',
  price: 29.99,
  category: 'flower',
  image: '/test-image.jpg',
  inStock: true,
  quantity: 100,
  variants: [],
  lab_results: null,
  thc_percentage: 15.5,
  cbd_percentage: 1.2,
  effects: ['relaxing', 'euphoric'],
  strain_type: 'hybrid',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

export const createMockCartItem = (overrides = {}) => ({
  id: '1',
  productId: '1',
  name: 'Test Product',
  price: 29.99,
  quantity: 1,
  image: '/test-image.jpg',
  variant: null,
  ...overrides,
})

export const createMockUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  phone: '555-123-4567',
  address: {
    street: '123 Test St',
    city: 'Test City',
    state: 'CA',
    zip: '12345',
    country: 'US',
  },
  preferences: {},
  age_verified: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

export const createMockOrder = (overrides = {}) => ({
  id: '1',
  user_id: '1',
  items: [createMockCartItem()],
  total: 29.99,
  subtotal: 29.99,
  tax: 0,
  shipping: 0,
  payment_method: 'cod',
  status: 'pending',
  customer_info: {
    name: 'Test Customer',
    email: 'customer@example.com',
    phone: '555-123-4567',
    address: {
      street: '123 Test St',
      city: 'Test City',
      state: 'CA',
      zip: '12345',
      country: 'US',
    },
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

export const createMockInventoryAlert = (overrides = {}) => ({
  id: '1',
  product_id: '1',
  product_name: 'Test Product',
  current_stock: 5,
  threshold: 10,
  severity: 'low' as const,
  message: 'Low stock alert',
  resolved: false,
  created_at: new Date().toISOString(),
  ...overrides,
})