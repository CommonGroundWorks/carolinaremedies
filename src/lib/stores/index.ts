/**
 * Store Index
 * Central export for all Zustand stores
 */

export * from './cart-store'
export * from './ui-store'

// Re-export convenience hooks
export {
  useCartStore,
  type CartItem,
  type CartTotals,
  type CartState
} from './cart-store'

export {
  useUIStore,
  useMobileMenu,
  useSearch,
  useFilters,
  useQuickView,
  useNotifications,
  useLoading,
  lockBodyScroll,
  unlockBodyScroll,
  type UIState,
  type Notification
} from './ui-store'

export {
  useUserStore,
  useAuth,
  useProfile,
} from './user-store'
