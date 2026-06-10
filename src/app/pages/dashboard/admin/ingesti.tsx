import { useRef, useState } from "react";
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, X, Database, RefreshCw } from "lucide-react";
import { DashboardLayout } from "../../../components/dashboard-layout";

type Source = "BPS Produksi" | "NASA POWER Cuaca" | "GeoJSON Wilayah" | "Dataset Penyakit";
type IngestStatus = "valid" | "warning" | "invalid" | "validating" | "ingested";

type IngestJob = {
  id: string;
  fileName: string;
  size: string;
  source: Source;
  rows?: number;
  status: IngestStatus;
  message: string;
  uploadedAt: string;
};

const seedHistory: IngestJob[] = [
  {
    id: "j-104",
    fileName: "bps-produksi-kalsel-2025.csv",
    size: "1.2 MB",
    source: "BPS Produksi",
    rows: 4820,
    status: "ingested",
    message: "Disuntikkan ke tabel agrolytics.produksi_historis",
    uploadedAt: "4 Jun 2026, 16:24 WITA",
  },
  {
    id: "j-103",
    fileName: "nasa-power-mei-2026.csv",
    size: "3.4 MB",
    source: "NASA POWER Cuaca",
    rows: 12480,
    status: "ingested",
    message: "Disuntikkan ke tabel agrolytics.iklim_harian",
    uploadedAt: "3 Jun 2026, 09:51 WITA",
  },
  {
    id: "j-102",
    fileName: "geojson-batas-kab.json",
    size: "812 KB",
    source: "GeoJSON Wilayah",
    rows: 54,
    status: "warning",
    message: "2 geometri overlap terdeteksi · perlu verifikasi manual",
    uploadedAt: "2 Jun 2026, 14:10 WITA",
  },
  {
    id: "j-101",
    fileName: "bps-produksi-kalteng-2024.csv",
    size: "980 KB",
    source: "BPS Produksi",
    rows: 0,
    status: "invalid",
    message: "Kolom 'kabupaten_id' hilang · file ditolak",
    uploadedAt: "1 Jun 2026, 10:32 WITA",
  },
];

