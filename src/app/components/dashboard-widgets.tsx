import { memo, type ReactNode } from "react";
import {
  CloudRain,
  Thermometer,
  Droplets,
  TrendingUp,
  AlertTriangle,
  UploadCloud,
} from "lucide-react";

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

export function ClimateKpiCard() {
  const items = [
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

  return (
    <Card title="Rata-Rata Iklim (NASA POWER)" eyebrow="Iklim">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {items.map((it) => (
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

export function PriorityTableCard() {
  const rows = [
    { wilayah: "Kab. Alpha", kategori: "Tinggi", estimasi: "14.500" },
    { wilayah: "Kab. Beta", kategori: "Sedang", estimasi: "9.820" },
    { wilayah: "Kab. Gamma", kategori: "Tinggi", estimasi: "12.140" },
  ];

  const badge = (k: string) =>
    k === "Tinggi"
      ? "bg-[#C9A24B]/15 text-[#8C6E26] dark:text-[#C9A24B]"
      : "bg-[#7A9A6E]/15 text-[#4A7A40] dark:text-[#84B878]";

  return (
    <Card title="Rekomendasi Prioritas" eyebrow="Rekomendasi">
      <div className="sm:hidden space-y-2.5">
        {rows.map((r) => (
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
            {rows.map((r) => (
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
  return (
    <Card title="Diagnosis Penyakit Cepat" eyebrow="Deteksi">
      <div className="rounded-xl border-2 border-dashed border-[#2A3530]/15 dark:border-[#E8E6DF]/15 bg-white/30 dark:bg-white/[0.04] px-4 py-8 flex flex-col items-center justify-center text-center">
        <span className="inline-flex w-10 h-10 items-center justify-center rounded-full bg-[#C9A24B]/15 text-[#8C6E26] dark:text-[#C9A24B] mb-3">
          <UploadCloud size={18} strokeWidth={1.6} />
        </span>
        <p className="font-mono text-[12px] tracking-wider text-[#5F6A64] dark:text-[#A8AFA9]">
          [ Area Drag & Drop Foto Daun ]
        </p>
        <p className="text-[12px] text-[#5F6A64] dark:text-[#A8AFA9] mt-1.5">
          PNG / JPG · maks. 5MB
        </p>
      </div>
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
    </Card>
  );
}
