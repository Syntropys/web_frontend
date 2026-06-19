import { useEffect, useRef, useState } from "react";
import { fieldErrors } from '@/schemas';
import {
  Search,
  UserPlus,
  ShieldCheck,
  Pause,
  Trash2,
  X,
  XCircle,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  UserCog,
} from "lucide-react";
import { DashboardLayout } from "../../../components/dashboard-layout";
import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
import { profilesService } from "@/services/profiles";
import { useAuthStore } from "@/stores/useAuthStore";

type Role = "Admin" | "Pengguna";
type Status = "Aktif" | "Ditangguhkan";

type UserRow = {
  id: string;
  nama: string;
  email: string;
  role: Role;
  status: Status;
};

const roleTone: Record<Role, string> = {
  Admin: "bg-[#C9A24B]/15 text-[#735A1E] dark:text-[#C9A24B]",
  Pengguna:
    "bg-[#2A3530]/8 dark:bg-[#E8E6DF]/8 text-[#5F6A64] dark:text-[#B8BFB9]",
};

export default function PenggunaPage() {
  const { profile } = useAuthStore();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"" | Role>("");
  const [showForm, setShowForm] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<UserRow | null>(null);

  const mapDbUser = (p: any): UserRow => ({
    id: p.id,
    nama: p.full_name || p.email.split("@")[0],
    email: p.email,
    role: p.role === "admin" ? "Admin" : "Pengguna",
    status: p.status === "suspended" ? "Ditangguhkan" : "Aktif",
  });

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const list = await profilesService.listUsers();
      setUsers(list.map(mapDbUser));
    } catch (err) {
      console.error(err);
      setError("Gagal memuat daftar pengguna.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filtered = users.filter((u) => {
    const matchQ =
      !query ||
      u.nama.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase());
    const matchR = !roleFilter || u.role === roleFilter;
    return matchQ && matchR;
  });

  const counts = {
    total: users.length,
    aktif: users.filter((u) => u.status === "Aktif").length,
    suspend: users.filter((u) => u.status === "Ditangguhkan").length,
    admin: users.filter((u) => u.role === "Admin").length,
  };

  const toggleStatus = async (id: string) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    if (user.role === "Admin") {
      alert("Akun Admin tidak dapat ditangguhkan.");
      return;
    }
    const newStatus = user.status === "Aktif" ? "suspended" : "active";
    try {
      const { error } = await supabase.rpc("admin_set_user_status", {
        target_user: user.id,
        new_status: newStatus,
      } as any);
      if (error) throw error;
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, status: newStatus === "suspended" ? "Ditangguhkan" : "Aktif" }
            : u
        )
      );
    } catch (err: any) {
      alert(err.message || "Gagal mengubah status pengguna.");
    }
  };

  const toggleRole = async (id: string) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    if (user.id === profile?.id) {
      alert("Anda tidak dapat mengubah role akun sendiri.");
      return;
    }
    const newRole = user.role === "Admin" ? "user" : "admin";
    const confirmMsg = newRole === "admin"
      ? `Jadikan ${user.nama} sebagai Admin?`
      : `Ubah ${user.nama} menjadi Pengguna biasa?`;
    if (!confirm(confirmMsg)) return;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", user.id);
      if (error) throw error;
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, role: newRole === "admin" ? "Admin" : "Pengguna" }
            : u
        )
      );
    } catch (err: any) {
      alert(err.message || "Gagal mengubah role pengguna.");
    }
  };

  const askDelete = (user: UserRow) => setPendingDelete(user);
  const cancelDelete = () => setPendingDelete(null);
  
  const confirmDelete = async () => {
    if (!pendingDelete) return;
    if (pendingDelete.id === profile?.id) {
      alert("Anda tidak dapat menghapus akun Anda sendiri.");
      setPendingDelete(null);
      return;
    }
    if (pendingDelete.role === "Admin") {
      alert("Akun Admin tidak dapat dihapus.");
      setPendingDelete(null);
      return;
    }
    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", pendingDelete.id);
      if (error) throw error;
      setUsers((prev) => prev.filter((u) => u.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (err: any) {
      alert(err.message || "Gagal menghapus pengguna.");
    }
  };

  return (
    <DashboardLayout
      pageTitle="Kelola Akun"
      eyebrow="Administrasi"
      title="Kelola Akun"
      description="Kelola akun, peran, dan akses pengguna sistem (RBAC)."
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Akun" value={counts.total} />
        <StatCard label="Aktif" value={counts.aktif} tone="green" />
        <StatCard label="Ditangguhkan" value={counts.suspend} tone="red" />
        <StatCard label="Admin" value={counts.admin} tone="gold" />
      </div>

      <section className="rounded-2xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/12 bg-white/40 dark:bg-white/[0.02] p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-2 flex-1 min-w-0">
            <div className="relative flex-1 min-w-0">
              <Search
                size={14}
                strokeWidth={1.6}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5F6A64] dark:text-[#A8AFA9]"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari nama atau email…"
                className="w-full pl-9 pr-9 py-2 rounded-lg border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 bg-white/60 dark:bg-white/[0.03] text-[13px] text-[#2A3530] dark:text-[#E8E6DF] placeholder-[#5F6A64] dark:placeholder-[#A8AFA9] outline-none focus:border-[#C9A24B] focus:ring-2 focus:ring-[#C9A24B]/20 transition-colors"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Hapus pencarian"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-5 h-5 rounded text-[#5F6A64] dark:text-[#A8AFA9] hover:text-[#735A1E] dark:hover:text-[#C9A24B] transition-colors cursor-pointer"
                >
                  <XCircle size={14} strokeWidth={1.6} />
                </button>
              )}
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as Role | "")}
              className="px-3 py-2 rounded-lg border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 bg-white/60 dark:bg-white/[0.03] text-[13px] text-[#2A3530] dark:text-[#E8E6DF] outline-none focus:border-[#C9A24B] focus:ring-2 focus:ring-[#C9A24B]/20 transition-colors cursor-pointer"
            >
              <option value="">Semua Role</option>
              <option value="Admin">Admin</option>
              <option value="Pengguna">Pengguna</option>
            </select>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#C9A24B] text-[#2A1F08] text-[13px] hover:bg-[#D4B05E] transition-colors cursor-pointer whitespace-nowrap"
          >
            <UserPlus size={14} strokeWidth={1.8} />
            Tambah Pengguna
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-[#5F6A64] dark:text-[#A8AFA9] gap-2.5">
            <Loader2 size={20} className="animate-spin text-[#C9A24B]" />
            <span className="text-[13px]">Memuat data pengguna…</span>
          </div>
        ) : error ? (
          <div className="text-center py-10 text-[13px] text-[#A04848] dark:text-[#D17878]">
            {error}
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="lg:hidden space-y-2.5">
              {filtered.map((u) => (
                <div
                  key={u.id}
                  className="rounded-xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/8 bg-white/30 dark:bg-white/[0.02] p-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[13px] text-[#2A3530] dark:text-[#E8E6DF] truncate">
                        {u.nama}
                      </div>
                      <div className="text-[12px] text-[#5F6A64] dark:text-[#A8AFA9] truncate">
                        {u.email}
                      </div>
                    </div>
                    <span
                      className={`inline-flex whitespace-nowrap px-2.5 py-0.5 rounded-full text-[12px] ${roleTone[u.role]}`}
                    >
                      {u.role}
                    </span>
                  </div>
                  <div className="mt-2.5 pt-2.5 border-t border-[#2A3530]/12 dark:border-[#E8E6DF]/12 flex items-center justify-end text-[12px] text-[#5F6A64] dark:text-[#A8AFA9]">
                    <span>{u.status}</span>
                  </div>
                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      onClick={() => toggleRole(u.id)}
                      disabled={u.id === profile?.id}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 h-10 rounded-md border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 text-[12px] text-[#5F6A64] dark:text-[#B8BFB9] hover:border-[#C9A24B] hover:text-[#735A1E] dark:hover:text-[#C9A24B] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-[#5F6A64]"
                    >
                      <UserCog size={12} />
                      {u.role === "Admin" ? "→ Pengguna" : "→ Admin"}
                    </button>
                    <button
                      onClick={() => toggleStatus(u.id)}
                      disabled={u.role === "Admin"}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 h-10 rounded-md border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 text-[12px] text-[#5F6A64] dark:text-[#B8BFB9] hover:border-[#C9A24B] hover:text-[#735A1E] dark:hover:text-[#C9A24B] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-[#5F6A64]"
                    >
                      {u.status === "Aktif" ? (
                        <Pause size={12} />
                      ) : (
                        <ShieldCheck size={12} />
                      )}
                      {u.status === "Aktif" ? "Tangguhkan" : "Aktifkan"}
                    </button>
                    <button
                      onClick={() => askDelete(u)}
                      disabled={u.role === "Admin" || u.id === profile?.id}
                      aria-label="Hapus"
                      className="w-10 h-10 inline-flex items-center justify-center rounded-md border border-[#A04848]/30 text-[#A04848] hover:bg-[#A04848]/8 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-[#5F6A64] dark:text-[#A8AFA9]">
                    <th className="px-3 py-2 font-normal">Pengguna</th>
                    <th className="px-3 py-2 font-normal">Role</th>
                    <th className="px-3 py-2 font-normal">Status</th>
                    <th className="px-3 py-2 font-normal text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-[13px] text-[#2A3530] dark:text-[#E8E6DF]">
                  {filtered.map((u) => (
                    <tr
                      key={u.id}
                      className="border-t border-[#2A3530]/15 dark:border-[#E8E6DF]/8"
                    >
                      <td className="px-3 py-3">
                        <div className="min-w-0">
                          <div className="truncate">{u.nama}</div>
                          <div className="text-[12px] text-[#5F6A64] dark:text-[#A8AFA9] truncate">
                            {u.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex whitespace-nowrap px-2.5 py-0.5 rounded-full text-[12px] ${roleTone[u.role]}`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 whitespace-nowrap text-[12px] ${
                            u.status === "Aktif"
                              ? "text-[#5A8A4E] dark:text-[#7A9A6E]"
                              : "text-[#A04848] dark:text-[#D17878]"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${u.status === "Aktif" ? "bg-[#7A9A6E]" : "bg-[#A04848]"}`}
                          />
                          {u.status}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => toggleRole(u.id)}
                            disabled={u.id === profile?.id}
                            aria-label={u.role === "Admin" ? "Jadikan Pengguna" : "Jadikan Admin"}
                            title={u.role === "Admin" ? "Jadikan Pengguna" : "Jadikan Admin"}
                            className="w-8 h-8 inline-flex items-center justify-center rounded-md border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 text-[#5F6A64] dark:text-[#B8BFB9] hover:border-[#C9A24B] hover:text-[#735A1E] dark:hover:text-[#C9A24B] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <UserCog size={13} strokeWidth={1.7} />
                          </button>
                          <button
                            onClick={() => toggleStatus(u.id)}
                            disabled={u.role === "Admin"}
                            aria-label={
                              u.status === "Aktif" ? "Tangguhkan" : "Aktifkan"
                            }
                            className="w-8 h-8 inline-flex items-center justify-center rounded-md border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 text-[#5F6A64] dark:text-[#B8BFB9] hover:border-[#C9A24B] hover:text-[#735A1E] dark:hover:text-[#C9A24B] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {u.status === "Aktif" ? (
                              <Pause size={13} strokeWidth={1.7} />
                            ) : (
                              <ShieldCheck size={13} strokeWidth={1.7} />
                            )}
                          </button>
                          <button
                            onClick={() => askDelete(u)}
                            disabled={u.role === "Admin" || u.id === profile?.id}
                            aria-label="Hapus"
                            className="w-8 h-8 inline-flex items-center justify-center rounded-md border border-[#A04848]/30 text-[#A04848] hover:bg-[#A04848]/8 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Trash2 size={13} strokeWidth={1.7} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-10 text-[12px] text-[#5F6A64] dark:text-[#A8AFA9]">
                Tidak ada pengguna yang cocok dengan filter.
              </div>
            )}
          </>
        )}
      </section>

      {showForm && (
        <AddUserModal
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            loadUsers();
          }}
          existingEmails={users.map((u) => u.email.toLowerCase())}
        />
      )}

      {pendingDelete && (
        <ConfirmDeleteDialog
          user={pendingDelete}
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
        />
      )}
    </DashboardLayout>
  );
}

function StatCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "green" | "red" | "gold";
}) {
  const toneMap = {
    neutral: "text-[#2A3530] dark:text-[#E8E6DF]",
    green: "text-[#5A8A4E] dark:text-[#7A9A6E]",
    red: "text-[#A04848] dark:text-[#D17878]",
    gold: "text-[#735A1E] dark:text-[#C9A24B]",
  };
  return (
    <div className="rounded-xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/12 bg-white/40 dark:bg-white/[0.02] p-3.5">
      <div className="text-[11px] uppercase tracking-wider text-[#5F6A64] dark:text-[#A8AFA9]">
        {label}
      </div>
      <div
        className={`font-serif text-[24px] leading-none mt-1.5 ${toneMap[tone]}`}
      >
        {value}
      </div>
    </div>
  );
}

function AddUserModal({
  onClose,
  onSuccess,
  existingEmails,
}: {
  onClose: () => void;
  onSuccess: () => void;
  existingEmails: string[];
}) {
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email);
  const isNameValid = nama.trim().length >= 3;
  const isPasswordValid = password.length >= 8;

  const isDuplicate = existingEmails.includes(email.trim().toLowerCase());
  
  const errs: Record<string, string> = {};
  if (touched.nama && !isNameValid) errs.nama = "Nama minimal 3 karakter";
  if (touched.email) {
    if (!email) errs.email = "Wajib diisi";
    else if (!isEmailValid) errs.email = "Format email salah";
    else if (isDuplicate) errs.email = "Email sudah terdaftar";
  }
  if (touched.password && !isPasswordValid) errs.password = "Kata sandi minimal 8 karakter";

  const isValid = isNameValid && isEmailValid && !isDuplicate && isPasswordValid;

  const onBlur = (f: string) => setTouched((t) => ({ ...t, [f]: true }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ nama: true, email: true, password: true });
    if (!isValid || submitting) return;
    setSubmitting(true);
    setFormError("");

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
      
      const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });

      const { data: authData, error: authError } = await tempClient.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: nama.trim(),
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Gagal membuat kredensial pengguna.");

      onSuccess();
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || "Gagal menambahkan pengguna.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0A0F11]/60 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-user-title"
        className="relative w-full max-w-md rounded-2xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/12 bg-[#EFEBE1] dark:bg-[#0E1619] p-5 sm:p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            id="add-user-title"
            className="font-serif text-[18px] text-[#2A3530] dark:text-[#E8E6DF]"
          >
            Tambah Pengguna
          </h2>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="w-8 h-8 inline-flex items-center justify-center rounded-full border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 text-[#5F6A64] dark:text-[#B8BFB9] cursor-pointer"
          >
            <X size={14} strokeWidth={1.7} />
          </button>
        </div>
        
        {formError && (
          <div className="mb-4 flex items-center gap-2 px-2.5 py-2 rounded-lg border border-[#B85C5C]/30 bg-[#B85C5C]/12 dark:bg-[#B85C5C]/15 text-[12px] text-[#A04848] dark:text-[#D17878]">
            <AlertTriangle size={13} strokeWidth={1.7} className="shrink-0" />
            <span className="min-w-0">{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <FormField
            label="Nama Lengkap"
            value={nama}
            onChange={setNama}
            onBlur={() => onBlur("nama")}
            placeholder="Mis. Budi Santoso"
            maxLength={80}
            error={errs.nama}
            required
            autoFocus
          />
          <FormField
            label="Email"
            value={email}
            onChange={setEmail}
            onBlur={() => onBlur("email")}
            type="email"
            placeholder="nama@email.com"
            maxLength={120}
            error={errs.email}
            required
          />
          
          <div className="relative">
            <FormField
              label="Kata Sandi"
              value={password}
              onChange={setPassword}
              onBlur={() => onBlur("password")}
              type={showPassword ? "text" : "password"}
              placeholder="Minimal 8 karakter"
              maxLength={128}
              error={errs.password}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[38px] w-7 h-7 inline-flex items-center justify-center rounded-md text-[#5F6A64] dark:text-[#A8AFA9] hover:text-[#735A1E] dark:hover:text-[#C9A24B] transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-[13px] text-[#5F6A64] dark:text-[#B8BFB9] hover:text-[#735A1E] dark:hover:text-[#C9A24B] transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!isValid || submitting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C9A24B] text-[#2A1F08] text-[13px] hover:bg-[#D4B05E] transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Menyimpan…
                </>
              ) : (
                "Simpan"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  onBlur,
  type = "text",
  placeholder,
  required,
  error,
  maxLength,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  maxLength?: number;
  autoFocus?: boolean;
}) {
  const hasError = Boolean(error);
  return (
    <label className="block">
      <span className="block text-[12px] text-[#4A5550] dark:text-[#B8BFB9] mb-1.5">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        autoFocus={autoFocus}
        aria-invalid={hasError || undefined}
        className={`w-full px-3 py-2.5 rounded-lg border bg-white/60 dark:bg-white/[0.03] text-[14px] text-[#2A3530] dark:text-[#E8E6DF] placeholder-[#5F6A64] dark:placeholder-[#A8AFA9] outline-none focus:ring-2 transition-colors ${
          hasError
            ? "border-[#A04848]/55 focus:border-[#A04848] focus:ring-[#A04848]/20"
            : "border-[#2A3530]/15 dark:border-[#E8E6DF]/15 focus:border-[#C9A24B] focus:ring-[#C9A24B]/20"
        }`}
      />
      {hasError && (
        <span className="block mt-1.5 text-[12px] text-[#A04848] dark:text-[#D17878]">
          {error}
        </span>
      )}
    </label>
  );
}

function ConfirmDeleteDialog({
  user,
  onCancel,
  onConfirm,
}: {
  user: UserRow;
  onCancel: () => void;
  onConfirm: () => void;
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
        aria-labelledby="confirm-delete-title"
        aria-describedby="confirm-delete-desc"
        className="relative w-full max-w-sm rounded-2xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/10 bg-[#EFEBE1] dark:bg-[#0E1619] p-6 shadow-2xl shadow-black/30"
      >
        <div className="flex flex-col items-center text-center">
          <span
            aria-hidden
            className="inline-flex w-11 h-11 rounded-full bg-[#A04848]/10 dark:bg-[#A04848]/15 text-[#A04848] dark:text-[#D17878] items-center justify-center ring-1 ring-[#A04848]/20 dark:ring-[#A04848]/25"
          >
            <AlertTriangle size={18} strokeWidth={1.7} />
          </span>
          <h2
            id="confirm-delete-title"
            className="mt-4 font-serif text-[20px] leading-tight tracking-tight text-[#2A3530] dark:text-[#E8E6DF]"
          >
            Hapus pengguna?
          </h2>
          <p
            id="confirm-delete-desc"
            className="mt-2 text-[13px] leading-[1.65] text-[#5F6A64] dark:text-[#A8AFA9]"
          >
            Akun{" "}
            <span className="text-[#2A3530] dark:text-[#E8E6DF]">
              {user.nama}
            </span>{" "}
            akan dihapus permanen.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg border border-[#A04848]/35 dark:border-[#A04848]/40 bg-transparent text-[#A04848] dark:text-[#D17878] text-[13px] hover:bg-[#A04848]/8 dark:hover:bg-[#A04848]/12 hover:border-[#A04848]/55 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#A04848]/40 focus-visible:ring-offset-[#EFEBE1] dark:focus-visible:ring-offset-[#0E1619]"
          >
            <Trash2 size={13} strokeWidth={1.8} />
            Hapus
          </button>
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-[#C9A24B] text-[#2A1F08] text-[13px] hover:bg-[#D4B05E] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#C9A24B] focus-visible:ring-offset-[#EFEBE1] dark:focus-visible:ring-offset-[#0E1619]"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
