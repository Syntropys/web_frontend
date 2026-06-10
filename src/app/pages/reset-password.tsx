import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Lock, Eye, EyeOff, CheckCircle2, ArrowLeft } from "lucide-react";
import { AuthShell } from "../components/auth-shell";
import { Field, PrimaryButton } from "../components/auth-fields";

type Strength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
};

const STRENGTH_TEXT_CLASSES = [
  "text-[#B85C5C] dark:text-[#D17878]",
  "text-[#B85C5C] dark:text-[#D17878]",
  "text-[#A07F2E] dark:text-[#C9A24B]",
  "text-[#5F7E55] dark:text-[#9CB892]",
  "text-[#4A7A40] dark:text-[#84B878]",
] as const;

function evaluateStrength(password: string): Strength {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const map: Record<number, Strength> = {
    0: { score: 0, label: "Terlalu lemah", color: "#B85C5C" },
    1: { score: 1, label: "Lemah", color: "#B85C5C" },
    2: { score: 2, label: "Cukup", color: "#C9A24B" },
    3: { score: 3, label: "Kuat", color: "#7A9A6E" },
    4: { score: 4, label: "Sangat kuat", color: "#5A8A4E" },
  };

  if (!password) return { score: 0, label: "—", color: "#5F6A64" };
  return map[score] as Strength;
}

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);

  const strength = useMemo(() => evaluateStrength(password), [password]);
  const mismatch = confirm.length > 0 && confirm !== password;
  const canSubmit = password.length >= 8 && !mismatch;

  if (success) {
    return (
      <AuthShell
        pageTitle="Kata Sandi Berhasil Diubah"
        eyebrow="Selesai"
        title="Kata sandi berhasil diubah"
        description="Anda sekarang dapat masuk menggunakan kata sandi baru Anda."
        footer={
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[#2A3530] dark:text-[#E8E6DF] hover:text-[#A07F2E] dark:hover:text-[#C9A24B] transition-colors"
          >
            <ArrowLeft size={14} strokeWidth={1.6} />
            Kembali ke beranda
          </Link>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-xl border border-[#C9A24B]/30 bg-[#C9A24B]/12 dark:bg-[#C9A24B]/15 text-[#5F6A64] dark:text-[#B8BFB9]">
            <CheckCircle2 size={18} strokeWidth={1.6} className="text-[#A07F2E] dark:text-[#C9A24B] shrink-0 mt-0.5" />
            <p className="text-[13px] leading-relaxed">
              Demi keamanan, semua sesi aktif lainnya telah keluar otomatis.
              Silakan masuk kembali dengan kata sandi baru.
            </p>
          </div>
          <Link
            to="/masuk"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#C9A24B] text-[#2A1F08] text-[13px] tracking-wide hover:bg-[#D4B05E] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#C9A24B] focus-visible:ring-offset-[#EFEBE1] dark:focus-visible:ring-offset-[#0B1215]"
          >
            Lanjut ke Masuk
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      pageTitle="Reset Kata Sandi"
      eyebrow="Reset Kata Sandi"
      title="Buat kata sandi baru"
      description="Pilih kata sandi yang kuat dan belum pernah Anda gunakan pada akun lain."
      footer={
        <Link
          to="/masuk"
          className="inline-flex items-center gap-1.5 text-[#2A3530] dark:text-[#E8E6DF] hover:text-[#A07F2E] dark:hover:text-[#C9A24B] transition-colors"
        >
          <ArrowLeft size={14} strokeWidth={1.6} />
          Kembali ke halaman masuk
        </Link>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canSubmit) return;
          setSuccess(true);
        }}
      >
        <div>
          <Field
            label="Kata Sandi Baru"
            type={showPassword ? "text" : "password"}
            placeholder="Minimal 8 karakter"
            icon={<Lock size={16} strokeWidth={1.6} />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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

          <div className="mt-2.5 space-y-1.5">
            <div className="flex items-center gap-1.5">
              {[0, 1, 2, 3].map((i) => {
                const filled = i < strength.score;
                return (
                  <span
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      filled ? "" : "bg-[#2A3530]/15 dark:bg-[#E8E6DF]/12"
                    }`}
                    style={filled ? { backgroundColor: strength.color } : undefined}
                  />
                );
              })}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#5F6A64] dark:text-[#A8AFA9]">
                Kekuatan kata sandi
              </span>
              <span
                className={`text-[11px] tracking-wide ${
                  password ? STRENGTH_TEXT_CLASSES[strength.score] : "text-[#5F6A64] dark:text-[#A8AFA9]"
                }`}
              >
                {strength.label}
              </span>
            </div>
          </div>
        </div>

        <Field
          label="Konfirmasi Kata Sandi"
          type={showConfirm ? "text" : "password"}
          placeholder="Ulangi kata sandi baru"
          icon={<Lock size={16} strokeWidth={1.6} />}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          trailing={
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              className="w-7 h-7 inline-flex items-center justify-center rounded-md text-[#5F6A64] dark:text-[#A8AFA9] hover:text-[#A07F2E] dark:hover:text-[#C9A24B] transition-colors cursor-pointer"
            >
              {showConfirm ? <EyeOff size={16} strokeWidth={1.6} /> : <Eye size={16} strokeWidth={1.6} />}
            </button>
          }
          error={mismatch ? "Konfirmasi kata sandi tidak cocok." : undefined}
          required
        />

        <div className="pt-2">
          <PrimaryButton disabled={!canSubmit} aria-disabled={!canSubmit}>
            Simpan Kata Sandi Baru
          </PrimaryButton>
        </div>
      </form>
    </AuthShell>
  );
}
