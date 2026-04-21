import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createMockProduct } from '../../utils/test-utils'

// Import store after mocking
vi.doUnmock('@/lib/stores/cart-store')
const { useCartStore } = await import('@/lib/stores/cart-store')

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('Cart Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useCartStore.getState().clearCart()
    useCartStore.setState({ isOpen: false })
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initial State', () => {
    it('has correct initial state', () => {
      const state = useCartStore.getState()
      
      expect(state.items).toEqual([])
      expect(state.isOpen).toBe(false)
      expect(state.totals).toEqual({
        subtotal: 0,
        tax: 0,
        shipping: 0,
        discount: 0,
        total: 0
      })
    })
  })

  describe('Add Item', () => {
    it('adds new item to cart', () => {
      const product = createMockProduct({ id: '1', base_price: 29.99 })
      
      useCartStore.getState().addItem(product)
      
      const state = useCartStore.getState()
      expect(state.items).toHaveLength(1)
      expect(state.items[0]).toMatchObject({
        id: '1',
        product,
        quantity: 1,
        unitPrice: 29.99,
        totalPrice: 29.99
      })
    })

    it('adds multiple quantities of the same item', () => {
      const product = createMockProduct({ id: '1', base_price: 29.99 })
      
      useCartStore.getState().addItem(product, undefined, 3)
      
      const state = useCartStore.getState()
      expect(state.items).toHaveLength(1)
      expect(state.items[0].quantity).toBe(3)
      expect(state.items[0].totalPrice).toBe(89.97)
    })

    it('increases quantity when adding existing item', () => {
      const product = createMockProduct({ id: '1', base_price: 29.99 })
      
      useCartStore.getState().addItem(product, undefined, 1)
      useCartStore.getState().addItem(product, undefined, 2)
      
      const state = useCartStore.getState()
      expect(state.items).toHaveLength(1)
      expect(state.items[0].quantity).toBe(3)
      expect(state.items[0].totalPrice).toBe(89.97)
    })

    it('handles product variants correctly', () => {
      const product = createMockProduct({ 
        id: '1', 
        base_price: 29.99 
      })
      const variant = {
        id: 'v1',
        name: '1/8 oz',
        price: 45.00,
        weight_grams: 3500
      }
      
      useCartStore.getState().addItem(product, variant)
      
      const state = useCartStore.getState()
      expect(state.items[0].variant).toEqual(variant)
      expect(state.items[0].unitPrice).toBe(45.00)
      expect(state.items[0].id).toBe('1-v1')
    })

    it('treats different variants as separate items', () => {
      const product = createMockProduct({ id: '1', base_price: 29.99 })
      const variant1 = { id: 'v1', name: '1/8 oz', price: 45.00 }
      const variant2 = { id: 'v2', name: '1/4 oz', price: 80.00 }
      
      useCartStore.getState().addItem(product, variant1)
      useCartStore.getState().addItem(product, variant2)
      
      const state = useCartStore.getState()
      expect(state.items).toHaveLength(2)
      expect(state.items[0].id).toBe('1-v1')
      expect(state.items[1].id).toBe('1-v2')
    })

    it('keeps cart closed after adding item', () => {
      const product = createMockProduct({ id: '1', base_price: 29.99 })
      
      expect(useCartStore.getState().isOpen).toBe(false)
      useCartStore.getState().addItem(product)
      expect(useCartStore.getState().isOpen).toBe(false)
    })

    it('recalculates totals after adding item', () => {
      const product = createMockProduct({ id: '1', base_price: 29.99 })
      
      useCartStore.getState().addItem(product)
      
      const state = useCartStore.getState()
      expect(state.totals.subtotal).toBe(29.99)
      expect(state.totals.tax).toBeCloseTo(2.40) // 8% tax
      expect(state.totals.shipping).toBe(9.99) // Under free shipping threshold
      expect(state.totals.total).toBeCloseTo(42.38)
    })
  })

  describe('Remove Item', () => {
    beforeEach(() => {
      const product = createMockProduct({ id: '1', base_price: 29.99 })
      useCartStore.getState().addItem(product, undefined, 2)
    })

    it('removes item from cart', () => {
      useCartStore.getState().removeItem('1')
      
      const state = useCartStore.getState()
      expect(state.items).toHaveLength(0)
    })

    it('recalculates totals after removing item', () => {
      useCartStore.getState().removeItem('1')
      
      const state = useCartStore.getState()
      expect(state.totals.subtotal).toBe(0)
      expect(state.totals.tax).toBe(0)
      expect(state.totals.shipping).toBe(0)
      expect(state.totals.total).toBe(0)
    })

    it('does not affect other items when removing one item', () => {
      const product2 = createMockProduct({ id: '2', base_price: 19.99 })
      useCartStore.getState().addItem(product2)
      
      useCartStore.getState().removeItem('1')
      
      const state = useCartStore.getState()
      expect(state.items).toHaveLength(1)
      expect(state.items[0].product.id).toBe('2')
    })
  })

  describe('Update Quantity', () => {
    beforeEach(() => {
      const product = createMockProduct({ id: '1', base_price: 29.99 })
      useCartStore.getState().addItem(product, undefined, 2)
    })

    it('updates item quantity', () => {
      useCartStore.getState().updateQuantity('1', 5)
      
      const state = useCartStore.getState()
      expect(state.items[0].quantity).toBe(5)
      expect(state.items[0].totalPrice).toBeCloseTo(149.95)
    })

    it('removes item when quantity is set to 0', () => {
      useCartStore.getState().updateQuantity('1', 0)
      
      const state = useCartStore.getState()
      expect(state.items).toHaveLength(0)
    })

    it('removes item when quantity is negative', () => {
      useCartStore.getState().updateQuantity('1', -1)
      
      const state = useCartStore.getState()
      expect(state.items).toHaveLength(0)
    })

    it('recalculates totals after updating quantity', () => {
      useCartStore.getState().updateQuantity('1', 3)
      
      const state = useCartStore.getState()
      expect(state.totals.subtotal).toBeCloseTo(89.97)
      expect(state.totals.tax).toBeCloseTo(7.20)
      expect(state.totals.total).toBeCloseTo(97.17, 2)
    })
  })

  describe('Clear Cart', () => {
    beforeEach(() => {
      const product1 = createMockProduct({ id: '1', base_price: 29.99 })
      const product2 = createMockProduct({ id: '2', base_price: 19.99 })
      useCartStore.getState().addItem(product1)
      useCartStore.getState().addItem(product2)
    })

    it('removes all items from cart', () => {
      useCartStore.getState().clearCart()
      
      const state = useCartStore.getState()
      expect(state.items).toHaveLength(0)
    })

    it('resets totals to zero', () => {
      useCartStore.getState().clearCart()
      
      const state = useCartStore.getState()
      expect(state.totals).toEqual({
        subtotal: 0,
        tax: 0,
        shipping: 0,
        discount: 0,
        total: 0
      })
    })
  })

  describe('Cart UI Actions', () => {
    it('opens cart', () => {
      useCartStore.getState().openCart()
      expect(useCartStore.getState().isOpen).toBe(true)
    })

    it('closes cart', () => {
      useCartStore.setState({ isOpen: true })
      useCartStore.getState().closeCart()
      expect(useCartStore.getState().isOpen).toBe(false)
    })

    it('toggles cart state', () => {
      expect(useCartStore.getState().isOpen).toBe(false)
      
      useCartStore.getState().toggleCart()
      expect(useCartStore.getState().isOpen).toBe(true)
      
      useCartStore.getState().toggleCart()
      expect(useCartStore.getState().isOpen).toBe(false)
    })
  })

  describe('Cart Utilities', () => {
    describe('getItemCount', () => {
      it('returns 0 for empty cart', () => {
        expect(useCartStore.getState().getItemCount()).toBe(0)
      })

      it('returns total quantity of all items', () => {
        const product1 = createMockProduct({ id: '1', base_price: 29.99 })
        const product2 = createMockProduct({ id: '2', base_price: 19.99 })
        
        useCartStore.getState().addItem(product1, undefined, 3)
        useCartStore.getState().addItem(product2, undefined, 2)
        
        expect(useCartStore.getState().getItemCount()).toBe(5)
      })
    })

    describe('getCartWeight', () => {
      it('returns 0 for empty cart', () => {
        expect(useCartStore.getState().getCartWeight()).toBe(0)
      })

      it('calculates total weight from variants', () => {
        const product = createMockProduct({ id: '1', base_price: 29.99 })
        const variant = {
          id: 'v1',
          name: '1/8 oz',
          price: 45.00,
          weight_grams: 3500
        }
        
        useCartStore.getState().addItem(product, variant, 2)
        
        expect(useCartStore.getState().getCartWeight()).toBe(7000) // 3500g * 2
      })

      it('handles items without weight variants', () => {
        const product = createMockProduct({ id: '1', base_price: 29.99 })
        
        useCartStore.getState().addItem(product, undefined, 1)
        
        expect(useCartStore.getState().getCartWeight()).toBe(0)
      })
    })

    describe('generateCartItemId', () => {
      it('generates ID for product without variant', () => {
        const id = useCartStore.getState().generateCartItemId('product1')
        expect(id).toBe('product1')
      })

      it('generates ID for product with variant', () => {
        const id = useCartStore.getState().generateCartItemId('product1', 'variant1')
        expect(id).toBe('product1-variant1')
      })
    })

    describe('findCartItem', () => {
      beforeEach(() => {
        const product = createMockProduct({ id: '1', base_price: 29.99 })
        const variant = { id: 'v1', name: '1/8 oz', price: 45.00 }
        useCartStore.getState().addItem(product, variant)
      })

      it('finds existing cart item', () => {
        const item = useCartStore.getState().findCartItem('1', 'v1')
        expect(item).toBeDefined()
        expect(item?.id).toBe('1-v1')
      })

      it('returns undefined for non-existent item', () => {
        const item = useCartStore.getState().findCartItem('2', 'v2')
        expect(item).toBeUndefined()
      })
    })
  })

  describe('Tax and Shipping Calculations', () => {
    describe('Tax Calculation', () => {
      it('applies 8% tax rate', () => {
        const product = createMockProduct({ id: '1', base_price: 100.00 })
        useCartStore.getState().addItem(product)
        
        const state = useCartStore.getState()
        expect(state.totals.tax).toBeCloseTo(8.00)
      })
    })

    describe('Shipping Calculation', () => {
      it('charges shipping for orders under $75', () => {
        const product = createMockProduct({ id: '1', base_price: 50.00 })
        useCartStore.getState().addItem(product)
        
        const state = useCartStore.getState()
        expect(state.totals.shipping).toBe(9.99)
      })

      it('provides free shipping for orders $75 and over', () => {
        const product = createMockProduct({ id: '1', base_price: 75.00 })
        useCartStore.getState().addItem(product)
        
        const state = useCartStore.getState()
        expect(state.totals.shipping).toBe(0)
      })

      it('provides free shipping for orders over $75', () => {
        const product = createMockProduct({ id: '1', base_price: 100.00 })
        useCartStore.getState().addItem(product)
        
        const state = useCartStore.getState()
        expect(state.totals.shipping).toBe(0)
      })

      it('does not charge shipping for empty cart', () => {
        const state = useCartStore.getState()
        expect(state.totals.shipping).toBe(0)
      })
    })

    describe('Total Calculation', () => {
      it('correctly calculates total for order under free shipping threshold', () => {
        const product = createMockProduct({ id: '1', base_price: 50.00 })
        useCartStore.getState().addItem(product)
        
        const state = useCartStore.getState()
        const expected = 50.00 + (50.00 * 0.08) + 9.99 // subtotal + tax + shipping
        expect(state.totals.total).toBeCloseTo(expected)
      })

      it('correctly calculates total for order over free shipping threshold', () => {
        const product = createMockProduct({ id: '1', base_price: 100.00 })
        useCartStore.getState().addItem(product)
        
        const state = useCartStore.getState()
        const expected = 100.00 + (100.00 * 0.08) + 0 // subtotal + tax + no shipping
        expect(state.totals.total).toBeCloseTo(expected)
      })
    })
  })

  describe('Persistence', () => {
    it('persists cart state to localStorage on changes', () => {
      const product = createMockProduct({ id: '1', base_price: 29.99 })
      useCartStore.getState().addItem(product)
      
      // Storage should be called when state changes
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })

    it('only persists necessary state', () => {
      const product = createMockProduct({ id: '1', base_price: 29.99 })
      useCartStore.getState().addItem(product)
      
      // Check that setItem was called with correct structure
      const calls = localStorageMock.setItem.mock.calls
      const lastCall = calls[calls.length - 1]
      const persistedData = JSON.parse(lastCall[1])
      
      expect(persistedData.state).toHaveProperty('items')
      expect(persistedData.state).toHaveProperty('totals')
      expect(persistedData.state).not.toHaveProperty('isOpen') // UI state shouldn't persist
    })
  })

  describe('Edge Cases', () => {
    it('handles adding item with zero price', () => {
      const product = createMockProduct({ id: '1', base_price: 0 })
      useCartStore.getState().addItem(product)
      
      const state = useCartStore.getState()
      expect(state.items).toHaveLength(1)
      expect(state.totals.subtotal).toBe(0)
      expect(state.totals.shipping).toBe(0) // No shipping for $0 order
    })

    it('handles very large quantities', () => {
      const product = createMockProduct({ id: '1', base_price: 29.99 })
      useCartStore.getState().addItem(product, undefined, 1000)
      
      const state = useCartStore.getState()
      expect(state.items[0].quantity).toBe(1000)
      expect(state.items[0].totalPrice).toBeCloseTo(29990)
    })

    it('handles decimal pricing correctly', () => {
      const product = createMockProduct({ id: '1', base_price: 29.995 })
      useCartStore.getState().addItem(product)
      
      const state = useCartStore.getState()
      expect(state.items[0].unitPrice).toBe(29.995)
      expect(state.items[0].totalPrice).toBe(29.995)
    })
  })
})