/**
 * Cart Store
 * Manages shopping cart state with persistence
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Product, ProductVariant } from '@/types/database.types'

type CartStorage = {
  getItem: (name: string) => string | null
  setItem: (name: string, value: string) => void
  removeItem: (name: string) => void
}

export interface CartItem {
  id: string // unique cart item ID
  product: Product
  variant?: ProductVariant
  quantity: number
  unitPrice: number
  totalPrice: number
  addedAt: string
}

export interface CartTotals {
  subtotal: number
  tax: number
  shipping: number
  discount: number
  total: number
}

export interface CartState {
  // State
  items: CartItem[]
  isOpen: boolean
  totals: CartTotals
  
  // Actions
  addItem: (product: Product, variant?: ProductVariant, quantity?: number) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  
  // UI Actions
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  
  // Computed
  getItemCount: () => number
  getCartWeight: () => number
  
  // Utilities
  generateCartItemId: (productId: string, variantId?: string) => string
  findCartItem: (productId: string, variantId?: string) => CartItem | undefined
  calculateTotals: () => void
}

const TAX_RATE = 0.08 // 8% tax rate - should be configurable per location
const FREE_SHIPPING_THRESHOLD = 75 // Free shipping over $75

const noopStorage: CartStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined
}

const getStorage = (): CartStorage => {
  if (typeof window === 'undefined') {
    return noopStorage
  }

  return window.localStorage ?? noopStorage
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // Initial state
      items: [],
      isOpen: false,
      totals: {
        subtotal: 0,
        tax: 0,
        shipping: 0,
        discount: 0,
        total: 0
      },

      // Add item to cart
      addItem: (product: Product, variant?: ProductVariant, quantity = 1) => {
        const state = get()
        const cartItemId = state.generateCartItemId(product.id, variant?.id)
        const existingItem = state.findCartItem(product.id, variant?.id)
        
        // Determine price - use variant price if available, otherwise base price
        const unitPrice = variant?.price || product.base_price
        
        if (existingItem) {
          // Update existing item quantity
          state.updateQuantity(cartItemId, existingItem.quantity + quantity)
        } else {
          // Add new item
          const newItem: CartItem = {
            id: cartItemId,
            product,
            variant,
            quantity,
            unitPrice,
            totalPrice: unitPrice * quantity,
            addedAt: new Date().toISOString()
          }
          
          set((state) => ({
            items: [...state.items, newItem]
          }))
        }
        
        // Recalculate totals
        get().calculateTotals()
      },

      // Remove item from cart
      removeItem: (itemId: string) => {
        set((state) => ({
          items: state.items.filter(item => item.id !== itemId)
        }))
        get().calculateTotals()
      },

      // Update item quantity
      updateQuantity: (itemId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(itemId)
          return
        }
        
        set((state) => ({
          items: state.items.map(item => 
            item.id === itemId 
              ? { ...item, quantity, totalPrice: item.unitPrice * quantity }
              : item
          )
        }))
        get().calculateTotals()
      },

      // Clear entire cart
      clearCart: () => {
        set({
          items: [],
          totals: {
            subtotal: 0,
            tax: 0,
            shipping: 0,
            discount: 0,
            total: 0
          }
        })
      },

      // UI Actions
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      // Get total item count
      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      // Get total cart weight (for shipping calculations)
      getCartWeight: () => {
        return get().items.reduce((total, item) => {
          const weight = item.variant?.weight_grams || 0
          return total + (weight * item.quantity)
        }, 0)
      },

      // Generate unique cart item ID
      generateCartItemId: (productId: string, variantId?: string) => {
        return variantId ? `${productId}-${variantId}` : productId
      },

      // Find existing cart item
      findCartItem: (productId: string, variantId?: string) => {
        const cartItemId = get().generateCartItemId(productId, variantId)
        return get().items.find(item => item.id === cartItemId)
      },

      // Calculate cart totals
      calculateTotals: () => {
        const items = get().items
        const subtotal = items.reduce((total, item) => total + item.totalPrice, 0)
        
        // Calculate tax
        const tax = subtotal * TAX_RATE
        
        // Calculate shipping
        let shipping = 0
        if (subtotal > 0 && subtotal < FREE_SHIPPING_THRESHOLD) {
          shipping = 9.99 // Standard shipping rate
        }
        
        // TODO: Apply discounts when discount system is implemented
        const discount = 0
        
        const total = subtotal + tax + shipping - discount
        
        set({
          totals: {
            subtotal,
            tax,
            shipping,
            discount,
            total
          }
        })
      }
    }),
    {
      name: 'ncremedies-cart',
      storage: createJSONStorage(() => ({
        getItem: (name) => getStorage().getItem(name),
        setItem: (name, value) => getStorage().setItem(name, value),
        removeItem: (name) => getStorage().removeItem(name)
      })),
      partialize: (state) => ({
        items: state.items,
        totals: state.totals
      }),
      // Rehydrate totals on load
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.calculateTotals()
        }
      }
    }
  )
)