const schemaBySource: Record<Source, { ext: string[]; mime: string[]; required: string[]; target: string }> = {
  "BPS Produksi": {
    ext: [".csv", ".xlsx"],
    mime: ["text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ""],
    required: ["kabupaten_id", "tahun", "luas_panen_ha", "produksi_ton"],
    target: "agrolytics.produksi_historis",
  },
  "NASA POWER Cuaca": {
    ext: [".csv"],
    mime: ["text/csv", "application/vnd.ms-excel", ""],
    required: ["lat", "lon", "tanggal", "t2m", "prectot", "rh2m"],
    target: "agrolytics.iklim_harian",
  },
  "GeoJSON Wilayah": {
    ext: [".json", ".geojson"],
    mime: ["application/json", "application/geo+json", "application/octet-stream", ""],
    required: ["type", "features"],
    target: "agrolytics.geo_wilayah",
  },
  "Dataset Penyakit": {
    ext: [".csv", ".zip"],
    mime: ["text/csv", "application/zip", "application/x-zip-compressed", ""],
    required: ["image_path", "label", "split"],
    target: "agrolytics.cnn_dataset",
  },
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILENAME_LENGTH = 100;

function sanitizeFilename(name: string): string {
  return name
    .replace(/\.{2,}/g, ".")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/^[._-]+/, "")
    .slice(0, MAX_FILENAME_LENGTH);
}

function getExtension(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx === -1 ? "" : name.slice(idx).toLowerCase();
}

async function peekHeader(file: File): Promise<string> {
  const slice = file.slice(0, 8192);
  return await slice.text();
}

function validateCsvHeader(text: string, required: string[]): string | null {
  const stripped = text.replace(/^﻿/, "");
  const firstLine = stripped.split(/\r?\n/)[0]?.toLowerCase() ?? "";
  const cols = firstLine.split(/[,;\t]/).map((c) => c.trim().replace(/^"|"$/g, ""));
  const missing = required.filter((r) => !cols.includes(r.toLowerCase()));
  return missing.length ? missing[0] : null;
}

function validateGeoJson(text: string, required: string[]): string | null {
  const head = text.replace(/^﻿/, "").slice(0, 4096);
  for (const key of required) {
    const re = new RegExp(`["']${key}["']\\s*:`, "i");
    if (!re.test(head)) return key;
  }
  return null;
}

export default function IngestiPage() {
  const [source, setSource] = useState<Source>("BPS Produksi");
  const [staged, setStaged] = useState<IngestJob | null>(null);
  const [history, setHistory] = useState(seedHistory);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const schema = schemaBySource[source];

  const handleFile = async (file: File) => {
    const safeName = sanitizeFilename(file.name);
    const ext = getExtension(file.name);
    const job: IngestJob = {
      id: `j-${Math.floor(Math.random() * 900 + 100)}`,
      fileName: safeName,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      source,
      status: "validating",
      message: "Memvalidasi struktur file…",
      uploadedAt: "Baru saja",
    };
    setStaged(job);

    if (file.size > MAX_FILE_SIZE) {
      setStaged({
        ...job,
        status: "invalid",
        message: `Ukuran file ${(file.size / 1024 / 1024).toFixed(1)} MB melebihi batas 10 MB · file ditolak`,
      });
      return;
    }

    if (file.size === 0) {
      setStaged({ ...job, status: "invalid", message: "File kosong · ditolak" });
      return;
    }

    if (!schema.ext.includes(ext)) {
      setStaged({
        ...job,
        status: "invalid",
        message: `Ekstensi "${ext || "tidak ada"}" tidak didukung. Wajib: ${schema.ext.join(", ")}`,
      });
      return;
    }

    if (file.type && !schema.mime.includes(file.type)) {
      setStaged({
        ...job,
        status: "invalid",
        message: `Tipe MIME "${file.type}" tidak sesuai dengan ekstensi · file ditolak`,
      });
      return;
    }

    try {
      const head = await peekHeader(file);
      let missing: string | null = null;
      if (ext === ".csv") {
        missing = validateCsvHeader(head, schema.required);
      } else if (ext === ".json" || ext === ".geojson") {
        missing = validateGeoJson(head, schema.required);
      }

      if (missing) {
        setStaged({
          ...job,
          status: "invalid",
          message: `Kolom/field wajib "${missing}" tidak ditemukan · file ditolak`,
          rows: 0,
        });
        return;
      }

      const simulatedRows = Math.floor(Math.random() * 5000 + 500);
      const warn = Math.random() < 0.2;
      setStaged({
        ...job,
        rows: simulatedRows,
        status: warn ? "warning" : "valid",
        message: warn
          ? `${Math.floor(simulatedRows * 0.02)} baris memiliki nilai kosong · bisa dilanjutkan dengan catatan`
          : `Struktur valid · siap disuntikkan ke ${schema.target}`,
      });
    } catch {
      setStaged({
        ...job,
        status: "invalid",
        message: "Gagal membaca isi file · pastikan file tidak rusak",
      });
    }
  };

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const confirmIngest = () => {
    if (!staged || (staged.status !== "valid" && staged.status !== "warning")) return;
    const ingested: IngestJob = {
      ...staged,
      status: "ingested",
      message: `Disuntikkan ke tabel ${schema.target}`,
      uploadedAt: new Date().toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " WITA",
    };
    setHistory((h) => [ingested, ...h]);
    setStaged(null);
  };

  return (
    <DashboardLayout
      pageTitle="Ingesti Data"
      eyebrow="Administrasi"
      title="Manajemen Ingesti Data"
      description="Unggah, validasi, dan suntikkan dataset historis ke basis data Supabase."
    >
      <section className="rounded-2xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/12 bg-white/40 dark:bg-white/[0.02] p-4 sm:p-5 mb-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 space-y-3">
            <div>
              <label className="block text-[12px] text-[#4A5550] dark:text-[#B8BFB9] mb-1.5">Jenis Sumber Data</label>
              <select
                value={source}
                onChange={(e) => {
                  setSource(e.target.value as Source);
                  setStaged(null);
                }}
                className="w-full px-3 py-2.5 rounded-lg border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 bg-white/60 dark:bg-white/[0.03] text-[14px] text-[#2A3530] dark:text-[#E8E6DF] outline-none focus:border-[#C9A24B] focus:ring-2 focus:ring-[#C9A24B]/20 transition-colors cursor-pointer"
              >
                {(Object.keys(schemaBySource) as Source[]).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="rounded-xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/8 bg-white/30 dark:bg-white/[0.02] p-3.5">
              <div className="flex items-center gap-2 mb-2.5">
                <Database size={14} strokeWidth={1.7} className="text-[#A07F2E] dark:text-[#C9A24B]" />
                <span className="text-[12px] uppercase tracking-wider text-[#5F6A64] dark:text-[#A8AFA9]">Skema Wajib</span>
              </div>
              <div className="text-[12px] text-[#5F6A64] dark:text-[#B8BFB9] space-y-1.5">
                <div>
                  <span className="text-[#5F6A64] dark:text-[#A8AFA9]">Format: </span>
                  <span className="font-mono text-[#2A3530] dark:text-[#E8E6DF]">{schema.ext.join(", ")}</span>
                </div>
                <div>
                  <span className="text-[#5F6A64] dark:text-[#A8AFA9]">Tabel target: </span>
                  <span className="font-mono text-[#2A3530] dark:text-[#E8E6DF] break-all">{schema.target}</span>
                </div>
                <div className="pt-1.5 border-t border-[#2A3530]/10 dark:border-[#E8E6DF]/8">
                  <div className="text-[#5F6A64] dark:text-[#A8AFA9] mb-1">Kolom wajib:</div>
                  <div className="flex flex-wrap gap-1">
                    {schema.required.map((c) => (
                      <span key={c} className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[#2A3530]/8 dark:bg-[#E8E6DF]/8 text-[#2A3530] dark:text-[#E8E6DF]">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <input
              ref={inputRef}
              type="file"
              accept={schema.ext.join(",")}
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="hidden"
            />
            <label
              htmlFor=""
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`block rounded-xl border-2 border-dashed px-4 py-10 sm:py-14 text-center cursor-pointer transition-colors ${
                dragging
                  ? "border-[#C9A24B] bg-[#C9A24B]/12"
                  : "border-[#2A3530]/15 dark:border-[#E8E6DF]/15 bg-white/30 dark:bg-white/[0.02] hover:border-[#C9A24B]/60"
              }`}
            >
              <span className="inline-flex w-12 h-12 items-center justify-center rounded-full bg-[#C9A24B]/15 text-[#A07F2E] dark:text-[#C9A24B] mb-3">
                <UploadCloud size={20} strokeWidth={1.6} />
              </span>
              <p className="text-[13px] text-[#2A3530] dark:text-[#E8E6DF]">
                Seret file ke sini atau <span className="text-[#A07F2E] dark:text-[#C9A24B]">klik untuk pilih</span>
              </p>
              <p className="text-[11px] text-[#5F6A64] dark:text-[#A8AFA9] mt-1.5">
                {schema.ext.join(", ")} · maksimum 10 MB
              </p>
            </label>

            {staged && (
              <div className={`mt-4 rounded-xl border p-3.5 ${statusBoxClass(staged.status)}`}>
                <div className="flex items-start gap-3">
                  <StatusIcon status={staged.status} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-[#2A3530] dark:text-[#E8E6DF]">
                      <FileSpreadsheet size={14} strokeWidth={1.7} className="shrink-0 text-[#5F6A64] dark:text-[#A8AFA9]" />
                      <span className="truncate min-w-0">{staged.fileName}</span>
                      <span className="text-[11px] text-[#5F6A64] dark:text-[#A8AFA9] whitespace-nowrap">· {staged.size}</span>
                      {staged.rows !== undefined && staged.rows > 0 && (
                        <span className="text-[11px] text-[#5F6A64] dark:text-[#A8AFA9] whitespace-nowrap">· {staged.rows.toLocaleString("id-ID")} baris</span>
                      )}
                    </div>
                    <p className="mt-1 text-[12px] text-[#5F6A64] dark:text-[#B8BFB9]">{staged.message}</p>
                  </div>
                  <button onClick={() => setStaged(null)} aria-label="Buang" className="w-7 h-7 inline-flex items-center justify-center rounded-md text-[#5F6A64] dark:text-[#A8AFA9] hover:text-[#B85C5C] transition-colors cursor-pointer shrink-0">
                    <X size={14} strokeWidth={1.7} />
                  </button>
                </div>

                {(staged.status === "valid" || staged.status === "warning") && (
                  <div className="mt-3 pt-3 border-t border-[#2A3530]/10 dark:border-[#E8E6DF]/8 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
                    <button onClick={() => setStaged(null)} className="px-4 py-2 rounded-lg text-[12px] text-[#5F6A64] dark:text-[#B8BFB9] hover:text-[#A07F2E] dark:hover:text-[#C9A24B] transition-colors cursor-pointer">
                      Batal
                    </button>
                    <button onClick={confirmIngest} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#C9A24B] text-[#2A1F08] text-[12px] hover:bg-[#D4B05E] transition-colors cursor-pointer">
                      <Database size={13} strokeWidth={1.8} />
                      Suntikkan ke Supabase
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/12 bg-white/40 dark:bg-white/[0.02] p-4 sm:p-5">
        <header className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#A07F2E] dark:text-[#C9A24B]">Riwayat</span>
            <span className="h-px w-6 bg-[#C9A24B]/40" />
            <h3 className="font-serif text-[15px] text-[#2A3530] dark:text-[#E8E6DF]">Ingesti Terakhir</h3>
          </div>
          <button aria-label="Muat ulang" className="w-8 h-8 inline-flex items-center justify-center rounded-md border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 text-[#5F6A64] dark:text-[#B8BFB9] hover:border-[#C9A24B] hover:text-[#A07F2E] dark:hover:text-[#C9A24B] transition-colors cursor-pointer">
            <RefreshCw size={13} strokeWidth={1.7} />
          </button>
        </header>

        <ul className="space-y-2.5">
          {history.map((j) => (
            <li key={j.id} className="rounded-xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/8 bg-white/30 dark:bg-white/[0.02] p-3.5">
              <div className="flex items-start gap-3">
                <StatusIcon status={j.status} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-[#2A3530] dark:text-[#E8E6DF]">
                    <span className="truncate min-w-0">{j.fileName}</span>
                    <span className="inline-flex whitespace-nowrap px-2 py-0.5 rounded-full text-[11px] bg-[#2A3530]/8 dark:bg-[#E8E6DF]/8 text-[#5F6A64] dark:text-[#B8BFB9]">
                      {j.source}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-[#5F6A64] dark:text-[#B8BFB9]">{j.message}</p>
                  <div className="mt-1.5 text-[11px] text-[#5F6A64] dark:text-[#A8AFA9]">
                    {j.size} {j.rows ? `· ${j.rows.toLocaleString("id-ID")} baris` : ""} · {j.uploadedAt}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </DashboardLayout>
  );
}

function statusBoxClass(s: IngestStatus) {
  switch (s) {
    case "valid":
    case "ingested":
      return "border-[#7A9A6E]/15 bg-[#7A9A6E]/12";
    case "warning":
      return "border-[#C9A24B]/15 bg-[#C9A24B]/12";
    case "invalid":
      return "border-[#B85C5C]/15 bg-[#B85C5C]/12";
    default:
      return "border-[#2A3530]/15 dark:border-[#E8E6DF]/12 bg-white/30 dark:bg-white/[0.02]";
  }
}

function StatusIcon({ status }: { status: IngestStatus }) {
  const base = "shrink-0 w-8 h-8 inline-flex items-center justify-center rounded-md";
  if (status === "valid" || status === "ingested")
    return <span className={`${base} bg-[#7A9A6E]/15 text-[#5A8A4E] dark:text-[#7A9A6E]`}><CheckCircle2 size={15} strokeWidth={1.8} /></span>;
  if (status === "warning")
    return <span className={`${base} bg-[#C9A24B]/15 text-[#A07F2E] dark:text-[#C9A24B]`}><AlertTriangle size={15} strokeWidth={1.8} /></span>;
  if (status === "invalid")
    return <span className={`${base} bg-[#B85C5C]/15 text-[#B85C5C] dark:text-[#D17878]`}><AlertTriangle size={15} strokeWidth={1.8} /></span>;
  return <span className={`${base} bg-[#2A3530]/8 dark:bg-[#E8E6DF]/8 text-[#5F6A64] dark:text-[#B8BFB9] animate-pulse`}><RefreshCw size={15} strokeWidth={1.8} /></span>;
}
