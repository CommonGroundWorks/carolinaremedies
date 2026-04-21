import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../../utils/test-utils'
import { StorefrontProvider } from '@/components/layout/storefront-provider'
import { ProductCard } from '@/components/product/product-card'
import type { ProductWithRelations } from '@/types/database.types'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => React.createElement('a', { href, ...props }, children),
}))

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) =>
    React.createElement('img', { src, alt, ...props }),
}))

vi.mock('@/lib/stores', () => ({
  useCartStore: () => ({
    addItem: vi.fn(),
  }),
  useNotifications: () => ({
    add: vi.fn(),
  }),
}))

const product: ProductWithRelations = {
  id: 'product-1',
  name: 'Test Flower',
  slug: 'test-flower',
  sku: 'TEST-FLOWER',
  category_id: 'category-1',
  subcategory: null,
  description: 'Test product description',
  short_description: 'Short product description',
  brand: null,
  genetics: null,
  strain_type: 'hybrid',
  thc_percentage: 18,
  cbd_percentage: 1,
  total_cannabinoids: null,
  terpene_profile: null,
  base_price: 39.99,
  currency: 'USD',
  status: 'active',
  is_featured: false,
  is_new_arrival: false,
  is_bestseller: false,
  is_lab_tested: false,
  is_organic: false,
  lab_results_url: null,
  meta_title: null,
  meta_description: null,
  meta_keywords: null,
  farm_bill_compliant: true,
  age_restricted: true,
  license_number: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  published_at: null,
  discontinued_at: null,
  created_by: null,
  updated_by: null,
  category: {
    id: 'category-1',
    name: 'Flower',
    slug: 'flower',
    description: null,
    parent_id: null,
    level: 0,
    sort_order: 0,
    icon: null,
    image_url: null,
    color_hex: null,
    is_featured: false,
    meta_title: null,
    meta_description: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  variants: [
    {
      id: 'variant-1',
      product_id: 'product-1',
      name: 'Default',
      weight_value: null,
      weight_unit: 'g',
      price: 39.99,
      cost: null,
      compare_at_price: null,
      sku: 'TEST-FLOWER',
      barcode: null,
      inventory_quantity: 8,
      inventory_policy: 'deny',
      low_stock_threshold: 5,
      requires_shipping: true,
      weight_grams: null,
      is_active: true,
      position: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  images: [
    {
      id: 'image-1',
      product_id: 'product-1',
      filename: 'test.jpg',
      original_filename: 'test.jpg',
      url: '/images/placeholders/product-default.svg',
      alt_text: 'Test Flower',
      width: null,
      height: null,
      file_size: null,
      mime_type: 'image/svg+xml',
      image_type: 'product',
      position: 0,
      is_primary: true,
      created_at: new Date().toISOString(),
    },
  ],
}

describe('ProductCard storefront mode', () => {
  it('hides quick add controls when shopping is disabled', () => {
    render(
      <StorefrontProvider
        initialSettings={{ id: 'storefront', shopping_enabled: false, updated_at: null }}
      >
        <ProductCard product={product} />
      </StorefrontProvider>
    )

    expect(screen.queryByTestId('quick-add-to-cart')).not.toBeInTheDocument()
    expect(screen.getByText('Catalog only')).toBeInTheDocument()
  })

  it('shows quick add controls when shopping is enabled', () => {
    render(
      <StorefrontProvider
        initialSettings={{ id: 'storefront', shopping_enabled: true, updated_at: null }}
      >
        <ProductCard product={product} />
      </StorefrontProvider>
    )

    expect(screen.getAllByTestId('quick-add-to-cart')).toHaveLength(2)
  })
})