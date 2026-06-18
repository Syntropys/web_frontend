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
  const [climate, setClimate] = useState({ rain: "150 mm", temp: "28°C", humid: "80%" });
  const [yearRange, setYearRange] = useState({ start: 2018, end: 2026 });

  useEffect(() => {
    const handleRangeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ startYear: number; endYear: number }>;
      setYearRange({ start: customEvent.detail.startYear, end: customEvent.detail.endYear });
    };
    window.addEventListener("agrolytics_year_range_changed", handleRangeChange);
    return () => window.removeEventListener("agrolytics_year_range_changed", handleRangeChange);
  }, []);

  useEffect(() => {
    async function fetchClimate() {
      try {
        const { data } = await supabase
          .from("weather_history")
          .select("rainfall_mm, temp_avg_c, humidity_pct")
          .gte("year", yearRange.start)
          .lte("year", yearRange.end);

        if (data && data.length > 0) {
          const rain = Math.round(data.reduce((acc, w) => acc + (w.rainfall_mm || 0), 0) / data.length);
          const temp = Math.round(data.reduce((acc, w) => acc + (w.temp_avg_c || 0), 0) / data.length);
          const humid = Math.round(data.reduce((acc, w) => acc + (w.humidity_pct || 0), 0) / data.length);
          setClimate({
            rain: `${rain} mm`,
            temp: `${temp}°C`,
            humid: `${humid}%`,
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchClimate();
  }, [yearRange]);

  const items = [
    {
      icon: <CloudRain size={16} strokeWidth={1.6} />,
      value: climate.rain,
      label: "Curah Hujan",
    },
    {
      icon: <Droplets size={16} strokeWidth={1.6} />,
      value: climate.temp,
      label: "Suhu Rata-rata",
    },
    {
      icon: <Thermometer size={16} strokeWidth={1.6} />,
      value: climate.humid,
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
  const [totalProd, setTotalProd] = useState<string>("2.306.722");

  useEffect(() => {
    async function fetchProduction() {
      try {
        const { data, error } = await supabase
          .from("predictions")
          .select("predicted_prod_ton")
          .eq("target_year", 2026)
          .eq("model_name", "xgboost")
          .eq("model_version", "v1-real");
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
    <Card title="Proyeksi Produksi (XGBoost)" eyebrow="Prediksi">
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

import { TrendChart } from "./trend-chart";

export function TrendChartCard() {
  return (
    <Card title="Historis BPS vs Prediksi XGBoost" eyebrow="Tren">
      <div className="w-full">
        <TrendChart />
      </div>
    </Card>
  );
}

export function PriorityTableCard() {
  const [priorityRows, setPriorityRows] = useState<Array<{ wilayah: string; kategori: string; estimasi: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPriorities() {
      try {
        setLoading(true);
        const [regionsRes, predictionsRes, clustersRes] = await Promise.all([
          supabase.from("regions").select("id, name"),
          supabase.from("predictions").select("region_id, predicted_prod_ton").eq("target_year", 2026).eq("model_name", "xgboost").eq("model_version", "v1-real"),
          supabase.from("cluster_assignments").select("region_id, cluster_label")
        ]);

        const regions = regionsRes.data || [];
        const predictions = predictionsRes.data || [];
        const clusters = clustersRes.data || [];

        const rows = predictions.map((p) => {
          const reg = regions.find((r) => r.id === p.region_id);
          const cl = clusters.find((c) => c.region_id === p.region_id);
          const label = cl?.cluster_label === 0 ? "Tinggi" : cl?.cluster_label === 1 ? "Sedang" : "Rendah";
          return {
            wilayah: reg?.name || "Kabupaten",
            kategori: label,
            estimasi: p.predicted_prod_ton ? Math.round(p.predicted_prod_ton).toLocaleString("id-ID") : "0"
          };
        });

        // Filter high/medium priority and sort
        const filtered = rows
          .filter((r) => r.kategori === "Tinggi" || r.kategori === "Sedang")
          .sort((a, b) => {
            if (a.kategori === b.kategori) return 0;
            return a.kategori === "Tinggi" ? -1 : 1;
          });

        setPriorityRows(filtered.slice(0, 10));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadPriorities();
  }, []);

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
// ─── Disease Info Database ────────────────────────────────────────────────────
const DISEASE_INFO: Record<string, {
  name: string; severity: string; severityColor: string; severityBg: string;
  description: string; symptoms: string[]; treatment: string[]; emoji: string;
}> = {
  hispa: {
    name: "Hispa (Dicladispa armigera)", severity: "Tinggi", severityColor: "#C9A24B", severityBg: "bg-[#C9A24B]/10",
    description: "Hama serangga yang menyerang daun padi. Larva menggerek jaringan daun membuat bekas berwarna putih, sementara imago mengikis permukaan daun dari atas.",
    symptoms: ["Goresan putih memanjang pada daun", "Larva dalam jaringan daun (terowongan berliku)", "Tepi daun mengering dan menggulung", "Serangan berat: daun putih keseluruhan"],
    treatment: ["Semprotkan insektisida berbahan aktif chlorpyrifos atau imidacloprid", "Kumpulkan dan musnahkan tanaman terinfeksi", "Optimalkan jarak tanam untuk sirkulasi udara", "Hindari pemupukan nitrogen berlebihan"],
    emoji: "🐛",
  },
  brown_spot: {
    name: "Bercak Coklat (Bipolaris oryzae)", severity: "Sedang", severityColor: "#C9A24B", severityBg: "bg-[#C9A24B]/10",
    description: "Penyakit jamur yang terutama muncul pada tanaman kekurangan nutrisi, khususnya kalium dan silika. Dapat menyebabkan gabah hampa.",
    symptoms: ["Bercak oval coklat tua di permukaan daun", "Tepi bercak berwarna kuning", "Bercak pada gabah menyebabkan gabah hampa", "Bibit terserang dapat mati (damping off)"],
    treatment: ["Gunakan benih bersertifikat + perlakuan fungisida", "Tingkatkan pemupukan K (Kalium) dan Si (Silika)", "Semprotkan fungisida mancozeb atau propiconazole", "Perbaiki drainase lahan sawah"],
    emoji: "🟤",
  },
  blast: {
    name: "Blas (Magnaporthe oryzae)", severity: "Kritis", severityColor: "#D17878", severityBg: "bg-[#A04848]/10",
    description: "Penyakit jamur paling merusak pada padi. Menyerang daun, leher malai, dan ruas batang. Epidemi dapat memusnahkan hingga 100% panen.",
    symptoms: ["Bercak belah ketupat dengan tepi coklat, pusat abu-abu", "Leher malai patah (blast leher)", "Gabah hampa akibat serangan malai", "Antraknosa pada batang dan buku ruas"],
    treatment: ["SEGERA semprot: tricyclazole, isoprothiolane, atau azoxystrobin", "Gunakan varietas tahan blas (Ciherang, Inpari)", "Kurangi nitrogen, tambah kalium + silika", "Hindari irigasi berlebihan saat cuaca lembap"],
    emoji: "🚨",
  },
  tungro: {
    name: "Tungro (Rice Tungro Virus)", severity: "Kritis", severityColor: "#D17878", severityBg: "bg-[#A04848]/10",
    description: "Penyakit virus ditularkan oleh wereng hijau (Nephotettix virescens). Merupakan penyakit virus padi paling merugikan di Asia Tenggara.",
    symptoms: ["Daun kuning-jingga mulai dari ujung", "Tanaman kerdil, anakan berkurang", "Gabah berisi tidak sempurna", "Populasi wereng hijau tinggi di sekitar tanaman"],
    treatment: ["Kendalikan wereng hijau (BPMC, imidacloprid)", "Cabut dan bakar tanaman bergejala parah", "Tanam varietas tahan tungro (Tukad Unda, Bondoyudo)", "Atur waktu tanam serentak untuk memutus siklus hama"],
    emoji: "🦠",
  },
  healthy: {
    name: "Daun Sehat", severity: "Sehat", severityColor: "#7A9A6E", severityBg: "bg-[#7A9A6E]/10",
    description: "Tanaman padi terdeteksi dalam kondisi sehat. Tidak ada gejala penyakit yang terdeteksi pada daun yang dianalisis.",
    symptoms: ["Warna daun hijau merata dan segar", "Tidak ada bercak atau perubahan warna abnormal", "Permukaan daun bersih dan tidak berlubang"],
    treatment: ["Pertahankan jadwal pemupukan sesuai dosis anjuran", "Monitor rutin minimal 2x per minggu", "Jaga drainase dan irigasi yang baik", "Lanjutkan program PHT (Pengendalian Hama Terpadu)"],
    emoji: "✅",
  },
};

export function DiseaseDetectionCard() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DiseasePredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const getDiseaseInfo = (className: string) => {
    const key = className.toLowerCase().replace(/[\s-]+/g, "_");
    return DISEASE_INFO[key] ?? {
      name: capitalizeClass(className), severity: "Tidak Dikenal", severityColor: "#5F6A64", severityBg: "bg-[#5F6A64]/10",
      description: "Kondisi tidak dikenali. Konsultasikan dengan ahli pertanian setempat.",
      symptoms: ["Gejala tidak teridentifikasi"], treatment: ["Konsultasikan dengan Dinas Pertanian setempat"], emoji: "❓",
    };
  };

  const capitalizeClass = (s: string) =>
    s ? s.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "Unknown";

  const handleFile = async (selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/")) { setError("File harus berupa gambar (PNG, JPG, atau JPEG)."); return; }
    if (selectedFile.size > 5 * 1024 * 1024) { setError("Ukuran file tidak boleh melebihi 5MB."); return; }
    setFile(selectedFile); setError(null); setResult(null);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setIsAnalyzing(true);
    try {
      const startTime = Date.now();
      const response = await diseaseService.detectDisease(selectedFile);
      setResult({ ...response, inference_time_ms: response.inference_time_ms || (Date.now() - startTime) });
    } catch (err: any) {
      setError(err.message || "Gagal melakukan deteksi penyakit.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null); setResult(null); setError(null);
  };

  const diseaseInfo = result ? getDiseaseInfo(result.predicted_class) : null;

  return (
    <Card title="Diagnosis Penyakit Cepat" eyebrow="Deteksi">
      <div className="space-y-4">
        {/* Upload Zone */}
        {!previewUrl && (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]); }}
            onClick={() => fileInputRef.current?.click()}
            className={`rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer px-4 py-10 flex flex-col items-center justify-center text-center ${
              isDragging ? "border-[#C9A24B] bg-[#C9A24B]/5" : "border-[#2A3530]/15 dark:border-[#E8E6DF]/15 bg-white/30 dark:bg-white/[0.04] hover:border-[#C9A24B]/50"
            }`}
          >
            <input type="file" ref={fileInputRef} onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} accept="image/png, image/jpeg, image/jpg" className="hidden" />
            <span className="inline-flex w-12 h-12 items-center justify-center rounded-full bg-[#C9A24B]/15 text-[#8C6E26] dark:text-[#C9A24B] mb-3">
              <UploadCloud size={20} strokeWidth={1.6} />
            </span>
            <p className="font-serif text-[15px] text-[#2A3530] dark:text-[#E8E6DF] font-medium">Tarik &amp; taruh foto daun padi di sini</p>
            <p className="text-[12px] text-[#5F6A64] dark:text-[#A8AFA9] mt-1">atau klik untuk memilih dari komputer</p>
            <p className="text-[11px] text-[#5F6A64]/60 dark:text-[#A8AFA9]/50 mt-3 font-mono">PNG / JPG · maks. 5MB</p>
            <div className="mt-4 flex flex-wrap justify-center gap-1.5">
              {["Hispa 🐛", "Brown Spot 🟤", "Blast 🚨", "Tungro 🦠", "Sehat ✅"].map((d) => (
                <span key={d} className="px-2 py-0.5 rounded-full text-[10px] border border-[#2A3530]/10 dark:border-[#E8E6DF]/10 text-[#5F6A64] dark:text-[#A8AFA9]">{d}</span>
              ))}
            </div>
          </div>
        )}

        {/* Preview + Analyzing overlay */}
        {previewUrl && (
          <div className="relative rounded-xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/12 bg-[#EFEBE1]/30 dark:bg-black/20 p-4 flex flex-col items-center justify-center min-h-[200px]">
            {isAnalyzing && (
              <div className="absolute inset-0 bg-[#EFEBE1]/88 dark:bg-[#0E1619]/92 rounded-xl flex flex-col items-center justify-center z-10 backdrop-blur-sm gap-2">
                <Loader2 className="animate-spin text-[#C9A24B]" size={34} />
                <p className="text-[13px] font-medium text-[#2A3530] dark:text-[#E8E6DF]">Menganalisis gambar…</p>
                <p className="text-[11px] text-[#5F6A64] dark:text-[#A8AFA9] font-mono">Paddy SoftVoting Ensemble</p>
              </div>
            )}
            <img src={previewUrl} alt="Paddy leaf preview" className="max-h-[200px] w-auto rounded-lg object-contain shadow-md" />
            {file && !isAnalyzing && <p className="mt-2 text-[11px] text-[#5F6A64] dark:text-[#A8AFA9] truncate max-w-full">{file.name}</p>}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg border border-[#A04848]/20 bg-[#A04848]/5 text-[#A04848] dark:text-[#D17878] text-[12px] leading-relaxed">
            {error}
            <button onClick={handleReset} className="block mt-2 text-[#C9A24B] hover:underline font-medium focus:outline-none cursor-pointer">Coba File Lain</button>
          </div>
        )}

        {/* Rich Result */}
        {result && diseaseInfo && !error && !isAnalyzing && (
          <div className="space-y-4">
            {/* Diagnosis header */}
            <div className={`rounded-xl border border-[#2A3530]/8 dark:border-[#E8E6DF]/8 ${diseaseInfo.severityBg} p-4`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#5F6A64] dark:text-[#A8AFA9] mb-1">Hasil Diagnosis</p>
                  <p className="font-serif text-[16px] text-[#2A3530] dark:text-[#E8E6DF] font-semibold leading-snug">
                    {diseaseInfo.emoji} {diseaseInfo.name}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border" style={{ color: diseaseInfo.severityColor, borderColor: diseaseInfo.severityColor + "40" }}>
                    {diseaseInfo.severity}
                  </span>
                  <p className="font-mono text-[24px] font-bold mt-1" style={{ color: diseaseInfo.severityColor }}>
                    {(result.confidence * 100).toFixed(1)}%
                  </p>
                  <p className="text-[10px] text-[#5F6A64] dark:text-[#A8AFA9]">Kepercayaan</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-[12px] text-[#5F6A64] dark:text-[#A8AFA9] leading-relaxed">{diseaseInfo.description}</p>

            {/* Top-k probability bars */}
            {result.top_k_predictions && result.top_k_predictions.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#5F6A64] dark:text-[#A8AFA9]">Probabilitas Kelas</p>
                {result.top_k_predictions.map((pred) => (
                  <div key={pred.class_name} className="space-y-0.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#2A3530] dark:text-[#E8E6DF]">{capitalizeClass(pred.class_name)}</span>
                      <span className="font-mono text-[#5F6A64] dark:text-[#A8AFA9]">{(pred.probability * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#2A3530]/8 dark:bg-white/8 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pred.probability * 100}%`, background: pred.class_name.toLowerCase() === result.predicted_class.toLowerCase() ? diseaseInfo.severityColor : "#5F6A64" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Symptoms + Treatment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#2A3530]/10 dark:border-[#E8E6DF]/8 bg-white/30 dark:bg-white/[0.03] p-3">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#5F6A64] dark:text-[#A8AFA9] mb-2">🔍 Gejala</p>
                <ul className="space-y-1.5">
                  {diseaseInfo.symptoms.map((s, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[11px] text-[#2A3530] dark:text-[#E8E6DF]">
                      <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full" style={{ background: diseaseInfo.severityColor }} />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-[#7A9A6E]/20 bg-[#7A9A6E]/5 p-3">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#5F6A64] dark:text-[#A8AFA9] mb-2">💊 Rekomendasi</p>
                <ul className="space-y-1.5">
                  {diseaseInfo.treatment.map((t, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[11px] text-[#2A3530] dark:text-[#E8E6DF]">
                      <span className="shrink-0 mt-0.5 text-[#7A9A6E] dark:text-[#84B878] font-bold">→</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Model info + reset */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#5F6A64]/70 dark:text-[#A8AFA9]/60 font-mono border-t border-[#2A3530]/8 dark:border-[#E8E6DF]/8 pt-3">
              <span>Model: {result.model_used}</span>
              <span>Inferensi: {result.inference_time_ms}ms</span>
            </div>
            <button type="button" onClick={handleReset} className="w-full inline-flex items-center justify-center h-10 px-4 rounded-lg bg-[#C9A24B] text-[#2A1F08] text-[13px] hover:bg-[#D4B05E] transition-colors cursor-pointer font-medium focus:outline-none">
              Analisis Foto Lain
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
