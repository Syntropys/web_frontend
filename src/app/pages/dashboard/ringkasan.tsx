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
  gold: "bg-[#C9A24B]/15 text-[#8C6E26] dark:text-[#C9A24B]",
  green: "bg-[#7A9A6E]/15 text-[#5A8A4E] dark:text-[#7A9A6E]",
  red: "bg-[#A04848]/15 text-[#A04848] dark:text-[#D17878]",
  neutral:
    "bg-[#2A3530]/12 dark:bg-[#E8E6DF]/12 text-[#5F6A64] dark:text-[#B8BFB9]",
};

export default function RingkasanPage() {
  const [metrics, setMetrics] = useState({
    totalProd: "2.306.722",
    highRiskCount: "19",
    priorityCount: "38",
    priorityCaption: "19 Tinggi · 19 Sedang",
  });

  useEffect(() => {
    async function fetchSummaryMetrics() {
      try {
        const [predictionsRes, clustersRes] = await Promise.all([
          supabase.from("predictions").select("predicted_prod_ton").eq("target_year", 2026).eq("model_name", "lstm"),
          supabase.from("cluster_assignments").select("cluster_label")
        ]);

        if (predictionsRes.error) throw predictionsRes.error;
        if (clustersRes.error) throw clustersRes.error;

        const predictions = predictionsRes.data || [];
        const clusters = clustersRes.data || [];

        // Sum predicted production
        const total = predictions.reduce(
          (acc, p) => acc + Number(p.predicted_prod_ton || 0),
          0
        );
        const totalFormatted = total > 0 
          ? Math.round(total).toLocaleString("id-ID")
          : "2.306.722";

        // Count high risk (cluster = 0) and medium risk (cluster = 1)
        const highRisk = clusters.filter((c) => c.cluster_label === 0).length;
        const medRisk = clusters.filter((c) => c.cluster_label === 1).length;

        const highRiskStr = highRisk > 0 ? String(highRisk) : "19";
        const priorityCountStr = (highRisk + medRisk) > 0 ? String(highRisk + medRisk) : "38";
        const priorityCaptionStr = `${highRisk} Tinggi · ${medRisk} Sedang`;

        setMetrics({
          totalProd: totalFormatted,
          highRiskCount: highRiskStr,
          priorityCount: priorityCountStr,
          priorityCaption: priorityCaptionStr,
        });
      } catch (err) {
        console.error("Error fetching summary metrics:", err);
      }
    }
    fetchSummaryMetrics();
  }, []);

  const items = useMemo<SummaryItem[]>(() => [
    {
      to: "/dashboard/iklim",
      eyebrow: "Iklim",
      title: "Rata-Rata Iklim",
      icon: CloudSun,
      metric: "28",
      unit: "°C",
      caption: "Suhu · Hujan 150 mm · Lembap 80%",
      tone: "gold",
    },
    {
      to: "/dashboard/prediksi",
      eyebrow: "Prediksi Produksi",
      title: "Proyeksi Panen",
      icon: LineChart,
      metric: metrics.totalProd,
      unit: "ton",
      caption: "Model LSTM · +4,2% vs musim lalu",
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
      metric: "56",
      unit: "kabupaten",
      caption: "Total wilayah Kalimantan",
      tone: "neutral",
    },
    {
      to: "/dashboard/tren",
      eyebrow: "Tren Historis",
      title: "Tren Produksi",
      icon: TrendingUp,
      metric: "+4,2",
      unit: "%",
      caption: "BPS 2018–2025 vs Prediksi LSTM",
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
  ], [metrics]);

  return (
    <DashboardLayout
      pageTitle="Ringkasan"
      eyebrow="Ringkasan"
      title="Ringkasan Keseluruhan"
      description="Cuplikan indikator kunci dari seluruh modul intelijen panen."
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
            <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#8C6E26] dark:text-[#C9A24B] truncate">
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
          className="shrink-0 text-[#5F6A64] dark:text-[#A8AFA9] group-hover:text-[#8C6E26] dark:group-hover:text-[#C9A24B] transition-colors"
        />
      </div>

      <div className="mt-4 pt-4 border-t border-[#2A3530]/12 dark:border-[#E8E6DF]/12">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="font-serif text-[28px] sm:text-[32px] leading-none text-[#2A3530] dark:text-[#E8E6DF]">
            {item.metric}
          </span>
          {item.unit && (
            <span className="text-[12px] text-[#5F6A64] dark:text-[#A8AFA9]">
              {item.unit}
            </span>
          )}
        </div>
        <p className="mt-2 text-[12px] leading-[1.5] text-[#5F6A64] dark:text-[#B8BFB9]">
          {item.caption}
        </p>
      </div>
    </Link>
  );
}
