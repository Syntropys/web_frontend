import { Link } from "react-router";
import { BrandMark } from "@/app/components/brand-mark";

const groups = [
  {
    title: "Dokumentasi",
    links: [
      { label: "Arsitektur Model", to: "/404" },
      { label: "Repositori GitHub", to: "/404" },
      { label: "Metodologi Riset", to: "/404" },
    ],
  },
  {
    title: "Informasi",
    links: [
      { label: "Panduan Pengguna", to: "/404" },
      { label: "Pusat Bantuan", to: "/404" },
      { label: "Hubungi Kami", to: "/404" },
    ],
  },
  {
    title: "Legalitas",
    links: [
      { label: "Syarat Layanan", to: "/404" },
      { label: "Kebijakan Privasi", to: "/404" },
      { label: "Keamanan Data", to: "/404" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative px-5 sm:px-8 lg:px-14 pt-16 sm:pt-20 pb-8 border-t border-[#2A3530]/15 dark:border-[#E8E6DF]/12">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10 lg:gap-12 pb-12 sm:pb-16">
        <div className="lg:max-w-sm">
          <Link
            to="/"
            className="group inline-flex items-center gap-2 mb-5"
          >
            <BrandMark size={22} className="text-[#C9A24B]" />
            <span className="font-serif text-[20px] tracking-tight text-[#2A3530] dark:text-[#E8E6DF] transition-colors group-hover:text-[#735A1E] dark:group-hover:text-[#C9A24B]">
              Agrolytics
            </span>
          </Link>
          <p className="text-[13px] leading-[1.7] text-[#5F6A64] dark:text-[#A8AFA9]">
            Platform intelijen pertanian berbasis AI yang memadukan data iklim
            dan historis panen untuk mendukung keputusan strategis pemangku
            kebijakan di Kalimantan.
          </p>
        </div>

        {groups.map((g) => (
          <div key={g.title}>
            <div className="text-[14px] text-[#2A3530] dark:text-[#E8E6DF] mb-5">
              {g.title}
            </div>
            <ul className="space-y-3.5">
              {g.links.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-[13px] text-[#5F6A64] dark:text-[#A8AFA9] hover:text-[#735A1E] dark:hover:text-[#C9A24B] transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="pt-6 border-t border-[#2A3530]/15 dark:border-[#E8E6DF]/12 flex flex-col sm:flex-row items-center sm:items-center justify-center sm:justify-between gap-3 text-center sm:text-left">
        <div className="text-[12px] text-[#5F6A64] dark:text-[#A8AFA9]">
          © {new Date().getFullYear()} Agrolytics. Seluruh hak cipta dilindungi.
        </div>
        <div className="font-mono text-[11px] tracking-wider text-[#5F6A64] dark:text-[#A8AFA9]">
          v1.0.0 · Capstone Project
        </div>
      </div>
    </footer>
  );
}
