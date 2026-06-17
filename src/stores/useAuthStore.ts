import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Session, User } from '@supabase/supabase-js'
import type { Profile } from '@/types/database'

interface AuthState {
  session: Session | null
  user: User | null
  profile: Profile | null
  isLoading: boolean
  setSession: (session: Session | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      user: null,
      profile: null,
      isLoading: true,
      setSession: (session) =>
        set({ session, user: session?.user ?? null }),
      setProfile: (profile) => set({ profile }),
      setLoading: (isLoading) => set({ isLoading }),
      reset: () =>
        set({ session: null, user: null, profile: null, isLoading: false }),
    }),
    {
      name: 'agrolytics-auth-v2',
      partialize: (state) => ({
        // Only persist profile prefs, NOT session tokens (Supabase handles that)
        profile: state.profile,
      }),
    },
  ),
)

if (typeof window !== 'undefined') {
  (window as any).authStore = useAuthStore
}
