import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { supabase } from "@/lib/supabase";
import { useThemeStore } from "@/stores/useThemeStore";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function TrendChart() {
  const { theme } = useThemeStore();
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Fetch historical BPS data (2018-2025)
        const { data: bpsRaw } = await supabase
          .from("production_history")
          .select("year, production_ton");
        const bpsRes = bpsRaw as Array<{ year: number; production_ton: number | null }> | null;

        // Fetch predicted XGBoost data (2026)
        const { data: xgbRaw } = await supabase
          .from("predictions")
          .select("target_year, predicted_prod_ton")
          .eq("model_name", "xgboost")
          .eq("model_version", "v1-real");
        const xgbRes = xgbRaw as Array<{ target_year: number; predicted_prod_ton: number | null }> | null;


        // Group by year and calculate sum
        const years = Array.from({ length: 9 }, (_, i) => 2018 + i);
        const bpsMap: Record<number, number> = {};
        const xgbMap: Record<number, number> = {};

        bpsRes?.forEach((r) => {
          bpsMap[r.year] = (bpsMap[r.year] || 0) + Number(r.production_ton || 0);
        });

        xgbRes?.forEach((r) => {
          xgbMap[r.target_year] = (xgbMap[r.target_year] || 0) + Number(r.predicted_prod_ton || 0);
        });

        // Set up Chart dataset
        const bpsDataset = years.map((y) => (y <= 2025 ? bpsMap[y] || 0 : null));
        const xgbDataset = years.map((y) => {
          if (y === 2025) return bpsMap[2025] || 0; // connect line chart smoothly
          if (y === 2026) return xgbMap[2026] || 0;
          return null;
        });

        const isDark = theme === "dark";
        setChartData({
          labels: years.map(String),
          datasets: [
            {
              label: "Historis BPS (Ton)",
              data: bpsDataset,
              borderColor: "#8C6E26",
              backgroundColor: "rgba(140, 110, 38, 0.1)",
              borderWidth: 2.5,
              tension: 0.3,
              fill: true,
              pointBackgroundColor: "#8C6E26",
            },
            {
              label: "Prediksi XGBoost (Ton)",
              data: xgbDataset,
              borderColor: "#7A9A6E",
              backgroundColor: "rgba(122, 154, 110, 0.1)",
              borderWidth: 2.5,
              borderDash: [6, 6],
              tension: 0.3,
              fill: true,
              pointBackgroundColor: "#7A9A6E",
            },
          ],
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [theme]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: theme === "dark" ? "#B8BFB9" : "#5F6A64",
          font: { family: "Inter" },
        },
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: {
          color: theme === "dark" ? "rgba(232, 230, 223, 0.08)" : "rgba(42, 53, 48, 0.08)",
        },
        ticks: {
          color: theme === "dark" ? "#B8BFB9" : "#5F6A64",
        },
      },
      y: {
        grid: {
          color: theme === "dark" ? "rgba(232, 230, 223, 0.08)" : "rgba(42, 53, 48, 0.08)",
        },
        ticks: {
          color: theme === "dark" ? "#B8BFB9" : "#5F6A64",
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center min-h-[300px]">
        <div className="flex items-center gap-2 text-[13px] text-[#5F6A64] dark:text-[#A8AFA9]">
          <span className="w-4 h-4 border-2 border-t-transparent border-[#C9A24B] rounded-full animate-spin" />
          Memuat Grafik...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[320px] sm:h-[380px]">
      {chartData && <Line data={chartData} options={options} />}
    </div>
  );
}
