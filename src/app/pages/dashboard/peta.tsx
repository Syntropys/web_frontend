import { DashboardLayout } from "../../components/dashboard-layout";
import { KalimantanMap } from "../../components/peta";
import { supabase } from "../../../lib/supabase";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Download, ChevronDown, Play, Pause } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface RegionData {
  bps_code: string;
  name: string;
  province: string;
  cluster_label: number;
  predicted_yield: number | null;
  predicted_prod: number | null;
  centroid_lat?: number | null;
  centroid_lng?: number | null;
}

const CLUSTER_META = [
  { label: "Tinggi",  color: "#C9A24B", bg: "bg-[#C9A24B]/15", text: "text-[#735A1E] dark:text-[#C9A24B]", border: "border-[#C9A24B]/30" },
  { label: "Sedang",  color: "#7E8E78", bg: "bg-[#7E8E78]/15",  text: "text-[#4A6050] dark:text-[#9AB090]", border: "border-[#7E8E78]/30" },
  { label: "Rendah",  color: "#5A6A60", bg: "bg-[#5A6A60]/15",  text: "text-[#3D4F45] dark:text-[#8FA095]", border: "border-[#5A6A60]/30" },
];

const PROVINCES = [
  "Semua",
  "Kalimantan Barat",
  "Kalimantan Selatan",
  "Kalimantan Tengah",
  "Kalimantan Timur",
  "Kalimantan Utara",
];

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatBadge({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color: string }) {
  return (
    <div className="flex flex-col gap-1 p-4 rounded-xl border border-[#2A3530]/12 dark:border-[#E8E6DF]/10 bg-white/40 dark:bg-white/[0.03]">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
        <span className="font-mono text-[10px] tracking-widest uppercase text-[#5F6A64] dark:text-[#A8AFA9]">{label}</span>
      </div>
      <span className="font-serif text-[28px] leading-none text-[#2A3530] dark:text-[#E8E6DF]">{value}</span>
      {sub && <span className="font-mono text-[11px] text-[#8A958E] dark:text-[#7A8580]">{sub}</span>}
    </div>
  );
}

