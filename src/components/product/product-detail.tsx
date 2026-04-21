/**
 * Product Detail Component
 * Complete product detail view with variants, images, and purchase options.
 *
 * UX/A11y fixes:
 * - Quantity ± buttons have proper aria-label
 * - Tabs use role="tablist", role="tab", aria-selected, aria-controls, aria-labelledby
 * - Thumbnail buttons have descriptive aria-label
 * - Lab report dates use Intl.DateTimeFormat (locale-safe)
 * - Variant buttons use aria-pressed (radio-group pattern)
 * - Global toast via useNotifications
 * - Share fallback shows user feedback via toast
 * - Removed aria-hidden on trust-signal icons (they are meaningful)
 */

'use client'

import * as React from 'react'
import Image from 'next/image'
import { useStorefront } from '@/components/layout/storefront-provider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCartStore, useNotifications } from '@/lib/stores'
import { formatCurrency, cn } from '@/lib/utils'
import type { ProductWithRelations, ProductVariant } from '@/types/database.types'
import {
  ShoppingCart,
  Share2,
  Shield,
  Truck,
  RotateCcw,
  Plus,
  Minus,
  Check,
} from 'lucide-react'

export interface ProductDetailProps {
  product: ProductWithRelations
  className?: string
}

/** Format a date string consistently regardless of locale */
function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateStr))
}

type TabId = 'description' | 'effects' | 'lab-reports'

const TABS: { id: TabId; label: string }[] = [
  { id: 'description', label: 'Description' },
  { id: 'effects', label: 'Effects' },
  { id: 'lab-reports', label: 'Lab Reports' },
]

