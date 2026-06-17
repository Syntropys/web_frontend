import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useLocation } from 'react-router'
import { Mail, Lock, Eye, EyeOff, AlertCircle, ShieldAlert, Loader2 } from 'lucide-react'
import { AuthShell } from '@/app/components/auth-shell'
import { Field, PrimaryButton, OrDivider, GoogleButton } from '@/app/components/auth-fields'
import { LoginSchema, fieldErrors } from '@/schemas'
import { authService } from '@/services/auth'
import { useAuthStore } from '@/stores/useAuthStore'
import { profilesService } from '@/services/profiles'

const MAX_ATTEMPTS = 5
const LOCK_DURATION_MS = 30_000
const SUBMIT_COOLDOWN_MS = 1200

export default function Masuk() {
  const { session } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [fieldErr, setFieldErr] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [failCount, setFailCount] = useState(0)
  const [lockUntil, setLockUntil] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  const [submitting, setSubmitting] = useState(false)
  const cooldownRef = useRef<number | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard'

  useEffect(() => {
    if (lockUntil === null) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [lockUntil])

  useEffect(() => {
    if (lockUntil !== null && Date.now() >= lockUntil) {
      setLockUntil(null)
      setFailCount(0)
      setError('')
    }
  }, [now, lockUntil])

  useEffect(() => {
    return () => {
      if (cooldownRef.current) window.clearTimeout(cooldownRef.current)
    }
  }, [])

  const secondsLeft = lockUntil ? Math.max(0, Math.ceil((lockUntil - now) / 1000)) : 0
  const isLocked = lockUntil !== null && secondsLeft > 0
  const attemptsLeft = Math.max(0, MAX_ATTEMPTS - failCount)

  const parsed = LoginSchema.safeParse({ email, password })
  const errs = parsed.success ? {} : fieldErrors(parsed)
  const isFormValid = parsed.success

  const handleSignOut = async () => {
    await authService.signOut()
  }

  const startCooldown = () => {
    setSubmitting(true)
    cooldownRef.current = window.setTimeout(() => setSubmitting(false), SUBMIT_COOLDOWN_MS)
  }

  const registerFail = (message: string) => {
    const next = failCount + 1
    setFailCount(next)
    if (next >= MAX_ATTEMPTS) {
      setLockUntil(Date.now() + LOCK_DURATION_MS)
      setError('')
    } else {
      setError(message)
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLocked || submitting) return
    setTouched({ email: true, password: true })
    if (!parsed.success) {
      setFieldErr(errs)
      return
    }
    setError('')
    setFieldErr({})
    startCooldown()

    // Proceed with Supabase auth
    try {
      const { user, session } = await authService.signInPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      })

      if (session) {
        try {
          const prof = await profilesService.getById(session.user.id)
          useAuthStore.getState().setProfile(prof)
        } catch { /* non-fatal */ }
        setFailCount(0)
        navigate(from, { replace: true })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan'
      registerFail(msg.includes('Invalid login') || msg.includes('Invalid email')
        ? 'Email atau kata sandi salah'
        : msg)
    }
  }

  const handleGoogleSignIn = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      await authService.signInGoogle()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal login dengan Google'
      setError(msg)
      setSubmitting(false)
    }
  }

  if (session) return <Navigate to="/dashboard" replace />

  return (
    <AuthShell
      pageTitle="Masuk"
      eyebrow="Masuk"
      title="Selamat datang kembali"
      description="Gunakan email dan kata sandi akun Anda untuk melanjutkan."
      footer={
        <>
          Belum punya akun?{' '}
          <Link to="/daftar" className="text-[#2A3530] dark:text-[#E8E6DF] hover:text-[#8C6E26] dark:hover:text-[#C9A24B] transition-colors">
            Daftar sekarang
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field
          label="Email"
          type="email"
          placeholder="nama@email.com"
          icon={<Mail size={16} strokeWidth={1.6} />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          error={touched.email ? fieldErr.email || errs.email : undefined}
          disabled={isLocked}
          autoComplete="email"
          required
        />
        <Field
          label="Kata Sandi"
          type={showPassword ? 'text' : 'password'}
          placeholder="Masukkan kata sandi Anda"
          icon={<Lock size={16} strokeWidth={1.6} />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
          error={touched.password ? fieldErr.password || errs.password : undefined}
          disabled={isLocked}
          autoComplete="current-password"
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              className="w-7 h-7 inline-flex items-center justify-center rounded-md text-[#5F6A64] dark:text-[#A8AFA9] hover:text-[#8C6E26] dark:hover:text-[#C9A24B] transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff size={16} strokeWidth={1.6} /> : <Eye size={16} strokeWidth={1.6} />}
            </button>
          }
          required
        />

        {isLocked ? (
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-[#B85C5C]/30 bg-[#B85C5C]/12 dark:bg-[#B85C5C]/15 text-[12px] text-[#A04848] dark:text-[#D17878]">
            <ShieldAlert size={13} strokeWidth={1.7} className="shrink-0" />
            <span>Dikunci · coba lagi {secondsLeft}s</span>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-[#B85C5C]/30 bg-[#B85C5C]/12 dark:bg-[#B85C5C]/15 text-[12px] text-[#A04848] dark:text-[#D17878]">
            <AlertCircle size={13} strokeWidth={1.7} className="shrink-0" />
            <span className="min-w-0">
              {error}
              {failCount >= 2 && attemptsLeft > 0 && (
                <span className="opacity-75"> · sisa {attemptsLeft}x</span>
              )}
            </span>
          </div>
        ) : null}

        <div className="flex items-center justify-between pt-1">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-3.5 h-3.5 rounded border-[#2A3530]/30 dark:border-[#E8E6DF]/30 accent-[#C9A24B]"
            />
            <span className="text-[12px] text-[#5F6A64] dark:text-[#B8BFB9]">Ingat saya</span>
          </label>
          <Link to="/lupa-password" className="text-[12px] text-[#5F6A64] dark:text-[#B8BFB9] hover:text-[#8C6E26] dark:hover:text-[#C9A24B] transition-colors">
            Lupa kata sandi?
          </Link>
        </div>

        <div className="pt-2 space-y-3">
          <PrimaryButton disabled={isLocked || submitting || !isFormValid}>
            {submitting && !isLocked ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 size={14} strokeWidth={2} className="animate-spin" />
                Memproses…
              </span>
            ) : (
              'Masuk'
            )}
          </PrimaryButton>
          <OrDivider />
          <GoogleButton onClick={handleGoogleSignIn}>Masuk dengan Google</GoogleButton>
        </div>
      </form>
    </AuthShell>
  )
}