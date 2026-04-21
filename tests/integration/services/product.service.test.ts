import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Chainable Supabase query-builder mock.
 * Each call (select, eq, ilike, order, range, etc.) returns `this` so chaining works.
 * The terminal calls (.single(), awaiting the builder) resolve via `mockResolvedData`.
 */
const { supabaseMock, setMockReturn, resetMocks } = vi.hoisted(() => {
  let mockReturn: { data: unknown; error: unknown; count?: number | null } = { data: null, error: null, count: null }

  const builder: Record<string, ReturnType<typeof vi.fn>> = {}

  const wireUp = () => {
    const chainMethods = [
      'select', 'eq', 'neq', 'in', 'ilike', 'or', 'gte', 'lte',
      'order', 'range', 'limit', 'is', 'filter', 'match', 'not',
      'insert', 'update', 'upsert', 'delete',
    ]
    for (const m of chainMethods) {
      builder[m] = vi.fn().mockImplementation(() => builder)
    }
    builder.single = vi.fn().mockImplementation(() => Promise.resolve(mockReturn))
    builder.then = vi.fn().mockImplementation((resolve: (v: unknown) => void) => resolve(mockReturn))
  }

  wireUp()

  const from = vi.fn().mockReturnValue(builder)

  return {
    supabaseMock: { from, _builder: builder },
    setMockReturn: (data: unknown, error: unknown = null, count: number | null = null) => {
      mockReturn = { data, error, count }
    },
    resetMocks: () => {
      mockReturn = { data: null, error: null, count: null }
      wireUp()
      from.mockClear()
      from.mockReturnValue(builder)
    },
  }
})

vi.mock('@/lib/supabase', () => ({
  supabase: supabaseMock,
}))

import { ProductService } from '@/lib/services/product.service'

const createCategory = (overrides = {}) => ({
  id: 'cat-1',
  name: 'Flower',
  slug: 'flower',
  ...overrides,
})

const createVariant = (overrides = {}) => ({
  id: 'variant-1',
  product_id: 'product-1',
  name: '3.5g',
  price: 45,
  inventory_quantity: 10,
  is_active: true,
  position: 1,
  created_at: new Date().toISOString(),
  ...overrides,
})

const createProduct = (overrides = {}) => ({
  id: 'product-1',
  name: 'Blue Dream',
  slug: 'blue-dream',
  description: 'Balanced flower',
  status: 'active',
  categoryId: 'cat-1',
  category_id: 'cat-1',
  base_price: 45,
  currency: 'USD',
  thc_percentage: 22,
  cbd_percentage: 1,
  is_featured: false,
  is_new_arrival: false,
  is_bestseller: false,
  is_lab_tested: true,
  is_organic: false,
  strain_type: 'hybrid',
  created_at: new Date().toISOString(),
  category: createCategory(),
  variants: [createVariant()],
  images: [],
  effects: [],
  lab_reports: [],
  compliance_records: [],
  ...overrides,
})

const createSearchResult = (products = [createProduct()]) => ({
  products,
  total: products.length,
  page: 1,
  limit: 20,
  hasMore: false,
})

