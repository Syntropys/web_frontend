import { useEffect, useState, useRef, type ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { useThemeStore } from "@/stores/useThemeStore";
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
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";



import { BrandMark } from "./brand-mark";
import { useAuthSession } from "@/hooks/useAuthSession";
import { authService } from "@/services/auth";
import { useAuthStore } from "@/stores/useAuthStore";
import { AiChatbotOverlay } from "./ai-chatbot-overlay";

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
  toolbar,
  children,
}: {
  title: string;
  eyebrow: string;
  description?: string;
  pageTitle: string;
  children: ReactNode;
  toolbar?: ReactNode;
}) {
  const { theme, toggle } = useThemeStore();
  const { reset } = useAuthStore()
  const { profile, isAdmin, isAuthenticated, isLoading } = useAuthSession()
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [chatbotOn, setChatbotOn] = useState<boolean>(() => {
    try { return localStorage.getItem("agrolytics_chatbot_enabled") !== "false"; }
    catch { return true; }
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/masuk", { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    document.title = `${pageTitle} — Agrolytics`;
  }, [pageTitle]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await authService.signOut();
      reset();
    } catch {
      reset();
    } finally {
      navigate("/masuk", { replace: true });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#EFEBE1] dark:bg-[#0B1215]">
        <div className="flex items-center gap-3 text-[#5F6A64] dark:text-[#B8BFB9]">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm font-medium">Memuat sesi…</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-[#EFEBE1] text-[#2A3530] dark:bg-[#0B1215] dark:text-[#E8E6DF] transition-colors">
      <aside
        className={`hidden lg:flex fixed inset-y-0 left-0 flex-col border-r border-[#2A3530]/15 dark:border-[#E8E6DF]/12 bg-[#E8E3D7]/60 dark:bg-[#0E1619]/60 backdrop-blur-xl transition-all duration-300 z-40 ${
          sidebarOpen ? "w-[280px]" : "w-[76px]"
        }`}
      >
        <SidebarContent
          isAdmin={isAdmin}
          profile={profile}
          isCollapsed={!sidebarOpen}
        />
        
        {/* Floating Toggle Button centered on the right border */}
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label={sidebarOpen ? "Tutup sidebar" : "Buka sidebar"}
          className="absolute top-5 -right-3 w-6 h-6 rounded-full border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 bg-[#E8E3D7] dark:bg-[#0E1619] flex items-center justify-center text-[#5F6A64] dark:text-[#E8E6DF] hover:border-[#C9A24B] hover:text-[#A07F2E] dark:hover:text-[#C9A24B] shadow-sm cursor-pointer transition-all duration-300 z-50"
        >
          {sidebarOpen ? (
            <ChevronLeft size={12} strokeWidth={2.2} />
          ) : (
            <ChevronRight size={12} strokeWidth={2.2} />
          )}
        </button>
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
              isCollapsed={false}
              onNavigate={() => setMobileOpen(false)}
              onLogout={handleLogout}
              loggingOut={loggingOut}
            />
          </aside>
        </div>
      )}

      <div
        className={`min-h-screen flex flex-col transition-all duration-300 ${sidebarOpen ? "lg:pl-[280px]" : "lg:pl-[76px]"}`}
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
            {/* Always show brand/logo on desktop header if sidebar is collapsed, or on mobile */}
            {(!sidebarOpen || mobileOpen) && (
              <Link to="/" className="flex items-center gap-2">
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

            {/* Chatbot toggle */}
            <button
              onClick={() => {
                const next = !chatbotOn;
                setChatbotOn(next);
                window.dispatchEvent(new CustomEvent("agrolytics:toggle-chatbot"));
              }}
              aria-label={chatbotOn ? "Matikan AI Chatbot" : "Aktifkan AI Chatbot"}
              title={chatbotOn ? "Matikan AI Chatbot" : "Aktifkan AI Chatbot"}
              className={`w-10 h-10 sm:w-9 sm:h-9 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                chatbotOn
                  ? "border-[#C9A24B]/50 bg-[#C9A24B]/10 text-[#735A1E] dark:text-[#C9A24B] hover:bg-[#C9A24B]/20"
                  : "border-[#2A3530]/15 dark:border-[#E8E6DF]/15 text-[#5F6A64]/40 dark:text-[#E8E6DF]/30 hover:border-[#C9A24B]/40 hover:text-[#735A1E]"
              }`}
            >
              <Sparkles size={15} strokeWidth={1.6} />
            </button>

            <span className="hidden sm:inline-block h-6 w-px bg-[#2A3530]/12 dark:bg-[#E8E6DF]/12 mx-0.5" />

            <button
              onClick={() => setShowLogoutConfirm(true)}
              disabled={loggingOut}
              aria-label="Keluar"
              className="hidden sm:inline-flex items-center gap-2 h-9 px-3.5 rounded-full bg-[#2A3530] text-[#EFEBE1] dark:bg-[#E8E6DF] dark:text-[#0B1215] text-[12px] hover:bg-[#3A4540] dark:hover:bg-[#D4D2CB] transition-colors cursor-pointer disabled:opacity-50"
            >
              <LogOut size={14} strokeWidth={1.6} />
              Keluar
            </button>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              disabled={loggingOut}
              aria-label="Keluar"
              className="sm:hidden w-10 h-10 rounded-full bg-[#2A3530] text-[#EFEBE1] dark:bg-[#E8E6DF] dark:text-[#0B1215] flex items-center justify-center hover:bg-[#3A4540] dark:hover:bg-[#D4D2CB] transition-colors cursor-pointer disabled:opacity-50"
            >
              <LogOut size={14} strokeWidth={1.6} />
            </button>
          </div>
        </header>

        <main className="flex-1 w-full px-4 sm:px-6 lg:px-12 py-6 sm:py-10 max-w-[1200px] mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#A07F2E] dark:text-[#C9A24B]">
              {eyebrow}
            </span>
            <span className="h-px w-8 bg-[#C9A24B]/40" />
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-serif text-[26px] sm:text-[30px] leading-[1.15] tracking-[-0.01em] text-[#2A3530] dark:text-[#E8E6DF]">
                {title}
              </h1>
              {description && (
                <p className="mt-2 text-[13px] sm:text-[14px] text-[#5F6A64] dark:text-[#B8BFB9]">
                  {description}
                </p>
              )}
            </div>
            {toolbar && <div className="shrink-0 flex items-center gap-3">{toolbar}</div>}
          </div>

          <div className="mt-8 pb-28">{children}</div>
        </main>

        <footer className="border-t border-[#2A3530]/12 dark:border-[#E8E6DF]/12">
          <div className="px-4 sm:px-6 lg:px-12 py-4 max-w-[1200px] mx-auto text-center text-[11px] text-[#5F6A64] dark:text-[#A8AFA9]">
            © {new Date().getFullYear()} Agrolytics
          </div>
        </footer>
        {showLogoutConfirm && (
          <ConfirmLogoutDialog
            onCancel={() => setShowLogoutConfirm(false)}
            onConfirm={handleLogout}
            loggingOut={loggingOut}
          />
        )}
        {/* Chatbot — hanya muncul saat sudah login (dashboard only) */}
        <AiChatbotOverlay />
      </div>
    </div>
  );
}

function ConfirmLogoutDialog({
  onCancel,
  onConfirm,
  loggingOut,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  loggingOut: boolean;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    cancelRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#0A0F11]/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-logout-title"
        aria-describedby="confirm-logout-desc"
        className="relative w-full max-w-sm rounded-2xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/10 bg-[#EFEBE1] dark:bg-[#0E1619] p-6 shadow-2xl shadow-black/30"
      >
        <div className="flex flex-col items-center text-center">
          <span
            aria-hidden
            className="inline-flex w-11 h-11 rounded-full bg-[#A04848]/10 dark:bg-[#A04848]/15 text-[#A04848] dark:text-[#D17878] items-center justify-center ring-1 ring-[#A04848]/20 dark:ring-[#A04848]/25"
          >
            <LogOut size={18} strokeWidth={1.7} />
          </span>
          <h2
            id="confirm-logout-title"
            className="mt-4 font-serif text-[20px] leading-tight tracking-tight text-[#2A3530] dark:text-[#E8E6DF]"
          >
            Konfirmasi Keluar
          </h2>
          <p
            id="confirm-logout-desc"
            className="mt-2 text-[13px] leading-[1.65] text-[#5F6A64] dark:text-[#A8AFA9]"
          >
            Apakah Anda yakin ingin keluar dari sistem?
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onConfirm}
            disabled={loggingOut}
            className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg border border-[#A04848]/35 dark:border-[#A04848]/40 bg-transparent text-[#A04848] dark:text-[#D17878] text-[13px] hover:bg-[#A04848]/8 dark:hover:bg-[#A04848]/12 hover:border-[#A04848]/55 transition-colors cursor-pointer focus:outline-none disabled:opacity-50"
          >
            {loggingOut ? 'Keluar...' : 'Keluar'}
          </button>
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-[#C9A24B] text-[#2A1F08] text-[13px] hover:bg-[#D4B05E] transition-colors cursor-pointer focus:outline-none"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}

function SidebarContent({
  isAdmin,
  profile,
  onNavigate,
  isCollapsed,
}: {
  isAdmin: boolean
  profile: { full_name?: string | null; email?: string | null } | null
  onNavigate?: () => void
  onLogout?: () => void
  loggingOut?: boolean
  isCollapsed: boolean
}) {
  const displayName = profile?.full_name || profile?.email?.split('@')[0] || 'Pengguna'
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  const roleLabel = isAdmin ? 'Admin' : 'Pengguna'
  return (
    <div className={`flex flex-col h-full py-6 w-full ${isCollapsed ? 'px-2' : 'px-5'}`}>
      <Link
        to="/"
        onClick={onNavigate}
        className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'} mb-6 shrink-0`}
      >
        <span className="relative inline-flex w-8 h-8 shrink-0 items-center justify-center rounded-lg bg-[#C9A24B]/15">
          <BrandMark size={18} className="text-[#C9A24B]" />
          <span className="absolute inset-0 rounded-lg ring-1 ring-[#C9A24B]/30" />
        </span>
        {!isCollapsed && (
          <span className="font-serif text-[18px] tracking-tight text-[#2A3530] dark:text-[#E8E6DF] whitespace-nowrap">
            Agrolytics
          </span>
        )}
      </Link>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#2A3530]/12 dark:via-[#E8E6DF]/12 to-transparent mb-4" />

      <nav className="flex-1 overflow-y-auto overflow-x-hidden -mx-2 px-2">
        <ul className="space-y-0.5">
          {navItems.map((item) => (
            <li key={item.to}>
              <SidebarLink {...item} onClick={onNavigate} isCollapsed={isCollapsed} />
            </li>
          ))}
        </ul>

        {isAdmin && (
          <>
            <div className={`mt-5 mb-2 flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-2 px-3'}`}>
              {!isCollapsed ? (
                <>
                  <span className="font-mono text-[9px] tracking-[0.22em] uppercase text-[#A07F2E] dark:text-[#C9A24B]">
                    Administrasi
                  </span>
                  <span className="h-px flex-1 bg-[#2A3530]/12 dark:bg-[#E8E6DF]/12" />
                </>
              ) : (
                <span className="h-px w-6 bg-[#2A3530]/12 dark:bg-[#E8E6DF]/12" />
              )}
            </div>
            <ul className="space-y-0.5">
              {adminNavItems.map((item) => (
                <li key={item.to}>
                  <SidebarLink {...item} onClick={onNavigate} isCollapsed={isCollapsed} />
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>

      <div className={`mt-4 pt-4 border-t border-[#2A3530]/12 dark:border-[#E8E6DF]/12 flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'} shrink-0`}>
        <span
          aria-hidden
          className="inline-flex w-9 h-9 shrink-0 rounded-full bg-[#C9A24B] text-[#2A1F08] items-center justify-center font-serif text-[13px] ring-1 ring-[#C9A24B]/30"
        >
          {initials}
        </span>
        {!isCollapsed && (
          <div className="min-w-0 flex-1">
            <div className="text-[13px] text-[#2A3530] dark:text-[#E8E6DF] truncate">
              {displayName}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-[#5F6A64] dark:text-[#A8AFA9]">
              <span className="truncate">{profile?.email || "—"}</span>
              <span className="shrink-0 px-1.5 py-px rounded-full bg-[#C9A24B]/15 text-[#A07F2E] dark:text-[#C9A24B] uppercase tracking-wider">
                {roleLabel}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SidebarLink({
  to,
  label,
  icon: Icon,
  onClick,
  isCollapsed,
}: {
  to: string;
  label: string;
  icon: typeof CloudSun;
  onClick?: () => void;
  isCollapsed: boolean;
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      title={isCollapsed ? label : undefined}
      className={({ isActive }) =>
        `group relative flex items-center ${isCollapsed ? 'justify-center px-0 py-2.5 mx-1' : 'gap-3 mx-2.5 pl-3 pr-3 py-2'} rounded-lg text-[13px] transition-all duration-200 whitespace-nowrap ${
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
            className={`inline-flex w-7 h-7 shrink-0 items-center justify-center rounded-md transition-colors ${
              isActive
                ? "bg-[#C9A24B]/18 text-[#A07F2E] dark:text-[#C9A24B]"
                : "bg-[#2A3530]/4 dark:bg-[#E8E6DF]/4 text-[#5F6A64] dark:text-[#B8BFB9] group-hover:text-[#A07F2E] dark:hover:text-[#C9A24B]"
            }`}
          >
            <Icon size={14} strokeWidth={1.7} />
          </span>
          {!isCollapsed && <span className="flex-1">{label}</span>}
        </>
      )}
    </NavLink>
  );
}
