'use server'

import { ProductService } from '@/lib/services/product.service'
import type { ProductFilters, ProductSortOption } from '@/types/database.types'
import { z } from 'zod'

const productSortOptions = [
  'featured',
  'name_asc',
  'name_desc',
  'price_asc',
  'price_desc',
  'thc_asc',
  'thc_desc',
  'cbd_asc',
  'cbd_desc',
  'created_desc',
  'created_asc',
  'bestseller',
] as const

const optionalTrimmedString = (max: number) => z.preprocess(
  (value) => typeof value === 'string' ? value.trim() || undefined : value,
  z.string().max(max).optional()
)

const productQuerySchema = z.object({
  limit: z.number().int().min(1).max(48).optional(),
  offset: z.number().int().min(0).max(5000).optional(),
  category_id: z.string().uuid().optional(),
  category_slug: optionalTrimmedString(100).refine(
    (value) => value === undefined || /^[a-z0-9-]+$/.test(value),
    'Invalid category slug'
  ),
  filters: z.custom<ProductFilters>((value) => value === undefined || (typeof value === 'object' && value !== null)).optional(),
  sort: z.enum(productSortOptions).optional(),
  search: optionalTrimmedString(100),
})

export async function getProductsAction(options: {
  limit?: number
  offset?: number
  category_id?: string
  category_slug?: string
  filters?: ProductFilters
  sort?: ProductSortOption
  search?: string
}) {
  const validatedOptions = productQuerySchema.parse(options)
  return ProductService.getProducts(validatedOptions)
}
