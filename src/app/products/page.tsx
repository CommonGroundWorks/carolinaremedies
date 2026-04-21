import { Suspense } from 'react'
import { ProductGrid } from '@/components/product/product-grid'
import { getActiveCategories } from '@/lib/categories'
import { ProductService } from '@/lib/services/product.service'
import Link from 'next/link'

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string
    search?: string
    sort?: string
    thc?: string
    thcRange?: string
  }>
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { category, search, sort, thc, thcRange } = await searchParams
  const categories = getActiveCategories()

  const activeCategory = categories.find(c =>
    c.slug === category || c.name === category
  )

  // Pre-fetch products server-side for immediate display
  const initialProductsResult = await ProductService.getProducts({
    limit: 20,
    offset: 0,
    category_slug: category,
    search: search,
    sort: (sort as import('@/types/database.types').ProductSortOption) || 'featured',
    filters:
      (thc === 'high' || thcRange === 'high') ? { thc_range: { min: 20, max: 100 } } :
      thcRange === 'medium' ? { thc_range: { min: 10, max: 20 } } :
      undefined,
  }).catch(() => ({ products: [], total: 0, page: 1, limit: 20, hasMore: false }))

  return (
    <div
      className="min-h-screen bg-earth-900"

    >
      {/* Page header */}
      <div
        className="border-b border-cream-300/[0.08]"

      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16">
          {/* Eyebrow */}
          <p
            className="text-xs tracking-[0.2em] uppercase mb-4 text-secondary-400 font-sans"
          >
            {search ? 'Search Results' : 'The Collection'}
          </p>

          {/* Heading */}
          <h1
            className="font-display font-light mb-8"
            data-testid="category-title"

          >
            {search
              ? <>Results for <em className="italic text-display-md text-cream-100 -tracking-[0.02em] font-display">&ldquo;{search}&rdquo;</em></>
              : activeCategory
                ? activeCategory.name
                : 'All Products'
            }
          </h1>

          {/* Category filter pills — refined */}
          <nav
            aria-label="Filter by category"
            className="flex flex-wrap gap-2"
          >
            <Link
              href="/products"
              className="px-4 py-1.5 text-xs tracking-wider uppercase transition-all duration-200"
              style={!category ? {
                background: 'var(--sage-500)',
                color: 'var(--cream-100)',
              } : {
                border: '1px solid rgba(216,204,175,0.12)',
                color: 'var(--cream-400)',
              }}
            >
              All
            </Link>
            {categories.map((cat) => {
              const isActive = category === cat.slug || category === cat.name
              return (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  data-testid={`category-${cat.slug}`}
                  className="px-4 py-1.5 text-xs tracking-wider uppercase transition-all duration-200 hover:opacity-80"
                  style={isActive ? {
                    background: 'var(--sage-500)',
                    color: 'var(--cream-100)',
                  } : {
                    border: '1px solid rgba(216,204,175,0.12)',
                    color: 'var(--cream-400)',
                  }}
                >
                  {cat.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Search bar + sort — minimal */}
      <div
        className="border-b border-cream-300/[0.06]"

      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-4 flex flex-col gap-4">
          <form method="GET" className="flex items-center gap-2" role="search">
            <label htmlFor="product-search" className="sr-only">Search products</label>
            <input
              id="product-search"
              type="search"
              name="search"
              placeholder="Search specimens…"
              defaultValue={search}
              className="w-56 px-3 py-1.5 text-sm focus:outline-none bg-cream-300/5 border border-cream-300/[0.12] text-cream-200 font-sans"
              data-testid="product-search"
            />
            {category && <input type="hidden" name="category" value={category} />}
            <button
              type="submit"
              className="px-3 py-1.5 text-xs tracking-widest uppercase transition-opacity duration-200 hover:opacity-70 border border-cream-300/[0.12] text-cream-400"
            >
              Search
            </button>
          </form>

          {/* Sort — link-based navigation */}
          <div className="flex items-center gap-3" data-testid="sort-dropdown">
            <span className="text-xs uppercase tracking-widest text-cream-600" >Sort</span>
            <div className="flex gap-2 flex-wrap">
              {([
                { value: 'name_asc', label: 'Name', testid: 'sort-name' },
                { value: 'price_asc', label: 'Price ↑', testid: 'sort-price-asc' },
                { value: 'price_desc', label: 'Price ↓', testid: 'sort-price-desc' },
                { value: 'created_desc', label: 'Newest', testid: 'sort-newest' },
              ] as { value: string; label: string; testid: string }[]).map(({ value, label, testid }) => {
                const isActive = sort === value || (!sort && value === 'name_asc')
                const params = new URLSearchParams()
                params.set('sort', value)
                if (category) params.set('category', category)
                if (search) params.set('search', search)
                if (thc) params.set('thc', thc)
                return (
                  <Link
                    key={value}
                    href={`/products?${params.toString()}`}
                    data-testid={testid}
                    className="px-2 py-1 text-xs tracking-wider uppercase transition-all duration-200"
                    style={isActive ? {
                      background: 'var(--sage-500)',
                      color: 'var(--cream-100)',
                    } : {
                      border: '1px solid rgba(216,204,175,0.12)',
                      color: 'var(--cream-400)',
                    }}
                  >
                    {label}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* THC Filter */}
          <div className="flex items-center gap-3">
            <div
              data-testid="filter-thc"
              className="text-xs uppercase tracking-widest px-3 py-1.5 cursor-pointer border border-cream-300/[0.12]"
              style={{ color: thc ? 'var(--gold-400)' : 'var(--cream-600)' }}
            >
              THC Filter
            </div>
            <Link
              data-testid="thc-range-high"
              href={(() => {
                const p = new URLSearchParams()
                p.set('thcRange', 'high')
                if (category) p.set('category', category)
                if (search) p.set('search', search)
                if (sort) p.set('sort', sort)
                return `/products?${p.toString()}`
              })()}
              className="px-2 py-1 text-xs tracking-wider uppercase transition-all duration-200"
              style={(thcRange === 'high' || thc === 'high') ? {
                background: 'var(--gold-400)',
                color: 'var(--ink-900)',
              } : {
                border: '1px solid rgba(216,204,175,0.12)',
                color: 'var(--cream-400)',
              }}
            >
              High (20%+)
            </Link>
            <Link
              data-testid="thc-range-medium"
              href={(() => {
                const p = new URLSearchParams()
                p.set('thcRange', 'medium')
                if (category) p.set('category', category)
                if (search) p.set('search', search)
                if (sort) p.set('sort', sort)
                return `/products?${p.toString()}`
              })()}
              className="px-2 py-1 text-xs tracking-wider uppercase transition-all duration-200"
              style={thcRange === 'medium' ? {
                background: 'var(--gold-400)',
                color: 'var(--ink-900)',
              } : {
                border: '1px solid rgba(216,204,175,0.12)',
                color: 'var(--cream-400)',
              }}
            >
              Medium (10-20%)
            </Link>
            <Link
              data-testid="apply-filters"
              href={(() => {
                const p = new URLSearchParams()
                p.set('thc', 'high')
                if (category) p.set('category', category)
                if (search) p.set('search', search)
                if (sort) p.set('sort', sort)
                return `/products?${p.toString()}`
              })()}
              className="px-3 py-1.5 text-xs tracking-widest uppercase transition-opacity duration-200 hover:opacity-70 bg-primary-500 text-cream-100"
            >
              Apply
            </Link>
            {thc && (
              <Link
                href="/products"
                className="px-2 py-1 text-xs tracking-wider uppercase transition-all duration-200 border border-cream-300/[0.12] text-cream-500"
              >
                Clear
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Product grid */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16">
        <Suspense fallback={
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse space-y-3">
                <div
                  className="aspect-[4/5] w-full bg-earth-800"

                />
                <div className="h-3 w-1/2 rounded bg-earth-700"  />
                <div className="h-4 w-3/4 rounded bg-earth-700"  />
                <div className="h-3 w-1/3 rounded bg-earth-700"  />
              </div>
            ))}
          </div>
        }>
          <ProductGrid
            key={`${sort || 'default'}-${category || 'all'}-${search || ''}-${thc || ''}-${thcRange || ''}`}
            initialProducts={initialProductsResult.products}
            category={category}
            searchQuery={search}
            sortBy={sort}
            filters={
              (thc === 'high' || thcRange === 'high') ? { thc_range: { min: 20, max: 100 } } :
              thcRange === 'medium' ? { thc_range: { min: 10, max: 20 } } :
              undefined
            }
          />
        </Suspense>

        {search && (
          <div className="text-center pt-16">
            <p className="text-sm text-cream-500" >
              No specimens found for &ldquo;{search}&rdquo;.{' '}
              <Link
                href="/products"
                className="transition-opacity duration-200 hover:opacity-70 text-primary-400"

              >
                View full collection
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export async function generateMetadata({ searchParams }: ProductsPageProps) {
  const { category, search } = await searchParams

  let title = 'Products — Carolina Remedies'
  let description = 'Shop premium hemp and wellness products from North Carolina'

  if (category) {
    title = `${category} — Carolina Remedies`
    description = `Shop premium ${category.toLowerCase()} from Carolina Remedies`
  }

  if (search) {
    title = `"${search}" — Carolina Remedies`
    description = `Find products matching "${search}" at Carolina Remedies`
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: '/products',
      images: [
        {
          url: '/images/og-products.jpg',
          width: 1200,
          height: 630,
          alt: 'NCRemedies Products'
        }
      ]
    }
  }
}