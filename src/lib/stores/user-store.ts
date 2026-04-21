import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { User } from '@supabase/supabase-js'

type AuthUser = User

type UserProfile = {
  id?: string
  is_admin?: boolean
  age_verified?: boolean
  date_of_birth?: string
  age_verification_method?: string
  [key: string]: unknown
}

type UserStoreStorage = {
  getItem: (name: string) => string | null
  setItem: (name: string, value: string) => void
  removeItem: (name: string) => void
}

interface UserStoreState {
  user: AuthUser | null
  profile: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  isAgeVerified: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, userData?: Record<string, unknown>) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  loadProfile: () => Promise<void>
  verifyAge: (birthDate: string) => Promise<boolean>
  setAgeVerified: (verified: boolean) => void
  initialize: () => Promise<void>
  refreshSession: () => Promise<void>
  hasPermission: (permission: string) => boolean
  isAdmin: () => boolean
}

const noopStorage: UserStoreStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
}

const getStorage = (): UserStoreStorage => {
  if (typeof window === 'undefined') {
    return noopStorage
  }

  return window.localStorage ?? noopStorage
}

const getSupabase = async () => {
  const supabaseModule = await import('@/lib/supabase')
  return supabaseModule.supabase
}

const calculateAge = (birthDate: string) => {
  const today = new Date(Date.now())
  const dob = new Date(birthDate)

  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()
  const dayDiff = today.getDate() - dob.getDate()

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1
  }

  return age
}

const getAuthView = (state: UserStoreState) => ({
  user: state.user,
  profile: state.profile,
  isAuthenticated: state.isAuthenticated,
  isAgeVerified: state.isAgeVerified,
  signIn: state.signIn,
  signUp: state.signUp,
  signOut: state.signOut,
  verifyAge: state.verifyAge,
  hasPermission: state.hasPermission,
  isAdmin: state.isAdmin,
})

export const useUserStore = create<UserStoreState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: false,
      isAgeVerified: false,

      signIn: async (email, password) => {
        set({ isLoading: true })

        try {
          const supabase = await getSupabase()
          const { data, error } = await supabase.auth.signInWithPassword({ email, password })

          if (error) {
            throw error
          }

          const user = data?.user ?? null
          set({
            user,
            isAuthenticated: Boolean(user),
            isLoading: false,
          })
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          })
          throw error
        }
      },

      signUp: async (email, password, userData = {}) => {
        set({ isLoading: true })

        try {
          const supabase = await getSupabase()
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: userData },
          })

          if (error) {
            throw error
          }

          const user = data?.user ?? null
          set({
            user,
            isAuthenticated: Boolean(user),
            isLoading: false,
          })
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          })
          throw error
        }
      },

      signOut: async () => {
        const supabase = await getSupabase()
        const { error } = await supabase.auth.signOut()

        if (error) {
          throw error
        }

        set({
          user: null,
          profile: null,
          isAuthenticated: false,
          isAgeVerified: false,
        })
      },

      updateProfile: async (updates) => {
        const state = get()
        if (!state.user || !state.profile) {
          return
        }

        const profile = {
          ...state.profile,
          ...updates,
        }

        set({
          profile,
          isAgeVerified: Boolean(profile.age_verified ?? state.isAgeVerified),
        })
      },

      loadProfile: async () => undefined,

      verifyAge: async (birthDate) => {
        const isAgeVerified = calculateAge(birthDate) >= 21
        set({ isAgeVerified })

        const state = get()
        if (isAgeVerified && state.user && state.profile) {
          await state.updateProfile({
            date_of_birth: birthDate,
            age_verified: true,
            age_verification_method: 'self_reported',
          })
        }

        return isAgeVerified
      },

      setAgeVerified: (verified) => set({ isAgeVerified: verified }),

      initialize: async () => {
        set({ isLoading: true })

        try {
          const supabase = await getSupabase()
          const { data } = await supabase.auth.getSession()
          const user = data?.session?.user ?? null

          set({
            user,
            isAuthenticated: Boolean(user),
            isLoading: false,
          })

          supabase.auth.onAuthStateChange(() => undefined)
        } catch (error) {
          console.error('Failed to initialize auth session', error)
          set({ isLoading: false })
        }
      },

      refreshSession: async () => {
        const supabase = await getSupabase()
        const { data, error } = await supabase.auth.refreshSession()

        if (error) {
          throw error
        }

        const user = data?.session?.user ?? null
        set({
          user,
          isAuthenticated: Boolean(user),
        })
      },

      hasPermission: (permission) => {
        const profile = get().profile
        if (!profile) {
          return false
        }

        if (profile.is_admin) {
          return true
        }

        return ['view_products', 'create_orders', 'view_profile'].includes(permission)
      },

      isAdmin: () => Boolean(get().profile?.is_admin),
    }),
    {
      name: 'ncremedies-user',
      storage: createJSONStorage(() => ({
        getItem: (name) => getStorage().getItem(name),
        setItem: (name, value) => getStorage().setItem(name, value),
        removeItem: (name) => getStorage().removeItem(name),
      })),
      partialize: (state) => ({
        isAgeVerified: state.isAgeVerified,
      }),
    }
  )
)

export const useAuth = () => getAuthView(useUserStore.getState())

export const useProfile = () => {
  const state = useUserStore.getState()

  return {
    profile: state.profile,
    isLoading: state.isLoading,
    updateProfile: state.updateProfile,
    loadProfile: state.loadProfile,
  }
}
