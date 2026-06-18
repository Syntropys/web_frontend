import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "../../components/dashboard-layout";
import { supabase } from "@/lib/supabase";
import { Search, ChevronUp, ChevronDown, TrendingUp, AlertTriangle, Info } from "lucide-react";

type Region = { id: string; name: string; province: string };
type PredRow = { region_id: string; predicted_prod_ton: number | null; predicted_yield: number | null };
type ClusterRow = { region_id: string; cluster_label: number };

type SortKey = "wilayah" | "prioritas" | "produksi" | "yield";
type PriorityFilter = "all" | "tinggi" | "sedang" | "rendah";

const PRIORITY_META = {
  tinggi:  { label: "Tinggi",  order: 0, color: "#D17878", bg: "bg-[#A04848]/8",  border: "border-[#A04848]/20",  action: "Intervensi Segera", icon: AlertTriangle },
  sedang:  { label: "Sedang",  order: 1, color: "#C9A24B", bg: "bg-[#C9A24B]/8",  border: "border-[#C9A24B]/20",  action: "Pantau Rutin", icon: TrendingUp },
  rendah:  { label: "Rendah",  order: 2, color: "#7A9A6E", bg: "bg-[#7A9A6E]/8",  border: "border-[#7A9A6E]/20",  action: "Pertahankan", icon: Info },
};

const clusterToKey = (cl: number) => cl === 0 ? "tinggi" : cl === 1 ? "sedang" : "rendah";

