import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router";
import {
  LayoutDashboard,
  CloudSun,
  LineChart,
  ShieldAlert,
  Map,
  TrendingUp,
  ListChecks,
  Leaf,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  Home,
  Users,
  DatabaseZap,
} from "lucide-react";
import { useTheme } from "../hooks/use-theme";
import { useRole, clearSession } from "../hooks/use-role";
import { useProfile } from "../hooks/use-profile";
import { BrandMark } from "./brand-mark";
import { Navigate, useLocation } from "react-router";

const navItems = [
  { to: "/dashboard/ringkasan", label: "Ringkasan", icon: LayoutDashboard },
  { to: "/dashboard/iklim", label: "Iklim", icon: CloudSun },
  { to: "/dashboard/prediksi", label: "Prediksi Produksi", icon: LineChart },
  { to: "/dashboard/risiko", label: "Status Risiko", icon: ShieldAlert },
  { to: "/dashboard/peta", label: "Peta Spasial", icon: Map },
  { to: "/dashboard/tren", label: "Tren Historis", icon: TrendingUp },
  { to: "/dashboard/prioritas", label: "Rekomendasi", icon: ListChecks },
  { to: "/dashboard/penyakit", label: "Deteksi Penyakit", icon: Leaf },
];

const adminNavItems = [
  { to: "/dashboard/admin/pengguna", label: "Manajemen Pengguna", icon: Users },
  { to: "/dashboard/admin/ingesti", label: "Ingesti Data", icon: DatabaseZap },
];

