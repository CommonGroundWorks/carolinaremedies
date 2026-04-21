/**
 * Product Service
 * Handles all product-related operations with Supabase
 */

import { supabase } from '@/lib/supabase'
import type { Product, ProductWithRelations, ProductVariant, ProductFilters, ProductSortOption } from '@/types/database.types'

export interface ProductQueryOptions {
  limit?: number
  offset?: number
  category_id?: string
  category_slug?: string
  filters?: ProductFilters
  sort?: ProductSortOption
  search?: string
}

export interface ProductSearchResult {
  products: ProductWithRelations[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// Map sort option → Supabase column + ascending flag
function sortParams(sort: ProductSortOption): { column: string; ascending: boolean }[] {
  switch (sort) {
    case 'name_asc':     return [{ column: 'name', ascending: true }]
    case 'name_desc':    return [{ column: 'name', ascending: false }]
    case 'price_asc':    return [{ column: 'base_price', ascending: true }]
    case 'price_desc':   return [{ column: 'base_price', ascending: false }]
    case 'thc_asc':      return [{ column: 'thc_percentage', ascending: true }]
    case 'thc_desc':     return [{ column: 'thc_percentage', ascending: false }]
    case 'cbd_asc':      return [{ column: 'cbd_percentage', ascending: true }]
    case 'cbd_desc':     return [{ column: 'cbd_percentage', ascending: false }]
    case 'created_desc': return [{ column: 'created_at', ascending: false }]
    case 'created_asc':  return [{ column: 'created_at', ascending: true }]
    case 'featured':     return [{ column: 'is_featured', ascending: false }, { column: 'name', ascending: true }]
    case 'bestseller':   return [{ column: 'is_bestseller', ascending: false }, { column: 'name', ascending: true }]
    default:             return [{ column: 'name', ascending: true }]
  }
}

export class ProductService {
  /**
   * Get products with filtering, pagination, and search
   */
  static async getProducts(options: ProductQueryOptions = {}): Promise<ProductSearchResult> {
    const {
      limit = 20,
      offset = 0,
      category_id,
      category_slug,
      filters,
      sort = 'name_asc',
      search
    } = options

    // Return empty result-set when running without real Supabase credentials
    // (e.g. E2E CI without DB secrets, template demo mode).
    // Skip this guard in test environments where Supabase is fully mocked.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!process.env.VITEST && (!supabaseUrl || supabaseUrl.includes('placeholder'))) {
      return { products: [], total: 0, page: 1, limit, hasMore: false }
    }

    try {
      // Build query with relations
      let query = supabase
        .from('products')
        .select('*, category:categories(*), variants:product_variants(*), images:product_images(*)', { count: 'exact' })
        .in('status', ['active', 'published'])

      // Category filters
      if (category_id) {
        query = query.eq('category_id', category_id)
      } else if (category_slug) {
        // Resolve slug → id first
        const { data: cat } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', category_slug)
          .single()
        if (cat) {
          query = query.eq('category_id', cat.id)
        }
      }

      // Full-text / ILIKE search
      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
      }

      // Boolean & range filters
      if (filters) {
        if (filters.is_featured !== undefined)   query = query.eq('is_featured', filters.is_featured)
        if (filters.is_new_arrival !== undefined) query = query.eq('is_new_arrival', filters.is_new_arrival)
        if (filters.is_bestseller !== undefined)  query = query.eq('is_bestseller', filters.is_bestseller)
        if (filters.is_lab_tested !== undefined)  query = query.eq('is_lab_tested', filters.is_lab_tested)
        if (filters.is_organic !== undefined)     query = query.eq('is_organic', filters.is_organic)
        if (filters.strain_type && filters.strain_type.length > 0) {
          query = query.in('strain_type', filters.strain_type)
        }
        if (filters.price_range) {
          query = query.gte('base_price', filters.price_range.min).lte('base_price', filters.price_range.max)
        }
        if (filters.thc_range) {
          query = query.gte('thc_percentage', filters.thc_range.min).lte('thc_percentage', filters.thc_range.max)
        }
        if (filters.cbd_range) {
          query = query.gte('cbd_percentage', filters.cbd_range.min).lte('cbd_percentage', filters.cbd_range.max)
        }
      }

      // Sorting
      for (const { column, ascending } of sortParams(sort)) {
        query = query.order(column, { ascending })
      }

      // Pagination
      query = query.range(offset, offset + limit - 1)

      const { data, count, error } = await query

      if (error) throw new Error(error.message)

      const total = count ?? 0
      const products = (data ?? []) as unknown as ProductWithRelations[]
      const page = Math.floor(offset / limit) + 1
      const hasMore = (offset + limit) < total

      return { products, total, page, limit, hasMore }
    } catch (error) {
      console.error('Error in getProducts:', error)
      throw error instanceof Error ? error : new Error(String(error))
    }
  }

