import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { profilesService } from '@/services/profiles'
import type { Session } from '@supabase/supabase-js'

export function useAuthSession() {
  const { session, user, profile, isLoading, setSession, setProfile, setLoading, reset } =
    useAuthStore()

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      const TIMEOUT_MS = 8000

      const timeout = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), TIMEOUT_MS)
      )

      try {
        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          timeout,
        ])

        if (cancelled) return

        // Timeout or network failure — treat as no session
        if (!sessionResult || !('data' in sessionResult)) {
          reset()
          return
        }

        const { data } = sessionResult
        const s: Session | null = data?.session ?? null

        // Session found in storage
        if (s) {
          try {
            const prof = await profilesService.getById(s.user.id)
            if (prof?.status === 'suspended') {
              supabase.auth.signOut()
              reset()
              setLoading(false)
              return
            }
            if (!cancelled) {
              setSession(s)
              setProfile(prof)
            }
          } catch {
            if (!cancelled) {
              setSession(s)
              setProfile(null)
            }
          }
        } else {
          reset()
        }
      } catch {
        if (!cancelled) reset()
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    setLoading(true)
    bootstrap()

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      if (cancelled) return
      if (s) {
        try {
          const prof = await profilesService.getById(s.user.id)
          if (prof?.status === 'suspended') {
            supabase.auth.signOut()
            reset()
            setLoading(false)
            return
          }
          if (!cancelled) {
            setSession(s)
            setProfile(prof)
          }
        } catch {
          if (!cancelled) {
            setSession(s)
            setProfile(null)
          }
        }
      } else {
        if (!cancelled) reset()
      }
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  return {
    session,
    user,
    profile,
    isLoading,
    isAdmin: profile?.role === 'admin',
    isAuthenticated: !!session,
  }
}
