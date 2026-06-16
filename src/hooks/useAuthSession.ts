import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { profilesService } from '@/services/profiles'
import type { Session } from '@supabase/supabase-js'

export function useAuthSession() {
  const { session, user, profile, isLoading, setSession, setProfile, setLoading, reset } =
    useAuthStore()
  const [initError, setInitError] = useState<string | null>(null)

  // Bootstrap: load session + profile once on mount
  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      try {
        const { data } = await supabase.auth.getSession()
        if (cancelled) return

        const s: Session | null = data.session
        setSession(s)

        if (s?.user) {
          try {
            const prof = await profilesService.getById(s.user.id)
            if (!cancelled) setProfile(prof)
          } catch {
            // profile may not exist yet (trigger race) — non-fatal
            if (!cancelled) setProfile(null)
          }
        }
      } catch (err) {
        if (!cancelled) setInitError('Gagal memuat sesi')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    setLoading(true)
    bootstrap()

    // Listen for auth changes
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (cancelled) return
      setSession(s)
      if (s?.user) {
        try {
          const prof = await profilesService.getById(s.user.id)
          if (!cancelled) setProfile(prof)
        } catch {
          if (!cancelled) setProfile(null)
        }
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
    initError,
    isAdmin: profile?.role === 'admin',
    isAuthenticated: !!session,
  }
}