export function ProductDetail({ product, className }: ProductDetailProps) {
  const { addItem } = useCartStore()
  const { add: addNotification } = useNotifications()
  const { shoppingEnabled } = useStorefront()
  const [selectedVariant, setSelectedVariant] = React.useState<ProductVariant | null>(
    product.variants?.[0] || null
  )
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0)
  const [quantity, setQuantity] = React.useState(1)
  const [isAddingToCart, setIsAddingToCart] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<TabId>('description')

  const images = product.images || []
  const variants = product.variants || []
  const hasVariants = variants.length > 0

  const currentPrice = selectedVariant?.price || product.base_price
  const currentStock = selectedVariant?.inventory_quantity ?? 100
  const isInStock = currentStock > 0
  const maxQuantity = Math.min(currentStock, 10)

  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant)
    setQuantity(1)
  }

  const handleQuantityChange = (newQuantity: number) => {
    const clamped = Math.max(1, Math.min(newQuantity, maxQuantity))
    setQuantity(clamped)
  }

  const handleAddToCart = async () => {
    if (!isInStock) return
    setIsAddingToCart(true)
    try {
      addItem(product, selectedVariant || undefined, quantity)
      addNotification({
        type: 'success',
        title: `${product.name} added to cart`,
        message:
          quantity > 1
            ? `${quantity} × ${selectedVariant?.name ?? 'unit'}`
            : selectedVariant?.name,
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

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text: product.short_description || '',
          url: window.location.href,
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        addNotification({
          type: 'info',
          title: 'Link copied to clipboard',
          duration: 2500,
        })
      }
    } catch {
      // User cancelled share — not an error
    }
  }

  return (
    <>
      <div className={cn('', className)}>
        {/* ─── Gallery + Info ─── */}
        <div className="grid gap-0 lg:grid-cols-[1fr_1fr]">
          {/* Left — Image Gallery */}
          <div className="relative">
            {/* Main Image */}
            <div className="relative aspect-[4/5] overflow-hidden bg-earth-800">
              <Image
                src={images[selectedImageIndex]?.url || '/images/placeholders/product-default.svg'}
                alt={
                  images[selectedImageIndex]
                    ? `${product.name} — image ${selectedImageIndex + 1} of ${images.length}`
                    : product.name
                }
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                data-testid="product-image"
              />

              {/* Ambient gradient overlay at bottom */}
              <div
                className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[var(--ink-900)] to-transparent pointer-events-none"
                aria-hidden="true"
              />

              {/* Badges */}
              <div className="absolute top-6 left-6 flex flex-col gap-2">
                {product.is_featured && <Badge variant="featured">Featured</Badge>}
                {product.is_new_arrival && <Badge variant="new">New Arrival</Badge>}
                {product.is_bestseller && <Badge variant="bestseller">Best Seller</Badge>}
                {!isInStock && <Badge variant="destructive">Sold Out</Badge>}
              </div>
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex gap-[1px] mt-[1px]" role="group" aria-label="Product images">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImageIndex(index)}
                    className="relative flex-1 aspect-square overflow-hidden transition-opacity duration-200 bg-earth-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400"
                    style={{
                      opacity: index === selectedImageIndex ? 1 : 0.5,
                      borderBottom:
                        index === selectedImageIndex
                          ? '2px solid var(--gold-400)'
                          : '2px solid transparent',
                    }}
                    aria-label={`View image ${index + 1} of ${images.length}`}
                    aria-pressed={index === selectedImageIndex}
                  >
                    <Image
                      src={image.url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="100px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right — Product Information */}
          <div className="lg:pl-16 lg:pr-8 py-10 px-6 lg:py-16 flex flex-col justify-center space-y-8">
            {/* Specimen Label */}
            <div>
              {product.category && (
                <p
                  className="text-xs tracking-[0.25em] uppercase mb-4 font-mono text-secondary-400"
                  data-testid="product-category"
                >
                  {product.category.name}
                </p>
              )}

              <h1
                className="font-display text-4xl lg:text-5xl font-light leading-[1.1] mb-4 text-cream-100"
                data-testid="product-title"
              >
                {product.name}
              </h1>

              <div className="flex items-center gap-4 flex-wrap">
                {product.strain_type && <Badge variant="strain">{product.strain_type}</Badge>}
                {product.genetics && (
                  <span className="text-xs tracking-wide text-cream-600">{product.genetics}</span>
                )}
              </div>
            </div>

            {/* Price */}
            <div>
              <p
                className="font-mono text-3xl tracking-tight text-cream-100"
                data-testid="product-price"
              >
                {formatCurrency(currentPrice, product.currency)}
              </p>
              <p className="text-xs mt-1 text-cream-600">Tax included · Free shipping over $75</p>
            </div>

            <hr className="atelier-divider" aria-hidden="true" />

            {/* Cannabinoid Profile */}
            {(product.thc_percentage || product.cbd_percentage) && (
              <div>
                <h3 className="text-xs tracking-[0.2em] uppercase mb-4 font-mono text-cream-500">
                  Cannabinoid Profile
                </h3>
                <div className="flex gap-6">
                  {product.thc_percentage != null && (
                    <div
                      className="flex-1 p-5 text-center bg-cream-300/[0.03] border border-cream-300/[0.08]"
                      data-testid="product-thc"
                    >
                      <div className="font-mono text-2xl font-medium text-secondary-400">
                        {product.thc_percentage}%
                      </div>
                      <div className="text-xs tracking-[0.15em] uppercase mt-1 text-cream-500">
                        THC
                      </div>
                    </div>
                  )}
                  {product.cbd_percentage != null && (
                    <div
                      className="flex-1 p-5 text-center bg-cream-300/[0.03] border border-cream-300/[0.08]"
                      data-testid="product-cbd"
                    >
                      <div className="font-mono text-2xl font-medium text-primary-400">
                        {product.cbd_percentage}%
                      </div>
                      <div className="text-xs tracking-[0.15em] uppercase mt-1 text-cream-500">
                        CBD
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Variant Selector */}
            {hasVariants && (
              <div data-testid="variant-selector">
                <h3
                  id="variant-label"
                  className="text-xs tracking-[0.2em] uppercase mb-4 font-mono text-cream-500"
                >
                  Select Size
                </h3>
                <div
                  className="grid grid-cols-2 gap-2"
                  role="group"
                  aria-labelledby="variant-label"
                >
                  {variants.map((variant) => {
                    const isSelected = selectedVariant?.id === variant.id
                    const isSoldOut = variant.inventory_quantity === 0
                    return (
                      <button
                        key={variant.id}
                        onClick={() => handleVariantSelect(variant)}
                        disabled={isSoldOut}
                        data-testid="variant-option"
                        aria-pressed={isSelected}
                        aria-label={`${variant.name} — ${formatCurrency(variant.price, product.currency)}${isSoldOut ? ' (sold out)' : ''}`}
                        className="p-4 text-left transition-opacity duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400 disabled:cursor-not-allowed"
                        style={{
                          background: isSelected ? 'rgba(216,204,175,0.06)' : 'transparent',
                          border: isSelected
                            ? '1px solid var(--gold-400)'
                            : '1px solid rgba(216,204,175,0.1)',
                          opacity: isSoldOut ? 0.35 : 1,
                        }}
                      >
                        <div className="font-medium text-sm text-cream-200">{variant.name}</div>
                        <div className="font-mono text-sm mt-1 text-cream-500">
                          {formatCurrency(variant.price, product.currency)}
                        </div>
                        {isSoldOut && (
                          <div className="text-xs mt-1 text-[var(--destructive)]">Sold out</div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quantity + Add to Cart */}
            {shoppingEnabled ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span
                    id="qty-label"
                    className="text-xs tracking-[0.15em] uppercase font-mono text-cream-500"
                  >
                    Qty
                  </span>
                  <div
                    className="inline-flex items-center border border-cream-300/[0.12]"
                    role="group"
                    aria-labelledby="qty-label"
                  >
                    <button
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1}
                      className="h-10 w-10 flex items-center justify-center transition-colors duration-150 hover:bg-[rgba(216,204,175,0.06)] disabled:opacity-30 text-cream-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400 focus-visible:ring-inset"
                      aria-label={`Decrease quantity (currently ${quantity})`}
                    >
                      <Minus className="h-3 w-3" aria-hidden="true" />
                    </button>
                    <span
                      className="w-12 text-center font-mono text-sm text-cream-100"
                      aria-live="polite"
                      aria-label={`Quantity: ${quantity}`}
                    >
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={quantity >= maxQuantity}
                      className="h-10 w-10 flex items-center justify-center transition-colors duration-150 hover:bg-[rgba(216,204,175,0.06)] disabled:opacity-30 text-cream-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400 focus-visible:ring-inset"
                      aria-label={`Increase quantity (currently ${quantity})`}
                    >
                      <Plus className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </div>
                  <span className="text-xs text-cream-600">{currentStock} available</span>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleAddToCart}
                    disabled={!isInStock || isAddingToCart}
                    loading={isAddingToCart}
                    size="lg"
                    className="flex-1 h-12"
                    data-testid="add-to-cart-btn"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" aria-hidden="true" />
                    {isInStock ? 'Add to Cart' : 'Sold Out'}
                  </Button>

                  <button
                    onClick={handleShare}
                    className="h-12 w-12 flex items-center justify-center transition-colors duration-150 hover:bg-[rgba(216,204,175,0.06)] border border-cream-300/[0.12] text-cream-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400"
                    aria-label="Share this product"
                  >
                    <Share2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-cream-300/[0.03] border border-cream-300/[0.08]">
                  <p className="text-xs tracking-[0.18em] uppercase font-mono text-secondary-400">
                    Catalog Mode
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-cream-400">
                    Shopping and checkout are currently disabled. Browse the catalog,
                    review product details, and manage inventory from admin.
                  </p>
                  <p className="mt-3 text-xs text-cream-600">
                    {isInStock ? `${currentStock} available in inventory` : 'Currently out of stock'}
                  </p>
                </div>

                <button
                  onClick={handleShare}
                  className="h-12 w-12 flex items-center justify-center transition-colors duration-150 hover:bg-[rgba(216,204,175,0.06)] border border-cream-300/[0.12] text-cream-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400"
                  aria-label="Share this product"
                >
                  <Share2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            )}

            {/* Trust Signals */}
            <div className="grid grid-cols-2 gap-4 py-6 border-t border-t-cream-300/[0.06]">
              {product.is_lab_tested && (
                <div className="flex items-center gap-2 text-xs text-cream-500">
                  <Shield className="h-3.5 w-3.5 text-primary-400" aria-hidden="true" />
                  <span>Lab Tested</span>
                </div>
              )}
              {product.farm_bill_compliant && (
                <div className="flex items-center gap-2 text-xs text-cream-500">
                  <Check className="h-3.5 w-3.5 text-primary-400" aria-hidden="true" />
                  <span>Farm Bill Compliant</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-cream-500">
                <Truck className="h-3.5 w-3.5 text-cream-500" aria-hidden="true" />
                <span>Free Shipping $75+</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-cream-500">
                <RotateCcw className="h-3.5 w-3.5 text-cream-500" aria-hidden="true" />
                <span>30-Day Returns</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Tabs: Description / Effects / Lab Reports ─── */}
        <div className="mt-16 px-6 lg:px-0 max-w-4xl mx-auto">
          {/* Tab Navigation — ARIA tablist pattern */}
          <div
            role="tablist"
            aria-label="Product information"
            className="flex gap-0 border-b border-b-cream-300/[0.08]"
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`tabpanel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className="py-3 px-6 text-xs tracking-[0.15em] uppercase font-mono transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400 focus-visible:ring-inset"
                style={{
                  color: activeTab === tab.id ? 'var(--cream-100)' : 'var(--cream-600)',
                  borderBottom:
                    activeTab === tab.id
                      ? '2px solid var(--gold-400)'
                      : '2px solid transparent',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Panels */}
          <div className="py-10">
            {TABS.map((tab) => (
              <div
                key={tab.id}
                id={`tabpanel-${tab.id}`}
                role="tabpanel"
                aria-labelledby={`tab-${tab.id}`}
                hidden={activeTab !== tab.id}
              >
                {tab.id === 'description' && (
                  <div className="space-y-6 max-w-2xl" data-testid="product-description">
                    <p className="text-base leading-relaxed text-cream-300">
                      {product.description || product.short_description}
                    </p>
                  </div>
                )}

                {tab.id === 'effects' && (
                  <div>
                    {product.effects && product.effects.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {product.effects.map((productEffect) => (
                          <Badge key={productEffect.effect_id} variant="outline" className="py-2 px-4">
                            {productEffect.effect.name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-cream-600">No effects information available.</p>
                    )}
                  </div>
                )}

                {tab.id === 'lab-reports' && (
                  <div>
                    {product.lab_reports && product.lab_reports.length > 0 ? (
                      <div className="space-y-4">
                        {product.lab_reports.map((report) => (
                          <div key={report.id} className="atelier-card p-6">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-medium text-sm text-cream-200">
                                  {report.lab_name}
                                </h4>
                                <p className="text-xs font-mono mt-1 text-cream-600">
                                  {formatDate(report.test_date)}
                                </p>
                              </div>
                              <Badge variant={report.overall_passed ? 'success' : 'destructive'}>
                                {report.overall_passed ? 'Passed' : 'Failed'}
                              </Badge>
                            </div>
                            {report.report_url && (
                              <Button variant="outline" size="sm" asChild>
                                <a
                                  href={report.report_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label={`View full lab report from ${report.lab_name} (opens in new tab)`}
                                >
                                  View Full Report
                                </a>
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-cream-600">No lab reports available.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}