/**
 * UI Store
 * Manages global UI state and modal/drawer states
 */

import { create } from 'zustand'

const syncBodyScroll = (state: Pick<UIState, 'isMobileMenuOpen' | 'isQuickViewOpen'>) => {
  if (typeof document === 'undefined' || !document.body) {
    return
  }

  document.body.style.overflow = state.isMobileMenuOpen || state.isQuickViewOpen ? 'hidden' : ''
}

export interface UIState {
  // Mobile menu
  isMobileMenuOpen: boolean
  
  // Search
  isSearchOpen: boolean
  searchQuery: string
  
  // Filters
  isFilterOpen: boolean
  
  // Product quick view
  isQuickViewOpen: boolean
  quickViewProductId: string | null
  
  // Loading states
  isPageLoading: boolean
  loadingStates: Record<string, boolean>
  
  // Notifications/Toasts
  notifications: Notification[]
  
  // Actions
  setMobileMenuOpen: (open: boolean) => void
  toggleMobileMenu: () => void
  
  setSearchOpen: (open: boolean) => void
  setSearchQuery: (query: string) => void
  clearSearch: () => void
  
  setFilterOpen: (open: boolean) => void
  toggleFilters: () => void
  
  openQuickView: (productId: string) => void
  closeQuickView: () => void
  
  setPageLoading: (loading: boolean) => void
  setLoadingState: (key: string, loading: boolean) => void
  getLoadingState: (key: string) => boolean
  
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
}

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number // ms, 0 = persistent
  timestamp: number
}

export const useUIStore = create<UIState>((set, get) => ({
  // Initial state
  isMobileMenuOpen: false,
  isSearchOpen: false,
  searchQuery: '',
  isFilterOpen: false,
  isQuickViewOpen: false,
  quickViewProductId: null,
  isPageLoading: false,
  loadingStates: {},
  notifications: [],

  // Mobile menu actions
  setMobileMenuOpen: (open: boolean) => {
    set((state) => {
      const nextState = { ...state, isMobileMenuOpen: open }
      syncBodyScroll(nextState)
      return { isMobileMenuOpen: open }
    })
  },
  
  toggleMobileMenu: () => {
    const { isMobileMenuOpen, setMobileMenuOpen } = get()
    setMobileMenuOpen(!isMobileMenuOpen)
  },

  // Search actions
  setSearchOpen: (open: boolean) => {
    set({ isSearchOpen: open })
    
    // Clear search when closing
    if (!open) {
      get().clearSearch()
    }
  },
  
  setSearchQuery: (query: string) => {
    set({ searchQuery: query })
  },
  
  clearSearch: () => {
    set({ searchQuery: '', isSearchOpen: false })
  },

  // Filter actions
  setFilterOpen: (open: boolean) => {
    set({ isFilterOpen: open })
  },
  
  toggleFilters: () => {
    const { isFilterOpen } = get()
    set({ isFilterOpen: !isFilterOpen })
  },

  // Quick view actions
  openQuickView: (productId: string) => {
    set((state) => {
      const nextState = {
        ...state,
        isQuickViewOpen: true,
        quickViewProductId: productId
      }
      syncBodyScroll(nextState)
      return {
        isQuickViewOpen: true,
        quickViewProductId: productId
      }
    })
  },
  
  closeQuickView: () => {
    set((state) => {
      const nextState = {
        ...state,
        isQuickViewOpen: false,
        quickViewProductId: null
      }
      syncBodyScroll(nextState)
      return {
        isQuickViewOpen: false,
        quickViewProductId: null
      }
    })
  },

  // Loading state actions
  setPageLoading: (loading: boolean) => {
    set({ isPageLoading: loading })
  },
  
  setLoadingState: (key: string, loading: boolean) => {
    set((state) => ({
      loadingStates: {
        ...state.loadingStates,
        [key]: loading
      }
    }))
  },
  
  getLoadingState: (key: string) => {
    return get().loadingStates[key] || false
  },

  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const id = Math.random().toString(36).substring(2)
    const timestamp = Date.now()
    
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp,
      duration: notification.duration ?? 5000 // Default 5s
    }
    
    set((state) => ({
      notifications: [...state.notifications, newNotification]
    }))
    
    // Auto-remove notification after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        get().removeNotification(id)
      }, newNotification.duration)
    }
  },
  
  removeNotification: (id: string) => {
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }))
  },
  
  clearNotifications: () => {
    set({ notifications: [] })
  }
}))

// Convenience hooks for specific UI states
export const useMobileMenu = () => {
  const isOpen = useUIStore((state) => state.isMobileMenuOpen)
  const setMobileMenuOpen = useUIStore((state) => state.setMobileMenuOpen)
  const toggleMobileMenu = useUIStore((state) => state.toggleMobileMenu)

  return {
    isOpen,
    open: () => setMobileMenuOpen(true),
    close: () => setMobileMenuOpen(false),
    toggle: toggleMobileMenu
  }
}

export const useSearch = () => {
  const isOpen = useUIStore((state) => state.isSearchOpen)
  const query = useUIStore((state) => state.searchQuery)
  const setSearchOpen = useUIStore((state) => state.setSearchOpen)
  const setSearchQuery = useUIStore((state) => state.setSearchQuery)
  const clearSearch = useUIStore((state) => state.clearSearch)

  return {
    isOpen,
    query,
    open: () => setSearchOpen(true),
    close: () => setSearchOpen(false),
    setQuery: setSearchQuery,
    clear: clearSearch
  }
}

export const useFilters = () => {
  const isOpen = useUIStore((state) => state.isFilterOpen)
  const setFilterOpen = useUIStore((state) => state.setFilterOpen)
  const toggleFilters = useUIStore((state) => state.toggleFilters)

  return {
    isOpen,
    open: () => setFilterOpen(true),
    close: () => setFilterOpen(false),
    toggle: toggleFilters
  }
}

export const useQuickView = () => {
  const isOpen = useUIStore((state) => state.isQuickViewOpen)
  const productId = useUIStore((state) => state.quickViewProductId)
  const open = useUIStore((state) => state.openQuickView)
  const close = useUIStore((state) => state.closeQuickView)

  return {
    isOpen,
    productId,
    open,
    close
  }
}

export const useNotifications = () => {
  const notifications = useUIStore((state) => state.notifications)
  const add = useUIStore((state) => state.addNotification)
  const remove = useUIStore((state) => state.removeNotification)
  const clear = useUIStore((state) => state.clearNotifications)

  return {
    notifications,
    add,
    remove,
    clear
  }
}

export const useLoading = () => {
  const isPageLoading = useUIStore((state) => state.isPageLoading)
  const setPageLoading = useUIStore((state) => state.setPageLoading)
  const setLoading = useUIStore((state) => state.setLoadingState)
  const getLoading = useUIStore((state) => state.getLoadingState)

  return {
    isPageLoading,
    setPageLoading,
    setLoading,
    getLoading
  }
}