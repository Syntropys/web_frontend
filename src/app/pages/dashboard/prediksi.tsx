import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "../../components/dashboard-layout";
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

// Historical BPS data: 2018–2025. Predictions target 2026.
const HIST_YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
const PRED_YEAR = 2026;

const MODELS = [
  { key: "xgboost", label: "XGBoost", color: "#C9A24B", checked: true },
  { key: "random_forest", label: "Random Forest", color: "#7A9A6E", checked: false },
  { key: "linear", label: "Linear Regression", color: "#6BA5C8", checked: false },
];

type Region = { id: string; name: string; province: string };
type PredRow = { model_name: string; target_year: number; predicted_yield: number | null; predicted_prod_ton: number | null };
type HistRow = { year: number; yield_ton_ha: number | null; production_ton: number | null };

export default function PrediksiPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [regionId, setRegionId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [activeModels, setActiveModels] = useState<Set<string>>(new Set(["xgboost"]));
  const [histData, setHistData] = useState<HistRow[]>([]);
  const [predData, setPredData] = useState<PredRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [tableRows, setTableRows] = useState<Array<{ model: string; yield: string; prod: string; color: string }>>([]);

  // Load regions
  useEffect(() => {
    supabase.from("regions").select("id, name, province").order("name").then(({ data }) => {
      const regions = data as Array<{ id: string; name: string; province: string }> | null;
      if (regions && regions.length > 0) {
        setRegions(regions);
        setRegionId(regions[0].id);
      }
    });
  }, []);

  // Load data when region changes
  useEffect(() => {
    if (!regionId) return;
    setLoading(true);
    Promise.all([
      supabase
        .from("production_history")
        .select("year, yield_ton_ha, production_ton")
        .eq("region_id", regionId)
        .in("year", HIST_YEARS)
        .order("year"),
      supabase
        .from("predictions")
        .select("model_name, target_year, predicted_yield, predicted_prod_ton")
        .eq("region_id", regionId)
        .eq("model_version", "v1-real"),
    ]).then(([histRes, predRes]) => {
      setHistData((histRes.data || []) as HistRow[]);
      setPredData((predRes.data || []) as PredRow[]);
      setLoading(false);
    });
  }, [regionId]);

  // Build summary table
  useEffect(() => {
    const rows = MODELS.map((m) => {
      const pred = predData.find((p) => p.model_name === m.key);
      return {
        model: m.label,
        yield: pred?.predicted_yield != null ? pred.predicted_yield.toFixed(2) : "—",
        prod: pred?.predicted_prod_ton != null ? Math.round(pred.predicted_prod_ton).toLocaleString("id-ID") : "—",
        color: m.color,
      };
    });
    setTableRows(rows);
  }, [predData]);

  const filteredRegions = regions.filter(
    (r) => !search || r.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleModel = (key: string) => {
    setActiveModels((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Build chart data
  const chartData = useMemo(() => {
    const allLabels = [
      ...HIST_YEARS.map(String),
      ...[String(PRED_YEAR)],
    ];

    const lastHist = histData[histData.length - 1];

    return allLabels.map((label) => {
      const yr = Number(label);
      const point: Record<string, number | null | string> = { year: label };

      // Historical
      const histRow = histData.find((h) => h.year === yr);
      point["Historis (BPS)"] = histRow?.yield_ton_ha != null ? Number(histRow.yield_ton_ha) : null;

      // Models
      MODELS.filter((m) => activeModels.has(m.key)).forEach((m) => {
        if (yr <= 2025) {
          // Connect last historical point to prediction
          if (yr === 2025 && lastHist?.yield_ton_ha != null) {
            point[m.label] = Number(lastHist.yield_ton_ha);
          } else {
            point[m.label] = null;
          }
        } else {
          const pred = predData.find((p) => p.model_name === m.key && p.target_year === yr);
          point[m.label] = pred?.predicted_yield != null ? Number(pred.predicted_yield) : null;
        }
      });

      return point;
    });
  }, [histData, predData, activeModels]);

  const activeModelMeta = MODELS.filter((m) => activeModels.has(m.key));

  return (
    <DashboardLayout
      pageTitle="Prediksi Produksi"
      eyebrow="Prediksi"
      title="Proyeksi Produksi 2026"
      description="Tren historis 2018–2025 + proyeksi 2026 dari tiga model ML. Pilih wilayah dan aktifkan model untuk perbandingan."
      toolbar={
        <div className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-[#C9A24B]/40 bg-[#C9A24B]/8 text-[#8C6E26] dark:text-[#C9A24B] text-[12px] font-mono">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          BPS 2018–2025 + Proyeksi 2026
        </div>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
          {/* Sidebar Controls */}
          <div className="space-y-4">
            {/* Region selector */}
            <div className="rounded-2xl border border-[#2A3530]/12 dark:border-[#E8E6DF]/10 bg-white/40 dark:bg-white/[0.04] p-4 space-y-3">
              <h3 className="text-[11px] font-mono uppercase tracking-widest text-[#5F6A64] dark:text-[#A8AFA9]">
                Wilayah
              </h3>
              <input
                type="text"
                placeholder="Cari kabupaten…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-8 px-3 rounded-lg border border-[#2A3530]/12 dark:border-[#E8E6DF]/10 bg-white/60 dark:bg-white/[0.04] text-[12px] text-[#2A3530] dark:text-[#E8E6DF] placeholder-[#5F6A64]/50 focus:outline-none focus:border-[#C9A24B]"
              />
              <div data-lenis-prevent className="space-y-0.5 max-h-48 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
                {filteredRegions.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => { setRegionId(r.id); setSearch(""); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-all cursor-pointer ${
                      regionId === r.id
                        ? "bg-[#C9A24B] text-[#2A1F08] font-medium"
                        : "text-[#2A3530] dark:text-[#E8E6DF] hover:bg-[#2A3530]/5 dark:hover:bg-white/5"
                    }`}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Model checkboxes */}
            <div className="rounded-2xl border border-[#2A3530]/12 dark:border-[#E8E6DF]/10 bg-white/40 dark:bg-white/[0.04] p-4 space-y-3">
              <h3 className="text-[11px] font-mono uppercase tracking-widest text-[#5F6A64] dark:text-[#A8AFA9]">
                Model
              </h3>
              {MODELS.map((m) => (
                <label key={m.key} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={activeModels.has(m.key)}
                    onChange={() => toggleModel(m.key)}
                    className="w-4 h-4 rounded border-[#2A3530]/30 dark:border-[#E8E6DF]/30 accent-[#C9A24B] cursor-pointer"
                  />
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: m.color }}
                  />
                  <span className="text-[13px] text-[#2A3530] dark:text-[#E8E6DF] group-hover:text-[#8C6E26] dark:group-hover:text-[#C9A24B] transition-colors">
                    {m.label}
                  </span>
                  {m.key === "xgboost" && (
                    <span className="ml-auto text-[10px] bg-[#C9A24B]/15 text-[#8C6E26] dark:text-[#C9A24B] px-1.5 py-0.5 rounded font-mono">
                      Best
                    </span>
                  )}
                </label>
              ))}
            </div>

            {/* Summary table */}
            <div className="rounded-2xl border border-[#2A3530]/12 dark:border-[#E8E6DF]/10 bg-[#F0EDE5] dark:bg-[#1A2326] p-4">
              <h3 className="text-[11px] font-mono uppercase tracking-widest text-[#5F6A64] dark:text-[#A8AFA9] mb-3">
                Proyeksi 2026
              </h3>
              <div className="space-y-2.5">
                {tableRows.map((r) => (
                  <div key={r.model} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: r.color }} />
                      <span className="text-[11px] text-[#5F6A64] dark:text-[#A8AFA9] truncate">{r.model}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[13px] font-serif text-[#2A3530] dark:text-[#E8E6DF]">
                        {r.yield} t/ha
                      </p>
                      <p className="text-[10px] text-[#5F6A64] dark:text-[#A8AFA9] font-mono">
                        {r.prod} ton
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="rounded-2xl border border-[#2A3530]/12 dark:border-[#E8E6DF]/10 bg-white/40 dark:bg-white/[0.04] p-5">
            <p className="text-[11px] font-mono uppercase tracking-widest text-[#5F6A64] dark:text-[#A8AFA9] mb-4">
              Yield (ton/ha) · {regions.find((r) => r.id === regionId)?.name ?? ""}
            </p>

            {loading ? (
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
            ) : activeModels.size === 0 ? (
              <div className="h-80 flex items-center justify-center text-[#5F6A64] dark:text-[#A8AFA9] text-[13px]">
                Pilih minimal 1 model untuk menampilkan prediksi
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={340}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,53,48,0.08)" vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#5F6A64" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#5F6A64" }} axisLine={false} tickLine={false} tickFormatter={(v) => v.toFixed(1)} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15,22,25,0.95)",
                      border: "1px solid rgba(232,230,223,0.1)",
                      borderRadius: 12,
                      fontSize: 12,
                      color: "#E8E6DF",
                    }}
                    formatter={(val: any) => [val != null ? Number(val).toFixed(2) : "—", ""] as [string, string]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} iconType="circle" iconSize={8} />
                  {/* Historical solid line */}
                  <Line
                    type="monotone"
                    dataKey="Historis (BPS)"
                    stroke="#E8E6DF"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#E8E6DF" }}
                    activeDot={{ r: 5 }}
                    connectNulls={false}
                  />
                  {/* Model dashed lines */}
                  {activeModelMeta.map((m) => (
                    <Line
                      key={m.key}
                      type="monotone"
                      dataKey={m.label}
                      stroke={m.color}
                      strokeWidth={2}
                      strokeDasharray="6 3"
                      dot={{ r: 4, fill: m.color }}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
