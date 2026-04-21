import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMockUser } from '../../utils/test-utils'

// Import store after mocking
vi.doUnmock('@/lib/stores/user-store')
const { useUserStore, useAuth, useProfile } = await import('@/lib/stores/user-store')

// Mock Supabase client
const mockSupabaseAuth = {
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  refreshSession: vi.fn(),
  onAuthStateChange: vi.fn(),
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: mockSupabaseAuth,
  },
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('User Store', () => {
  beforeEach(() => {
    // Reset store state
    useUserStore.setState({
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: false,
      isAgeVerified: false,
    })
    
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initial State', () => {
    it('has correct initial state', () => {
      const state = useUserStore.getState()
      
      expect(state.user).toBe(null)
      expect(state.profile).toBe(null)
      expect(state.isAuthenticated).toBe(false)
      expect(state.isLoading).toBe(false)
      expect(state.isAgeVerified).toBe(false)
    })
  })

  describe('Authentication', () => {
    describe('signIn', () => {
      it('signs in successfully', async () => {
        const mockUser = { id: '1', email: 'test@example.com' }
        mockSupabaseAuth.signInWithPassword.mockResolvedValue({
          data: { user: mockUser },
          error: null
        })

        await useUserStore.getState().signIn('test@example.com', 'password')

        expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password'
        })

        const state = useUserStore.getState()
        expect(state.user).toEqual(mockUser)
        expect(state.isAuthenticated).toBe(true)
        expect(state.isLoading).toBe(false)
      })

      it('handles sign in error', async () => {
        const error = new Error('Invalid credentials')
        mockSupabaseAuth.signInWithPassword.mockResolvedValue({
          data: { user: null },
          error
        })

        await expect(
          useUserStore.getState().signIn('test@example.com', 'wrong-password')
        ).rejects.toThrow('Invalid credentials')

        const state = useUserStore.getState()
        expect(state.user).toBe(null)
        expect(state.isAuthenticated).toBe(false)
        expect(state.isLoading).toBe(false)
      })

      it('sets loading state during sign in', async () => {
        const mockUser = { id: '1', email: 'test@example.com' }
        mockSupabaseAuth.signInWithPassword.mockImplementation(() => {
          expect(useUserStore.getState().isLoading).toBe(true)
          return Promise.resolve({ data: { user: mockUser }, error: null })
        })

        await useUserStore.getState().signIn('test@example.com', 'password')

        expect(useUserStore.getState().isLoading).toBe(false)
      })
    })

    describe('signUp', () => {
      it('signs up successfully', async () => {
        const mockUser = { id: '1', email: 'test@example.com' }
        mockSupabaseAuth.signUp.mockResolvedValue({
          data: { user: mockUser },
          error: null
        })

        const userData = { name: 'Test User', phone: '555-123-4567' }
        await useUserStore.getState().signUp('test@example.com', 'password', userData)

        expect(mockSupabaseAuth.signUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password',
          options: {
            data: userData
          }
        })

        const state = useUserStore.getState()
        expect(state.user).toEqual(mockUser)
        expect(state.isAuthenticated).toBe(true)
      })

      it('handles sign up error', async () => {
        const error = new Error('Email already exists')
        mockSupabaseAuth.signUp.mockResolvedValue({
          data: { user: null },
          error
        })

        await expect(
          useUserStore.getState().signUp('test@example.com', 'password')
        ).rejects.toThrow('Email already exists')
      })
    })

    describe('signOut', () => {
      beforeEach(() => {
        useUserStore.setState({
          user: { id: '1', email: 'test@example.com' } as any,
          profile: createMockUser(),
          isAuthenticated: true,
          isAgeVerified: true,
        })
      })

      it('signs out successfully', async () => {
        mockSupabaseAuth.signOut.mockResolvedValue({ error: null })

        await useUserStore.getState().signOut()

        expect(mockSupabaseAuth.signOut).toHaveBeenCalled()

        const state = useUserStore.getState()
        expect(state.user).toBe(null)
        expect(state.profile).toBe(null)
        expect(state.isAuthenticated).toBe(false)
        expect(state.isAgeVerified).toBe(false)
      })

      it('handles sign out error', async () => {
        const error = new Error('Sign out failed')
        mockSupabaseAuth.signOut.mockResolvedValue({ error })

        await expect(
          useUserStore.getState().signOut()
        ).rejects.toThrow('Sign out failed')
      })
    })
  })

  describe('Profile Management', () => {
    beforeEach(() => {
      useUserStore.setState({
        user: { id: '1', email: 'test@example.com' } as any,
        profile: createMockUser({ id: '1' }),
        isAuthenticated: true,
      })
    })

    describe('updateProfile', () => {
      it('updates profile locally (since DB operations are commented out)', async () => {
        const updates = { name: 'Updated Name', phone: '555-987-6543' }

        await useUserStore.getState().updateProfile(updates)

        const state = useUserStore.getState()
        expect(state.profile).toMatchObject(updates)
      })

      it('updates age verification status from profile', async () => {
        const updates = { age_verified: true }

        await useUserStore.getState().updateProfile(updates)

        const state = useUserStore.getState()
        expect(state.isAgeVerified).toBe(true)
      })

      it('does not update profile if no user or profile', async () => {
        useUserStore.setState({ user: null, profile: null })

        await useUserStore.getState().updateProfile({ name: 'Test' })

        const state = useUserStore.getState()
        expect(state.profile).toBe(null)
      })
    })

    describe('loadProfile', () => {
      it('does not load profile if no user', async () => {
        useUserStore.setState({ user: null })

        await useUserStore.getState().loadProfile()

        // Should not throw or cause issues
        expect(true).toBe(true)
      })

      it('handles profile loading with user present', async () => {
        await useUserStore.getState().loadProfile()

        // Since profile loading is commented out, this just ensures no errors
        expect(true).toBe(true)
      })
    })
  })

  describe('Age Verification', () => {
    const futureDate = new Date()
    futureDate.setFullYear(futureDate.getFullYear() + 5) // 5 years in the future

    const validDate = new Date()
    validDate.setFullYear(validDate.getFullYear() - 25) // 25 years ago

    describe('verifyAge', () => {
      it('verifies age for valid birth date (21+)', async () => {
        const birthDate = validDate.toISOString().split('T')[0]
        
        const isVerified = await useUserStore.getState().verifyAge(birthDate)
        
        expect(isVerified).toBe(true)
        expect(useUserStore.getState().isAgeVerified).toBe(true)
      })

      it('rejects age for invalid birth date (under 21)', async () => {
        const underageDate = new Date()
        underageDate.setFullYear(underageDate.getFullYear() - 18) // 18 years old
        const birthDate = underageDate.toISOString().split('T')[0]
        
        const isVerified = await useUserStore.getState().verifyAge(birthDate)
        
        expect(isVerified).toBe(false)
        expect(useUserStore.getState().isAgeVerified).toBe(false)
      })

      it('handles edge case of exactly 21 years old', async () => {
        const exactlyTwentyOne = new Date()
        exactlyTwentyOne.setFullYear(exactlyTwentyOne.getFullYear() - 21)
        const birthDate = exactlyTwentyOne.toISOString().split('T')[0]
        
        const isVerified = await useUserStore.getState().verifyAge(birthDate)
        
        expect(isVerified).toBe(true)
      })

      it('handles birthday not yet reached this year', async () => {
        const notYetTwentyOne = new Date()
        notYetTwentyOne.setFullYear(notYetTwentyOne.getFullYear() - 21)
        notYetTwentyOne.setMonth(notYetTwentyOne.getMonth() + 1) // Next month
        const birthDate = notYetTwentyOne.toISOString().split('T')[0]
        
        const isVerified = await useUserStore.getState().verifyAge(birthDate)
        
        expect(isVerified).toBe(false)
      })

      it('updates profile for authenticated users', async () => {
        useUserStore.setState({
          user: { id: '1', email: 'test@example.com' } as any,
          profile: createMockUser({ id: '1' }),
          isAuthenticated: true,
        })
        
        const birthDate = validDate.toISOString().split('T')[0]
        
        await useUserStore.getState().verifyAge(birthDate)
        
        const state = useUserStore.getState()
        expect(state.profile?.date_of_birth).toBe(birthDate)
        expect(state.profile?.age_verified).toBe(true)
        expect(state.profile?.age_verification_method).toBe('self_reported')
      })

      it('stores verification locally for guest users', async () => {
        useUserStore.setState({ user: null, isAuthenticated: false })
        
        const birthDate = validDate.toISOString().split('T')[0]
        
        await useUserStore.getState().verifyAge(birthDate)
        
        expect(useUserStore.getState().isAgeVerified).toBe(true)
      })
    })

    describe('setAgeVerified', () => {
      it('sets age verification status', () => {
        useUserStore.getState().setAgeVerified(true)
        expect(useUserStore.getState().isAgeVerified).toBe(true)

        useUserStore.getState().setAgeVerified(false)
        expect(useUserStore.getState().isAgeVerified).toBe(false)
      })
    })
  })

  describe('Session Management', () => {
    describe('initialize', () => {
      it('initializes with existing session', async () => {
        const mockUser = { id: '1', email: 'test@example.com' }
        mockSupabaseAuth.getSession.mockResolvedValue({
          data: { session: { user: mockUser } }
        })
        mockSupabaseAuth.onAuthStateChange.mockImplementation(() => () => {})

        await useUserStore.getState().initialize()

        const state = useUserStore.getState()
        expect(state.user).toEqual(mockUser)
        expect(state.isAuthenticated).toBe(true)
        expect(state.isLoading).toBe(false)
      })

      it('initializes without session', async () => {
        mockSupabaseAuth.getSession.mockResolvedValue({
          data: { session: null }
        })
        mockSupabaseAuth.onAuthStateChange.mockImplementation(() => () => {})

        await useUserStore.getState().initialize()

        const state = useUserStore.getState()
        expect(state.user).toBe(null)
        expect(state.isAuthenticated).toBe(false)
        expect(state.isLoading).toBe(false)
      })

      it('sets up auth state change listener', async () => {
        mockSupabaseAuth.getSession.mockResolvedValue({
          data: { session: null }
        })
        mockSupabaseAuth.onAuthStateChange.mockImplementation(() => () => {})

        await useUserStore.getState().initialize()

        expect(mockSupabaseAuth.onAuthStateChange).toHaveBeenCalled()
      })

      it('handles initialization error', async () => {
        mockSupabaseAuth.getSession.mockRejectedValue(new Error('Network error'))
        mockSupabaseAuth.onAuthStateChange.mockImplementation(() => () => {})

        await useUserStore.getState().initialize()

        // Should not throw, but log error and set loading to false
        expect(useUserStore.getState().isLoading).toBe(false)
      })
    })

    describe('refreshSession', () => {
      it('refreshes session successfully', async () => {
        const mockUser = { id: '1', email: 'test@example.com' }
        mockSupabaseAuth.refreshSession.mockResolvedValue({
          data: { session: { user: mockUser } },
          error: null
        })

        await useUserStore.getState().refreshSession()

        const state = useUserStore.getState()
        expect(state.user).toEqual(mockUser)
        expect(state.isAuthenticated).toBe(true)
      })

      it('handles refresh session error', async () => {
        const error = new Error('Session expired')
        mockSupabaseAuth.refreshSession.mockResolvedValue({
          data: { session: null },
          error
        })

        await expect(
          useUserStore.getState().refreshSession()
        ).rejects.toThrow('Session expired')
      })
    })
  })

  describe('Permissions', () => {
    describe('hasPermission', () => {
      it('returns false for unauthenticated users', () => {
        useUserStore.setState({ profile: null })

        const hasPermission = useUserStore.getState().hasPermission('view_products')
        expect(hasPermission).toBe(false)
      })

      it('grants all permissions to admin users', () => {
        useUserStore.setState({
          profile: createMockUser({ is_admin: true })
        })

        const hasPermission = useUserStore.getState().hasPermission('admin_action')
        expect(hasPermission).toBe(true)
      })

      it('grants basic permissions to regular users', () => {
        useUserStore.setState({
          profile: createMockUser({ is_admin: false })
        })

        expect(useUserStore.getState().hasPermission('view_products')).toBe(true)
        expect(useUserStore.getState().hasPermission('create_orders')).toBe(true)
        expect(useUserStore.getState().hasPermission('view_profile')).toBe(true)
        expect(useUserStore.getState().hasPermission('admin_action')).toBe(false)
      })
    })

    describe('isAdmin', () => {
      it('returns true for admin users', () => {
        useUserStore.setState({
          profile: createMockUser({ is_admin: true })
        })

        expect(useUserStore.getState().isAdmin()).toBe(true)
      })

      it('returns false for regular users', () => {
        useUserStore.setState({
          profile: createMockUser({ is_admin: false })
        })

        expect(useUserStore.getState().isAdmin()).toBe(false)
      })

      it('returns false for unauthenticated users', () => {
        useUserStore.setState({ profile: null })

        expect(useUserStore.getState().isAdmin()).toBe(false)
      })
    })
  })

  describe('Convenience Hooks', () => {
    describe('useAuth', () => {
      it('provides authentication controls', () => {
        useUserStore.setState({
          user: { id: '1', email: 'test@example.com' } as any,
          profile: createMockUser(),
          isAuthenticated: true,
          isAgeVerified: true,
        })

        const auth = useAuth()

        expect(auth.user).toBeDefined()
        expect(auth.profile).toBeDefined()
        expect(auth.isAuthenticated).toBe(true)
        expect(auth.isAgeVerified).toBe(true)
        expect(typeof auth.signIn).toBe('function')
        expect(typeof auth.signUp).toBe('function')
        expect(typeof auth.signOut).toBe('function')
        expect(typeof auth.verifyAge).toBe('function')
        expect(typeof auth.hasPermission).toBe('function')
        expect(typeof auth.isAdmin).toBe('function')
      })
    })

    describe('useProfile', () => {
      it('provides profile management controls', () => {
        useUserStore.setState({
          profile: createMockUser(),
          isLoading: false,
        })

        const profile = useProfile()

        expect(profile.profile).toBeDefined()
        expect(profile.isLoading).toBe(false)
        expect(typeof profile.updateProfile).toBe('function')
        expect(typeof profile.loadProfile).toBe('function')
      })
    })
  })

  describe('Age Calculation Edge Cases', () => {
    it('calculates age correctly for leap year births', async () => {
      // Test with Feb 29th leap year birthday
      const leapYearDate = new Date('2000-02-29')
      const testDate = new Date('2024-02-28') // Day before leap day
      
      // Mock current date
      const originalNow = Date.now
      Date.now = () => testDate.getTime()
      
      const birthDate = leapYearDate.toISOString().split('T')[0]
      const isVerified = await useUserStore.getState().verifyAge(birthDate)
      
      expect(isVerified).toBe(true) // Should be 24 years old
      
      Date.now = originalNow
    })

    it('handles same day birthday correctly', async () => {
      const today = new Date()
      const exactlyTwentyOneToday = new Date()
      exactlyTwentyOneToday.setFullYear(today.getFullYear() - 21)
      
      const birthDate = exactlyTwentyOneToday.toISOString().split('T')[0]
      const isVerified = await useUserStore.getState().verifyAge(birthDate)
      
      expect(isVerified).toBe(true)
    })
  })

  describe('Persistence', () => {
    it('persists age verification state', () => {
      useUserStore.getState().setAgeVerified(true)
      
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })

    it('only persists necessary state', () => {
      useUserStore.getState().setAgeVerified(true)
      
      const calls = localStorageMock.setItem.mock.calls
      const lastCall = calls[calls.length - 1]
      const persistedData = JSON.parse(lastCall[1])
      
      expect(persistedData.state).toHaveProperty('isAgeVerified')
      expect(persistedData.state).not.toHaveProperty('user') // Sensitive data shouldn't persist
      expect(persistedData.state).not.toHaveProperty('profile')
    })
  })
})