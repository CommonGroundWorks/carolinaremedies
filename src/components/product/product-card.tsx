/**
 * Product Card Component — Botanical Atelier Edition
 * Museum-quality specimen card with editorial typography
 *
 * Accessibility & UX fixes:
 * - Wraps entire card in <Link> (proper anchor semantics, Cmd/Ctrl+click support)
 * - Uses global toast via useNotifications (no per-card inline toasts)
 * - image loading="lazy" for below-fold cards; caller passes priority prop for above-fold
 * - No transition:all; only specific properties listed
 * - Removed inline style mouse handlers (conflict with className transform)
 */

'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useStorefront } from '@/components/layout/storefront-provider'
import { useCartStore, useNotifications } from '@/lib/stores'
import { formatCurrency, cn } from '@/lib/utils'
import type { ProductWithRelations } from '@/types/database.types'
import { ShoppingCart, Plus } from 'lucide-react'

export interface ProductCardProps {
  product: ProductWithRelations
  variant?: 'grid' | 'list'
  /** Pass true for the first row of cards (above-fold LCP images) */
  priority?: boolean
  className?: string
}

export function ProductCard({
  product,
  variant = 'grid',
  priority = false,
  className,
}: ProductCardProps) {
  const { addItem } = useCartStore()
  const { add: addNotification } = useNotifications()
  const { shoppingEnabled } = useStorefront()
  const [isAddingToCart, setIsAddingToCart] = React.useState(false)
  const [imageError, setImageError] = React.useState(false)
  const productHref = `/products/${product.slug}`

  const primaryImage = product.images?.[0]?.url || '/images/placeholders/product-default.svg'

  const hasVariants = product.variants && product.variants.length > 0
  const minPrice = hasVariants
    ? Math.min(...product.variants.map((v) => v.price))
    : product.base_price
  const maxPrice = hasVariants
    ? Math.max(...product.variants.map((v) => v.price))
    : product.base_price

  const priceDisplay =
    minPrice === maxPrice
      ? formatCurrency(minPrice, product.currency)
      : `${formatCurrency(minPrice, product.currency)} – ${formatCurrency(maxPrice, product.currency)}`

  const totalStock = hasVariants
    ? product.variants.reduce((sum, v) => sum + v.inventory_quantity, 0)
    : 100
  const isInStock = totalStock > 0

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isInStock || isAddingToCart) return
    setIsAddingToCart(true)
    try {
      const defaultVariant = hasVariants ? product.variants[0] : undefined
      addItem(product, defaultVariant, 1)
      addNotification({
        type: 'success',
        title: `${product.name} added to cart`,
        message: hasVariants ? `Variant: ${defaultVariant?.name}` : undefined,
        duration: 3000,
      })
    } catch (error) {
      console.error('Error adding to cart:', error)
      addNotification({
        type: 'error',
        title: 'Could not add to cart',
        message: 'Please try again or refresh the page.',
        duration: 4000,
      })
    } finally {
      setIsAddingToCart(false)
    }
  }

  // ── List variant ──────────────────────────────────────────────────────────
  if (variant === 'list') {
    return (
      <article
        className="group border-b border-cream-300/10"
        data-testid="product-card"
        data-stock={isInStock ? 'in' : 'out'}
      >
        <Link
          href={productHref}
          className="flex gap-6 py-8 transition-opacity duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-earth-900"
          aria-label={`View ${product.name} details`}
          data-testid="product-card-link"
        >
          {/* Thumbnail */}
          <div className="relative w-24 h-24 flex-shrink-0 overflow-hidden bg-earth-800">
            <Image
              src={imageError ? '/images/placeholders/product-default.svg' : primaryImage}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              loading={priority ? 'eager' : 'lazy'}
              onError={() => setImageError(true)}
              sizes="96px"
              data-testid="product-image"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs tracking-widest uppercase mb-1 text-primary-400 font-sans">
              {product.category?.name}
              {product.strain_type && ` · ${product.strain_type}`}
            </p>
            <h3
              className="font-display font-light text-xl mb-1 truncate text-cream-100 -tracking-[0.01em]"
              data-testid="product-title"
            >
              {product.name}
            </h3>
            {product.short_description && (
              <p className="text-sm line-clamp-1 text-cream-500" data-testid="product-description">
                {product.short_description}
              </p>
            )}
          </div>

          {/* Price + CTA */}
          <div className="flex flex-col items-end justify-between flex-shrink-0">
            <span
              className="font-mono text-lg tabular-nums text-secondary-400"
              data-testid="product-price"
            >
              {priceDisplay}
            </span>
            {shoppingEnabled ? (
              <button
                onClick={handleAddToCart}
                disabled={!isInStock || isAddingToCart}
                className="flex items-center gap-2 px-4 py-2 text-xs tracking-widest uppercase transition-opacity duration-200 hover:opacity-80 disabled:opacity-40 text-cream-300 border border-cream-300/[0.15]"
                aria-label={`Add ${product.name} to cart`}
                data-testid="add-to-cart-btn"
              >
                <ShoppingCart className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isInStock ? 'Add' : 'Sold Out'}</span>
              </button>
            ) : (
              <span className="text-[0.65rem] tracking-[0.18em] uppercase text-cream-600">
                Catalog only
              </span>
            )}
          </div>
        </Link>
      </article>
    )
  }

  // ── Grid variant ──────────────────────────────────────────────────────────
  return (
    <article
      className={cn('group', className)}
      data-testid="product-card"
      data-stock={isInStock ? 'in' : 'out'}
    >
      <Link
        href={productHref}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-earth-900"
        aria-label={`View ${product.name} — ${priceDisplay}`}
        data-testid="product-card-link"
      >
        {/* Image — botanical specimen frame */}
        <div className="relative aspect-[4/5] overflow-hidden mb-4 bg-earth-800">
          <Image
            src={imageError ? '/images/placeholders/product-default.svg' : primaryImage}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            loading={priority ? 'eager' : 'lazy'}
            priority={priority}
            onError={() => setImageError(true)}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            data-testid="product-image"
          />

          {/* Status badges — top-left */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.is_new_arrival && (
              <span className="px-2 py-0.5 text-xs tracking-widest uppercase bg-secondary-400 text-earth-900 font-sans">
                New
              </span>
            )}
            {product.is_bestseller && (
              <span className="px-2 py-0.5 text-xs tracking-widest uppercase bg-primary-500/90 text-cream-100 font-sans">
                Bestseller
              </span>
            )}
            {!isInStock && (
              <span
                className="px-2 py-0.5 text-xs tracking-widest uppercase bg-earth-900/[0.85] text-cream-500 font-sans border border-cream-300/[0.15]"
                data-testid="out-of-stock-badge"
              >
                Sold Out
              </span>
            )}
          </div>

          {/* Cannabinoid readouts — top-right, DM Mono */}
          {(product.thc_percentage || product.cbd_percentage) && (
            <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
              {product.thc_percentage && (
                <span
                  className="px-2 py-0.5 text-xs bg-earth-900/80 text-cream-300 font-mono border border-cream-300/10"
                  data-testid="product-thc"
                  aria-label={`THC: ${product.thc_percentage}%`}
                >
                  {product.thc_percentage}% THC
                </span>
              )}
              {product.cbd_percentage && (
                <span
                  className="px-2 py-0.5 text-xs bg-earth-900/80 text-primary-400 font-mono border border-primary-500/20"
                  data-testid="product-cbd"
                  aria-label={`CBD: ${product.cbd_percentage}%`}
                >
                  {product.cbd_percentage}% CBD
                </span>
              )}
            </div>
          )}

          {/* Quick-add overlay — desktop hover only */}
          {shoppingEnabled && isInStock && (
            <div className="hidden md:flex absolute inset-x-0 bottom-0 items-center justify-center py-4 translate-y-full transition-transform duration-300 group-hover:translate-y-0 bg-earth-900/90">
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className="flex items-center gap-2 text-xs tracking-widest uppercase transition-opacity duration-200 disabled:opacity-50 hover:opacity-80 text-cream-200"
                aria-label={`Add ${product.name} to cart`}
                data-testid="quick-add-to-cart"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                {isAddingToCart ? 'Adding…' : 'Add to Cart'}
              </button>
            </div>
          )}
        </div>

        {/* Specimen label — below image */}
        <div className="space-y-1 px-0.5">
          {/* Category · Strain type */}
          <p
            className="text-xs tracking-widest uppercase text-primary-400 font-sans"
            data-testid="product-category"
          >
            {product.category?.name}
            {product.strain_type && <span> · {product.strain_type}</span>}
          </p>

          {/* Product name — Cormorant Garamond */}
          <h3
            className="font-display font-light leading-tight text-xl text-cream-100 -tracking-[0.01em]"
            data-testid="product-title"
          >
            {product.name}
          </h3>

          {product.short_description && (
            <p className="text-sm line-clamp-2 text-cream-500" data-testid="product-description">
              {product.short_description}
            </p>
          )}

          {/* Price row — with mobile add-to-cart button */}
          <div className="flex items-center justify-between pt-1">
            <span
              className="font-mono tabular-nums text-base text-secondary-400"
              data-testid="product-price"
            >
              {priceDisplay}
            </span>
            <div className="flex items-center gap-2">
              {product.is_lab_tested && (
                <span className="hidden sm:inline text-xs tracking-wide text-primary-400" aria-label="Lab tested">
                  ✓ Tested
                </span>
              )}
              {/* Mobile add-to-cart — visible below md, replaces hover overlay */}
              {shoppingEnabled && isInStock && (
                <button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className="md:hidden flex items-center justify-center h-9 w-9 border border-cream-300/[0.15] transition-opacity duration-200 disabled:opacity-40 hover:opacity-80 text-cream-300 active:scale-95"
                  aria-label={`Add ${product.name} to cart`}
                  data-testid="quick-add-to-cart"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
          {!shoppingEnabled && (
            <p className="pt-1 text-[0.65rem] tracking-[0.18em] uppercase text-cream-600">
              Catalog only
            </p>
          )}
        </div>
      </Link>
    </article>
  )
}
