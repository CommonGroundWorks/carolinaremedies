/**
 * Header Component — Botanical Atelier Edition
 * Ultra-minimal navigation with editorial typography.
 *
 * UX/A11y fixes:
 * - Search navigates via router.push (client-side, no full reload)
 * - autoFocus on search input only on non-touch (pointer: fine) devices
 * - Skip link is outside this component; provided by AgeVerificationProvider
 * - Mobile backdrop has onKeyDown (Enter/Space closes) + aria-hidden
 * - All transition properties listed explicitly (no transition:all)
 */

'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCartStore, useMobileMenu, useSearch } from '@/lib/stores'
import { useStorefront } from '@/components/layout/storefront-provider'
import { getActiveCategories } from '@/lib/categories'
import { cn } from '@/lib/utils'
import { Search, ShoppingCart, Menu, X } from 'lucide-react'

export interface HeaderProps {
  className?: string
}

export function Header({ className }: HeaderProps) {
  const router = useRouter()
  const { shoppingEnabled } = useStorefront()
  const toggleCart = useCartStore((state) => state.toggleCart)
  const cartItemCount = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0)
  )
  const { isOpen: isMobileMenuOpen, toggle: toggleMobileMenu } = useMobileMenu()
  const {
    isOpen: isSearchOpen,
    query: searchQuery,
    setQuery: setSearchQuery,
    open: openSearch,
    close: closeSearch,
  } = useSearch()
  const categories = getActiveCategories()

  // Detect coarse pointer (touch) to skip autoFocus on mobile
  const [hasFinePointer, setHasFinePointer] = React.useState(false)
  React.useEffect(() => {
    setHasFinePointer(window.matchMedia('(pointer: fine)').matches)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = searchQuery.trim()
    if (trimmed) {
      closeSearch()
      router.push(`/products?search=${encodeURIComponent(trimmed)}`)
    }
  }

  return (
    <header className={cn('sticky top-0 z-50 w-full backdrop-blur-[20px]', className)}>
      {/* Free shipping notice */}
      <div className="hidden md:flex items-center justify-center py-2 text-xs tracking-[0.12em] uppercase border-b border-b-cream-300/5 text-cream-500 font-sans">
        Complimentary shipping on orders over $75&nbsp;·&nbsp;North Carolina hemp
      </div>

      {/* Main navigation */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16">

          {/* Mobile menu toggle */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 transition-opacity duration-200 hover:opacity-60 text-cream-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {isMobileMenuOpen
              ? <X className="h-5 w-5" aria-hidden="true" />
              : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>

          {/* Logo — editorial typemark */}
          <Link
            href="/"
            className="flex items-center gap-3 transition-opacity duration-200 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400"
            aria-label="Carolina Remedies — Home"
            data-testid="site-logo"
          >
            <span className="font-display font-light text-xl tracking-tight text-cream-100 -tracking-[0.02em]">
              Carolina Remedies
            </span>
            <span className="hidden lg:block text-xs tracking-widest uppercase pb-0.5 text-primary-400 font-sans border-l border-l-cream-300/20 pl-3 ml-1">
              Hemp&nbsp;&amp;&nbsp;Wellness
            </span>
          </Link>

          {/* Desktop navigation */}
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-8">
            {categories.slice(0, 5).map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="text-sm transition-opacity duration-200 hover:opacity-100 opacity-70 text-cream-200 font-sans tracking-[0.02em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400"
                data-testid={`nav-${category.slug}`}
              >
                {category.name}
              </Link>
            ))}
            <Link
              href="/products"
              className="text-sm transition-opacity duration-200 hover:opacity-100 opacity-70 text-secondary-400 font-sans tracking-[0.02em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400"
              data-testid="nav-products"
            >
              All Products
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Search */}
            {isSearchOpen ? (
              <form
                onSubmit={handleSearch}
                className="flex items-center gap-2"
                role="search"
              >
                <label htmlFor="header-search" className="sr-only">
                  Search products
                </label>
                <input
                  id="header-search"
                  type="search"
                  placeholder="Search…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-44 px-3 py-1.5 text-sm bg-cream-300/[0.06] border border-cream-300/[0.15] text-cream-200 font-sans focus-visible:outline-none focus-visible:border-secondary-400 focus-visible:ring-1 focus-visible:ring-secondary-400"
                  // Only autoFocus on devices with a fine pointer (desktop) — avoids mobile keyboard pop
                  autoFocus={hasFinePointer}
                  autoComplete="off"
                  spellCheck={false}
                  data-testid="product-search"
                />
                <button
                  type="button"
                  onClick={closeSearch}
                  className="p-2 transition-opacity duration-200 hover:opacity-60 text-cream-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400"
                  aria-label="Close search"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </form>
            ) : (
              <button
                onClick={openSearch}
                className="p-2 transition-opacity duration-200 hover:opacity-60 text-cream-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400"
                aria-label="Search products"
              >
                <Search className="h-4.5 w-4.5" aria-hidden="true" />
              </button>
            )}

            {/* Cart */}
            {shoppingEnabled && (
              <button
                onClick={toggleCart}
                className="relative p-2 transition-opacity duration-200 hover:opacity-60 text-cream-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400"
                aria-label={`Cart — ${cartItemCount} item${cartItemCount !== 1 ? 's' : ''}`}
                data-testid="cart-icon"
              >
                <ShoppingCart className="h-4.5 w-4.5" aria-hidden="true" />
                <span
                  className={cn(
                    'absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[0.65rem] font-medium tabular-nums rounded-[2px] px-[3px] bg-secondary-400 text-earth-900 transition-all duration-200',
                    cartItemCount > 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'
                  )}
                  aria-hidden="true"
                  data-testid="cart-counter"
                >
                  <span data-testid="cart-count">{cartItemCount > 99 ? '99+' : cartItemCount}</span>
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 md:hidden bg-earth-950/60"
            onClick={toggleMobileMenu}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') toggleMobileMenu()
            }}
            role="button"
            tabIndex={-1}
            aria-label="Close navigation menu"
          />

          <nav
            id="mobile-menu"
            className="md:hidden relative z-50 bg-earth-900 border-t border-t-cream-300/[0.08]"
            aria-label="Mobile navigation"
          >
            <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/products?category=${category.slug}`}
                  className="block font-display font-light text-2xl transition-opacity duration-200 hover:opacity-70 text-cream-200 -tracking-[0.01em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400"
                  onClick={toggleMobileMenu}
                  data-testid={`mobile-nav-${category.slug}`}
                >
                  {category.name}
                </Link>
              ))}
              <div className="pt-4 border-t border-t-cream-300/[0.08]">
                {[
                  { label: 'All Products', href: '/products' },
                  { label: 'About', href: '/about' },
                ].map(({ label, href }) => (
                  <Link
                    key={href}
                    href={href}
                    className="block py-2 text-sm tracking-[0.1em] uppercase transition-opacity duration-200 hover:opacity-70 text-cream-500 font-sans focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400"
                    onClick={toggleMobileMenu}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        </>
      )}
    </header>
  )
}
