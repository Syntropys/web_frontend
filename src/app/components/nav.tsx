import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useTheme } from "@/app/hooks/use-theme";
import { useActiveSection } from "@/app/hooks/use-active-section";
import { useProfile } from "@/app/hooks/use-profile";
import { BrandMark } from "@/app/components/brand-mark";

const links = [
  { label: "Beranda", href: "#beranda", id: "beranda" },
  { label: "Masalah", href: "#masalah", id: "masalah" },
  { label: "Peta", href: "#peta", id: "peta" },
  { label: "Solusi", href: "#solusi", id: "solusi" },
];

export function Nav() {
  const { profile } = useProfile();
  const target = profile.email ? "/dashboard" : "/masuk";
  const label = profile.email ? "Dashboard" : "Masuk";

  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const active = useActiveSection(links.map((l) => l.id));

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Tutup menu"
          onClick={() => setOpen(false)}
          className="md:hidden fixed inset-0 top-16 z-30 bg-black/30 cursor-default"
        />
      )}
      <nav className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-[#EFEBE1]/85 dark:bg-[#0B1215]/70 border-b border-[#2A3530]/12 dark:border-[#E8E6DF]/12">
        <div className="px-5 sm:px-8 lg:px-14 h-16 flex items-center justify-between gap-4">
          <a href="#beranda" className="flex items-center gap-2 shrink-0">
            <BrandMark size={22} className="text-[#C9A24B]" />
            <span className="font-serif text-[18px] sm:text-[20px] tracking-tight text-[#2A3530] dark:text-[#E8E6DF]">
              Agrolytics
            </span>
          </a>

          <ul className="hidden md:flex items-center gap-8">
            {links.map((l) => {
              const isActive = active === l.id;
              return (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className={`relative text-[13px] tracking-wide transition-colors ${
                      isActive
                        ? "text-[#8C6E26] dark:text-[#C9A24B]"
                        : "text-[#5F6A64] dark:text-[#B8BFB9] hover:text-[#8C6E26] dark:hover:text-[#C9A24B]"
                    }`}
                  >
                    {l.label}
                    <span
                      className={`absolute -bottom-1.5 left-0 right-0 mx-auto h-px bg-[#C9A24B] transition-all duration-300 ${
                        isActive ? "w-4 opacity-100" : "w-0 opacity-0"
                      }`}
                    />
                  </a>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="w-10 h-10 md:w-9 md:h-9 rounded-full border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 flex items-center justify-center text-[#5F6A64] dark:text-[#E8E6DF] hover:border-[#C9A24B] hover:text-[#8C6E26] dark:hover:text-[#C9A24B] transition-colors cursor-pointer"
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>

            <Link
              to={target}
              className="hidden sm:inline-flex items-center px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#C9A24B] text-[#2A1F08] text-[12px] sm:text-[13px] tracking-wide hover:bg-[#D4B05E] transition-colors cursor-pointer"
            >
              {label}
            </Link>

            <button
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
              className="md:hidden w-10 h-10 rounded-full border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 flex items-center justify-center text-[#5F6A64] dark:text-[#E8E6DF] cursor-pointer"
            >
              {open ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        <div
          className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
            open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-5 pt-2 pb-6 border-t border-[#2A3530]/15 dark:border-[#E8E6DF]/12 bg-[#EFEBE1] dark:bg-[#0B1215]">
            <ul className="flex flex-col">
              {links.map((l) => {
                const isActive = active === l.id;
                return (
                  <li
                    key={l.label}
                    className="border-b border-[#2A3530]/12 dark:border-[#E8E6DF]/12"
                  >
                    <a
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className={`block py-4 text-[15px] transition-colors ${
                        isActive
                          ? "text-[#8C6E26] dark:text-[#C9A24B]"
                          : "text-[#2A3530] dark:text-[#E8E6DF] hover:text-[#8C6E26] dark:hover:text-[#C9A24B]"
                      }`}
                    >
                      {l.label}
                    </a>
                  </li>
                );
              })}
            </ul>
            <Link
              to={target}
              onClick={() => setOpen(false)}
              className="mt-5 block w-full text-center px-5 py-3 rounded-full bg-[#C9A24B] text-[#2A1F08] text-[14px] tracking-wide cursor-pointer"
            >
              {label}
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}

function SunIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