describe('ProductService Integration Tests', () => {
  const builder = supabaseMock._builder

  beforeEach(() => {
    vi.restoreAllMocks()
    resetMocks()
  })

  describe('getProducts', () => {
    it('fetches products successfully', async () => {
      const products = [createProduct()]
      setMockReturn(products, null, 1)

      const result = await ProductService.getProducts()

      expect(supabaseMock.from).toHaveBeenCalledWith('products')
      expect(builder.select).toHaveBeenCalled()
      expect(builder.in).toHaveBeenCalledWith('status', ['active', 'published'])
      expect(result.products).toEqual(products)
      expect(result.total).toBe(1)
      expect(result.page).toBe(1)
      expect(result.hasMore).toBe(false)
    })

    it('applies search filter via .or()', async () => {
      setMockReturn([createProduct()], null, 1)

      await ProductService.getProducts({ search: 'dream' })

      expect(builder.or).toHaveBeenCalledWith(
        expect.stringContaining('dream')
      )
    })

    it('applies sorting and pagination correctly', async () => {
      setMockReturn([createProduct()], null, 50)

      const result = await ProductService.getProducts({
        sort: 'price_desc',
        limit: 10,
        offset: 20,
      })

      expect(builder.order).toHaveBeenCalledWith('base_price', { ascending: false })
      expect(builder.range).toHaveBeenCalledWith(20, 29)
      expect(result.page).toBe(3)
      expect(result.hasMore).toBe(true)
    })

    it('defaults invalid sort options to name ascending', async () => {
      setMockReturn([createProduct()], null, 1)

      await ProductService.getProducts({ sort: 'invalid_sort' as never })

      expect(builder.order).toHaveBeenCalledWith('name', { ascending: true })
    })

    it('returns empty results cleanly', async () => {
      setMockReturn([], null, 0)

      const result = await ProductService.getProducts()

      expect(result.products).toEqual([])
      expect(result.total).toBe(0)
      expect(result.hasMore).toBe(false)
    })

    it('rethrows database errors', async () => {
      setMockReturn(null, { message: 'Database error' })

      await expect(ProductService.getProducts()).rejects.toThrow('Database error')
    })
  })

  describe('getProduct', () => {
    it('fetches a product by slug', async () => {
      const product = createProduct()
      builder.single.mockResolvedValue({ data: product, error: null })

      const result = await ProductService.getProduct('blue-dream')

      expect(supabaseMock.from).toHaveBeenCalledWith('products')
      expect(builder.eq).toHaveBeenCalledWith('slug', 'blue-dream')
      expect(result?.slug).toBe('blue-dream')
    })

    it('returns null when a product is not found', async () => {
      builder.single.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'Not found' } })

      await expect(ProductService.getProduct('missing-product')).resolves.toBeNull()
    })

    it('rethrows read errors', async () => {
      builder.single.mockResolvedValue({ data: null, error: { code: 'OTHER', message: 'Read failed' } })

      await expect(ProductService.getProduct('blue-dream')).rejects.toThrow('Read failed')
    })
  })

  describe('collection helpers', () => {
    it('fetches featured products with the expected query shape', async () => {
      const spy = vi.spyOn(ProductService, 'getProducts').mockResolvedValue(createSearchResult())

      await ProductService.getFeaturedProducts(4)

      expect(spy).toHaveBeenCalledWith({
        filters: { is_featured: true },
        limit: 4,
        sort: 'created_desc',
      })
    })

    it('fetches new arrivals with the expected query shape', async () => {
      const spy = vi.spyOn(ProductService, 'getProducts').mockResolvedValue(createSearchResult())

      await ProductService.getNewArrivals(6)

      expect(spy).toHaveBeenCalledWith({
        filters: { is_new_arrival: true },
        limit: 6,
        sort: 'created_desc',
      })
    })

    it('fetches bestsellers with the expected query shape', async () => {
      const spy = vi.spyOn(ProductService, 'getProducts').mockResolvedValue(createSearchResult())

      await ProductService.getBestsellers(5)

      expect(spy).toHaveBeenCalledWith({
        filters: { is_bestseller: true },
        limit: 5,
        sort: 'bestseller',
      })
    })

    it('searches products by forwarding the query', async () => {
      const spy = vi.spyOn(ProductService, 'getProducts').mockResolvedValue(createSearchResult())

      await ProductService.searchProducts('cannabis', { limit: 10 })

      expect(spy).toHaveBeenCalledWith({
        limit: 10,
        search: 'cannabis',
      })
    })

    it('gets related products and excludes the current product', async () => {
      vi.spyOn(ProductService, 'getProduct').mockResolvedValue(createProduct({ id: 'product-1', category_id: 'cat-1' }) as never)
      vi.spyOn(ProductService, 'getProducts').mockResolvedValue({
        products: [
          createProduct({ id: 'product-2', category_id: 'cat-1' }),
          createProduct({ id: 'product-3', category_id: 'cat-1' }),
          createProduct({ id: 'product-1', category_id: 'cat-1' }),
        ],
        total: 3,
        page: 1,
        limit: 5,
        hasMore: false,
      })

      const result = await ProductService.getRelatedProducts('product-1', 2)

      expect(ProductService.getProducts).toHaveBeenCalledWith({
        category_id: 'cat-1',
        limit: 3,
        sort: 'featured',
      })
      expect(result).toHaveLength(2)
      expect(result.every((product) => product.id !== 'product-1')).toBe(true)
    })

    it('returns an empty related-product list when the source product is missing', async () => {
      vi.spyOn(ProductService, 'getProduct').mockResolvedValue(null)

      await expect(ProductService.getRelatedProducts('missing')).resolves.toEqual([])
    })

    it('returns an empty related-product list when loading fails', async () => {
      vi.spyOn(ProductService, 'getProduct').mockRejectedValue(new Error('Database error'))

      await expect(ProductService.getRelatedProducts('product-1')).resolves.toEqual([])
    })

    it('aliases getProductBySlug to getProduct', async () => {
      const product = createProduct()
      const spy = vi.spyOn(ProductService, 'getProduct').mockResolvedValue(product)

      const result = await ProductService.getProductBySlug('blue-dream')

      expect(spy).toHaveBeenCalledWith('blue-dream')
      expect(result).toEqual(product)
    })

    it('gets all products with a static-generation limit', async () => {
      const searchResult = {
        products: [createProduct()],
        total: 1,
        page: 1,
        limit: 1000,
        hasMore: false,
      }
      const spy = vi.spyOn(ProductService, 'getProducts').mockResolvedValue(searchResult)

      const result = await ProductService.getAllProducts({ limit: 25 })

      expect(spy).toHaveBeenCalledWith({
        limit: 25,
        sort: 'name_asc',
      })
      expect(result).toEqual(searchResult.products)
    })
  })

  describe('getProductVariants', () => {
    it('fetches active variants in position order', async () => {
      const variants = [createVariant()]
      setMockReturn(variants, null)

      const result = await ProductService.getProductVariants('product-1')

      expect(supabaseMock.from).toHaveBeenCalledWith('product_variants')
      expect(builder.eq).toHaveBeenCalledWith('product_id', 'product-1')
      expect(builder.eq).toHaveBeenCalledWith('is_active', true)
      expect(builder.order).toHaveBeenCalledWith('position', { ascending: true })
      expect(result).toEqual(variants)
    })

    it('rethrows variant query errors', async () => {
      setMockReturn(null, { message: 'Variant query failed' })

      await expect(ProductService.getProductVariants('product-1')).rejects.toThrow('Variant query failed')
    })
  })

  describe('inventory and pricing helpers', () => {
    it('checks stock for a specific variant', async () => {
      vi.spyOn(ProductService, 'getProductVariants').mockResolvedValue([
        createVariant({ id: 'variant-1', inventory_quantity: 10 }),
        createVariant({ id: 'variant-2', inventory_quantity: 0 }),
      ] as never)

      const result = await ProductService.checkProductAvailability('product-1', 'variant-1')

      expect(result).toEqual({
        available: true,
        stock: 10,
        variant: expect.objectContaining({ id: 'variant-1' }),
      })
    })

    it('returns unavailable when a requested variant is missing', async () => {
      vi.spyOn(ProductService, 'getProductVariants').mockResolvedValue([createVariant()] as never)

      await expect(ProductService.checkProductAvailability('product-1', 'missing')).resolves.toEqual({
        available: false,
        stock: 0,
      })
    })

    it('sums stock across variants when no variant is requested', async () => {
      vi.spyOn(ProductService, 'getProductVariants').mockResolvedValue([
        createVariant({ inventory_quantity: 10 }),
        createVariant({ id: 'variant-2', inventory_quantity: 5 }),
      ] as never)

      const result = await ProductService.checkProductAvailability('product-1')

      expect(result).toEqual({
        available: true,
        stock: 15,
      })
    })

    it('returns a base-price range when no variants exist', async () => {
      vi.spyOn(ProductService, 'getProductVariants').mockResolvedValue([] as never)
      vi.spyOn(ProductService, 'getProduct').mockResolvedValue(createProduct({ base_price: 30, currency: 'USD' }) as never)

      const result = await ProductService.getProductPriceRange('product-1')

      expect(result).toEqual({
        min: 30,
        max: 30,
        currency: 'USD',
      })
    })

    it('calculates a price range from variants', async () => {
      vi.spyOn(ProductService, 'getProductVariants').mockResolvedValue([
        createVariant({ price: 45 }),
        createVariant({ id: 'variant-2', price: 80 }),
      ] as never)
      vi.spyOn(ProductService, 'getProduct').mockResolvedValue(createProduct({ base_price: 30, currency: 'USD' }) as never)

      const result = await ProductService.getProductPriceRange('product-1')

      expect(result).toEqual({
        min: 45,
        max: 80,
        currency: 'USD',
      })
    })
  })
})
