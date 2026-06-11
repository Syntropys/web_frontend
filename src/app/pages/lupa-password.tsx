import { useState } from "react";
import { Link } from "react-router";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { AuthShell } from "../components/auth-shell";
import { Field, PrimaryButton } from "../components/auth-fields";

export default function LupaPassword() {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");

  return (
    <AuthShell
      pageTitle="Lupa Kata Sandi"
      eyebrow="Pemulihan Akun"
      title={submitted ? "Periksa email Anda" : "Lupa kata sandi?"}
      description={
        submitted
          ? `Kami telah mengirimkan tautan pemulihan ke ${email}. Ikuti instruksi pada email untuk mengatur ulang kata sandi.`
          : "Masukkan email Anda dan kami akan mengirimkan tautan untuk mengatur ulang kata sandi."
      }
      footer={
        <Link
          to="/masuk"
          className="inline-flex items-center gap-1.5 text-[#2A3530] dark:text-[#E8E6DF] hover:text-[#8C6E26] dark:hover:text-[#C9A24B] transition-colors"
        >
          <ArrowLeft size={14} strokeWidth={1.6} />
          Kembali ke halaman masuk
        </Link>
      }
    >
      {submitted ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-xl border border-[#C9A24B]/30 bg-[#C9A24B]/12 dark:bg-[#C9A24B]/15 text-[#5F6A64] dark:text-[#B8BFB9]">
            <CheckCircle2
              size={18}
              strokeWidth={1.6}
              className="text-[#8C6E26] dark:text-[#C9A24B] shrink-0 mt-0.5"
            />
            <p className="text-[13px] leading-relaxed">
              Tautan pemulihan berlaku selama 30 menit. Jika email tidak
              ditemukan, periksa folder spam atau coba kirim ulang.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="w-full inline-flex items-center justify-center px-5 py-2.5 rounded-full border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 text-[#5F6A64] dark:text-[#B8BFB9] text-[13px] tracking-wide hover:border-[#C9A24B] hover:text-[#8C6E26] dark:hover:text-[#C9A24B] transition-colors cursor-pointer"
          >
            Kirim ulang tautan
          </button>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
        >
          <Field
            label="Email"
            type="email"
            placeholder="nama@email.com"
            icon={<Mail size={16} strokeWidth={1.6} />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="pt-2">
            <PrimaryButton>Kirim Tautan Pemulihan</PrimaryButton>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
