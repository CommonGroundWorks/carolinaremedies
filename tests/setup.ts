import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => {
    const img = document.createElement('img')
    img.src = src
    img.alt = alt
    Object.assign(img, props)
    return img
  },
}))

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    button: 'button',
    span: 'span',
    p: 'p',
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
  },
  AnimatePresence: ({ children }: any) => children,
}))

// Mock Zustand stores
vi.mock('@/lib/stores/cart-store', () => ({
  useCartStore: vi.fn(() => ({
    items: [],
    totalItems: 0,
    totalPrice: 0,
    isOpen: false,
    addItem: vi.fn(),
    removeItem: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: vi.fn(),
    toggleCart: vi.fn(),
  })),
}))

vi.mock('@/lib/stores/ui-store', () => ({
  useUIStore: vi.fn(() => ({
    isMobileMenuOpen: false,
    isSearchOpen: false,
    isLoading: false,
    notifications: [],
    toggleMobileMenu: vi.fn(),
    toggleSearch: vi.fn(),
    setLoading: vi.fn(),
    addNotification: vi.fn(),
    removeNotification: vi.fn(),
  })),
}))

vi.mock('@/lib/stores/user-store', () => ({
  useUserStore: vi.fn(() => ({
    user: null,
    isAuthenticated: false,
    isAgeVerified: false,
    preferences: {},
    login: vi.fn(),
    logout: vi.fn(),
    verifyAge: vi.fn(),
    updatePreferences: vi.fn(),
  })),
}))

// Mock Supabase
vi.mock('@/lib/supabase', () => {
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  }

  const client = {
    from: vi.fn(() => builder),
    storage: {
      listBuckets: vi.fn().mockResolvedValue({ data: [], error: null }),
      createBucket: vi.fn().mockResolvedValue({ data: null, error: null }),
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: null, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/image.png' } }),
      })),
    },
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      refreshSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signIn: vi.fn().mockResolvedValue({ data: null, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  }

  return {
    supabase: client,
    createClient: vi.fn(() => client),
    createAdminClient: vi.fn(() => client),
  }
})

// Mock window.localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(() => null),
    removeItem: vi.fn(() => null),
    clear: vi.fn(() => null),
  },
  writable: true,
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})