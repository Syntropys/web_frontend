import { Link } from "react-router";
import { useState, useEffect, useMemo } from "react";
import {
  CloudSun,
  LineChart,
  ShieldAlert,
  Map,
  TrendingUp,
  ListChecks,
  ArrowUpRight,
} from "lucide-react";
import { DashboardLayout } from "../../components/dashboard-layout";
import { supabase } from "@/lib/supabase";
import { DateRangeAndExportToolbar } from "../../components/date-range-export-toolbar";

type SummaryItem = {
  to: string;
  eyebrow: string;
  title: string;
  icon: typeof CloudSun;
  metric: string;
  unit?: string;
  caption: string;
  tone: "gold" | "green" | "red" | "neutral";
  wide?: boolean;
};

const toneClasses: Record<SummaryItem["tone"], string> = {
  gold: "bg-[#C9A24B]/15 text-[#735A1E] dark:text-[#C9A24B]",
  green: "bg-[#7A9A6E]/15 text-[#5A8A4E] dark:text-[#7A9A6E]",
  red: "bg-[#A04848]/15 text-[#A04848] dark:text-[#D17878]",
  neutral:
    "bg-[#2A3530]/12 dark:bg-[#E8E6DF]/12 text-[#5F6A64] dark:text-[#B8BFB9]",
};

export default function RingkasanPage() {
  const [yearRange, setYearRange] = useState({ start: 2018, end: 2026 });
  const [metrics, setMetrics] = useState({
    totalProd: "—",
    highRiskCount: "—",
    priorityCount: "—",
    priorityCaption: "Memuat…",
    avgRain: "—",
    avgTemp: "—",
    avgHumid: "—",
    trendPct: "—",
    regionCount: "—",
  });

  useEffect(() => {
    const handleRangeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ startYear: number; endYear: number }>;
      setYearRange({ start: customEvent.detail.startYear, end: customEvent.detail.endYear });
    };
    window.addEventListener("agrolytics_year_range_changed", handleRangeChange);
    return () => window.removeEventListener("agrolytics_year_range_changed", handleRangeChange);
  }, []);

  useEffect(() => {
    async function fetchSummaryMetrics() {
      try {
        // Fetch production
        const { data: prodRaw } = await supabase
          .from("production_history")
          .select("production_ton, year")
          .gte("year", yearRange.start)
          .lte("year", yearRange.end);
        const prodData = prodRaw as Array<{ production_ton: number | null; year: number | null }> | null;


        // Fetch weather
        const { data: weatherRaw } = await supabase
          .from("weather_history")
          .select("rainfall_mm, temp_avg_c, humidity_pct")
          .gte("year", yearRange.start)
          .lte("year", yearRange.end);
        const weatherData = weatherRaw as Array<{ rainfall_mm: number | null; temp_avg_c: number | null; humidity_pct: number | null }> | null;

        // Fetch clusters
        const { data: clustersRaw } = await supabase.from("cluster_assignments").select("cluster_label");
        const clusters = clustersRaw as Array<{ cluster_label: number }> | null;

        // Sum production
        const total = prodData?.reduce((acc, p) => acc + Number(p.production_ton || 0), 0) || 0;
        const totalFormatted = total > 0
          ? Math.round(total).toLocaleString("id-ID")
          : "—";

        // Calculate weather averages
        let rainSum = 0, tempSum = 0, humidSum = 0;
        const weatherLen = weatherData?.length || 0;
        if (weatherLen > 0) {
          weatherData?.forEach((w) => {
            rainSum += Number(w.rainfall_mm || 0);
            tempSum += Number(w.temp_avg_c || 0);
            humidSum += Number(w.humidity_pct || 0);
          });
        }
        const avgRain = weatherLen > 0 ? Math.round(rainSum / weatherLen).toString() : "—";
        const avgTemp = weatherLen > 0 ? Math.round(tempSum / weatherLen).toString() : "—";
        const avgHumid = weatherLen > 0 ? Math.round(humidSum / weatherLen).toString() : "—";

        // Count risk and priority
        const highRisk = clusters?.filter((c) => c.cluster_label === 0).length || 0;
        const medRisk = clusters?.filter((c) => c.cluster_label === 1).length || 0;

        const highRiskStr = (highRisk + medRisk) > 0 ? String(highRisk) : "—";
        const priorityCountStr = (highRisk + medRisk) > 0 ? String(highRisk + medRisk) : "—";
        const priorityCaptionStr = (highRisk + medRisk) > 0 ? `${highRisk} Tinggi · ${medRisk} Sedang` : "Memuat…";

        // Calculate YoY trend from production history
        let trendPct = "—";
        if (prodData && prodData.length > 0) {
          // Group by year to get yearly totals
          const yearlyTotals: Record<number, number> = {};
          prodData.forEach((p: any) => {
            const yr = p.year ?? p.target_year;
            if (yr) yearlyTotals[yr] = (yearlyTotals[yr] || 0) + Number(p.production_ton || 0);
          });
          const sortedYears = Object.keys(yearlyTotals).map(Number).sort();
          if (sortedYears.length >= 2) {
            const first = yearlyTotals[sortedYears[0]];
            const last = yearlyTotals[sortedYears[sortedYears.length - 1]];
            if (first > 0) {
              const pct = ((last - first) / first) * 100;
              trendPct = (pct >= 0 ? "+" : "") + pct.toFixed(1);
            }
          }
        }

        // Fetch region count
        const { count: regCount } = await supabase.from("regions").select("id", { count: "exact", head: true });
        const regionCount = regCount != null && regCount > 0 ? String(regCount) : "—";

        setMetrics({
          totalProd: totalFormatted,
          highRiskCount: highRiskStr,
          priorityCount: priorityCountStr,
          priorityCaption: priorityCaptionStr,
          avgRain,
          avgTemp,
          avgHumid,
          trendPct,
          regionCount,
        });
      } catch (err) {
        console.error("Error fetching summary metrics:", err);
      }
    }
    fetchSummaryMetrics();
  }, [yearRange]);

  const items = useMemo<SummaryItem[]>(() => [
    {
      to: "/dashboard/iklim",
      eyebrow: "Iklim",
      title: "Rata-Rata Iklim",
      icon: CloudSun,
      metric: metrics.avgTemp,
      unit: "°C",
      caption: `Suhu · Hujan ${metrics.avgRain} mm · Lembap ${metrics.avgHumid}%`,
      tone: "gold",
    },
    {
      to: "/dashboard/prediksi",
      eyebrow: "Prediksi Produksi",
      title: "Proyeksi Panen",
      icon: LineChart,
      metric: metrics.totalProd,
      unit: "ton",
      caption: `XGBoost (${yearRange.start}–${yearRange.end})`,
      tone: "green",
    },
    {
      to: "/dashboard/risiko",
      eyebrow: "Status Risiko",
      title: "Wilayah Risiko Tinggi",
      icon: ShieldAlert,
      metric: metrics.highRiskCount,
      unit: "kabupaten",
      caption: "Indeks kerentanan spasial",
      tone: "red",
    },
    {
      to: "/dashboard/peta",
      eyebrow: "Peta Spasial",
      title: "Cakupan Pemetaan",
      icon: Map,
      metric: metrics.regionCount,
      unit: "kabupaten",
      caption: "Total wilayah Kalimantan",
      tone: "neutral",
    },
    {
      to: "/dashboard/tren",
      eyebrow: "Tren Historis",
      title: "Tren Produksi",
      icon: TrendingUp,
      metric: metrics.trendPct,
      unit: "%",
      caption: `Historis ${yearRange.start}–${yearRange.end}`,
      tone: "green",
    },
    {
      to: "/dashboard/prioritas",
      eyebrow: "Rekomendasi",
      title: "Aksi Prioritas",
      icon: ListChecks,
      metric: metrics.priorityCount,
      unit: "wilayah",
      caption: metrics.priorityCaption,
      tone: "gold",
    },
  ], [metrics, yearRange]);

  return (
    <DashboardLayout
      pageTitle="Ringkasan"
      eyebrow="Ringkasan"
      title="Ringkasan Keseluruhan"
      description="Cuplikan indikator kunci dari seluruh modul intelijen panen."
      toolbar={<DateRangeAndExportToolbar />}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {items.map((it) => (
          <SummaryCard key={it.to} item={it} />
        ))}
      </div>
    </DashboardLayout>
  );
}

