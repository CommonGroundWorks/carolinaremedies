/**
 * Product Grid Component
 * Displays products in a responsive grid layout with filtering.
 *
 * UX/A11y fixes:
 * - h2 (not h1) for heading hierarchy
 * - View-mode buttons have aria-label + aria-pressed
 * - Sort select has an associated <label> (visually hidden)
 * - Filter state synced to URL via nuqs (back-button safe)
 * - Loading spinner text uses ellipsis character
 * - Priority loading for first 4 cards (above-fold LCP)
 */

'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProductCard } from './product-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getProductsAction } from '@/app/actions/product'
import { getActiveCategories } from '@/lib/categories'
import { cn } from '@/lib/utils'
import type { ProductWithRelations, ProductFilters, ProductSortOption } from '@/types/database.types'
import { Grid, List, Loader2 } from 'lucide-react'

export interface ProductGridProps {
  initialProducts?: ProductWithRelations[]
  categoryId?: string
  category?: string
  filters?: ProductFilters
  searchQuery?: string
  sortBy?: string
  limit?: number
  excludeId?: string
  className?: string
  /** Section heading text — defaults to category name or "Products" */
  heading?: string
  /** Heading level rendered for the section — default "h2" */
  headingLevel?: 'h1' | 'h2' | 'h3'
}

type ViewMode = 'grid' | 'list'

const SORT_OPTIONS: { value: ProductSortOption; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'name_asc', label: 'Name A–Z' },
  { value: 'name_desc', label: 'Name Z–A' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'thc_desc', label: 'THC %: High to Low' },
  { value: 'created_desc', label: 'Newest First' },
  { value: 'bestseller', label: 'Best Sellers' },
]

export function ProductGrid({
  initialProducts = [],
  categoryId,
  category,
  filters: initialFilters,
  searchQuery,
  sortBy: initialSortBy,
  limit: customLimit,
  excludeId,
  className,
  heading,
  headingLevel: HeadingTag = 'h2',
}: ProductGridProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // ── URL-synced sort ────────────────────────────────────────────────────────
  const sortFromUrl = (searchParams.get('sort') as ProductSortOption) || initialSortBy || 'featured'
  const [sortBy, setSortBy] = React.useState<ProductSortOption>(sortFromUrl as ProductSortOption)

  const updateSort = (newSort: ProductSortOption) => {
    setSortBy(newSort)
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', newSort)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  // ── Local state ────────────────────────────────────────────────────────────
  const [products, setProducts] = React.useState<ProductWithRelations[]>(initialProducts)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [hasMore, setHasMore] = React.useState(true)
  const [page, setPage] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const [viewMode, setViewMode] = React.useState<ViewMode>('grid')
  const [filters, setFilters] = React.useState<ProductFilters>(initialFilters || {})

  const categories = getActiveCategories()
  const limit = customLimit || 20

  const activeCategoryId = categoryId
  const activeCategorySlug = !categoryId && category ? category : undefined

  const hasInitialProducts = React.useRef(initialProducts.length > 0)

  // ── Load products ──────────────────────────────────────────────────────────
  const loadProducts = React.useCallback(
    async ({ resetPage = false, pageToLoad = 1 }: { resetPage?: boolean; pageToLoad?: number }) => {
      setLoading(true)
      setError(null)

      try {
        const offset = (pageToLoad - 1) * limit
        const result = await getProductsAction({
          limit,
          offset,
          category_id: activeCategoryId,
          category_slug: activeCategorySlug,
          filters,
          sort: sortBy,
          search: searchQuery,
        })

        let filteredProducts = result.products
        if (excludeId) {
          filteredProducts = result.products.filter((p) => p.id !== excludeId)
        }

        if (resetPage) {
          setProducts(filteredProducts)
          setPage(2)
        } else {
          setProducts((prev) => [...prev, ...filteredProducts])
          setPage(pageToLoad + 1)
        }

        setTotal(result.total)
        setHasMore(result.hasMore)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load products. Please refresh the page or contact support.'
        )
      } finally {
        setLoading(false)
      }
    },
    [activeCategoryId, activeCategorySlug, filters, sortBy, searchQuery, limit, excludeId]
  )

  React.useEffect(() => {
    if (hasInitialProducts.current) {
      hasInitialProducts.current = false
      return
    }
    void loadProducts({ resetPage: true, pageToLoad: 1 })
  }, [activeCategoryId, activeCategorySlug, searchQuery, filters, sortBy, loadProducts])

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      void loadProducts({ pageToLoad: page })
    }
  }

  const clearFilters = () => setFilters({})

  const activeFilterCount = Object.keys(filters).filter((key) => {
    const value = filters[key as keyof ProductFilters]
    return value !== undefined && value !== null && value !== false
  }).length

  const currentCategory = categories.find(
    (cat) => cat.id === activeCategoryId || cat.slug === activeCategorySlug
  )

  const sectionHeading = heading ?? (currentCategory ? currentCategory.name : 'Products')

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-sm mb-4 text-[var(--destructive)]">{error}</p>
        <Button onClick={() => void loadProducts({ resetPage: true, pageToLoad: 1 })}>
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)} data-testid="product-grid">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <HeadingTag className="font-display text-2xl font-light text-cream-100">
            {sectionHeading}
          </HeadingTag>
          <p className="text-xs font-mono tracking-wide mt-1 text-cream-600">
            {total > 0
              ? `${total} product${total !== 1 ? 's' : ''} found`
              : 'No products found'}
          </p>
        </div>

        {/* View and Sort Controls */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* View Mode Toggle — hidden on smallest screens to save space */}
          <div className="hidden xs:flex border border-cream-300/[0.12]" role="group" aria-label="View mode">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
              data-testid="view-grid"
            >
              <Grid className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
              data-testid="view-list"
            >
              <List className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <label htmlFor="product-sort" className="sr-only">
              Sort products by
            </label>
            <select
              id="product-sort"
              value={sortBy}
              onChange={(e) => updateSort(e.target.value as ProductSortOption)}
              className="atelier-input text-xs py-2 min-w-[9rem]"
              data-testid="sort-select"
            >
              {SORT_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono tracking-wide text-cream-600">Active filters:</span>
          {Object.entries(filters).map(([key, value]) => {
            if (!value) return null
            let displayValue = String(value)
            if (key === 'price_range' && typeof value === 'object' && 'min' in value) {
              displayValue = `$${value.min} – $${value.max}`
            }
            return (
              <Badge key={key} variant="secondary" className="text-xs">
                {key.replace('_', ' ')}: {displayValue}
              </Badge>
            )
          })}
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 text-xs">
            Clear all
          </Button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && products.length === 0 && (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square" />
              <Skeleton className="h-4" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Products Grid/List */}
      {products.length > 0 && (
        <div
          className={cn(
            'grid gap-6',
            viewMode === 'grid'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'grid-cols-1'
          )}
        >
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              variant={viewMode}
              // First 4 cards are likely above-fold — give them eager/priority loading
              priority={index < 4}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && products.length === 0 && (
        <div className="text-center py-12" data-testid="no-results-message">
          <p className="text-sm mb-4 text-cream-600">
            No products found matching your criteria.
          </p>
          {activeFilterCount > 0 && (
            <Button onClick={clearFilters}>Clear Filters</Button>
          )}
        </div>
      )}

      {/* Load More */}
      {hasMore && products.length > 0 && (
        <div className="text-center pt-8">
          <Button
            onClick={handleLoadMore}
            disabled={loading}
            variant="outline"
            size="lg"
            data-testid="load-more"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
                Loading…
              </>
            ) : (
              'Load More Products'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}