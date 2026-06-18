import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "../../components/dashboard-layout";
import { supabase } from "@/lib/supabase";
import { AlertTriangle, TrendingDown, TrendingUp, Search, ChevronUp, ChevronDown } from "lucide-react";

type ClusterRow = { region_id: string; cluster_label: number; risk_score?: number | null };
type PredRow = { region_id: string; predicted_prod_ton: number | null; predicted_yield: number | null };
type Region = { id: string; name: string; province: string };

type RiskLevel = "all" | "tinggi" | "sedang" | "rendah";

const RISK_META: Record<number, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  0: { label: "Tinggi", color: "#D17878", bg: "bg-[#A04848]/10", border: "border-[#A04848]/20", icon: AlertTriangle },
  1: { label: "Sedang", color: "#C9A24B", bg: "bg-[#C9A24B]/10", border: "border-[#C9A24B]/20", icon: TrendingDown },
  2: { label: "Rendah", color: "#7A9A6E", bg: "bg-[#7A9A6E]/10", border: "border-[#7A9A6E]/20", icon: TrendingUp },
};

type SortKey = "wilayah" | "risiko" | "produksi" | "yield";

export default function RisikoPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [clusters, setClusters] = useState<ClusterRow[]>([]);
  const [predictions, setPredictions] = useState<PredRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRisk, setFilterRisk] = useState<RiskLevel>("all");
  const [sortKey, setSortKey] = useState<SortKey>("risiko");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const PER_PAGE = 15;

  useEffect(() => {
    Promise.all([
      supabase.from("regions").select("id, name, province"),
      supabase.from("cluster_assignments").select("region_id, cluster_label"),
      supabase
        .from("predictions")
        .select("region_id, predicted_prod_ton, predicted_yield")
        .eq("target_year", 2026)
        .eq("model_name", "xgboost")
        .eq("model_version", "v1-real"),
    ]).then(([regRes, clRes, predRes]) => {
      setRegions((regRes.data || []) as Region[]);
      setClusters((clRes.data || []) as ClusterRow[]);
      setPredictions((predRes.data || []) as PredRow[]);
      setLoading(false);
    });
  }, []);

  const tableData = useMemo(() => {
    return regions.map((r) => {
      const cl = clusters.find((c) => c.region_id === r.id);
      const pred = predictions.find((p) => p.region_id === r.id);
      return {
        id: r.id,
        wilayah: r.name,
        provinsi: r.province,
        clusterLabel: cl?.cluster_label ?? 2,
        risiko: RISK_META[cl?.cluster_label ?? 2]?.label ?? "Rendah",
        produksi: pred?.predicted_prod_ton ?? 0,
        yield: pred?.predicted_yield ?? 0,
      };
    });
  }, [regions, clusters, predictions]);

  const filtered = useMemo(() => {
    return tableData
      .filter((r) => {
        const matchSearch = !search || r.wilayah.toLowerCase().includes(search.toLowerCase()) || r.provinsi.toLowerCase().includes(search.toLowerCase());
        const matchRisk = filterRisk === "all" || r.risiko.toLowerCase() === filterRisk;
        return matchSearch && matchRisk;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortKey === "wilayah") diff = a.wilayah.localeCompare(b.wilayah);
        else if (sortKey === "risiko") diff = a.clusterLabel - b.clusterLabel;
        else if (sortKey === "produksi") diff = a.produksi - b.produksi;
        else if (sortKey === "yield") diff = a.yield - b.yield;
        return sortDir === "asc" ? diff : -diff;
      });
  }, [tableData, search, filterRisk, sortKey, sortDir]);

  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(0);
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (
      sortDir === "asc" ? <ChevronUp size={12} className="inline ml-0.5" /> : <ChevronDown size={12} className="inline ml-0.5" />
    ) : null;

  const counts = {
    tinggi: tableData.filter((r) => r.clusterLabel === 0).length,
    sedang: tableData.filter((r) => r.clusterLabel === 1).length,
    rendah: tableData.filter((r) => r.clusterLabel === 2).length,
  };

  return (
    <DashboardLayout
      pageTitle="Status Risiko"
      eyebrow="Risiko"
      title="Status Risiko Wilayah"
      description="Klasifikasi risiko produksi padi berdasarkan klaster ML. Filter, urutkan, dan ekspor data 56 kabupaten Kalimantan."
      toolbar={
        <div className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-[#C9A24B]/40 bg-[#C9A24B]/8 text-[#735A1E] dark:text-[#C9A24B] text-[12px] font-mono">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Proyeksi 2026
        </div>
      }
    >
      <div className="space-y-5">
        {/* KPI Summary */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: "tinggi", label: "Risiko Tinggi", count: counts.tinggi, color: "#D17878", bg: "bg-[#A04848]/8", icon: AlertTriangle },
            { key: "sedang", label: "Risiko Sedang", count: counts.sedang, color: "#C9A24B", bg: "bg-[#C9A24B]/8", icon: TrendingDown },
            { key: "rendah", label: "Risiko Rendah", count: counts.rendah, color: "#7A9A6E", bg: "bg-[#7A9A6E]/8", icon: TrendingUp },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => { setFilterRisk(filterRisk === item.key as RiskLevel ? "all" : item.key as RiskLevel); setPage(0); }}
                className={`rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                  filterRisk === item.key
                    ? "border-[#C9A24B] ring-1 ring-[#C9A24B]/30"
                    : "border-[#2A3530]/12 dark:border-[#E8E6DF]/10 hover:border-[#C9A24B]/40"
                } ${item.bg} dark:bg-white/[0.03]`}
              >
                <Icon size={16} style={{ color: item.color }} className="mb-2" strokeWidth={1.8} />
                <p className="font-serif text-[22px] text-[#2A3530] dark:text-[#E8E6DF] leading-none">{loading ? "—" : item.count}</p>
                <p className="text-[11px] text-[#5F6A64] dark:text-[#A8AFA9] mt-1">{item.label}</p>
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-[#2A3530]/12 dark:border-[#E8E6DF]/10 bg-white/40 dark:bg-white/[0.04] overflow-hidden">
          {/* Toolbar */}
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
              {(["all", "tinggi", "sedang", "rendah"] as RiskLevel[]).map((r) => (
                <button
                  key={r}
                  onClick={() => { setFilterRisk(r); setPage(0); }}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer capitalize ${
                    filterRisk === r
                      ? "bg-[#C9A24B] text-[#2A1F08]"
                      : "border border-[#2A3530]/12 dark:border-[#E8E6DF]/10 text-[#5F6A64] dark:text-[#A8AFA9] hover:border-[#C9A24B] bg-white/50 dark:bg-white/[0.04]"
                  }`}
                >
                  {r === "all" ? "Semua" : r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-[#5F6A64] dark:text-[#A8AFA9] ml-auto">
              {filtered.length} wilayah
            </span>
          </div>

          {/* Table */}
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
                  const meta = RISK_META[r.clusterLabel] ?? RISK_META[2];
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
                          {r.risiko}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 pt-2 border-t border-[#2A3530]/6 dark:border-[#E8E6DF]/6">
                        <div className="flex-1">
                          <p className="text-[9px] uppercase tracking-wider text-[#5F6A64] dark:text-[#A8AFA9] mb-0.5">Produksi</p>
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
                      <th className="px-4 py-2.5 font-normal cursor-pointer hover:text-[#C9A24B] select-none" onClick={() => handleSort("risiko")}>
                        Risiko <SortIcon k="risiko" />
                      </th>
                      <th className="px-4 py-2.5 font-normal text-right cursor-pointer hover:text-[#C9A24B] select-none" onClick={() => handleSort("produksi")}>
                        Estimasi Produksi (ton) <SortIcon k="produksi" />
                      </th>
                      <th className="px-4 py-2.5 font-normal text-right cursor-pointer hover:text-[#C9A24B] select-none" onClick={() => handleSort("yield")}>
                        Yield (t/ha) <SortIcon k="yield" />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px] text-[#2A3530] dark:text-[#E8E6DF]">
                    {paginated.map((r, idx) => {
                      const meta = RISK_META[r.clusterLabel] ?? RISK_META[2];
                      const Icon = meta.icon;
                      return (
                        <tr key={r.id} className="border-t border-[#2A3530]/6 dark:border-[#E8E6DF]/6 hover:bg-[#C9A24B]/3 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3 text-[11px] text-[#5F6A64] dark:text-[#A8AFA9] font-mono">
                            {page * PER_PAGE + idx + 1}
                          </td>
                          <td className="px-4 py-3 font-medium">{r.wilayah}</td>
                          <td className="px-4 py-3 text-[12px] text-[#5F6A64] dark:text-[#A8AFA9]">{r.provinsi}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${meta.bg} ${meta.border}`}
                              style={{ color: meta.color }}
                            >
                              <Icon size={10} strokeWidth={2} />
                              {r.risiko}
                            </span>
                          </td>
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
                        <td colSpan={6} className="px-4 py-12 text-center text-[#5F6A64] dark:text-[#A8AFA9] text-[13px]">
                          Tidak ada wilayah yang sesuai filter
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#2A3530]/8 dark:border-[#E8E6DF]/8">
              <p className="text-[11px] text-[#5F6A64] dark:text-[#A8AFA9]">
                Halaman {page + 1} dari {totalPages}
              </p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 rounded-lg border border-[#2A3530]/12 dark:border-[#E8E6DF]/10 text-[12px] text-[#5F6A64] dark:text-[#A8AFA9] disabled:opacity-40 hover:border-[#C9A24B] hover:text-[#735A1E] transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  ← Sebelumnya
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 rounded-lg border border-[#2A3530]/12 dark:border-[#E8E6DF]/10 text-[12px] text-[#5F6A64] dark:text-[#A8AFA9] disabled:opacity-40 hover:border-[#C9A24B] hover:text-[#735A1E] transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  Berikutnya →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