function SummaryCard({ item }: { item: SummaryItem }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      className="group relative flex flex-col rounded-2xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/12 bg-white/40 dark:bg-white/[0.04] p-4 sm:p-5 hover:border-[#C9A24B]/60 dark:hover:border-[#C9A24B]/60 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`inline-flex w-9 h-9 items-center justify-center rounded-lg shrink-0 ${toneClasses[item.tone]}`}
          >
            <Icon size={16} strokeWidth={1.7} />
          </span>
          <div className="min-w-0">
            <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#735A1E] dark:text-[#C9A24B] truncate">
              {item.eyebrow}
            </div>
            <div className="text-[13px] text-[#2A3530] dark:text-[#E8E6DF] truncate">
              {item.title}
            </div>
          </div>
        </div>
        <ArrowUpRight
          size={16}
          strokeWidth={1.6}
          className="shrink-0 text-[#5F6A64] dark:text-[#A8AFA9] group-hover:text-[#735A1E] dark:group-hover:text-[#C9A24B] transition-colors"
        />
      </div>

      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[#2A3530]/12 dark:border-[#E8E6DF]/12">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="font-serif text-[24px] sm:text-[32px] leading-none text-[#2A3530] dark:text-[#E8E6DF]">
            {item.metric}
          </span>
          {item.unit && (
            <span className="text-[11px] sm:text-[12px] text-[#5F6A64] dark:text-[#A8AFA9]">
              {item.unit}
            </span>
          )}
        </div>
        <p className="mt-1.5 sm:mt-2 text-[11px] sm:text-[12px] leading-[1.5] text-[#5F6A64] dark:text-[#B8BFB9]">
          {item.caption}
        </p>
      </div>
    </Link>
  );
}
