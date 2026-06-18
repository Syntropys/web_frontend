import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "../../components/dashboard-layout";
import { DateRangeAndExportToolbar } from "../../components/date-range-export-toolbar";
import { supabase } from "@/lib/supabase";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

// 2026 is prediction-only; historical BPS data covers 2018–2025
const YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
const MAX_REGIONS = 5;
const LINE_COLORS = ["#C9A24B", "#7A9A6E", "#6BA5C8", "#D4735E", "#9B7FD4", "#D4AF37"];

type Metric = "production_ton" | "yield_ton_ha" | "area_harvest_ha";
const METRIC_LABELS: Record<Metric, string> = {
  production_ton: "Produksi (ton)",
  yield_ton_ha: "Yield (ton/ha)",
  area_harvest_ha: "Luas Panen (ha)",
};

type Region = { id: string; name: string; province: string };
type ProductionRow = {
  region_id: string;
  year: number;
  production_ton: number | null;
  yield_ton_ha: number | null;
  area_harvest_ha: number | null;
};

export default function TrenPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [rows, setRows] = useState<ProductionRow[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<number[]>([2023, 2024, 2025]);
  const [metric, setMetric] = useState<Metric>("production_ton");
  const [province, setProvince] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Load regions
  useEffect(() => {
    supabase.from("regions").select("id, name, province").then(({ data }) => {
      if (data) setRegions(data);
    });
  }, []);

  // Load production data when selection changes
  useEffect(() => {
    if (selectedRegions.length === 0 || selectedYears.length === 0) {
      setRows([]);
      return;
    }
    setLoading(true);
    supabase
      .from("production_history")
      .select("region_id, year, production_ton, yield_ton_ha, area_harvest_ha")
      .in("region_id", selectedRegions)
      .in("year", selectedYears)
      .then(({ data }) => {
        setRows((data || []) as ProductionRow[]);
        setLoading(false);
      });
  }, [selectedRegions, selectedYears]);

  const provinces = useMemo(() => [...new Set(regions.map((r) => r.province))].sort(), [regions]);
  const filteredRegions = regions.filter(
    (r) =>
      (!province || r.province === province) &&
      (!search || r.name.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleRegion = (id: string) => {
    setSelectedRegions((prev) => {
      if (prev.includes(id)) return prev.filter((r) => r !== id);
      if (prev.length >= MAX_REGIONS) return prev;
      return [...prev, id];
    });
  };

  const toggleYear = (y: number) => {
    setSelectedYears((prev) => (prev.includes(y) ? prev.filter((v) => v !== y) : [...prev, y]));
  };

  // Build Recharts data
  const chartData = useMemo(() => {
    const sorted = [...selectedYears].sort();
    return sorted.map((year) => {
      const point: Record<string, number | string> = { year: String(year) };
      selectedRegions.forEach((rid) => {
        const row = rows.find((r) => r.region_id === rid && r.year === year);
        const regionName = regions.find((r) => r.id === rid)?.name ?? rid;
        point[regionName] = row ? Number(row[metric] ?? 0) : 0;
      });
      return point;
    });
  }, [rows, selectedRegions, selectedYears, metric, regions]);

  const regionNames = selectedRegions.map((id) => regions.find((r) => r.id === id)?.name ?? id);

  return (
    <DashboardLayout
      pageTitle="Tren Historis"
      eyebrow="Tren"
      title="Analitik Historis BPS"
      description="Bandingkan hingga 5 wilayah lintas tahun (2018–2025). Data historis BPS. Filter provinsi, pilih metrik, dan ekspor data."
      toolbar={<DateRangeAndExportToolbar />}
    >
      <div className="space-y-5">
        {/* Filter Panel */}
        <div className="rounded-2xl border border-[#2A3530]/12 dark:border-[#E8E6DF]/10 bg-white/40 dark:bg-white/[0.04] p-5 space-y-5">
          {/* Row 1: Province + Metric + Search */}
          <div className="flex flex-wrap gap-3">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono uppercase tracking-widest text-[#5F6A64] dark:text-[#A8AFA9]">
                Provinsi
              </label>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="h-9 px-3 rounded-xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 bg-[#F4F0E6] dark:bg-[#1A2326] text-[13px] text-[#2A3530] dark:text-[#E8E6DF] focus:outline-none focus:border-[#C9A24B] cursor-pointer"
              >
                <option value="">Semua Provinsi</option>
                {provinces.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono uppercase tracking-widest text-[#5F6A64] dark:text-[#A8AFA9]">
                Metrik
              </label>
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value as Metric)}
                className="h-9 px-3 rounded-xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 bg-[#F4F0E6] dark:bg-[#1A2326] text-[13px] text-[#2A3530] dark:text-[#E8E6DF] focus:outline-none focus:border-[#C9A24B] cursor-pointer"
              >
                {Object.entries(METRIC_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 flex-1 min-w-[160px]">
              <label className="block text-[10px] font-mono uppercase tracking-widest text-[#5F6A64] dark:text-[#A8AFA9]">
                Cari Wilayah
              </label>
              <input
                type="text"
                placeholder="Ketik nama kabupaten…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full px-3 rounded-xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 bg-white/60 dark:bg-white/[0.04] text-[13px] text-[#2A3530] dark:text-[#E8E6DF] placeholder-[#5F6A64]/50 focus:outline-none focus:border-[#C9A24B]"
              />
            </div>
          </div>

          {/* Row 2: Region chips */}
          <div className="space-y-2">
            <label className="block text-[10px] font-mono uppercase tracking-widest text-[#5F6A64] dark:text-[#A8AFA9]">
              Wilayah ({selectedRegions.length}/{MAX_REGIONS})
            </label>
            <div data-lenis-prevent className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
              {filteredRegions.map((r) => {
                const active = selectedRegions.includes(r.id);
                const colorIdx = selectedRegions.indexOf(r.id);
                return (
                  <button
                    key={r.id}
                    onClick={() => toggleRegion(r.id)}
                    disabled={!active && selectedRegions.length >= MAX_REGIONS}
                    style={active ? { background: LINE_COLORS[colorIdx % LINE_COLORS.length], color: "#fff" } : undefined}
                    className={`px-3 py-1 rounded-full text-[12px] font-medium transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      active
                        ? "shadow-sm"
                        : "border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 text-[#5F6A64] dark:text-[#A8AFA9] hover:border-[#C9A24B] hover:text-[#8C6E26] dark:hover:text-[#C9A24B] bg-white/50 dark:bg-white/[0.04]"
                    }`}
                  >
                    {r.name}
                  </button>
                );
              })}
              {filteredRegions.length === 0 && (
                <p className="text-[12px] text-[#5F6A64] dark:text-[#A8AFA9] py-1">Tidak ada wilayah ditemukan</p>
              )}
            </div>
          </div>

          {/* Row 3: Year chips */}
          <div className="space-y-2">
            <label className="block text-[10px] font-mono uppercase tracking-widest text-[#5F6A64] dark:text-[#A8AFA9]">
              Tahun
            </label>
            <div className="flex flex-wrap gap-1.5">
              {YEARS.map((y) => {
                const active = selectedYears.includes(y);
                return (
                  <button
                    key={y}
                    onClick={() => toggleYear(y)}
                    className={`px-3 py-1 rounded-full text-[12px] font-medium transition-all cursor-pointer ${
                      active
                        ? "bg-[#7A9A6E] text-white shadow-sm"
                        : "border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 text-[#5F6A64] dark:text-[#A8AFA9] hover:border-[#7A9A6E] hover:text-[#4A7A40] dark:hover:text-[#84B878] bg-white/50 dark:bg-white/[0.04]"
                    }`}
                  >
                    {y}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="rounded-2xl border border-[#2A3530]/12 dark:border-[#E8E6DF]/10 bg-white/40 dark:bg-white/[0.04] p-5">
          {selectedRegions.length === 0 || selectedYears.length === 0 ? (
            <div className="h-80 flex flex-col items-center justify-center gap-3 text-[#5F6A64] dark:text-[#A8AFA9]">
              <span className="text-4xl opacity-30">📊</span>
              <p className="text-[14px]">Pilih minimal 1 wilayah dan 1 tahun untuk menampilkan tren</p>
            </div>
          ) : loading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full bg-[#C9A24B]"
                    style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-[11px] font-mono uppercase tracking-widest text-[#5F6A64] dark:text-[#A8AFA9] mb-4">
                {METRIC_LABELS[metric]}
              </p>
              <ResponsiveContainer width="100%" height={340}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(42,53,48,0.08)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 12, fill: "#5F6A64" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#5F6A64" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      metric === "production_ton"
                        ? `${(v / 1000).toFixed(0)}k`
                        : v.toFixed(1)
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15,22,25,0.95)",
                      border: "1px solid rgba(232,230,223,0.1)",
                      borderRadius: 12,
                      fontSize: 12,
                      color: "#E8E6DF",
                    }}
                    formatter={(val: number) =>
                      [val.toLocaleString("id-ID"), ""]
                    }
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                    iconType="circle"
                    iconSize={8}
                  />
                  {regionNames.map((name, idx) => (
                    <Line
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stroke={LINE_COLORS[idx % LINE_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3, fill: LINE_COLORS[idx % LINE_COLORS.length] }}
                      activeDot={{ r: 5 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
