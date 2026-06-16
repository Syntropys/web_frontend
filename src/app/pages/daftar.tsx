import { useState } from 'react'
import { Link, Navigate } from 'react-router'
import { User, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { AuthShell } from '@/app/components/auth-shell'
import { Field, PrimaryButton, OrDivider, GoogleButton } from '@/app/components/auth-fields'
import { DaftarSchema, fieldErrors, passwordStrength } from '@/schemas'
import { authService } from '@/services/auth'
import { useAuthStore } from '@/stores/useAuthStore'
import { useDebouncedValue } from '@/app/hooks/use-debounced-value'

const STRENGTH_COLORS = ['#A04848', '#C9A24B', '#7A9A6E', '#5A8A4E'] as const
const STRENGTH_TEXT_CLASSES = [
  'text-[#A04848] dark:text-[#D17878]',
  'text-[#8C6E26] dark:text-[#C9A24B]',
  'text-[#5F7E55] dark:text-[#9CB892]',
  'text-[#4A7A40] dark:text-[#84B878]',
] as const

export default function Daftar() {
  const { session } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [setuju, setSetuju] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)

  const parsed = DaftarSchema.safeParse({ nama, email, password, setuju })
  const liveErrs = parsed.success ? {} : fieldErrors(parsed)
  const isFormValid = parsed.success
  const strength = passwordStrength(password)

  const debouncedNama = useDebouncedValue(nama, 400)
  const debouncedEmail = useDebouncedValue(email, 400)
  const debouncedPassword = useDebouncedValue(password, 400)
  const debouncedParsed = DaftarSchema.safeParse({
    nama: debouncedNama,
    email: debouncedEmail,
    password: debouncedPassword,
    setuju,
  })
  const debouncedErrs = debouncedParsed.success ? {} : fieldErrors(debouncedParsed)
  const errs = submitAttempted ? liveErrs : debouncedErrs

  const onBlur = (field: string) => setTouched((t) => ({ ...t, [field]: true }))

  const handleGoogleSignUp = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      await authService.signInGoogle()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal daftar dengan Google'
      setServerError(msg)
      setSubmitting(false)
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitAttempted(true)
    setTouched({ nama: true, email: true, password: true, setuju: true })
    if (!parsed.success || submitting) return
    setSubmitting(true)
    setServerError('')

    try {
      await authService.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        fullName: parsed.data.nama,
      })
      setSuccess(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan'
      // User-friendly Indonesian messages
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
        setServerError('Email sudah terdaftar. Gunakan email lain atau masuk di sini.')
      } else {
        setServerError(msg)
      }
      setSubmitting(false)
    }
  }

  if (session) return <Navigate to="/dashboard" replace />

  if (success) {
    return (
      <AuthShell
        pageTitle="Verifikasi Email"
        eyebrow="Daftar"
        title="Cek email Anda"
        description={`Kami telah mengirim tautan verifikasi ke ${email || 'email Anda'}. Klik tautan tersebut untuk mengaktifkan akun.`}
        footer={
          <>
            Sudah punya akun?{' '}
            <Link to="/masuk" className="text-[#2A3530] dark:text-[#E8E6DF] hover:text-[#8C6E26] dark:hover:text-[#C9A24B] transition-colors">
              Masuk di sini
            </Link>
          </>
        }
      >
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Mail size={28} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-sm text-center text-[#5F6A64] dark:text-[#B8BFB9]">
            Jika tidak menemukan email, cek folder <strong>Spam</strong>.
          </p>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      pageTitle="Daftar"
      eyebrow="Daftar"
      title="Buat akun baru"
      description="Lengkapi data berikut untuk mulai menggunakan Agrolytics."
      footer={
        <>
          Sudah memiliki akun?{' '}
          <Link to="/masuk" className="text-[#2A3530] dark:text-[#E8E6DF] hover:text-[#8C6E26] dark:hover:text-[#C9A24B] transition-colors">
            Masuk di sini
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field
          label="Nama Lengkap"
          type="text"
          placeholder="Nama sesuai identitas"
          icon={<User size={16} strokeWidth={1.6} />}
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          onBlur={() => onBlur('nama')}
          error={touched.nama ? errs.nama : undefined}
          autoComplete="name"
          maxLength={80}
          required
        />
        <Field
          label="Email"
          type="email"
          placeholder="nama@email.com"
          icon={<Mail size={16} strokeWidth={1.6} />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => onBlur('email')}
          error={touched.email ? errs.email : undefined}
          autoComplete="email"
          maxLength={120}
          required
        />
        <div>
          <Field
            label="Kata Sandi"
            type={showPassword ? 'text' : 'password'}
            placeholder="Buat kata sandi"
            icon={<Lock size={16} strokeWidth={1.6} />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => onBlur('password')}
            error={touched.password ? errs.password : undefined}
            autoComplete="new-password"
            maxLength={128}
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
          {password && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 flex gap-1">
                {[0, 1, 2, 3].map((i) => {
                  const filled = i < strength.level + 1
                  return (
                    <span
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        filled ? '' : 'bg-[#2A3530]/15 dark:bg-[#E8E6DF]/12'
                      }`}
                      style={filled ? { background: STRENGTH_COLORS[strength.level] } : undefined}
                    />
                  )
                })}
              </div>
              <span className={`text-[12px] ${STRENGTH_TEXT_CLASSES[strength.level]}`}>
                {strength.label}
              </span>
            </div>
          )}
        </div>

        <div className="pt-1">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={setuju}
              onChange={(e) => { setSetuju(e.target.checked); onBlur('setuju') }}
              className="mt-0.5 w-3.5 h-3.5 rounded border-[#2A3530]/30 dark:border-[#E8E6DF]/30 accent-[#C9A24B]"
            />
            <span className="text-[12px] leading-[1.6] text-[#5F6A64] dark:text-[#B8BFB9]">
              Setuju dengan{' '}
              <a href="#" className="text-[#2A3530] dark:text-[#E8E6DF] hover:text-[#8C6E26] dark:hover:text-[#C9A24B] transition-colors">Syarat</a>
              {' '}&{' '}
              <a href="#" className="text-[#2A3530] dark:text-[#E8E6DF] hover:text-[#8C6E26] dark:hover:text-[#C9A24B] transition-colors">Privasi</a>.
            </span>
          </label>
          {touched.setuju && errs.setuju && (
            <p className="mt-1.5 ml-[22px] text-[12px] text-[#A04848] dark:text-[#D17878]">{errs.setuju}</p>
          )}
        </div>

        {serverError && (
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-[#B85C5C]/30 bg-[#B85C5C]/12 dark:bg-[#B85C5C]/15 text-[12px] text-[#A04848] dark:text-[#D17878]">
            {serverError}
          </div>
        )}

        <div className="pt-2 space-y-3">
          <PrimaryButton disabled={!isFormValid || submitting}>
            {submitting ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 size={14} strokeWidth={2} className="animate-spin" />
                Memproses…
              </span>
            ) : (
              'Daftar'
            )}
          </PrimaryButton>
          <OrDivider />
          <GoogleButton onClick={handleGoogleSignUp}>Daftar dengan Google</GoogleButton>
        </div>
      </form>
    </AuthShell>
  )
}