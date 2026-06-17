import { memo, useState, useRef, useEffect, type ReactNode } from "react";
import {
  CloudRain,
  Thermometer,
  Droplets,
  TrendingUp,
  AlertTriangle,
  UploadCloud,
  Loader2,
} from "lucide-react";
import { diseaseService, type DiseasePredictionResponse } from "@/services/disease";
import { KalimantanMap } from "./peta";
import { supabase } from "@/lib/supabase";

function Card({
  title,
  eyebrow,
  children,
  className = "",
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/12 bg-white/40 dark:bg-white/[0.04] p-5 sm:p-6 ${className}`}
    >
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-4">
        {eyebrow && (
          <div className="flex items-center gap-3 shrink-0">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#8C6E26] dark:text-[#C9A24B]">
              {eyebrow}
            </span>
            <span className="h-px w-6 bg-[#C9A24B]/40" />
          </div>
        )}
        <h3 className="font-serif tracking-tight text-[15px] text-[#2A3530] dark:text-[#E8E6DF]">
          {title}
        </h3>
      </header>
      {children}
    </section>
  );
}

const climateKpiItems = [
  {
    icon: <CloudRain size={16} strokeWidth={1.6} />,
    value: "150 mm",
    label: "Curah Hujan",
  },
  {
    icon: <Thermometer size={16} strokeWidth={1.6} />,
    value: "28°C",
    label: "Suhu",
  },
  {
    icon: <Droplets size={16} strokeWidth={1.6} />,
    value: "80%",
    label: "Kelembapan",
  },
];

export function ClimateKpiCard() {
  return (
    <Card title="Rata-Rata Iklim (NASA POWER)" eyebrow="Iklim">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {climateKpiItems.map((it) => (
          <div
            key={it.label}
            className="rounded-xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/12 bg-white/40 dark:bg-white/[0.04] p-3 flex sm:block items-center gap-3"
          >
            <span className="inline-flex w-8 h-8 sm:w-7 sm:h-7 items-center justify-center rounded-md bg-[#C9A24B]/15 text-[#8C6E26] dark:text-[#C9A24B] shrink-0 sm:mb-2">
              {it.icon}
            </span>
            <div className="min-w-0">
              <p className="font-serif tracking-tight text-[17px] sm:text-[18px] text-[#2A3530] dark:text-[#E8E6DF] whitespace-nowrap">
                [ {it.value} ]
              </p>
              <p className="text-[12px] text-[#5F6A64] dark:text-[#B8BFB9] mt-0.5">
                {it.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

const Sparkline = memo(function Sparkline() {
  return (
    <svg
      viewBox="0 0 120 40"
      className="w-full h-10"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#7A9A6E" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#7A9A6E" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 32 L15 28 L30 30 L45 22 L60 24 L75 16 L90 18 L105 10 L120 6"
        fill="none"
        stroke="#7A9A6E"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M0 32 L15 28 L30 30 L45 22 L60 24 L75 16 L90 18 L105 10 L120 6 L120 40 L0 40 Z"
        fill="url(#spark-fill)"
      />
    </svg>
  );
});

export function PredictionKpiCard() {
  const [totalProd, setTotalProd] = useState<string>("2.306.722");

  useEffect(() => {
    async function fetchProduction() {
      try {
        const { data, error } = await supabase
          .from("predictions")
          .select("predicted_prod_ton")
          .eq("target_year", 2026)
          .eq("model_name", "lstm");
        if (error) throw error;
        if (data) {
          const total = data.reduce((sum, p) => sum + Number(p.predicted_prod_ton || 0), 0);
          if (total > 0) {
            setTotalProd(Math.round(total).toLocaleString("id-ID"));
          }
        }
      } catch (err) {
        console.error("Error fetching dynamic yield projection:", err);
      }
    }
    fetchProduction();
  }, []);

  return (
    <Card title="Proyeksi Produksi (LSTM)" eyebrow="Prediksi">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-serif tracking-tight text-[26px] text-[#2A3530] dark:text-[#E8E6DF] leading-none">
            {totalProd}
          </p>
          <p className="text-[12px] text-[#5F6A64] dark:text-[#B8BFB9] mt-1">
            Ton
          </p>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#7A9A6E]/15 text-[#4A7A40] dark:text-[#84B878] text-[12px]">
          <TrendingUp size={12} strokeWidth={1.8} />
          +4,2%
        </span>
      </div>
      <div className="mt-4">
        <Sparkline />
      </div>
    </Card>
  );
}

export function RiskKpiCard() {
  const [highRiskCount, setHighRiskCount] = useState<number>(19);

  useEffect(() => {
    async function fetchRiskCount() {
      try {
        const { data, error } = await supabase
          .from("cluster_assignments")
          .select("cluster_label")
          .eq("cluster_label", 0);
        if (error) throw error;
        if (data) {
          setHighRiskCount(data.length);
        }
      } catch (err) {
        console.error("Error fetching dynamic risk count:", err);
      }
    }
    fetchRiskCount();
  }, []);

  return (
    <Card title="Status Wilayah" eyebrow="Risiko">
      <div className="flex items-center gap-4">
        <span className="inline-flex w-11 h-11 items-center justify-center rounded-xl bg-[#A04848]/15 text-[#A04848] dark:text-[#D17878] shrink-0">
          <AlertTriangle size={20} strokeWidth={1.6} />
        </span>
        <div>
          <p className="font-serif tracking-tight text-[22px] text-[#2A3530] dark:text-[#E8E6DF] leading-none">
            {highRiskCount} Kabupaten
          </p>
          <p className="text-[12px] text-[#5F6A64] dark:text-[#B8BFB9] mt-1.5">
            Risiko Tinggi
          </p>
        </div>
      </div>
    </Card>
  );
}

export function SpatialMapCard() {
  return (
    <Card title="Distribusi Kerentanan Spasial" eyebrow="Peta">
      <div className="w-full">
        <KalimantanMap />
      </div>
    </Card>
  );
}

export function TrendChartCard() {
  return (
    <Card title="Historis BPS vs Prediksi LSTM" eyebrow="Tren">
      <div className="aspect-[16/9] w-full rounded-xl border border-dashed border-[#2A3530]/15 dark:border-[#E8E6DF]/15 bg-white/30 dark:bg-white/[0.04] flex items-center justify-center">
        <p className="font-mono text-[12px] tracking-wider text-[#5F6A64] dark:text-[#A8AFA9]">
          [ Placeholder Grafik Garis Chart.js ]
        </p>
      </div>
    </Card>
  );
}

const priorityRows = [
  { wilayah: "Kab. Alpha", kategori: "Tinggi", estimasi: "14.500" },
  { wilayah: "Kab. Beta", kategori: "Sedang", estimasi: "9.820" },
  { wilayah: "Kab. Gamma", kategori: "Tinggi", estimasi: "12.140" },
];

export function PriorityTableCard() {
  const badge = (k: string) =>
    k === "Tinggi"
      ? "bg-[#C9A24B]/15 text-[#8C6E26] dark:text-[#C9A24B]"
      : "bg-[#7A9A6E]/15 text-[#4A7A40] dark:text-[#84B878]";

  return (
    <Card title="Rekomendasi Prioritas" eyebrow="Rekomendasi">
      <div className="sm:hidden space-y-2.5">
        {priorityRows.map((r) => (
          <div
            key={r.wilayah}
            className="rounded-xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/12 bg-white/30 dark:bg-white/[0.04] p-3.5"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] text-[#2A3530] dark:text-[#E8E6DF] whitespace-nowrap">
                [ {r.wilayah} ]
              </span>
              <span
                className={`inline-flex whitespace-nowrap px-2.5 py-0.5 rounded-full text-[12px] ${badge(r.kategori)}`}
              >
                [ {r.kategori} ]
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-[#2A3530]/12 dark:border-[#E8E6DF]/12 flex items-center justify-between gap-3 text-[12px]">
              <span className="uppercase tracking-wider text-[#5F6A64] dark:text-[#A8AFA9]">
                Estimasi (Ton)
              </span>
              <span className="font-mono text-[13px] text-[#2A3530] dark:text-[#E8E6DF]">
                [ {r.estimasi} ]
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden sm:block">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-[#5F6A64] dark:text-[#A8AFA9]">
              <th className="px-2 py-2 font-normal">Wilayah</th>
              <th className="px-2 py-2 font-normal">Kategori</th>
              <th className="px-2 py-2 font-normal text-right">
                Estimasi (Ton)
              </th>
            </tr>
          </thead>
          <tbody className="text-[13px] text-[#2A3530] dark:text-[#E8E6DF]">
            {priorityRows.map((r) => (
              <tr
                key={r.wilayah}
                className="border-t border-[#2A3530]/15 dark:border-[#E8E6DF]/12"
              >
                <td className="px-2 py-3 whitespace-nowrap">[ {r.wilayah} ]</td>
                <td className="px-2 py-3">
                  <span
                    className={`inline-flex whitespace-nowrap px-2.5 py-0.5 rounded-full text-[12px] ${badge(r.kategori)}`}
                  >
                    [ {r.kategori} ]
                  </span>
                </td>
                <td className="px-2 py-3 text-right font-mono whitespace-nowrap">
                  [ {r.estimasi} ]
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
export function DiseaseDetectionCard() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DiseasePredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const capitalizeClass = (className: string) => {
    if (!className) return "Unknown";
    return className
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleFile = async (selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/")) {
      setError("File harus berupa gambar (PNG, JPG, atau JPEG).");
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("Ukuran file tidak boleh melebihi 5MB.");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setResult(null);
    
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    setIsAnalyzing(true);
    try {
      const startTime = Date.now();
      const response = await diseaseService.detectDisease(selectedFile);
      const elapsed = Date.now() - startTime;
      setResult({
        ...response,
        inference_time_ms: response.inference_time_ms || elapsed,
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Gagal melakukan deteksi penyakit.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  };

  return (
    <Card title="Diagnosis Penyakit Cepat" eyebrow="Deteksi">
      {/* Upload Zone & Preview Zone */}
      {!previewUrl ? (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={triggerFileInput}
          className={`rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer px-4 py-10 flex flex-col items-center justify-center text-center ${
            isDragging
              ? "border-[#C9A24B] bg-[#C9A24B]/5"
              : "border-[#2A3530]/15 dark:border-[#E8E6DF]/15 bg-white/30 dark:bg-white/[0.04] hover:border-[#C9A24B]/50"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={onSelectFile}
            accept="image/png, image/jpeg, image/jpg"
            className="hidden"
          />
          <span className="inline-flex w-10 h-10 items-center justify-center rounded-full bg-[#C9A24B]/15 text-[#8C6E26] dark:text-[#C9A24B] mb-3">
            <UploadCloud size={18} strokeWidth={1.6} />
          </span>
          <p className="font-serif text-[14px] text-[#2A3530] dark:text-[#E8E6DF] font-medium">
            Tarik & taruh foto daun di sini
          </p>
          <p className="text-[12px] text-[#5F6A64] dark:text-[#A8AFA9] mt-1">
            atau klik untuk memilih file dari komputer Anda
          </p>
          <p className="text-[11px] text-[#5F6A64]/70 dark:text-[#A8AFA9]/50 mt-3 font-mono">
            PNG / JPG · maks. 5MB
          </p>
        </div>
      ) : (
        <div className="relative rounded-xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/12 bg-[#EFEBE1]/30 dark:bg-black/20 p-4 flex flex-col items-center justify-center min-h-[220px]">
          {isAnalyzing ? (
            <div className="absolute inset-0 bg-[#EFEBE1]/80 dark:bg-[#0E1619]/90 rounded-xl flex flex-col items-center justify-center z-10 backdrop-blur-sm">
              <Loader2 className="animate-spin text-[#C9A24B] mb-3" size={32} />
              <p className="text-[13px] font-medium text-[#2A3530] dark:text-[#E8E6DF] animate-pulse">
                Menganalisis gambar...
              </p>
            </div>
          ) : null}
          <img
            src={previewUrl}
            alt="Paddy leaf preview"
            className="max-h-[200px] w-auto rounded-lg object-contain shadow-md"
          />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mt-4 p-3 rounded-lg border border-[#A04848]/20 bg-[#A04848]/5 text-[#A04848] dark:text-[#D17878] text-[12px] leading-relaxed">
          {error}
          <button
            onClick={handleReset}
            className="block mt-2 text-[#C9A24B] hover:underline font-medium focus:outline-none"
          >
            Coba File Lain
          </button>
        </div>
      )}

      {/* Output KPI & Action Button */}
      {result && !error && !isAnalyzing && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4 border-t border-b border-[#2A3530]/10 dark:border-[#E8E6DF]/10 py-3 text-[12px]">
            <div>
              <p className="text-[#5F6A64] dark:text-[#A8AFA9] uppercase tracking-wider text-[10px]">
                DIAGNOSIS
              </p>
              <p className="font-serif text-[18px] text-[#2A3530] dark:text-[#E8E6DF] font-medium mt-0.5">
                {capitalizeClass(result.predicted_class)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[#5F6A64] dark:text-[#A8AFA9] uppercase tracking-wider text-[10px]">
                AKURASI
              </p>
              <p className="font-mono text-[18px] text-[#7A9A6E] dark:text-[#84B878] font-semibold mt-0.5">
                {(result.confidence * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="flex justify-between text-[11px] text-[#5F6A64]/80 dark:text-[#A8AFA9]/70 font-mono">
            <span>Model: {result.model_used}</span>
            <span>Waktu: {result.inference_time_ms}ms</span>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="w-full inline-flex items-center justify-center h-10 px-4 rounded-lg bg-[#C9A24B] text-[#2A1F08] text-[13px] hover:bg-[#D4B05E] transition-colors cursor-pointer font-medium focus:outline-none"
          >
            Analisis Ulang
          </button>
        </div>
      )}

      {/* Default placeholder state (waiting for input) */}
      {!result && !error && !isAnalyzing && previewUrl && (
        <div className="mt-4">
          <button
            type="button"
            onClick={handleReset}
            className="w-full inline-flex items-center justify-center h-10 px-4 rounded-lg border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 text-[#2A3530] dark:text-[#E8E6DF] text-[13px] hover:bg-[#2A3530]/5 dark:hover:bg-white/5 transition-colors cursor-pointer font-medium focus:outline-none"
          >
            Batal
          </button>
        </div>
      )}

      {!previewUrl && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[12px] text-[#5F6A64] dark:text-[#B8BFB9]">
          <span>
            Diagnosis:{" "}
            <span className="text-[#2A3530] dark:text-[#E8E6DF]">
              [ Menunggu Data ]
            </span>
          </span>
          <span>
            Akurasi:{" "}
            <span className="text-[#2A3530] dark:text-[#E8E6DF]">[ 0% ]</span>
          </span>
        </div>
      )}
    </Card>
  );
}
