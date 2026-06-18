import { DashboardLayout } from "../../components/dashboard-layout";
import { DiseaseDetectionCard } from "../../components/dashboard-widgets";
import { Microscope, Wifi, Info, Leaf, Bug, Flame, Zap } from "lucide-react";

const DISEASE_QUICK_REFS = [
  {
    name: "Hispa",
    emoji: "🐛",
    icon: Bug,
    severity: "Sedang",
    color: "#C9A24B",
    bg: "bg-[#C9A24B]/8",
    border: "border-[#C9A24B]/20",
    desc: "Larva dan imago menggores permukaan daun, meninggalkan guratan putih memanjang.",
  },
  {
    name: "Brown Spot",
    emoji: "🟤",
    icon: Leaf,
    severity: "Sedang",
    color: "#8C6E26",
    bg: "bg-[#8C6E26]/8",
    border: "border-[#8C6E26]/20",
    desc: "Bercak coklat oval dengan tepi kuning pada daun, biasanya akibat kekurangan nutrisi.",
  },
  {
    name: "Blast",
    emoji: "🚨",
    icon: Flame,
    severity: "Tinggi",
    color: "#D17878",
    bg: "bg-[#A04848]/8",
    border: "border-[#A04848]/20",
    desc: "Bercak belah ketupat abu-abu dengan tepi coklat, dapat menyerang leher malai.",
  },
  {
    name: "Tungro",
    emoji: "🦠",
    icon: Zap,
    severity: "Tinggi",
    color: "#D17878",
    bg: "bg-[#A04848]/8",
    border: "border-[#A04848]/20",
    desc: "Daun menguning dari ujung, tanaman kerdil. Disebarkan wereng hijau sebagai vektor.",
  },
];

const API_URL = import.meta.env.VITE_DISEASE_API_URL || "";
const isApiConfigured = API_URL && !API_URL.includes("your-ml-service");

export default function PenyakitPage() {
  return (
    <DashboardLayout
      pageTitle="Deteksi Penyakit Padi"
      eyebrow="Deteksi AI"
      title="Diagnosis Penyakit Daun Padi"
      description="Upload foto daun padi untuk mendapatkan diagnosis penyakit secara instan menggunakan model ensemble SoftVoting CNN (Accuracy ≥ 93%)."
    >
      <div className="space-y-5">
        {/* API Status Banner */}
        <div
          className={`rounded-xl border px-4 py-3 flex items-start gap-2.5 ${
            isApiConfigured
              ? "border-[#7A9A6E]/25 bg-[#7A9A6E]/5"
              : "border-[#C9A24B]/25 bg-[#C9A24B]/5"
          }`}
        >
          <Wifi
            size={14}
            className={`mt-0.5 shrink-0 ${
              isApiConfigured
                ? "text-[#7A9A6E] dark:text-[#84B878]"
                : "text-[#8C6E26] dark:text-[#C9A24B]"
            }`}
          />
          <div>
            <p className="text-[12px] font-medium text-[#2A3530] dark:text-[#E8E6DF]">
              {isApiConfigured
                ? "API Railway Aktif — Mode Inferensi Real"
                : "Mode Demo — API Railway belum dikonfigurasi"}
            </p>
            <p className="text-[11px] text-[#5F6A64] dark:text-[#A8AFA9] mt-0.5">
              {isApiConfigured
                ? `Terhubung ke: ${API_URL}`
                : "Set VITE_DISEASE_API_URL ke URL Railway di Vercel untuk menggunakan model CNN sungguhan. Sementara menggunakan mock inference."}
            </p>
          </div>
        </div>

        {/* Main grid: Detection + Info */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
          {/* Detection Card — wider */}
          <div className="xl:col-span-3">
            <DiseaseDetectionCard />
          </div>

          {/* Sidebar info */}
          <div className="xl:col-span-2 space-y-4">
            {/* How it works */}
            <div className="rounded-2xl border border-[#2A3530]/12 dark:border-[#E8E6DF]/10 bg-white/40 dark:bg-white/[0.04] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Microscope
                  size={14}
                  className="text-[#8C6E26] dark:text-[#C9A24B]"
                  strokeWidth={1.7}
                />
                <p className="text-[12px] font-medium text-[#2A3530] dark:text-[#E8E6DF]">
                  Cara Kerja Model
                </p>
              </div>
              <ol className="space-y-2.5">
                {[
                  { step: "1", text: "Upload foto daun padi yang menunjukkan gejala (PNG/JPG, maks 5MB)" },
                  { step: "2", text: "Model SoftVoting Ensemble memproses gambar menggunakan 3 arsitektur CNN" },
                  { step: "3", text: "Prediksi probabilitas dikombinasikan untuk akurasi optimal (≥93%)" },
                  { step: "4", text: "Hasil diagnosis ditampilkan beserta gejala dan rekomendasi penanganan" },
                ].map((item) => (
                  <li key={item.step} className="flex items-start gap-2.5">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-[#C9A24B]/15 text-[#8C6E26] dark:text-[#C9A24B] text-[10px] font-mono font-bold flex items-center justify-center">
                      {item.step}
                    </span>
                    <span className="text-[12px] text-[#5F6A64] dark:text-[#A8AFA9] leading-relaxed">
                      {item.text}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Model Info */}
            <div className="rounded-2xl border border-[#2A3530]/12 dark:border-[#E8E6DF]/10 bg-white/40 dark:bg-white/[0.04] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Info
                  size={14}
                  className="text-[#8C6E26] dark:text-[#C9A24B]"
                  strokeWidth={1.7}
                />
                <p className="text-[12px] font-medium text-[#2A3530] dark:text-[#E8E6DF]">
                  Spesifikasi Model
                </p>
              </div>
              <dl className="space-y-2">
                {[
                  { label: "Arsitektur", value: "SoftVoting Ensemble CNN" },
                  { label: "Dataset", value: "Paddy Disease Dataset (10.407 gambar)" },
                  { label: "Kelas", value: "4 Penyakit + Sehat" },
                  { label: "Akurasi", value: "≥ 93% (Test Set)" },
                  { label: "Input", value: "224×224 px RGB" },
                  { label: "Backend", value: "FastAPI + Railway" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-2">
                    <dt className="text-[11px] text-[#5F6A64] dark:text-[#A8AFA9]">
                      {item.label}
                    </dt>
                    <dd className="text-[11px] font-mono text-[#2A3530] dark:text-[#E8E6DF] text-right">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* Disease Quick Reference */}
        <div>
          <p className="text-[11px] font-mono uppercase tracking-widest text-[#5F6A64] dark:text-[#A8AFA9] mb-3">
            Referensi Cepat — Penyakit yang Dapat Dideteksi
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {DISEASE_QUICK_REFS.map((d) => {
              const Icon = d.icon;
              return (
                <div
                  key={d.name}
                  className={`rounded-xl border ${d.border} ${d.bg} dark:bg-white/[0.03] p-3.5`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[18px]">{d.emoji}</span>
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full border"
                      style={{ color: d.color, borderColor: d.color + "40" }}
                    >
                      {d.severity}
                    </span>
                  </div>
                  <p className="text-[13px] font-medium text-[#2A3530] dark:text-[#E8E6DF] mb-1">
                    {d.name}
                  </p>
                  <p className="text-[11px] text-[#5F6A64] dark:text-[#A8AFA9] leading-relaxed">
                    {d.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
