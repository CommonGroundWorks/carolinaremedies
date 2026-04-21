import { act, renderHook } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Import store after mocking
vi.doUnmock('@/lib/stores/ui-store')
const { 
  useUIStore, 
  useMobileMenu, 
  useSearch, 
  useFilters, 
  useQuickView, 
  useNotifications,
  useLoading 
} = await import('@/lib/stores/ui-store')

describe('UI Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useUIStore.setState({
      isMobileMenuOpen: false,
      isSearchOpen: false,
      searchQuery: '',
      isFilterOpen: false,
      isQuickViewOpen: false,
      quickViewProductId: null,
      isPageLoading: false,
      loadingStates: {},
      notifications: [],
    })
    
    // Reset document.body.style
    document.body.style.overflow = ''
    vi.clearAllTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initial State', () => {
    it('has correct initial state', () => {
      const state = useUIStore.getState()
      
      expect(state.isMobileMenuOpen).toBe(false)
      expect(state.isSearchOpen).toBe(false)
      expect(state.searchQuery).toBe('')
      expect(state.isFilterOpen).toBe(false)
      expect(state.isQuickViewOpen).toBe(false)
      expect(state.quickViewProductId).toBe(null)
      expect(state.isPageLoading).toBe(false)
      expect(state.loadingStates).toEqual({})
      expect(state.notifications).toEqual([])
    })
  })

  describe('Mobile Menu', () => {
    it('opens mobile menu', () => {
      useUIStore.getState().setMobileMenuOpen(true)
      
      expect(useUIStore.getState().isMobileMenuOpen).toBe(true)
      expect(document.body.style.overflow).toBe('hidden')
    })

    it('closes mobile menu', () => {
      useUIStore.setState({ isMobileMenuOpen: true })
      document.body.style.overflow = 'hidden'
      
      useUIStore.getState().setMobileMenuOpen(false)
      
      expect(useUIStore.getState().isMobileMenuOpen).toBe(false)
      expect(document.body.style.overflow).toBe('')
    })

    it('toggles mobile menu state', () => {
      expect(useUIStore.getState().isMobileMenuOpen).toBe(false)
      
      useUIStore.getState().toggleMobileMenu()
      expect(useUIStore.getState().isMobileMenuOpen).toBe(true)
      
      useUIStore.getState().toggleMobileMenu()
      expect(useUIStore.getState().isMobileMenuOpen).toBe(false)
    })
  })

  describe('Search', () => {
    it('opens search', () => {
      useUIStore.getState().setSearchOpen(true)
      
      expect(useUIStore.getState().isSearchOpen).toBe(true)
    })

    it('closes search and clears query', () => {
      useUIStore.setState({ isSearchOpen: true, searchQuery: 'test query' })
      
      useUIStore.getState().setSearchOpen(false)
      
      expect(useUIStore.getState().isSearchOpen).toBe(false)
      expect(useUIStore.getState().searchQuery).toBe('')
    })

    it('sets search query', () => {
      useUIStore.getState().setSearchQuery('cannabis products')
      
      expect(useUIStore.getState().searchQuery).toBe('cannabis products')
    })

    it('clears search', () => {
      useUIStore.setState({ searchQuery: 'test query', isSearchOpen: true })
      
      useUIStore.getState().clearSearch()
      
      expect(useUIStore.getState().searchQuery).toBe('')
      expect(useUIStore.getState().isSearchOpen).toBe(false)
    })
  })

  describe('Filters', () => {
    it('opens filters', () => {
      useUIStore.getState().setFilterOpen(true)
      
      expect(useUIStore.getState().isFilterOpen).toBe(true)
    })

    it('closes filters', () => {
      useUIStore.setState({ isFilterOpen: true })
      
      useUIStore.getState().setFilterOpen(false)
      
      expect(useUIStore.getState().isFilterOpen).toBe(false)
    })

    it('toggles filter state', () => {
      expect(useUIStore.getState().isFilterOpen).toBe(false)
      
      useUIStore.getState().toggleFilters()
      expect(useUIStore.getState().isFilterOpen).toBe(true)
      
      useUIStore.getState().toggleFilters()
      expect(useUIStore.getState().isFilterOpen).toBe(false)
    })
  })

  describe('Quick View', () => {
    it('opens quick view with product ID', () => {
      useUIStore.getState().openQuickView('product-123')
      
      expect(useUIStore.getState().isQuickViewOpen).toBe(true)
      expect(useUIStore.getState().quickViewProductId).toBe('product-123')
      expect(document.body.style.overflow).toBe('hidden')
    })

    it('closes quick view', () => {
      useUIStore.setState({ 
        isQuickViewOpen: true, 
        quickViewProductId: 'product-123' 
      })
      document.body.style.overflow = 'hidden'
      
      useUIStore.getState().closeQuickView()
      
      expect(useUIStore.getState().isQuickViewOpen).toBe(false)
      expect(useUIStore.getState().quickViewProductId).toBe(null)
      expect(document.body.style.overflow).toBe('')
    })
  })

  describe('Loading States', () => {
    it('sets page loading state', () => {
      useUIStore.getState().setPageLoading(true)
      
      expect(useUIStore.getState().isPageLoading).toBe(true)
    })

    it('sets specific loading state', () => {
      useUIStore.getState().setLoadingState('products', true)
      
      expect(useUIStore.getState().loadingStates.products).toBe(true)
    })

    it('gets specific loading state', () => {
      useUIStore.setState({ 
        loadingStates: { products: true, cart: false } 
      })
      
      expect(useUIStore.getState().getLoadingState('products')).toBe(true)
      expect(useUIStore.getState().getLoadingState('cart')).toBe(false)
      expect(useUIStore.getState().getLoadingState('nonexistent')).toBe(false)
    })

    it('handles multiple loading states independently', () => {
      useUIStore.getState().setLoadingState('products', true)
      useUIStore.getState().setLoadingState('orders', true)
      useUIStore.getState().setLoadingState('products', false)
      
      expect(useUIStore.getState().getLoadingState('products')).toBe(false)
      expect(useUIStore.getState().getLoadingState('orders')).toBe(true)
    })
  })

  describe('Notifications', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('adds notification with default duration', () => {
      useUIStore.getState().addNotification({
        type: 'success',
        title: 'Success',
        message: 'Operation completed'
      })
      
      const notifications = useUIStore.getState().notifications
      expect(notifications).toHaveLength(1)
      expect(notifications[0]).toMatchObject({
        type: 'success',
        title: 'Success',
        message: 'Operation completed',
        duration: 5000
      })
      expect(notifications[0].id).toBeDefined()
      expect(notifications[0].timestamp).toBeDefined()
    })

    it('adds notification with custom duration', () => {
      useUIStore.getState().addNotification({
        type: 'error',
        title: 'Error',
        duration: 10000
      })
      
      const notifications = useUIStore.getState().notifications
      expect(notifications[0].duration).toBe(10000)
    })

    it('auto-removes notification after duration', () => {
      useUIStore.getState().addNotification({
        type: 'info',
        title: 'Info',
        duration: 1000
      })
      
      expect(useUIStore.getState().notifications).toHaveLength(1)
      
      vi.advanceTimersByTime(1000)
      
      expect(useUIStore.getState().notifications).toHaveLength(0)
    })

    it('does not auto-remove persistent notifications', () => {
      useUIStore.getState().addNotification({
        type: 'warning',
        title: 'Warning',
        duration: 0 // Persistent
      })
      
      vi.advanceTimersByTime(10000)
      
      expect(useUIStore.getState().notifications).toHaveLength(1)
    })

    it('manually removes notification by ID', () => {
      useUIStore.getState().addNotification({
        type: 'success',
        title: 'Success'
      })
      
      const id = useUIStore.getState().notifications[0].id
      useUIStore.getState().removeNotification(id)
      
      expect(useUIStore.getState().notifications).toHaveLength(0)
    })

    it('clears all notifications', () => {
      useUIStore.getState().addNotification({
        type: 'success',
        title: 'Success 1'
      })
      useUIStore.getState().addNotification({
        type: 'error',
        title: 'Error 1'
      })
      
      expect(useUIStore.getState().notifications).toHaveLength(2)
      
      useUIStore.getState().clearNotifications()
      
      expect(useUIStore.getState().notifications).toHaveLength(0)
    })

    it('handles multiple notifications with different durations', () => {
      useUIStore.getState().addNotification({
        type: 'success',
        title: 'Quick',
        duration: 1000
      })
      useUIStore.getState().addNotification({
        type: 'info',
        title: 'Slow',
        duration: 3000
      })
      
      expect(useUIStore.getState().notifications).toHaveLength(2)
      
      vi.advanceTimersByTime(1500)
      expect(useUIStore.getState().notifications).toHaveLength(1)
      expect(useUIStore.getState().notifications[0].title).toBe('Slow')
      
      vi.advanceTimersByTime(2000)
      expect(useUIStore.getState().notifications).toHaveLength(0)
    })
  })

  describe('Convenience Hooks', () => {
    describe('useMobileMenu', () => {
      it('provides mobile menu controls', () => {
        const { result } = renderHook(() => useMobileMenu())

        expect(result.current.isOpen).toBe(false)

        act(() => result.current.open())
        expect(result.current.isOpen).toBe(true)

        act(() => result.current.close())
        expect(result.current.isOpen).toBe(false)

        act(() => result.current.toggle())
        expect(result.current.isOpen).toBe(true)
      })
    })

    describe('useSearch', () => {
      it('provides search controls', () => {
        const { result } = renderHook(() => useSearch())

        expect(result.current.isOpen).toBe(false)
        expect(result.current.query).toBe('')

        act(() => result.current.open())
        expect(result.current.isOpen).toBe(true)

        act(() => result.current.setQuery('test query'))
        expect(result.current.query).toBe('test query')

        act(() => result.current.close())
        expect(result.current.isOpen).toBe(false)

        act(() => result.current.clear())
        expect(result.current.query).toBe('')
      })
    })

    describe('useFilters', () => {
      it('provides filter controls', () => {
        const { result } = renderHook(() => useFilters())

        expect(result.current.isOpen).toBe(false)

        act(() => result.current.open())
        expect(result.current.isOpen).toBe(true)

        act(() => result.current.close())
        expect(result.current.isOpen).toBe(false)

        act(() => result.current.toggle())
        expect(result.current.isOpen).toBe(true)
      })
    })

    describe('useQuickView', () => {
      it('provides quick view controls', () => {
        const { result } = renderHook(() => useQuickView())

        expect(result.current.isOpen).toBe(false)
        expect(result.current.productId).toBe(null)

        act(() => result.current.open('product-123'))
        expect(result.current.isOpen).toBe(true)
        expect(result.current.productId).toBe('product-123')

        act(() => result.current.close())
        expect(result.current.isOpen).toBe(false)
        expect(result.current.productId).toBe(null)
      })
    })

    describe('useNotifications', () => {
      beforeEach(() => {
        vi.useFakeTimers()
      })

      afterEach(() => {
        vi.useRealTimers()
      })

      it('provides notification controls', () => {
        const { result } = renderHook(() => useNotifications())

        expect(result.current.notifications).toEqual([])

        act(() => result.current.add({
          type: 'success',
          title: 'Test'
        }))

        const currentNotifications = result.current.notifications
        expect(currentNotifications).toHaveLength(1)

        act(() => result.current.remove(currentNotifications[0].id))
        expect(result.current.notifications).toHaveLength(0)

        act(() => result.current.add({ type: 'info', title: 'Info 1' }))
        act(() => result.current.add({ type: 'warning', title: 'Warning 1' }))
        expect(result.current.notifications).toHaveLength(2)

        act(() => result.current.clear())
        expect(result.current.notifications).toHaveLength(0)
      })
    })

    describe('useLoading', () => {
      it('provides loading controls', () => {
        const { result } = renderHook(() => useLoading())

        expect(result.current.isPageLoading).toBe(false)

        act(() => result.current.setPageLoading(true))
        expect(result.current.isPageLoading).toBe(true)

        act(() => result.current.setLoading('products', true))
        expect(result.current.getLoading('products')).toBe(true)
        expect(result.current.getLoading('nonexistent')).toBe(false)
      })
    })
  })

  describe('Body Scroll Prevention', () => {
    it('prevents body scroll when mobile menu opens', () => {
      useUIStore.getState().setMobileMenuOpen(true)
      expect(document.body.style.overflow).toBe('hidden')
      
      useUIStore.getState().setMobileMenuOpen(false)
      expect(document.body.style.overflow).toBe('')
    })

    it('prevents body scroll when quick view opens', () => {
      useUIStore.getState().openQuickView('product-123')
      expect(document.body.style.overflow).toBe('hidden')
      
      useUIStore.getState().closeQuickView()
      expect(document.body.style.overflow).toBe('')
    })

    it('handles multiple overlays correctly', () => {
      // Open mobile menu
      useUIStore.getState().setMobileMenuOpen(true)
      expect(document.body.style.overflow).toBe('hidden')
      
      // Open quick view (should still prevent scroll)
      useUIStore.getState().openQuickView('product-123')
      expect(document.body.style.overflow).toBe('hidden')
      
      // Close mobile menu (should still prevent scroll due to quick view)
      useUIStore.getState().setMobileMenuOpen(false)
      expect(document.body.style.overflow).toBe('hidden')
      
      // Close quick view (should restore scroll)
      useUIStore.getState().closeQuickView()
      expect(document.body.style.overflow).toBe('')
    })
  })

  describe('Edge Cases', () => {
    it('handles missing window object gracefully', () => {
      const originalWindow = global.window
      delete (global as any).window
      
      expect(() => {
        useUIStore.getState().setMobileMenuOpen(true)
      }).not.toThrow()
      
      global.window = originalWindow
    })

    it('handles notification removal of non-existent ID', () => {
      useUIStore.getState().removeNotification('non-existent-id')
      expect(useUIStore.getState().notifications).toEqual([])
    })

    it('handles setting loading state multiple times', () => {
      useUIStore.getState().setLoadingState('test', true)
      useUIStore.getState().setLoadingState('test', true) // Should not cause issues
      useUIStore.getState().setLoadingState('test', false)
      
      expect(useUIStore.getState().getLoadingState('test')).toBe(false)
    })
  })
})