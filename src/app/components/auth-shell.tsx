import { useEffect, type ReactNode } from "react";
import { Link } from "react-router";
import { useTheme } from "../hooks/use-theme";
import { BrandMark } from "./brand-mark";

export function AuthShell({
  title,
  pageTitle,
  eyebrow,
  description,
  children,
  footer,
}: {
  title: ReactNode;
  pageTitle: string;
  eyebrow: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  const { theme, toggle } = useTheme();

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  return (
    <div className="min-h-screen w-full bg-[#EFEBE1] text-[#2A3530] dark:bg-[#0B1215] dark:text-[#E8E6DF] flex flex-col transition-colors">
      <header className="px-5 sm:px-8 lg:px-14 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <BrandMark size={22} className="text-[#C9A24B]" />
          <span className="font-serif text-[18px] sm:text-[20px] tracking-tight text-[#2A3530] dark:text-[#E8E6DF]">
            Agrolytics
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="text-[12px] tracking-wide text-[#5F6A64] dark:text-[#B8BFB9] hover:text-[#A07F2E] dark:hover:text-[#C9A24B] transition-colors"
          >
            ← Kembali
          </Link>
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="w-9 h-9 rounded-full border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 flex items-center justify-center text-[#5F6A64] dark:text-[#E8E6DF] hover:border-[#C9A24B] hover:text-[#A07F2E] dark:hover:text-[#C9A24B] transition-colors cursor-pointer"
          >
            {theme === "dark" ? <Sun /> : <Moon />}
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 sm:px-8 py-10 sm:py-14">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-5">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#A07F2E] dark:text-[#C9A24B]">
              {eyebrow}
            </span>
            <span className="h-px w-8 bg-[#C9A24B]/40" />
          </div>
          <h1 className="font-serif text-[26px] sm:text-[30px] leading-[1.15] tracking-[-0.01em] text-[#2A3530] dark:text-[#E8E6DF]">
            {title}
          </h1>
          <p className="mt-3 text-[13px] sm:text-[14px] leading-[1.6] text-[#4A5550] dark:text-[#B8BFB9]">
            {description}
          </p>

          <div className="mt-8 rounded-2xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/12 bg-white/40 dark:bg-white/[0.04] p-6 sm:p-7">
            {children}
          </div>

          <div className="mt-6 text-center text-[13px] text-[#5F6A64] dark:text-[#A8AFA9]">
            {footer}
          </div>
        </div>
      </main>

      <footer className="border-t border-[#2A3530]/12 dark:border-[#E8E6DF]/12">
        <div className="px-5 sm:px-8 lg:px-14 py-4 text-center text-[11px] text-[#5F6A64] dark:text-[#A8AFA9]">
          © {new Date().getFullYear()} Agrolytics
        </div>
      </footer>
    </div>
  );
}

function Sun() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function Moon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}