export function DashboardLayout({
  title,
  eyebrow,
  description,
  pageTitle,
  children,
}: {
  title: string;
  eyebrow: string;
  description?: string;
  pageTitle: string;
  children: ReactNode;
}) {
  const { theme, toggle } = useTheme();
  const { isAdmin } = useRole();
  const { profile, initials } = useProfile();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleLogout = () => {
    clearSession();
  };

  if (!profile.email) {
    return <Navigate to="/masuk" replace />;
  }

  if (!isAdmin && location.pathname.startsWith("/dashboard/admin")) {
    return <Navigate to="/dashboard/ringkasan" replace />;
  }

  return (
    <div className="min-h-screen w-full bg-[#EFEBE1] text-[#2A3530] dark:bg-[#0B1215] dark:text-[#E8E6DF] transition-colors">
      <aside
        className={`hidden lg:flex fixed inset-y-0 left-0 flex-col border-r border-[#2A3530]/15 dark:border-[#E8E6DF]/12 bg-[#E8E3D7]/60 dark:bg-[#0E1619]/60 backdrop-blur-xl transition-all duration-300 ${
          sidebarOpen ? "w-[260px]" : "w-0 overflow-hidden border-r-0"
        }`}
      >
        <SidebarContent
          isAdmin={isAdmin}
          profile={profile}
          initials={initials}
        />
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-[280px] h-full bg-[#E8E3D7] dark:bg-[#0E1619] border-r border-[#2A3530]/15 dark:border-[#E8E6DF]/12 flex flex-col">
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Tutup menu"
              className="absolute top-4 right-4 w-9 h-9 rounded-full border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 flex items-center justify-center cursor-pointer z-10"
            >
              <X size={16} strokeWidth={1.6} />
            </button>
            <SidebarContent
              isAdmin={isAdmin}
              profile={profile}
              initials={initials}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      <div
        className={`min-h-screen flex flex-col transition-all duration-300 ${sidebarOpen ? "lg:pl-[260px]" : "lg:pl-0"}`}
      >
        <header className="sticky top-0 z-30 px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 border-b border-[#2A3530]/15 dark:border-[#E8E6DF]/12 bg-[#EFEBE1]/85 dark:bg-[#0B1215]/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Buka menu"
              className="lg:hidden w-10 h-10 rounded-full border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 flex items-center justify-center cursor-pointer"
            >
              <Menu size={16} strokeWidth={1.6} />
            </button>
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label={sidebarOpen ? "Tutup sidebar" : "Buka sidebar"}
              className="hidden lg:flex w-9 h-9 rounded-full border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 items-center justify-center text-[#5F6A64] dark:text-[#E8E6DF] hover:border-[#C9A24B] hover:text-[#A07F2E] dark:hover:text-[#C9A24B] transition-colors cursor-pointer"
            >
              {sidebarOpen ? (
                <X size={16} strokeWidth={1.6} />
              ) : (
                <Menu size={16} strokeWidth={1.6} />
              )}
            </button>
            {!sidebarOpen && (
              <Link to="/" className="hidden lg:flex items-center gap-2">
                <BrandMark size={22} className="text-[#C9A24B]" />
                <span className="font-serif text-[18px] tracking-tight">
                  Agrolytics
                </span>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/"
              aria-label="Kembali ke beranda"
              className="hidden sm:inline-flex items-center gap-2 h-9 px-3.5 rounded-full border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 text-[12px] text-[#5F6A64] dark:text-[#B8BFB9] hover:border-[#C9A24B] hover:text-[#A07F2E] dark:hover:text-[#C9A24B] transition-colors cursor-pointer"
            >
              <Home size={14} strokeWidth={1.6} />
              Beranda
            </Link>
            <Link
              to="/"
              aria-label="Kembali ke beranda"
              className="sm:hidden w-10 h-10 rounded-full border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 flex items-center justify-center text-[#5F6A64] dark:text-[#E8E6DF] hover:border-[#C9A24B] hover:text-[#A07F2E] dark:hover:text-[#C9A24B] transition-colors cursor-pointer"
            >
              <Home size={16} strokeWidth={1.6} />
            </Link>

            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="w-10 h-10 sm:w-9 sm:h-9 rounded-full border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 flex items-center justify-center text-[#5F6A64] dark:text-[#E8E6DF] hover:border-[#C9A24B] hover:text-[#A07F2E] dark:hover:text-[#C9A24B] transition-colors cursor-pointer"
            >
              {theme === "dark" ? (
                <Sun size={16} strokeWidth={1.6} />
              ) : (
                <Moon size={16} strokeWidth={1.6} />
              )}
            </button>

            <span className="hidden sm:inline-block h-6 w-px bg-[#2A3530]/12 dark:bg-[#E8E6DF]/12 mx-0.5" />

            <Link
              to="/masuk"
              onClick={handleLogout}
              aria-label="Keluar"
              className="hidden sm:inline-flex items-center gap-2 h-9 px-3.5 rounded-full bg-[#2A3530] text-[#EFEBE1] dark:bg-[#E8E6DF] dark:text-[#0B1215] text-[12px] hover:bg-[#3A4540] dark:hover:bg-[#D4D2CB] transition-colors cursor-pointer"
            >
              <LogOut size={14} strokeWidth={1.6} />
              Keluar
            </Link>
            <Link
              to="/masuk"
              onClick={handleLogout}
              aria-label="Keluar"
              className="sm:hidden w-10 h-10 rounded-full bg-[#2A3530] text-[#EFEBE1] dark:bg-[#E8E6DF] dark:text-[#0B1215] flex items-center justify-center hover:bg-[#3A4540] dark:hover:bg-[#D4D2CB] transition-colors cursor-pointer"
            >
              <LogOut size={14} strokeWidth={1.6} />
            </Link>
          </div>
        </header>

        <main className="flex-1 w-full px-4 sm:px-6 lg:px-12 py-6 sm:py-10 max-w-[1200px] mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#A07F2E] dark:text-[#C9A24B]">
              {eyebrow}
            </span>
            <span className="h-px w-8 bg-[#C9A24B]/40" />
          </div>
          <h1 className="font-serif text-[26px] sm:text-[30px] leading-[1.15] tracking-[-0.01em] text-[#2A3530] dark:text-[#E8E6DF]">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-[13px] sm:text-[14px] text-[#5F6A64] dark:text-[#B8BFB9]">
              {description}
            </p>
          )}

          <div className="mt-8">{children}</div>
        </main>

        <footer className="border-t border-[#2A3530]/12 dark:border-[#E8E6DF]/12">
          <div className="px-4 sm:px-6 lg:px-12 py-4 max-w-[1200px] mx-auto text-center text-[11px] text-[#5F6A64] dark:text-[#A8AFA9]">
            © {new Date().getFullYear()} Agrolytics
          </div>
        </footer>
      </div>
    </div>
  );
}

function SidebarContent({
  isAdmin,
  profile,
  initials,
  onNavigate,
}: {
  isAdmin: boolean;
  profile: { nama: string; email: string };
  initials: string;
  onNavigate?: () => void;
}) {
  const displayName = profile.nama || "Pengguna";
  const roleLabel = isAdmin ? "Admin" : "Publik";
  return (
    <div className="flex flex-col h-full px-5 py-6 w-[260px] sm:w-[280px]">
      <Link
        to="/"
        onClick={onNavigate}
        className="flex items-center gap-2.5 mb-6 shrink-0"
      >
        <span className="relative inline-flex w-8 h-8 items-center justify-center rounded-lg bg-[#C9A24B]/15">
          <BrandMark size={18} className="text-[#C9A24B]" />
          <span className="absolute inset-0 rounded-lg ring-1 ring-[#C9A24B]/30" />
        </span>
        <span className="font-serif text-[18px] tracking-tight text-[#2A3530] dark:text-[#E8E6DF] whitespace-nowrap">
          Agrolytics
        </span>
      </Link>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#2A3530]/12 dark:via-[#E8E6DF]/12 to-transparent mb-4" />

      <nav className="flex-1 overflow-y-auto -mx-2 px-2">
        <ul className="space-y-0.5">
          {navItems.map((item) => (
            <li key={item.to}>
              <SidebarLink {...item} onClick={onNavigate} />
            </li>
          ))}
        </ul>

        {isAdmin && (
          <>
            <div className="mt-5 mb-2 px-3 flex items-center gap-2">
              <span className="font-mono text-[9px] tracking-[0.22em] uppercase text-[#A07F2E] dark:text-[#C9A24B]">
                Administrasi
              </span>
              <span className="h-px flex-1 bg-[#2A3530]/12 dark:bg-[#E8E6DF]/12" />
            </div>
            <ul className="space-y-0.5">
              {adminNavItems.map((item) => (
                <li key={item.to}>
                  <SidebarLink {...item} onClick={onNavigate} />
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>

      <div className="mt-4 pt-4 border-t border-[#2A3530]/12 dark:border-[#E8E6DF]/12 flex items-center gap-2.5 shrink-0">
        <span
          aria-hidden
          className="inline-flex w-9 h-9 shrink-0 rounded-full bg-[#C9A24B] text-[#2A1F08] items-center justify-center font-serif text-[13px] ring-1 ring-[#C9A24B]/30"
        >
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] text-[#2A3530] dark:text-[#E8E6DF] truncate">
            {displayName}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-[#5F6A64] dark:text-[#A8AFA9]">
            <span className="truncate">{profile.email || "—"}</span>
            <span className="shrink-0 px-1.5 py-px rounded-full bg-[#C9A24B]/15 text-[#A07F2E] dark:text-[#C9A24B] uppercase tracking-wider">
              {roleLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarLink({
  to,
  label,
  icon: Icon,
  onClick,
}: {
  to: string;
  label: string;
  icon: typeof CloudSun;
  onClick?: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 mx-2.5 pl-3 pr-3 py-2 rounded-lg text-[13px] transition-all duration-200 whitespace-nowrap ${
          isActive
            ? "bg-[#C9A24B]/12 text-[#A07F2E] dark:text-[#C9A24B]"
            : "text-[#5F6A64] dark:text-[#B8BFB9] hover:text-[#2A3530] dark:hover:text-[#E8E6DF] hover:bg-[#2A3530]/8 dark:hover:bg-[#E8E6DF]/8"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={`absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-[#C9A24B] transition-all ${
              isActive ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0"
            }`}
          />
          <span
            className={`inline-flex w-7 h-7 items-center justify-center rounded-md transition-colors ${
              isActive
                ? "bg-[#C9A24B]/18 text-[#A07F2E] dark:text-[#C9A24B]"
                : "bg-[#2A3530]/4 dark:bg-[#E8E6DF]/4 text-[#5F6A64] dark:text-[#B8BFB9] group-hover:text-[#A07F2E] dark:hover:text-[#C9A24B]"
            }`}
          >
            <Icon size={14} strokeWidth={1.7} />
          </span>
          <span className="flex-1">{label}</span>
        </>
      )}
    </NavLink>
  );
}
