import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "../../components/dashboard-layout";
import { DateRangeAndExportToolbar } from "../../components/date-range-export-toolbar";
import { supabase } from "@/lib/supabase";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type WeatherRow = {
  region_id: string;
  year: number;
  month: number | null;
  rainfall_mm: number | null;
  temp_avg_c: number | null;
  humidity_pct: number | null;
};

type Region = { id: string; name: string; province: string };

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

export default function IklimPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [regionId, setRegionId] = useState<string>("");
  const [weather, setWeather] = useState<WeatherRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [yearFilter, setYearFilter] = useState(2024);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase.from("regions").select("id, name, province").order("name").then(({ data }) => {
      const regions = data as Array<{ id: string; name: string; province: string }> | null;
      if (regions && regions.length > 0) {
        setRegions(regions);
        setRegionId(regions[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!regionId) return;
    setLoading(true);
    supabase
      .from("weather_history")
      .select("region_id, year, month, rainfall_mm, temp_avg_c, humidity_pct")
      .eq("region_id", regionId)
      .order("year")
      .order("month")
      .then(({ data }) => {
        setWeather((data || []) as WeatherRow[]);
        setLoading(false);
      });
  }, [regionId]);

  const years = useMemo(() => [...new Set(weather.map((w) => w.year))].sort(), [weather]);

  // Monthly chart data for selected year
  const monthlyData = useMemo(() => {
    const rows = weather.filter((w) => w.year === yearFilter);
    return MONTH_LABELS.map((label, idx) => {
      const row = rows.find((r) => r.month === idx + 1);
      return {
        bulan: label,
        "Curah Hujan (mm)": row?.rainfall_mm != null ? Number(row.rainfall_mm.toFixed(1)) : null,
        "Suhu °C": row?.temp_avg_c != null ? Number(row.temp_avg_c.toFixed(1)) : null,
        "Kelembapan %": row?.humidity_pct != null ? Number(row.humidity_pct.toFixed(1)) : null,
      };
    });
  }, [weather, yearFilter]);

  // Annual trend
  const annualData = useMemo(() => {
    return years.map((yr) => {
      const rows = weather.filter((w) => w.year === yr);
      const avg = (key: keyof WeatherRow) => {
        const vals = rows.map((r) => Number(r[key] ?? 0)).filter((v) => v > 0);
        return vals.length ? Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)) : null;
      };
      return {
        year: String(yr),
        "Curah Hujan": avg("rainfall_mm"),
        "Suhu": avg("temp_avg_c"),
        "Kelembapan": avg("humidity_pct"),
      };
    });
  }, [weather, years]);

  // KPI aggregates
  const kpiData = useMemo(() => {
    const rows = weather.filter((w) => w.year === yearFilter && w.rainfall_mm != null);
    if (rows.length === 0) return { rain: "—", temp: "—", humid: "—" };
    const avg = (key: keyof WeatherRow) => {
      const vals = rows.map((r) => Number(r[key] ?? 0)).filter((v) => v > 0);
      return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : "—";
    };
    return { rain: `${avg("rainfall_mm")} mm`, temp: `${avg("temp_avg_c")} °C`, humid: `${avg("humidity_pct")} %` };
  }, [weather, yearFilter]);

  const filteredRegions = regions.filter(
    (r) => !search || r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout
      pageTitle="Iklim"
      eyebrow="Iklim"
      title="Data Iklim Wilayah"
      description="Curah hujan, suhu, dan kelembapan dari NASA POWER. Pilih wilayah dan tahun untuk analisis tren iklim."
      toolbar={<DateRangeAndExportToolbar />}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5">
          {/* Sidebar */}
          <div className="space-y-4">
            {/* Region */}
            <div className="rounded-2xl border border-[#2A3530]/12 dark:border-[#E8E6DF]/10 bg-white/40 dark:bg-white/[0.04] p-4 space-y-3">
              <h3 className="text-[11px] font-mono uppercase tracking-widest text-[#5F6A64] dark:text-[#A8AFA9]">Wilayah</h3>
              <input
                type="text"
                placeholder="Cari kabupaten…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-8 px-3 rounded-lg border border-[#2A3530]/12 dark:border-[#E8E6DF]/10 bg-white/60 dark:bg-white/[0.04] text-[12px] text-[#2A3530] dark:text-[#E8E6DF] placeholder-[#5F6A64]/50 focus:outline-none focus:border-[#C9A24B]"
              />
              <div data-lenis-prevent className="space-y-0.5 max-h-44 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
                {filteredRegions.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => { setRegionId(r.id); setSearch(""); }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-[12px] transition-all cursor-pointer ${
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

            {/* Year selector */}
            <div className="rounded-2xl border border-[#2A3530]/12 dark:border-[#E8E6DF]/10 bg-white/40 dark:bg-white/[0.04] p-4 space-y-3">
              <h3 className="text-[11px] font-mono uppercase tracking-widest text-[#5F6A64] dark:text-[#A8AFA9]">Tahun</h3>
              <div className="flex flex-wrap gap-1.5">
                {years.map((y) => (
                  <button
                    key={y}
                    onClick={() => setYearFilter(y)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                      yearFilter === y
                        ? "bg-[#6BA5C8] text-white shadow-sm"
                        : "border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 text-[#5F6A64] dark:text-[#A8AFA9] hover:border-[#6BA5C8] hover:text-[#4A85A8] bg-white/50 dark:bg-white/[0.04]"
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>

            {/* KPI */}
            <div className="rounded-2xl border border-[#2A3530]/12 dark:border-[#E8E6DF]/10 bg-white/40 dark:bg-white/[0.04] p-4">
              <h3 className="text-[11px] font-mono uppercase tracking-widest text-[#5F6A64] dark:text-[#A8AFA9] mb-3">
                Rata-rata {yearFilter}
              </h3>
              <div className="space-y-2.5">
                {[
                  { label: "Curah Hujan", val: kpiData.rain, emoji: "🌧️" },
                  { label: "Suhu", val: kpiData.temp, emoji: "🌡️" },
                  { label: "Kelembapan", val: kpiData.humid, emoji: "💧" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-[12px] text-[#5F6A64] dark:text-[#A8AFA9]">
                      {item.emoji} {item.label}
                    </span>
                    <span className="font-mono text-[13px] text-[#2A3530] dark:text-[#E8E6DF] font-semibold">
                      {item.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="space-y-4">
            {loading ? (
              <div className="h-80 flex items-center justify-center rounded-2xl border border-[#2A3530]/12 dark:border-[#E8E6DF]/10 bg-white/40 dark:bg-white/[0.04]">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="w-2 h-2 rounded-full bg-[#6BA5C8]" style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Monthly rainfall bar */}
                <div className="rounded-2xl border border-[#2A3530]/12 dark:border-[#E8E6DF]/10 bg-white/40 dark:bg-white/[0.04] p-5">
                  <p className="text-[11px] font-mono uppercase tracking-widest text-[#5F6A64] dark:text-[#A8AFA9] mb-4">
                    Curah Hujan Bulanan {yearFilter} (mm)
                  </p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,53,48,0.08)" vertical={false} />
                      <XAxis dataKey="bulan" tick={{ fontSize: 10, fill: "#5F6A64" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#5F6A64" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: "rgba(15,22,25,0.95)", border: "1px solid rgba(232,230,223,0.1)", borderRadius: 10, fontSize: 11, color: "#E8E6DF" }} />
                      <Bar dataKey="Curah Hujan (mm)" fill="#6BA5C8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Annual trend */}
                <div className="rounded-2xl border border-[#2A3530]/12 dark:border-[#E8E6DF]/10 bg-white/40 dark:bg-white/[0.04] p-5">
                  <p className="text-[11px] font-mono uppercase tracking-widest text-[#5F6A64] dark:text-[#A8AFA9] mb-4">
                    Tren Tahunan Iklim
                  </p>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={annualData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="gradRain" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6BA5C8" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6BA5C8" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradTemp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#C9A24B" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#C9A24B" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,53,48,0.08)" vertical={false} />
                      <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#5F6A64" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#5F6A64" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: "rgba(15,22,25,0.95)", border: "1px solid rgba(232,230,223,0.1)", borderRadius: 10, fontSize: 11, color: "#E8E6DF" }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={7} />
                      <Area type="monotone" dataKey="Curah Hujan" stroke="#6BA5C8" fill="url(#gradRain)" strokeWidth={2} dot={false} connectNulls />
                      <Area type="monotone" dataKey="Suhu" stroke="#C9A24B" fill="url(#gradTemp)" strokeWidth={2} dot={false} connectNulls />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
