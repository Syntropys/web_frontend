import { Link } from "react-router";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useThemeStore } from "@/stores/useThemeStore";

export function Hero() {
  const { profile } = useAuthSession();
  const { theme } = useThemeStore();
  const dashboardTarget = profile?.email ? "/dashboard" : "/masuk";

  const isDark = theme === "dark";

  return (
    <section
      id="beranda"
      className={`relative min-h-screen w-full overflow-hidden transition-colors duration-500 ${isDark ? "bg-[#0B1215]" : "bg-[#D8CEB8]"}`}
    >
      <div className="absolute inset-0">
        <img
          src="/hero-desktop.webp"
          srcSet="/hero-mobile.webp 800w, /hero-desktop.webp 1200w"
          sizes="(max-width: 768px) 100vw, 100vw"
          alt="Sawah padi Kalimantan saat senja — latar visual platform Agrolytics"
          className={`w-full h-full object-cover transition-opacity duration-500 ${isDark ? "opacity-55" : "opacity-40"}`}
          width={1200}
          height={800}
          loading="eager"
          decoding="async"
          {...({ fetchpriority: "high" } as Record<string, string>)}
        />
        {isDark ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-b from-[#0B1215]/70 via-[#0B1215]/40 to-[#0B1215]" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B1215]/80 via-transparent to-transparent" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-b from-[#EFEBE1]/75 via-[#EFEBE1]/50 to-[#EFEBE1]" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#EFEBE1]/85 via-[#EFEBE1]/20 to-transparent" />
          </>
        )}
      </div>

      <div className="relative z-10 px-5 sm:px-8 lg:px-14 pt-16 sm:pt-20 lg:pt-36 pb-14 sm:pb-24 flex flex-col min-h-screen justify-center lg:justify-start">
        <div className="max-w-4xl">
          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <span className="h-px w-8 sm:w-10 bg-[#C9A24B]" />
            <span className="font-mono text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-[#C9A24B]">
              Agri BI · Est. 2026
            </span>
          </div>

          <h1 className={`font-serif text-[34px] sm:text-[52px] lg:text-[76px] leading-[1.05] lg:leading-[1.02] tracking-[-0.02em] transition-colors duration-500 ${isDark ? "text-[#E8E6DF]" : "text-[#1A2620]"}`}>
            Pastikan Hasil Panen Padi{" "}
            <em className="italic text-[#C9A24B]">Kalimantan</em> Anda Maksimal
            dengan Prediksi AI Presisi.
          </h1>

          <p className={`mt-6 sm:mt-8 max-w-2xl text-[14px] sm:text-[16px] leading-[1.7] transition-colors duration-500 ${isDark ? "text-[#B8BFB9]" : "text-[#3A4A44]"}`}>
            Platform AI dan Business Intelligence untuk memprediksi
            produktivitas panen padi dan diagnosis penyakit tanaman secara
            instan berbasis data terintegrasi.
          </p>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4">
            <Link
              to={dashboardTarget}
              className="group inline-flex items-center justify-center gap-3 px-6 sm:px-7 py-3.5 sm:py-4 rounded-full bg-[#C9A24B] text-[#2A1F08] text-[13px] sm:text-[14px] tracking-wide hover:bg-[#D4B05E] transition-colors cursor-pointer"
            >
              Masuk ke Dashboard
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M1 7h12m0 0L8 2m5 5l-5 5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </Link>
            <Link
              to="/daftar"
              className={`inline-flex items-center justify-center gap-3 px-6 sm:px-7 py-3.5 sm:py-4 rounded-full border transition-colors cursor-pointer text-[13px] sm:text-[14px] tracking-wide ${
                isDark
                  ? "border-[#E8E6DF]/20 text-[#E8E6DF] hover:border-[#E8E6DF]/40 hover:bg-white/5"
                  : "border-[#2A3530]/25 text-[#2A3530] hover:border-[#2A3530]/50 hover:bg-[#2A3530]/5"
              }`}
            >
              Daftar Sekarang
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
