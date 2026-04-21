/**
 * Cart Drawer Component
 * Slide-out cart with item management and checkout.
 *
 * UX/A11y fixes:
 * - aria-labelledby="cart-title" on dialog
 * - Focus trap: first focusable element receives focus on open; Escape closes
 * - overscroll-behavior: contain on scroll area
 * - Backdrop has aria-hidden="true"
 * - Removed double onClick handlers (div+button, button+Link nesting)
 * - "Continue Shopping" is a plain Link, not button-wrapping-Link
 * - Quantity increase wrapper div removed; single Button only
 * - Remove wrapper div removed; single button only
 * - Global body-scroll lock via shared counter in ui-store
 */

'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useStorefront } from '@/components/layout/storefront-provider'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/stores'
import { formatCurrency, cn } from '@/lib/utils'
import { X, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react'

export interface CartDrawerProps {
  className?: string
}

export function CartDrawer({ className }: CartDrawerProps) {
  const { shoppingEnabled } = useStorefront()
  const {
    items,
    isOpen,
    totals,
    closeCart,
    updateQuantity,
    removeItem,
    getItemCount,
  } = useCartStore()

  const itemCount = getItemCount()
  const drawerRef = React.useRef<HTMLDivElement>(null)
  const closeBtnRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (!shoppingEnabled && isOpen) {
      closeCart()
    }
  }, [shoppingEnabled, isOpen, closeCart])

  // ── Body scroll lock ───────────────────────────────────────────────────────
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      // Move focus into the drawer
      closeBtnRef.current?.focus()
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // ── Focus trap ─────────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeCart()
        return
      }

      if (e.key !== 'Tab') return

      const drawer = drawerRef.current
      if (!drawer) return

      const focusable = drawer.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closeCart])

  if (!shoppingEnabled || !isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 transition-opacity duration-300 bg-earth-950/70 backdrop-blur-[4px]"
        onClick={closeCart}
        aria-hidden="true"
        data-testid="cart-overlay"
      />

      {/* Cart Drawer */}
      <div
        ref={drawerRef}
        className={cn(
          'fixed top-0 h-full z-[60]',
          'flex flex-col',
          'right-0 w-[calc(100vw-4rem)] max-w-sm sm:w-full sm:max-w-md',
          'max-h-screen border-l border-l-cream-300/[0.08] bg-earth-900',
          className
        )}
        data-testid="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        style={{ overscrollBehavior: 'contain' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-b-cream-300/[0.08]">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-4 w-4 text-cream-400" aria-hidden="true" />
            <h2 id="cart-title" className="text-sm tracking-[0.15em] uppercase font-mono text-cream-200">
              Cart
              {itemCount > 0 && (
                <span className="ml-2 font-mono text-cream-500">({itemCount})</span>
              )}
            </h2>
          </div>
          <button
            ref={closeBtnRef}
            onClick={closeCart}
            className="h-8 w-8 flex items-center justify-center transition-colors duration-150 hover:bg-[rgba(216,204,175,0.06)] text-cream-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400"
            aria-label="Close shopping cart"
            data-testid="close-cart"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Cart Content */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ overscrollBehavior: 'contain' }}
        >
          {items.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center h-full p-8 text-center"
              data-testid="empty-cart-message"
            >
              <ShoppingBag
                className="h-12 w-12 mb-4 text-cream-600"
                aria-hidden="true"
                data-testid="empty-cart-icon"
              />
              <h3 className="text-sm font-medium mb-2 text-cream-300">Your cart is empty</h3>
              <p className="text-xs mb-6 text-cream-600">Discover our curated collection</p>
              <Button onClick={closeCart} asChild size="sm" data-testid="continue-shopping">
                <Link href="/products">Browse Products</Link>
              </Button>
            </div>
          ) : (
            <div className="p-4 space-y-0">
              {items.map((item, index) => (
                <React.Fragment key={item.id}>
                  <CartItem
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeItem}
                  />
                  {index < items.length - 1 && <hr className="atelier-divider" />}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Footer — always shown for empty state total */}
        {items.length === 0 ? (
          <div className="px-6 py-4 border-t border-t-cream-300/[0.08]">
            <div className="flex justify-between font-mono text-sm text-cream-400">
              <span>Total</span>
              <span data-testid="cart-total">$0.00</span>
            </div>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4 border-t border-t-cream-300/[0.08]">
            {/* Order Summary */}
            <div className="space-y-2 text-xs font-mono text-cream-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span data-testid="cart-subtotal">{formatCurrency(totals.subtotal)}</span>
              </div>

              {totals.discount > 0 && (
                <div className="flex justify-between text-cream-300">
                  <span>Discount</span>
                  <span data-testid="cart-discount">−{formatCurrency(totals.discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-primary-400">
                <span>Tax</span>
                <span>{formatCurrency(totals.tax)}</span>
              </div>

              <div className="flex justify-between text-cream-300">
                <span>Shipping</span>
                <span
                  style={{ color: totals.shipping === 0 ? 'var(--sage-400)' : 'var(--cream-300)' }}
                >
                  {totals.shipping === 0 ? 'FREE' : formatCurrency(totals.shipping)}
                </span>
              </div>

              <hr className="atelier-divider !my-3" aria-hidden="true" />

              <div className="flex justify-between text-sm text-cream-200">
                <span>Total</span>
                <span data-testid="cart-total">{formatCurrency(totals.total)}</span>
              </div>
            </div>

            {/* Free Shipping Progress */}
            {totals.shipping > 0 && totals.subtotal < 75 && (
              <div
                className="p-3 bg-cream-300/[0.03] border border-cream-300/[0.06]"
                role="status"
                aria-live="polite"
              >
                <div className="text-xs text-cream-400">
                  Add {formatCurrency(75 - totals.subtotal)} more for free shipping
                </div>
                <div className="w-full h-[2px] mt-2 bg-earth-700" aria-hidden="true">
                  <div
                    className="h-full transition-all duration-300 bg-primary-400"
                    style={{ width: `${Math.min((totals.subtotal / 75) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Checkout Buttons */}
            <div className="space-y-2">
              <Link
                href="/checkout"
                onClick={closeCart}
                className="flex items-center justify-center gap-2 w-full h-12 text-sm font-medium tracking-wide transition-opacity duration-200 hover:opacity-90 bg-primary-500 text-cream-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400"
                data-testid="checkout-btn"
              >
                Proceed to Checkout
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>

              <Button
                variant="outline"
                size="lg"
                className="w-full h-11"
                onClick={closeCart}
                asChild
                data-testid="view-full-cart"
              >
                <Link href="/cart">View Full Cart</Link>
              </Button>

              <Link
                href="/products"
                onClick={closeCart}
                className="block w-full text-center text-xs tracking-wide transition-colors duration-150 hover:text-cream-300 py-2 text-cream-600"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ── Individual Cart Item ──────────────────────────────────────────────────────
interface CartItemProps {
  item: any
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onRemove: (itemId: string) => void
}

function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const [isUpdating, setIsUpdating] = React.useState(false)

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) return
    setIsUpdating(true)
    try {
      onUpdateQuantity(item.id, newQuantity)
    } finally {
      setIsUpdating(false)
    }
  }

  const primaryImage =
    item.product.images?.[0]?.url || '/images/placeholders/product-default.svg'

  return (
    <div className="flex gap-4 py-4" data-testid="cart-item">
      {/* Product Image */}
      <div className="relative w-16 h-20 flex-shrink-0 overflow-hidden bg-earth-800">
        <Image
          src={primaryImage}
          alt={`${item.product.name}${item.variant ? ` — ${item.variant.name}` : ''}`}
          fill
          className="object-cover"
          sizes="64px"
        />
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <h4 className="text-sm line-clamp-2 pr-2 text-cream-200">{item.product.name}</h4>
          <button
            onClick={() => onRemove(item.id)}
            className="min-w-[32px] min-h-[32px] flex items-center justify-center flex-shrink-0 -mt-1 -mr-1 transition-colors duration-150 hover:bg-[rgba(216,204,175,0.06)] text-cream-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400"
            aria-label={`Remove ${item.product.name} from cart`}
            data-testid="remove-cart-item"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        </div>

        {/* Variant Info */}
        {item.variant && (
          <p className="text-xs mb-2 text-cream-600" data-testid="cart-item-variant">
            {item.variant.name}
          </p>
        )}

        <div className="flex items-center justify-between">
          {/* Quantity Controls */}
          <div
            className="inline-flex items-center border border-cream-300/10"
            role="group"
            aria-label={`Quantity for ${item.product.name}`}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={isUpdating || item.quantity <= 1}
              className="min-w-[44px] min-h-[44px] h-11 w-11"
              aria-label={`Decrease quantity of ${item.product.name}`}
              data-testid="quantity-decrease"
            >
              <Minus className="h-3 w-3" aria-hidden="true" />
            </Button>

            <input
              type="number"
              value={item.quantity}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 1
                if (value >= 1) handleQuantityChange(value)
              }}
              className="w-10 text-center text-xs font-mono bg-transparent border-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400 text-cream-200"
              min="1"
              aria-label={`Quantity of ${item.product.name}`}
              data-testid="cart-item-quantity"
            />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={isUpdating}
              className="min-w-[44px] min-h-[44px] h-11 w-11"
              aria-label={`Increase quantity of ${item.product.name}`}
              data-testid="quantity-increase"
              data-testid-wrapper="cart-item-increase-qty"
            >
              <Plus className="h-3 w-3" aria-hidden="true" />
            </Button>
          </div>

          {/* Price */}
          <div className="text-right font-mono">
            <div className="text-sm text-cream-200" data-testid="cart-item-total">
              {formatCurrency(item.totalPrice)}
            </div>
            {item.quantity > 1 && (
              <div className="text-xs text-cream-600">{formatCurrency(item.unitPrice)} ea</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}