  /**
   * Get a single product by ID or slug
   */
  static async getProduct(identifier: string): Promise<ProductWithRelations | null> {
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier)

      let query = supabase
        .from('products')
        .select('*, category:categories(*), variants:product_variants(*), images:product_images(*)')
        .in('status', ['active', 'published'])

      if (isUUID) {
        query = query.eq('id', identifier)
      } else {
        query = query.eq('slug', identifier)
      }

      const { data, error } = await query.single()

      if (error && error.code === 'PGRST116') return null // not found
      if (error) throw new Error(error.message)

      return data as unknown as ProductWithRelations
    } catch (error) {
      console.error('Error in getProduct:', error)
      throw error instanceof Error ? error : new Error(String(error))
    }
  }

  /**
   * Get featured products
   */
  static async getFeaturedProducts(limit: number = 8): Promise<ProductWithRelations[]> {
    const result = await this.getProducts({
      filters: { is_featured: true },
      limit,
      sort: 'created_desc'
    })
    return result.products
  }

  /**
   * Get new arrival products
   */
  static async getNewArrivals(limit: number = 8): Promise<ProductWithRelations[]> {
    const result = await this.getProducts({
      filters: { is_new_arrival: true },
      limit,
      sort: 'created_desc'
    })
    return result.products
  }

  /**
   * Get bestseller products
   */
  static async getBestsellers(limit: number = 8): Promise<ProductWithRelations[]> {
    const result = await this.getProducts({
      filters: { is_bestseller: true },
      limit,
      sort: 'bestseller'
    })
    return result.products
  }

  /**
   * Search products by query
   */
  static async searchProducts(query: string, options: Omit<ProductQueryOptions, 'search'> = {}): Promise<ProductSearchResult> {
    return this.getProducts({
      ...options,
      search: query
    })
  }

  /**
   * Get products related by category, excluding the current product.
   */
  static async getRelatedProducts(identifier: string, limit: number = 4): Promise<ProductWithRelations[]> {
    try {
      const product = await this.getProduct(identifier)
      if (!product) return []

      const result = await this.getProducts({
        category_id: product.category_id,
        limit: limit + 1,
        sort: 'featured'
      })

      return result.products
        .filter((p) => p.id !== product.id)
        .slice(0, limit)
    } catch (error) {
      console.error('Error in getRelatedProducts:', error)
      return []
    }
  }

  /**
   * Get product variants for a specific product
   */
  static async getProductVariants(productId: string): Promise<ProductVariant[]> {
    const { data, error } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', productId)
      .eq('is_active', true)
      .order('position', { ascending: true })

    if (error) throw error
    return (data ?? []) as ProductVariant[]
  }

  /**
   * Check product availability and stock
   */
  static async checkProductAvailability(productId: string, variantId?: string): Promise<{
    available: boolean
    stock: number
    variant?: ProductVariant
  }> {
    if (variantId) {
      const variants = await this.getProductVariants(productId)
      const variant = variants.find(v => v.id === variantId)

      if (!variant) return { available: false, stock: 0 }

      return {
        available: variant.inventory_quantity > 0,
        stock: variant.inventory_quantity,
        variant
      }
    }

    const variants = await this.getProductVariants(productId)
    const totalStock = variants.reduce((sum, v) => sum + v.inventory_quantity, 0)

    return { available: totalStock > 0, stock: totalStock }
  }

  /**
   * Get product price range (min/max from variants)
   */
  static async getProductPriceRange(productId: string): Promise<{
    min: number
    max: number
    currency: string
  }> {
    const variants = await this.getProductVariants(productId)
    const product = await this.getProduct(productId)

    const basePrice = product?.base_price ?? 0

    if (variants.length === 0) {
      return { min: basePrice, max: basePrice, currency: product?.currency || 'USD' }
    }

    const prices = variants.map(v => v.price)
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      currency: product?.currency || 'USD'
    }
  }

  /**
   * Get product by slug (alias for getProduct for clarity)
   */
  static async getProductBySlug(slug: string): Promise<ProductWithRelations | null> {
    return this.getProduct(slug)
  }

  /**
   * Get all products for static generation (simplified)
   */
  static async getAllProducts(options: { limit?: number } = {}): Promise<ProductWithRelations[]> {
    const result = await this.getProducts({
      limit: options.limit || 1000,
      sort: 'name_asc',
    })
    return result.products
  }
}
      sort: 'name_asc'