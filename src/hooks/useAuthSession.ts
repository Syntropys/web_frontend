import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { profilesService } from '@/services/profiles'
import type { Session } from '@supabase/supabase-js'

let isInitialized = false

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
          setSession(s)
          if (s?.user && !cancelled) {
            try {
              const prof = await profilesService.getById(s.user.id)
              if (!cancelled) setProfile(prof)
            } catch {
              if (!cancelled) setProfile(null)
            }
          }
        } else {
          reset()
        }
      } catch {
        if (!cancelled) reset()
      } finally {
        if (!cancelled) {
          isInitialized = true
          setLoading(false)
        }
      }
    }

    if (!isInitialized) {
      setLoading(true)
      bootstrap()
    } else {
      setLoading(false)
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (cancelled) return
      setSession(s)
      if (s?.user) {
        profilesService
          .getById(s.user.id)
          .then((prof) => { if (!cancelled) setProfile(prof) })
          .catch(() => { if (!cancelled) setProfile(null) })
      } else {
        if (!cancelled) setProfile(null)
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