// ─── Selected Region Info Panel ───────────────────────────────────────────────
function RegionInfoPanel({ region, onClose }: { region: RegionData; onClose: () => void }) {
  const meta = CLUSTER_META[region.cluster_label] ?? CLUSTER_META[2];
  return (
    <div className={`rounded-xl border ${meta.border} bg-white/50 dark:bg-white/[0.04] p-4 relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10" style={{ background: meta.color, filter: "blur(30px)" }} />
      <button
        onClick={onClose}
        className="absolute top-3 right-3 p-1 rounded-md text-[#5F6A64] dark:text-[#A8AFA9] hover:text-[#2A3530] dark:hover:text-[#E8E6DF] transition-colors"
        aria-label="Tutup"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div className="mb-3">
        <div className="font-mono text-[10px] tracking-widest uppercase text-[#5F6A64] dark:text-[#A8AFA9] mb-1">Dipilih</div>
        <div className="font-serif text-[20px] leading-tight text-[#2A3530] dark:text-[#E8E6DF]">
          {region.name.replace(/^(Kabupaten|Kota)\s+/i, "")}
        </div>
        <div className="font-mono text-[11px] text-[#5F6A64] dark:text-[#A8AFA9] mt-0.5">
          {region.province}
        </div>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold ${meta.bg} ${meta.text}`}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
          Prioritas {meta.label}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[12px]">
        <div className="rounded-lg bg-[#F7F3EA]/80 dark:bg-[#0F181B]/60 p-3">
          <div className="text-[10px] uppercase tracking-wider text-[#5F6A64] dark:text-[#A8AFA9] mb-1">Yield 2026</div>
          <div className="font-mono text-[#2A3530] dark:text-[#E8E6DF] font-semibold">
            {region.predicted_yield ? `${region.predicted_yield.toFixed(2)} t/ha` : "—"}
          </div>
        </div>
        <div className="rounded-lg bg-[#F7F3EA]/80 dark:bg-[#0F181B]/60 p-3">
          <div className="text-[10px] uppercase tracking-wider text-[#5F6A64] dark:text-[#A8AFA9] mb-1">Prod. 2026</div>
          <div className="font-mono text-[#2A3530] dark:text-[#E8E6DF] font-semibold">
            {region.predicted_prod ? `${Math.round(region.predicted_prod / 1000).toLocaleString("id-ID")} ribu ton` : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PetaPage() {
  const [dbData, setDbData] = useState<Map<string, RegionData>>(new Map());
  const [selectedBpsCode, setSelectedBpsCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterProvince, setFilterProvince] = useState("Semua");
  const [filterCluster, setFilterCluster] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showKmeansPng, setShowKmeansPng] = useState(false);
  const [sortMode, setSortMode] = useState<"cluster" | "yield" | "prod">("cluster");
  
  // Time-lapse state
  const YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
  const [selectedYear, setSelectedYear] = useState(2026);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;
    if (selectedYear === 2026) {
      setIsPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      const idx = YEARS.indexOf(selectedYear);
      if (idx < YEARS.length - 1) {
        setSelectedYear(YEARS[idx + 1]);
      }
    }, 1500); // 1.5s transition
    return () => clearTimeout(timer);
  }, [isPlaying, selectedYear]);

  const togglePlay = () => {
    setIsPlaying((p) => {
      if (!p && selectedYear === 2026) {
        setSelectedYear(2018); // Reset to start if starting from the end
      }
      return !p;
    });
  };

  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Close export dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    }
    if (exportOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [exportOpen]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const regionsRes = await supabase
          .from("regions")
          .select("id, bps_code, name, province, centroid_lat, centroid_lng");
        const regions = (regionsRes.data || []) as Array<{ id: string; bps_code: string; name: string; province: string; centroid_lat: number | null; centroid_lng: number | null }>;

        const map = new Map<string, RegionData>();
        regions.forEach((r) => {
          map.set(r.bps_code, {
            bps_code: r.bps_code,
            name: r.name,
            province: r.province,
            cluster_label: 2,
            predicted_yield: null,
            predicted_prod: null,
            centroid_lat: r.centroid_lat ? Number(r.centroid_lat) : null,
            centroid_lng: r.centroid_lng ? Number(r.centroid_lng) : null,
          });
        });

        if (selectedYear === 2026) {
          const [clustersRes, predictionsRes] = await Promise.all([
            supabase.from("cluster_assignments").select("region_id, cluster_label"),
            supabase.from("predictions")
              .select("region_id, predicted_yield, predicted_prod_ton")
              .eq("target_year", 2026)
              .eq("model_name", "xgboost")
              .eq("model_version", "v1-real"),
          ]);
          const clusters = (clustersRes.data || []) as Array<{ region_id: string; cluster_label: number }>;
          const preds = (predictionsRes.data || []) as Array<{ region_id: string; predicted_yield: number | null; predicted_prod_ton: number | null }>;

          clusters.forEach((c) => {
            const region = regions.find((r) => r.id === c.region_id);
            if (region) {
              const entry = map.get(region.bps_code);
              if (entry) entry.cluster_label = c.cluster_label;
            }
          });
          preds.forEach((p) => {
            const region = regions.find((r) => r.id === p.region_id);
            if (region) {
              const entry = map.get(region.bps_code);
              if (entry) {
                entry.predicted_yield = p.predicted_yield ? Number(p.predicted_yield) : null;
                entry.predicted_prod = p.predicted_prod_ton ? Number(p.predicted_prod_ton) : null;
              }
            }
          });
        } else {
          const historyRes = await supabase
            .from("production_history")
            .select("region_id, yield_ton_ha, production_ton")
            .eq("year", selectedYear);
          const history = (historyRes.data || []) as Array<{ region_id: string; yield_ton_ha: number | null; production_ton: number | null }>;

          history.forEach((h) => {
            const region = regions.find((r) => r.id === h.region_id);
            if (region) {
              const entry = map.get(region.bps_code);
              if (entry) {
                const yieldVal = h.yield_ton_ha ? Number(h.yield_ton_ha) : null;
                entry.predicted_yield = yieldVal;
                entry.predicted_prod = h.production_ton ? Number(h.production_ton) : null;

                if (yieldVal !== null) {
                  if (yieldVal < 3.3) {
                    entry.cluster_label = 0;
                  } else if (yieldVal < 3.8) {
                    entry.cluster_label = 1;
                  } else {
                    entry.cluster_label = 2;
                  }
                } else {
                  entry.cluster_label = 2;
                }
              }
            }
          });
        }
        setDbData(map);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedYear]);

  // ─── regionsList (must be before exportCSV) ─────────────────────────────────
  const regionsList = useMemo(() => {
    const list: RegionData[] = [];
    dbData.forEach((v) => list.push(v));
    return list;
  }, [dbData]);

  // ─── Export CSV ──────────────────────────────────────────────────────────────
  const exportCSV = useCallback(() => {
    const header = ["Wilayah", "Provinsi", "Kluster", "Prioritas", "Yield 2026 (t/ha)", "Produksi 2026 (ton)"];
    const prioritasLabel = ["Tinggi", "Sedang", "Rendah"];
    const rows = regionsList.map((r) => [
      r.name,
      r.province,
      r.cluster_label,
      prioritasLabel[r.cluster_label] ?? "—",
      r.predicted_yield != null ? r.predicted_yield.toFixed(4) : "",
      r.predicted_prod != null ? Math.round(r.predicted_prod) : "",
    ]);
    const csv = [header, ...rows].map((row) => row.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agrolytics_peta_spasial_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportOpen(false);
  }, [regionsList, selectedYear]);

  const filteredList = useMemo(() => {
    let result = regionsList;
    if (filterProvince !== "Semua") {
      result = result.filter((r) => r.province === filterProvince);
    }
    if (filterCluster !== null) {
      result = result.filter((r) => r.cluster_label === filterCluster);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r) =>
        r.name.toLowerCase().includes(q) || r.province.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => {
      if (sortMode === "yield") {
        return (b.predicted_yield ?? 0) - (a.predicted_yield ?? 0);
      }
      if (sortMode === "prod") {
        return (b.predicted_prod ?? 0) - (a.predicted_prod ?? 0);
      }
      if (a.cluster_label !== b.cluster_label) return a.cluster_label - b.cluster_label;
      return a.name.localeCompare(b.name);
    });
  }, [regionsList, filterProvince, filterCluster, searchQuery, sortMode]);

  const counts = useMemo(() => {
    const c = [0, 0, 0];
    dbData.forEach((v) => { if (v.cluster_label >= 0 && v.cluster_label <= 2) c[v.cluster_label]++; });
    return c;
  }, [dbData]);

  const totalProd = useMemo(() => {
    let t = 0;
    dbData.forEach((v) => { if (v.predicted_prod) t += v.predicted_prod; });
    return t;
  }, [dbData]);

  const avgYield = useMemo(() => {
    let sum = 0, cnt = 0;
    dbData.forEach((v) => { if (v.predicted_yield) { sum += v.predicted_yield; cnt++; } });
    return cnt > 0 ? sum / cnt : 0;
  }, [dbData]);

  const selectedRegion = selectedBpsCode ? dbData.get(selectedBpsCode) : null;

  // Build map data compatible with KalimantanMap's expected type
  const mapDbData = useMemo(() => {
    const m = new Map<string, { name: string; province: string; cluster_label: number; predicted_yield: number | null; centroid_lat?: number | null; centroid_lng?: number | null }>();
    dbData.forEach((v, k) => m.set(k, v));
    return m;
  }, [dbData]);

  return (
    <DashboardLayout
      pageTitle="Peta Spasial"
      eyebrow={selectedYear === 2026 ? "Proyeksi" : "Historis"}
      title={selectedYear === 2026 ? "Distribusi Kerentanan Spasial" : `Distribusi Produktivitas Historis (${selectedYear})`}
      description={
        selectedYear === 2026
          ? "Visualisasi sebaran kerentanan K-Means per wilayah Kalimantan — prediksi XGBoost 2026."
          : `Visualisasi sebaran tingkat produktivitas BPS per wilayah Kalimantan — tahun ${selectedYear}.`
      }
      toolbar={
        <div className="flex items-center gap-2">
          {/* Year badge */}
          <div className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-[#C9A24B]/40 bg-[#C9A24B]/8 text-[#735A1E] dark:text-[#C9A24B] text-[12px] font-mono">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {selectedYear === 2026 ? "Proyeksi 2026" : `Historis ${selectedYear}`}
          </div>

          {/* Export dropdown */}
          <div className="relative" ref={exportRef}>
            <button
              id="peta-export-btn"
              onClick={() => setExportOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 text-[12px] text-[#5F6A64] dark:text-[#B8BFB9] hover:border-[#C9A24B] hover:text-[#735A1E] dark:hover:text-[#C9A24B] transition-colors cursor-pointer bg-white/40 dark:bg-white/[0.03]"
            >
              <Download size={13} strokeWidth={1.6} />
              Ekspor
              <ChevronDown size={11} strokeWidth={2} className={`transition-transform duration-200 ${exportOpen ? "rotate-180" : ""}`} />
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-11 z-50 w-44 rounded-xl border border-[#2A3530]/12 dark:border-[#E8E6DF]/10 bg-[#F7F4EE] dark:bg-[#0E1619] shadow-xl overflow-hidden">
                <button
                  onClick={exportCSV}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-[12px] text-[#2A3530] dark:text-[#E8E6DF] hover:bg-[#C9A24B]/8 hover:text-[#735A1E] dark:hover:text-[#C9A24B] transition-colors text-left cursor-pointer"
                >
                  <Download size={13} strokeWidth={1.6} />
                  Unduh CSV
                </button>
              </div>
            )}
          </div>
        </div>
      }
    >
      {/* ── Stats Row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatBadge label="Prioritas Tinggi" value={counts[0]} sub="kabupaten" color="#C9A24B" />
        <StatBadge label="Prioritas Sedang" value={counts[1]} sub="kabupaten" color="#7E8E78" />
        <StatBadge label="Prioritas Rendah" value={counts[2]} sub="kabupaten" color="#5A6A60" />
        <StatBadge
          label={selectedYear === 2026 ? "Total Produksi 2026" : `Total Produksi ${selectedYear}`}
          value={totalProd > 0 ? `${(totalProd / 1_000_000).toFixed(2)} Jt` : "—"}
          sub={`Rata² ${avgYield.toFixed(2)} t/ha`}
          color="#C9A24B"
        />
      </div>

      {/* ── Main Grid: Map + Sidebar ──────────────────────────────────────── */}
      <div className="grid lg:grid-cols-12 gap-4">
        {/* MAP (left / top) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          {/* Legend bar */}
          <div className="flex items-center justify-between flex-wrap gap-2 px-1">
            <div className="flex items-center gap-4">
              {CLUSTER_META.map((m) => (
                <button
                  key={m.label}
                  onClick={() => setFilterCluster(filterCluster === CLUSTER_META.indexOf(m) ? null : CLUSTER_META.indexOf(m))}
                  className={`flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wide transition-opacity ${
                    filterCluster !== null && filterCluster !== CLUSTER_META.indexOf(m) ? "opacity-35" : ""
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: m.color }} />
                  <span className="text-[#5F6A64] dark:text-[#A8AFA9]">{m.label}</span>
                  <span className="text-[#2A3530] dark:text-[#E8E6DF] font-semibold">{counts[CLUSTER_META.indexOf(m)]}</span>
                </button>
              ))}
            </div>
            <span className="font-mono text-[10px] tracking-wider text-[#5F6A64] dark:text-[#A8AFA9]">
              {loading ? "Memuat…" : `${dbData.size} kabupaten · 5 provinsi`}
            </span>
          </div>

          {/* Map */}
          <div className="rounded-2xl overflow-hidden border border-[#2A3530]/12 dark:border-[#E8E6DF]/10 shadow-lg">
            <KalimantanMap
              dbData={mapDbData}
              selectedBpsCode={selectedBpsCode}
              onSelectRegion={setSelectedBpsCode}
              selectedYear={selectedYear}
            />
          </div>

          {/* Timeline Player controls */}
          <div className="rounded-2xl border border-[#2A3530]/12 dark:border-[#E8E6DF]/10 bg-white/40 dark:bg-white/[0.04] p-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-[#C9A24B] hover:bg-[#B08D3E] text-[#2A1F08] hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
              </button>
              <div className="text-[14px] font-mono font-bold text-[#2A3530] dark:text-[#E8E6DF] w-12 text-center">
                {selectedYear}
              </div>
            </div>

            {/* Timeline slider progress track */}
            <div className="flex-grow w-full flex items-center gap-2">
              {YEARS.map((yr) => (
                <div key={yr} className="flex-1 flex flex-col items-center">
                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      setSelectedYear(yr);
                    }}
                    className={`w-full h-2 rounded-full transition-all cursor-pointer ${
                      selectedYear === yr
                        ? "bg-[#C9A24B]"
                        : selectedYear > yr
                        ? "bg-[#C9A24B]/40 hover:bg-[#C9A24B]/60"
                        : "bg-[#2A3530]/10 dark:bg-white/[0.06] hover:bg-[#2A3530]/20 dark:hover:bg-white/10"
                    }`}
                    title={String(yr)}
                  />
                  <span className={`text-[10px] font-mono mt-1 ${selectedYear === yr ? "text-[#C9A24B] font-bold" : "text-[#5F6A64] dark:text-[#A8AFA9]"}`}>
                    {yr === 2026 ? "2026 (Pred)" : yr}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Selected region info */}
          {selectedRegion && (
            <RegionInfoPanel
              region={selectedRegion}
              onClose={() => setSelectedBpsCode(null)}
            />
          )}

          {/* K-Means Segmentation Plot toggle */}
          <div className="rounded-xl border border-[#2A3530]/12 dark:border-[#E8E6DF]/10 overflow-hidden">
            <button
              onClick={() => setShowKmeansPng(!showKmeansPng)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white/40 dark:bg-white/[0.03] text-[12px] font-mono uppercase tracking-wider text-[#5F6A64] dark:text-[#A8AFA9] hover:text-[#735A1E] dark:hover:text-[#C9A24B] transition-colors"
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
                </svg>
                Grafik Segmentasi K-Means (Output AI)
              </span>
              <svg
                className={`w-4 h-4 transition-transform duration-300 ${showKmeansPng ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showKmeansPng && (
              <div className="px-4 pb-4 pt-2 bg-white/30 dark:bg-white/[0.02]">
                <p className="text-[11px] text-[#5F6A64] dark:text-[#A8AFA9] mb-3">
                  Hasil segmentasi kabupaten menggunakan <strong className="text-[#735A1E] dark:text-[#C9A24B]">K-Means (k=3)</strong> dari model <code>kmeans_segmentation_kalimantan.pkl</code>.
                  Feature: produksi, luas panen, produktivitas, curah hujan (dinormalisasi).
                </p>
                <img
                  src="/segmentasi_kabupaten.png"
                  alt="K-Means Segmentasi Kabupaten Kalimantan"
                  className="w-full rounded-lg border border-[#2A3530]/12 dark:border-[#E8E6DF]/10"
                  loading="lazy"
                />
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR (right) */}
        <aside className="lg:col-span-5 flex flex-col gap-3">
          {/* Filter Controls */}
          <div className="rounded-xl border border-[#2A3530]/12 dark:border-[#E8E6DF]/10 bg-white/40 dark:bg-white/[0.03] p-4">
            <div className="font-mono text-[10px] tracking-widest uppercase text-[#5F6A64] dark:text-[#A8AFA9] mb-3">Filter & Cari</div>
            {/* Search */}
            <div className="relative mb-3">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5F6A64] dark:text-[#A8AFA9]">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Cari kabupaten / kota…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-lg border border-[#2A3530]/15 dark:border-[#E8E6DF]/12 bg-[#F7F3EA] dark:bg-[#0B1215] text-[#2A3530] dark:text-[#E8E6DF] placeholder-[#5F6A64]/50 dark:placeholder-[#A8AFA9]/50 text-[12px] focus:outline-none focus:border-[#735A1E] dark:focus:border-[#C9A24B] transition-colors"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#5F6A64] hover:text-[#735A1E] dark:hover:text-[#C9A24B] transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {/* Province Filter */}
            <div className="mb-3">
              <div className="flex flex-wrap gap-1.5">
                {["Semua", "Kalbar", "Kalsel", "Kalteng", "Kaltim", "Kaltara"].map((label) => {
                  const fullName = label === "Semua" ? "Semua"
                    : label === "Kalbar" ? "Kalimantan Barat"
                    : label === "Kalsel" ? "Kalimantan Selatan"
                    : label === "Kalteng" ? "Kalimantan Tengah"
                    : label === "Kaltim" ? "Kalimantan Timur"
                    : "Kalimantan Utara";
                  const active = filterProvince === fullName;
                  return (
                    <button
                      key={label}
                      onClick={() => setFilterProvince(fullName)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all ${
                        active
                          ? "bg-[#735A1E] dark:bg-[#C9A24B] text-[#F7F3EA] dark:text-[#0F181B] border-transparent font-semibold"
                          : "border-[#2A3530]/15 dark:border-[#E8E6DF]/12 text-[#5F6A64] dark:text-[#A8AFA9] hover:border-[#735A1E] dark:hover:border-[#C9A24B]"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Priority Filter + Sort */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-1.5">
                {CLUSTER_META.map((m, i) => (
                  <button
                    key={m.label}
                    onClick={() => setFilterCluster(filterCluster === i ? null : i)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all ${
                      filterCluster === i
                        ? `${m.bg} ${m.text} ${m.border} font-semibold`
                        : "border-[#2A3530]/15 dark:border-[#E8E6DF]/12 text-[#5F6A64] dark:text-[#A8AFA9]"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as any)}
                className="text-[11px] font-mono border border-[#2A3530]/15 dark:border-[#E8E6DF]/12 rounded-lg px-2 py-1 bg-[#F7F3EA] dark:bg-[#0B1215] text-[#5F6A64] dark:text-[#A8AFA9] focus:outline-none focus:border-[#735A1E] dark:focus:border-[#C9A24B]"
              >
                <option value="cluster">↑ Prioritas</option>
                <option value="yield">↓ Yield</option>
                <option value="prod">↓ Produksi</option>
              </select>
            </div>
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between px-1">
            <span className="font-mono text-[11px] text-[#5F6A64] dark:text-[#A8AFA9]">
              {filteredList.length} dari {regionsList.length} wilayah
            </span>
            {(filterProvince !== "Semua" || filterCluster !== null || searchQuery) && (
              <button
                onClick={() => { setFilterProvince("Semua"); setFilterCluster(null); setSearchQuery(""); }}
                className="font-mono text-[11px] text-[#735A1E] dark:text-[#C9A24B] hover:underline transition-colors"
              >
                Reset filter
              </button>
            )}
          </div>

          {/* Region Table */}
          <div
            data-lenis-prevent
            className="rounded-xl border border-[#2A3530]/12 dark:border-[#E8E6DF]/10 bg-white/40 dark:bg-white/[0.03] overflow-hidden max-h-[480px] overflow-y-auto"
            style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(201,162,75,0.3) transparent" }}
          >
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-[#5F6A64] dark:text-[#A8AFA9]">
                <svg className="w-5 h-5 animate-spin text-[#C9A24B]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="font-mono text-[11px]">Memuat data wilayah…</span>
              </div>
            ) : filteredList.length === 0 ? (
              <div className="py-12 text-center font-mono text-[12px] text-[#5F6A64] dark:text-[#A8AFA9]">
                Tidak ada hasil
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#F7F3EA]/95 dark:bg-[#0B1215]/95 backdrop-blur-sm">
                  <tr className="text-[10px] uppercase tracking-widest text-[#5F6A64] dark:text-[#A8AFA9]">
                    <th className="px-4 py-2.5 font-mono font-normal">Wilayah</th>
                    <th className="px-3 py-2.5 font-mono font-normal text-center">Prioritas</th>
                    <th className="px-4 py-2.5 font-mono font-normal text-right">Yield</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((r) => {
                    const meta = CLUSTER_META[r.cluster_label] ?? CLUSTER_META[2];
                    const isActive = selectedBpsCode === r.bps_code;
                    return (
                      <tr
                        key={r.bps_code}
                        onClick={() => setSelectedBpsCode(isActive ? null : r.bps_code)}
                        className={`border-t border-[#2A3530]/10 dark:border-[#E8E6DF]/8 cursor-pointer transition-colors ${
                          isActive
                            ? "bg-[#C9A24B]/8 dark:bg-[#C9A24B]/8"
                            : "hover:bg-[#2A3530]/4 dark:hover:bg-[#E8E6DF]/4"
                        }`}
                      >
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            {isActive && <span className="w-1 h-4 rounded-full bg-[#C9A24B] shrink-0" />}
                            <div>
                              <div className="text-[13px] text-[#2A3530] dark:text-[#E8E6DF] leading-tight">
                                {r.name.replace(/^(Kabupaten|Kota)\s+/i, "")}
                              </div>
                              <div className="font-mono text-[10px] text-[#5F6A64] dark:text-[#A8AFA9]">
                                {r.province.replace("Kalimantan ", "Kal")}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${meta.bg} ${meta.text}`}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-[12px] text-[#2A3530] dark:text-[#E8E6DF]">
                          {r.predicted_yield ? `${r.predicted_yield.toFixed(2)}` : "—"}
                          {r.predicted_yield && <span className="text-[10px] text-[#5F6A64] dark:text-[#A8AFA9] ml-0.5">t/ha</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Bottom info */}
          <div className="rounded-xl border border-[#2A3530]/12 dark:border-[#E8E6DF]/10 bg-white/40 dark:bg-white/[0.03] p-4 text-[12px] text-[#5F6A64] dark:text-[#A8AFA9]">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-[#C9A24B] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              <span>
                Warna peta menunjukkan kluster <strong className="text-[#735A1E] dark:text-[#C9A24B]">K-Means (k=3)</strong> berdasarkan produktivitas dan curah hujan.
                Klik kabupaten di peta atau di tabel untuk melihat detail. Prediksi yield dari model <strong className="text-[#735A1E] dark:text-[#C9A24B]">XGBoost</strong> tahun 2026.
              </span>
            </div>
          </div>
        </aside>
      </div>
    </DashboardLayout>
  );
}
