import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { profilesService } from '@/services/profiles'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { setSession, setProfile } = useAuthStore()

  useEffect(() => {
    const type = params.get('type')
    async function handleCallback() {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error || !session) {
        navigate('/masuk?error=callback_failed', { replace: true })
        return
      }

      // Fetch + persist profile
      try {
        const prof = await profilesService.getById(session.user.id)
        setProfile(prof)
      } catch {
        setProfile(null)
      }
      setSession(session)

      if (type === 'recovery') {
        navigate('/reset-password', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    }

    handleCallback()
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--bg)]">
      <div className="flex flex-col items-center gap-3 text-[var(--text-secondary)]">
        <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm font-medium">Memproses login…</span>
      </div>
    </div>
  )
}