export default function PrioritasPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [predictions, setPredictions] = useState<PredRow[]>([]);
  const [clusters, setClusters] = useState<ClusterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<PriorityFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("prioritas");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const PER_PAGE = 12;

  useEffect(() => {
    Promise.all([
      supabase.from("regions").select("id, name, province"),
      supabase.from("predictions").select("region_id, predicted_prod_ton, predicted_yield").eq("target_year", 2026).eq("model_name", "xgboost").eq("model_version", "v1-real"),
      supabase.from("cluster_assignments").select("region_id, cluster_label"),
    ]).then(([rRes, pRes, cRes]) => {
      setRegions((rRes.data || []) as Region[]);
      setPredictions((pRes.data || []) as PredRow[]);
      setClusters((cRes.data || []) as ClusterRow[]);
      setLoading(false);
    });
  }, []);

  const tableData = useMemo(() => {
    return regions.map((r) => {
      const pred = predictions.find((p) => p.region_id === r.id);
      const cl = clusters.find((c) => c.region_id === r.id);
      const pkey = clusterToKey(cl?.cluster_label ?? 2);
      const meta = PRIORITY_META[pkey];
      return {
        id: r.id,
        wilayah: r.name,
        provinsi: r.province,
        prioritasKey: pkey,
        prioritasOrder: meta.order,
        produksi: pred?.predicted_prod_ton ?? 0,
        yield: pred?.predicted_yield ?? 0,
        action: meta.action,
      };
    });
  }, [regions, predictions, clusters]);

  const filtered = useMemo(() => {
    return tableData
      .filter((r) => {
        const matchSearch = !search || r.wilayah.toLowerCase().includes(search.toLowerCase()) || r.provinsi.toLowerCase().includes(search.toLowerCase());
        const matchPriority = filterPriority === "all" || r.prioritasKey === filterPriority;
        return matchSearch && matchPriority;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortKey === "wilayah") diff = a.wilayah.localeCompare(b.wilayah);
        else if (sortKey === "prioritas") diff = a.prioritasOrder - b.prioritasOrder;
        else if (sortKey === "produksi") diff = a.produksi - b.produksi;
        else if (sortKey === "yield") diff = a.yield - b.yield;
        return sortDir === "asc" ? diff : -diff;
      });
  }, [tableData, search, filterPriority, sortKey, sortDir]);

  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const counts = {
    tinggi: tableData.filter((r) => r.prioritasKey === "tinggi").length,
    sedang: tableData.filter((r) => r.prioritasKey === "sedang").length,
    rendah: tableData.filter((r) => r.prioritasKey === "rendah").length,
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(0);
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (
      sortDir === "asc" ? <ChevronUp size={11} className="inline ml-0.5" /> : <ChevronDown size={11} className="inline ml-0.5" />
    ) : null;

  return (
    <DashboardLayout
      pageTitle="Rekomendasi Prioritas"
      eyebrow="Rekomendasi"
      title="Rekomendasi Wilayah Prioritas"
      description="Daftar wilayah prioritas berdasarkan estimasi produksi XGBoost 2026 dan tingkat risiko klaster. Tindakan intervensi diprioritaskan untuk klaster risiko tinggi."
      toolbar={
        <div className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-[#C9A24B]/40 bg-[#C9A24B]/8 text-[#735A1E] dark:text-[#C9A24B] text-[12px] font-mono">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Proyeksi 2026
        </div>
      }
    >
      <div className="space-y-5">
        {/* Insight cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(["tinggi", "sedang", "rendah"] as PriorityFilter[]).map((key) => {
            if (key === "all") return null;
            const meta = PRIORITY_META[key];
            const Icon = meta.icon;
            return (
              <button
                key={key}
                onClick={() => { setFilterPriority(filterPriority === key ? "all" : key); setPage(0); }}
                className={`rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                  filterPriority === key
                    ? "border-[#C9A24B] ring-1 ring-[#C9A24B]/25"
                    : "border-[#2A3530]/12 dark:border-[#E8E6DF]/10 hover:border-[#C9A24B]/40"
                } ${meta.bg} dark:bg-white/[0.03]`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon size={15} style={{ color: meta.color }} strokeWidth={1.8} />
                  <span className="text-[10px] font-mono text-[#5F6A64] dark:text-[#A8AFA9] uppercase tracking-wider">{meta.action}</span>
                </div>
                <p className="font-serif text-[24px] text-[#2A3530] dark:text-[#E8E6DF] leading-none">{loading ? "—" : counts[key]}</p>
                <p className="text-[11px] text-[#5F6A64] dark:text-[#A8AFA9] mt-1">Wilayah Prioritas {meta.label}</p>
              </button>
            );
          })}
        </div>

        {/* Context info */}
        <div className="rounded-xl border border-[#C9A24B]/20 bg-[#C9A24B]/5 px-4 py-3 flex items-start gap-2.5">
          <Info size={14} className="text-[#735A1E] dark:text-[#C9A24B] mt-0.5 shrink-0" />
          <p className="text-[12px] text-[#5F6A64] dark:text-[#B8BFB9] leading-relaxed">
            Prioritas berdasarkan <strong className="text-[#2A3530] dark:text-[#E8E6DF]">model XGBoost (R²=0.986)</strong> untuk tahun 2026 dan klaster risiko dari K-Means. 
            Wilayah &quot;Intervensi Segera&quot; memiliki prediksi rendah DAN indeks kerentanan tinggi — butuh perhatian kebijakan pertanian prioritas.
          </p>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-[#2A3530]/12 dark:border-[#E8E6DF]/10 bg-white/40 dark:bg-white/[0.04] overflow-hidden">
          <div className="flex flex-wrap items-center gap-2.5 px-4 py-3.5 border-b border-[#2A3530]/8 dark:border-[#E8E6DF]/8">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5F6A64] dark:text-[#A8AFA9]" />
              <input
                type="text"
                placeholder="Cari wilayah atau provinsi…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="w-full h-8 pl-8 pr-3 rounded-lg border border-[#2A3530]/12 dark:border-[#E8E6DF]/10 bg-white/60 dark:bg-white/[0.04] text-[12px] text-[#2A3530] dark:text-[#E8E6DF] placeholder-[#5F6A64]/50 focus:outline-none focus:border-[#C9A24B]"
              />
            </div>
            <div className="flex items-center gap-1.5">
              {(["all", "tinggi", "sedang", "rendah"] as PriorityFilter[]).map((p) => (
                <button
                  key={p}
                  onClick={() => { setFilterPriority(p); setPage(0); }}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                    filterPriority === p
                      ? "bg-[#C9A24B] text-[#2A1F08]"
                      : "border border-[#2A3530]/12 dark:border-[#E8E6DF]/10 text-[#5F6A64] dark:text-[#A8AFA9] hover:border-[#C9A24B] bg-white/50 dark:bg-white/[0.04]"
                  }`}
                >
                  {p === "all" ? "Semua" : p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-[#5F6A64] dark:text-[#A8AFA9] ml-auto">{filtered.length} wilayah</span>
          </div>

          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-2 h-2 rounded-full bg-[#C9A24B]" style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* ── Mobile cards ── */}
              <div className="lg:hidden space-y-2 px-3 py-2">
                {paginated.length === 0 && (
                  <div className="py-12 text-center text-[#5F6A64] dark:text-[#A8AFA9] text-[13px]">
                    Tidak ada wilayah yang sesuai filter
                  </div>
                )}
                {paginated.map((r, idx) => {
                  const meta = PRIORITY_META[r.prioritasKey as keyof typeof PRIORITY_META];
                  const Icon = meta.icon;
                  return (
                    <div
                      key={r.id}
                      className="rounded-xl border border-[#2A3530]/10 dark:border-[#E8E6DF]/8 bg-white/50 dark:bg-white/[0.03] p-3.5"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-[#2A3530] dark:text-[#E8E6DF] leading-tight truncate">
                            <span className="text-[10px] font-mono text-[#5F6A64] dark:text-[#A8AFA9] mr-1.5">
                              {page * PER_PAGE + idx + 1}.
                            </span>
                            {r.wilayah}
                          </p>
                          <p className="text-[11px] text-[#5F6A64] dark:text-[#A8AFA9] mt-0.5">{r.provinsi}</p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border shrink-0 ${meta.bg} ${meta.border}`}
                          style={{ color: meta.color }}
                        >
                          <Icon size={10} strokeWidth={2} />
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5F6A64] dark:text-[#A8AFA9] mb-2 leading-relaxed">{r.action}</p>
                      <div className="flex items-center gap-4 pt-2 border-t border-[#2A3530]/6 dark:border-[#E8E6DF]/6">
                        <div className="flex-1">
                          <p className="text-[9px] uppercase tracking-wider text-[#5F6A64] dark:text-[#A8AFA9] mb-0.5">Est. 2026</p>
                          <p className="font-mono text-[13px] text-[#2A3530] dark:text-[#E8E6DF]">
                            {r.produksi > 0 ? Math.round(r.produksi).toLocaleString("id-ID") : "—"} <span className="text-[10px] text-[#5F6A64]">ton</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] uppercase tracking-wider text-[#5F6A64] dark:text-[#A8AFA9] mb-0.5">Yield</p>
                          <p className="font-mono text-[13px] text-[#2A3530] dark:text-[#E8E6DF]">
                            {r.yield > 0 ? r.yield.toFixed(2) : "—"} <span className="text-[10px] text-[#5F6A64]">t/ha</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Desktop table ── */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-widest text-[#5F6A64] dark:text-[#A8AFA9] bg-[#2A3530]/3 dark:bg-white/[0.02]">
                      <th className="px-4 py-2.5 font-normal">No</th>
                      <th className="px-4 py-2.5 font-normal cursor-pointer hover:text-[#C9A24B] select-none" onClick={() => handleSort("wilayah")}>
                        Wilayah <SortIcon k="wilayah" />
                      </th>
                      <th className="px-4 py-2.5 font-normal">Provinsi</th>
                      <th className="px-4 py-2.5 font-normal cursor-pointer hover:text-[#C9A24B] select-none" onClick={() => handleSort("prioritas")}>
                        Prioritas <SortIcon k="prioritas" />
                      </th>
                      <th className="px-4 py-2.5 font-normal">Aksi Rekomendasi</th>
                      <th className="px-4 py-2.5 font-normal text-right cursor-pointer hover:text-[#C9A24B] select-none" onClick={() => handleSort("produksi")}>
                        Estimasi 2026 (ton) <SortIcon k="produksi" />
                      </th>
                      <th className="px-4 py-2.5 font-normal text-right cursor-pointer hover:text-[#C9A24B] select-none" onClick={() => handleSort("yield")}>
                        Yield (t/ha) <SortIcon k="yield" />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px] text-[#2A3530] dark:text-[#E8E6DF]">
                    {paginated.map((r, idx) => {
                      const meta = PRIORITY_META[r.prioritasKey as keyof typeof PRIORITY_META];
                      const Icon = meta.icon;
                      return (
                        <tr key={r.id} className="border-t border-[#2A3530]/6 dark:border-[#E8E6DF]/6 hover:bg-[#C9A24B]/3 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3 text-[11px] text-[#5F6A64] dark:text-[#A8AFA9] font-mono">{page * PER_PAGE + idx + 1}</td>
                          <td className="px-4 py-3 font-medium">{r.wilayah}</td>
                          <td className="px-4 py-3 text-[12px] text-[#5F6A64] dark:text-[#A8AFA9]">{r.provinsi}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${meta.bg} ${meta.border}`}
                              style={{ color: meta.color }}
                            >
                              <Icon size={10} strokeWidth={2} />
                              {meta.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[12px] text-[#5F6A64] dark:text-[#A8AFA9]">{r.action}</td>
                          <td className="px-4 py-3 text-right font-mono text-[12px]">
                            {r.produksi > 0 ? Math.round(r.produksi).toLocaleString("id-ID") : "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-[12px]">
                            {r.yield > 0 ? r.yield.toFixed(2) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                    {paginated.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-[#5F6A64] dark:text-[#A8AFA9] text-[13px]">
                          Tidak ada wilayah yang sesuai filter
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#2A3530]/8 dark:border-[#E8E6DF]/8">
              <p className="text-[11px] text-[#5F6A64] dark:text-[#A8AFA9]">Halaman {page + 1} dari {totalPages}</p>
              <div className="flex gap-1.5">
                <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1.5 rounded-lg border border-[#2A3530]/12 dark:border-[#E8E6DF]/10 text-[12px] text-[#5F6A64] dark:text-[#A8AFA9] disabled:opacity-40 hover:border-[#C9A24B] hover:text-[#735A1E] transition-all cursor-pointer disabled:cursor-not-allowed">← Sebelumnya</button>
                <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="px-3 py-1.5 rounded-lg border border-[#2A3530]/12 dark:border-[#E8E6DF]/10 text-[12px] text-[#5F6A64] dark:text-[#A8AFA9] disabled:opacity-40 hover:border-[#C9A24B] hover:text-[#735A1E] transition-all cursor-pointer disabled:cursor-not-allowed">Berikutnya →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
