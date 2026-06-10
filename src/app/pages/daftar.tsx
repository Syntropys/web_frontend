import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { User, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthShell } from "../components/auth-shell";
import { Field, PrimaryButton, OrDivider, GoogleButton } from "../components/auth-fields";
import { saveProfile, upsertAccount, hashPassword, useProfile } from "../hooks/use-profile";
import { setStoredRole } from "../hooks/use-role";
import { useDebouncedValue } from "../hooks/use-debounced-value";
import { DaftarSchema, fieldErrors, passwordStrength } from "../data/schemas";
import { usePrefetchDashboard } from "../hooks/use-prefetch-dashboard";

const STRENGTH_COLORS = ["#B85C5C", "#C9A24B", "#7A9A6E", "#5A8A4E"] as const;
const STRENGTH_TEXT_CLASSES = [
  "text-[#B85C5C] dark:text-[#D17878]",
  "text-[#A07F2E] dark:text-[#C9A24B]",
  "text-[#5F7E55] dark:text-[#9CB892]",
  "text-[#4A7A40] dark:text-[#84B878]",
] as const;

export default function Daftar() {
  const { profile } = useProfile();
  const [showPassword, setShowPassword] = useState(false);
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [setuju, setSetuju] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const navigate = useNavigate();
  usePrefetchDashboard();

  const parsed = DaftarSchema.safeParse({ nama, email, password, setuju });
  const liveErrs = parsed.success ? {} : fieldErrors(parsed);
  const isFormValid = parsed.success;
  const strength = passwordStrength(password);

  const debouncedNama = useDebouncedValue(nama, 400);
  const debouncedEmail = useDebouncedValue(email, 400);
  const debouncedPassword = useDebouncedValue(password, 400);
  const debouncedParsed = DaftarSchema.safeParse({
    nama: debouncedNama,
    email: debouncedEmail,
    password: debouncedPassword,
    setuju,
  });
  const debouncedErrs = debouncedParsed.success ? {} : fieldErrors(debouncedParsed);
  const errs = submitAttempted ? liveErrs : debouncedErrs;

  const onBlur = (field: string) => setTouched((t) => ({ ...t, [field]: true }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setTouched({ nama: true, email: true, password: true, setuju: true });
    if (!parsed.success || submitting) return;
    setSubmitting(true);
    const passwordHash = await hashPassword(parsed.data.password);
    const profile = {
      nama: parsed.data.nama,
      email: parsed.data.email,
    };
    upsertAccount({ ...profile, passwordHash });
    await new Promise((r) => setTimeout(r, 700));
    saveProfile(profile);
    setStoredRole("user");
    navigate("/dashboard");
  };

  if (profile.email) return <Navigate to="/dashboard" replace />;

  return (
    <AuthShell
      pageTitle="Daftar"
      eyebrow="Daftar"
      title="Buat akun baru"
      description="Lengkapi data berikut untuk mulai menggunakan Agrolytics."
      footer={
        <>
          Sudah memiliki akun?{" "}
          <Link to="/masuk" className="text-[#2A3530] dark:text-[#E8E6DF] hover:text-[#A07F2E] dark:hover:text-[#C9A24B] transition-colors">
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
          onBlur={() => onBlur("nama")}
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
          onBlur={() => onBlur("email")}
          error={touched.email ? errs.email : undefined}
          autoComplete="email"
          maxLength={120}
          required
        />
<div>
          <Field
            label="Kata Sandi"
            type={showPassword ? "text" : "password"}
            placeholder="Buat kata sandi"
            icon={<Lock size={16} strokeWidth={1.6} />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => onBlur("password")}
            error={touched.password ? errs.password : undefined}
            autoComplete="new-password"
            maxLength={128}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                className="w-7 h-7 inline-flex items-center justify-center rounded-md text-[#5F6A64] dark:text-[#A8AFA9] hover:text-[#A07F2E] dark:hover:text-[#C9A24B] transition-colors cursor-pointer"
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
                  const filled = i < strength.level + 1;
                  return (
                    <span
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        filled ? "" : "bg-[#2A3530]/15 dark:bg-[#E8E6DF]/12"
                      }`}
                      style={filled ? { background: STRENGTH_COLORS[strength.level] } : undefined}
                    />
                  );
                })}
              </div>
              <span className={`text-[11px] ${STRENGTH_TEXT_CLASSES[strength.level]}`}>
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
              onChange={(e) => {
                setSetuju(e.target.checked);
                onBlur("setuju");
              }}
              className="mt-0.5 w-3.5 h-3.5 rounded border-[#2A3530]/30 dark:border-[#E8E6DF]/30 accent-[#C9A24B]"
            />
            <span className="text-[12px] leading-[1.6] text-[#5F6A64] dark:text-[#B8BFB9]">
              Setuju dengan{" "}
              <a href="#" className="text-[#2A3530] dark:text-[#E8E6DF] hover:text-[#A07F2E] dark:hover:text-[#C9A24B] transition-colors">
                Syarat
              </a>{" "}
              &{" "}
              <a href="#" className="text-[#2A3530] dark:text-[#E8E6DF] hover:text-[#A07F2E] dark:hover:text-[#C9A24B] transition-colors">
                Privasi
              </a>
              .
            </span>
          </label>
          {touched.setuju && errs.setuju && (
            <p className="mt-1.5 ml-[22px] text-[11px] text-[#B85C5C] dark:text-[#D17878]">{errs.setuju}</p>
          )}
        </div>

        <div className="pt-2 space-y-3">
          <PrimaryButton disabled={!isFormValid || submitting}>
            {submitting ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 size={14} strokeWidth={2} className="animate-spin" />
                Memproses…
              </span>
            ) : (
              "Daftar Sekarang"
            )}
          </PrimaryButton>
          <OrDivider />
          <GoogleButton>Daftar dengan Google</GoogleButton>
        </div>
      </form>
    </AuthShell>
  );
}
