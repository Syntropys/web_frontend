import { memo, useState, useCallback, useRef, useEffect, type ReactNode } from "react";
import {
  CloudRain,
  Thermometer,
  Droplets,
  TrendingUp,
  AlertTriangle,
  UploadCloud,
  Loader2,
} from "lucide-react";
import { detectDisease, getDiseaseLabel } from "@/services/disease";
import type { DiseasePredictionResponse } from "@/types/api-types";

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
  return (
    <Card title="Proyeksi Produksi (LSTM)" eyebrow="Prediksi">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-serif tracking-tight text-[26px] text-[#2A3530] dark:text-[#E8E6DF] leading-none">
            [ 2.450.000 ]
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
  return (
    <Card title="Status Wilayah" eyebrow="Risiko">
      <div className="flex items-center gap-4">
        <span className="inline-flex w-11 h-11 items-center justify-center rounded-xl bg-[#A04848]/15 text-[#A04848] dark:text-[#D17878] shrink-0">
          <AlertTriangle size={20} strokeWidth={1.6} />
        </span>
        <div>
          <p className="font-serif tracking-tight text-[22px] text-[#2A3530] dark:text-[#E8E6DF] leading-none">
            [ 12 Kabupaten ]
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
      <div className="aspect-[16/9] w-full rounded-xl bg-[#F7F3EA] dark:bg-black/40 border border-[#2A3530]/15 dark:border-[#E8E6DF]/12 flex items-center justify-center">
        <p className="font-mono text-[12px] tracking-wider text-[#5F6A64] dark:text-[#A8AFA9]">
          [ Placeholder Peta Interaktif Leaflet.js ]
        </p>
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
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<DiseasePredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFile = useCallback(async (selected: File) => {
    // Reset previous state
    setError(null);
    setResult(null);

    // Validate
    if (!selected.type.startsWith("image/")) {
      setError("File harus berupa gambar (PNG, JPG, JPEG).");
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setError("Ukuran file maksimal 5MB.");
      return;
    }

    // Set file and preview
    setFile(selected);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(selected));

    // Call API
    setLoading(true);
    try {
      const response = await detectDisease(selected);
      setResult(response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menghubungi layanan deteksi. Pastikan backend berjalan.",
      );
    } finally {
      setLoading(false);
    }
  }, [preview]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) handleFile(selected);
    },
    [handleFile],
  );

  const handleReset = useCallback(() => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setResult(null);
    setError(null);
    setLoading(false);
    if (inputRef.current) inputRef.current.value = "";
  }, [preview]);

  const confidencePercent = result
    ? (result.confidence * 100).toFixed(1)
    : "0";

  return (
    <Card title="Diagnosis Penyakit Cepat" eyebrow="Deteksi">
      {/* Drag & Drop / Preview Area */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleClick();
        }}
        className={`relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer
          ${
            isDragOver
              ? "border-[#C9A24B] bg-[#C9A24B]/10 dark:bg-[#C9A24B]/5 scale-[1.01]"
              : "border-[#2A3530]/15 dark:border-[#E8E6DF]/15 bg-white/30 dark:bg-white/[0.04]"
          }
          ${preview ? "p-3" : "px-4 py-8"}
          flex flex-col items-center justify-center text-center`}
      >
        {preview ? (
          <img
            src={preview}
            alt={file?.name ?? "Preview gambar"}
            className="max-h-48 rounded-lg object-contain mx-auto"
          />
        ) : (
          <>
            <span className="inline-flex w-10 h-10 items-center justify-center rounded-full bg-[#C9A24B]/15 text-[#8C6E26] dark:text-[#C9A24B] mb-3">
              <UploadCloud size={18} strokeWidth={1.6} />
            </span>
            <p className="font-mono text-[12px] tracking-wider text-[#5F6A64] dark:text-[#A8AFA9]">
              {isDragOver
                ? "Lepaskan file di sini..."
                : "[ Area Drag & Drop Foto Daun ]"}
            </p>
            <p className="text-[12px] text-[#5F6A64] dark:text-[#A8AFA9] mt-1.5">
              PNG / JPG · maks. 5MB
            </p>
          </>
        )}

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 rounded-xl bg-black/40 flex flex-col items-center justify-center gap-2 z-10">
            <Loader2
              size={24}
              className="animate-spin text-[#C9A24B]"
              strokeWidth={2}
            />
            <span className="text-[12px] text-white/80 font-mono tracking-wider">
              Menganalisis...
            </span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        className="hidden"
        onChange={handleInputChange}
      />

      {/* Error display */}
      {error && (
        <div className="mt-3 px-3 py-2 rounded-lg bg-[#A04848]/10 border border-[#A04848]/20 text-[12px] text-[#A04848] dark:text-[#D17878]">
          ⚠ {error}
        </div>
      )}

      {/* Result display */}
      {result && (
        <div className="mt-4 space-y-3">
          {/* Main result */}
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[#5F6A64] dark:text-[#A8AFA9] mb-0.5">
                Diagnosis
              </p>
              <p className="font-serif tracking-tight text-[18px] text-[#2A3530] dark:text-[#E8E6DF]">
                {getDiseaseLabel(result.predicted_class)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wider text-[#5F6A64] dark:text-[#A8AFA9] mb-0.5">
                Akurasi
              </p>
              <p className="font-mono text-[20px] font-semibold text-[#7A9A6E] dark:text-[#84B878]">
                {confidencePercent}%
              </p>
            </div>
          </div>

          {/* Top-K predictions */}
          {result.top_k_predictions.length > 0 && (
            <div className="rounded-xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/12 bg-white/30 dark:bg-white/[0.04] p-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#8C6E26] dark:text-[#C9A24B] mb-2">
                Kemungkinan Lain
              </p>
              <div className="space-y-1.5">
                {result.top_k_predictions.slice(0, 5).map((pred) => (
                  <div
                    key={pred.class_name}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="text-[12px] text-[#2A3530] dark:text-[#E8E6DF] truncate">
                      {getDiseaseLabel(pred.class_name)}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-16 h-1.5 rounded-full bg-[#2A3530]/10 dark:bg-[#E8E6DF]/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#C9A24B]/60"
                          style={{
                            width: `${(pred.probability * 100).toFixed(0)}%`,
                          }}
                        />
                      </div>
                      <span className="font-mono text-[11px] text-[#5F6A64] dark:text-[#B8BFB9] w-10 text-right">
                        {(pred.probability * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11px] text-[#5F6A64] dark:text-[#B8BFB9]">
            <span>Model: {result.model_used}</span>
            {result.inference_time_ms != null && (
              <span>Waktu: {result.inference_time_ms.toFixed(0)}ms</span>
            )}
          </div>

          {/* Reset button */}
          <button
            type="button"
            onClick={handleReset}
            className="w-full mt-1 py-2 rounded-lg border border-[#2A3530]/15 dark:border-[#E8E6DF]/12 bg-white/40 dark:bg-white/[0.04] text-[12px] text-[#5F6A64] dark:text-[#B8BFB9] hover:bg-[#C9A24B]/10 hover:text-[#8C6E26] dark:hover:text-[#C9A24B] transition-colors"
          >
            Analisis Ulang
          </button>
        </div>
      )}

      {/* Default footer when no result */}
      {!result && !error && (
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

