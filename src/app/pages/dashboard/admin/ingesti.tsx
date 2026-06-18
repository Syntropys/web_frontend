import { useRef, useState } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  Database,
  RefreshCw,
  Loader2,
  FileJson,
} from "lucide-react";
import { DashboardLayout } from "../../../components/dashboard-layout";
import { supabase } from "@/lib/supabase";

type Source =
  | "BPS Produksi"
  | "NASA POWER Cuaca"
  | "GeoJSON Wilayah"
  | "Dataset Penyakit"
  | "Model AI (JSON)";

type IngestStatus = "valid" | "warning" | "invalid" | "validating" | "ingested" | "inserting";

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

/** Map Source ke nama tabel Supabase & kolom wajib */
const schemaBySource: Record<
  Source,
  { ext: string[]; mime: string[]; required: string[]; table: string; label: string }
> = {
  "BPS Produksi": {
    ext: [".csv", ".xlsx", ".json"],
    mime: ["text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/json", ""],
    required: ["region_id", "year", "production_ton"],
    table: "production_history",
    label: "Produksi Historis",
  },
  "NASA POWER Cuaca": {
    ext: [".csv", ".json"],
    mime: ["text/csv", "application/json", ""],
    required: ["region_id", "year", "rainfall_mm"],
    table: "weather_history",
    label: "Iklim Historis",
  },
  "GeoJSON Wilayah": {
    ext: [".json", ".geojson"],
    mime: ["application/json", "application/geo+json", "application/octet-stream", ""],
    required: ["type", "features"],
    table: "regions",
    label: "Wilayah",
  },
  "Dataset Penyakit": {
    ext: [".csv", ".zip"],
    mime: ["text/csv", "application/zip", "application/x-zip-compressed", ""],
    required: ["image_path", "label", "split"],
    table: "disease_dataset",
    label: "Dataset Penyakit",
  },
  "Model AI (JSON)": {
    ext: [".json"],
    mime: ["application/json", ""],
    required: ["id"],
    table: "auto-detect",
    label: "Output Model AI",
  },
};

/** Map nama file ke tabel Supabase untuk ingesti otomatis */
const FILE_TABLE_MAP: Record<string, string> = {
  "regions": "regions",
  "production_history": "production_history",
  "weather_history": "weather_history",
  "predictions": "predictions",
  "model_metrics": "model_metrics",
  "disease_model_info": "disease_model_info",
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB untuk JSON besar
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

/** Deteksi tabel dari nama file (tanpa ekstensi) */
function detectTableFromFilename(filename: string): string | null {
  const base = filename.replace(/\.[^.]+$/, "").toLowerCase().replace(/[-\s]/g, "_");
  for (const [key, table] of Object.entries(FILE_TABLE_MAP)) {
    if (base.includes(key)) return table;
  }
  return null;
}

export default function IngestiPage() {
  const [source, setSource] = useState<Source>("Model AI (JSON)");
  const [staged, setStaged] = useState<{ job: IngestJob; data: any[] } | null>(null);
  const [history, setHistory] = useState<IngestJob[]>([]);
  const [dragging, setDragging] = useState(false);
  const [dbLoading, setDbLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const schema = schemaBySource[source];

  const handleFile = async (file: File) => {
    const safeName = sanitizeFilename(file.name);
    const ext = getExtension(file.name);
    const baseJob: IngestJob = {
      id: `j-${Math.floor(Math.random() * 9000 + 1000)}`,
      fileName: safeName,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      source,
      status: "validating",
      message: "Memvalidasi struktur file…",
      uploadedAt: "Baru saja",
    };
    setStaged({ job: baseJob, data: [] });

    if (file.size > MAX_FILE_SIZE) {
      setStaged({
        job: { ...baseJob, status: "invalid", message: `Ukuran file melebihi batas 50 MB · ditolak` },
        data: [],
      });
      return;
    }

    if (!schema.ext.includes(ext)) {
      setStaged({
        job: {
          ...baseJob,
          status: "invalid",
          message: `Ekstensi "${ext || "tidak ada"}" tidak didukung. Wajib: ${schema.ext.join(", ")}`,
        },
        data: [],
      });
      return;
    }

    try {
      const text = await file.text();

      if (ext === ".json" || ext === ".geojson") {
        const parsed = JSON.parse(text);
        const arr = Array.isArray(parsed) ? parsed : parsed.features || [parsed];

        // Deteksi tabel otomatis untuk Mode AI
        let targetTable: string | null = null;
        if (source === "Model AI (JSON)") {
          targetTable = detectTableFromFilename(file.name);
          if (!targetTable) {
            setStaged({
              job: {
                ...baseJob,
                status: "warning",
                rows: arr.length,
                message: `Tidak dapat mendeteksi tabel tujuan dari nama file "${safeName}". Pastikan nama file sesuai: regions.json, production_history.json, predictions.json, dll.`,
              },
              data: arr,
            });
            return;
          }
        }

        const displayTable = targetTable || schema.table;
        setStaged({
          job: {
            ...baseJob,
            rows: arr.length,
            status: "valid",
            message: `✓ ${arr.length.toLocaleString("id-ID")} records · siap dimasukkan ke tabel "${displayTable}"`,
          },
          data: arr,
        });
      } else if (ext === ".csv") {
        const lines = text.split(/\r?\n/).filter(Boolean);
        const rows = lines.length - 1;
        const header = lines[0]?.toLowerCase() ?? "";
        const missing = schema.required.find(
          (r) => !header.includes(r.toLowerCase())
        );
        if (missing) {
          setStaged({
            job: { ...baseJob, status: "invalid", message: `Kolom wajib "${missing}" tidak ditemukan`, rows: 0 },
            data: [],
          });
          return;
        }
        setStaged({
          job: {
            ...baseJob,
            rows,
            status: "valid",
            message: `✓ ${rows.toLocaleString("id-ID")} baris CSV valid · perlu konversi ke JSON sebelum insert`,
          },
          data: [],
        });
      } else {
        setStaged({
          job: { ...baseJob, status: "valid", rows: 0, message: "File diterima · validasi manual diperlukan" },
          data: [],
        });
      }
    } catch (err: any) {
      setStaged({
        job: { ...baseJob, status: "invalid", message: `Gagal parse file: ${err.message}` },
        data: [],
      });
    }
  };

  const confirmIngest = async () => {
    if (!staged || (staged.job.status !== "valid" && staged.job.status !== "warning")) return;
    if (staged.data.length === 0) {
      // CSV mode - tidak bisa langsung insert, info saja
      const done: IngestJob = {
        ...staged.job,
        status: "warning",
        message: "File CSV diterima tapi insert manual via Supabase SQL diperlukan. Gunakan file JSON dari script extract_to_supabase_json.py.",
        uploadedAt: new Date().toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " WITA",
      };
      setHistory((h) => [done, ...h]);
      setStaged(null);
      return;
    }

    const targetTable = detectTableFromFilename(staged.job.fileName) || schema.table;
    if (targetTable === "auto-detect" || !targetTable) {
      alert("Tidak bisa mendeteksi tabel tujuan. Pastikan nama file sesuai konvensi.");
      return;
    }

    setStaged((prev) => prev ? { ...prev, job: { ...prev.job, status: "inserting", message: `Menyuntikkan ${staged.data.length} records ke tabel "${targetTable}"…` } } : null);
    setDbLoading(true);

    try {
      const BATCH_SIZE = 500;
      let totalInserted = 0;

      for (let i = 0; i < staged.data.length; i += BATCH_SIZE) {
        const batch = staged.data.slice(i, i + BATCH_SIZE);
        const { error } = await (supabase.from(targetTable) as any).upsert(batch, {
          onConflict: "id",
          ignoreDuplicates: false,
        });
        if (error) throw error;
        totalInserted += batch.length;
      }

      const done: IngestJob = {
        ...staged.job,
        status: "ingested",
        message: `✓ ${totalInserted.toLocaleString("id-ID")} records berhasil dimasukkan ke tabel "${targetTable}"`,
        uploadedAt: new Date().toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " WITA",
      };
      setHistory((h) => [done, ...h]);
      setStaged(null);
    } catch (err: any) {
      setStaged((prev) =>
        prev
          ? {
              ...prev,
              job: {
                ...prev.job,
                status: "invalid",
                message: `Gagal insert: ${err.message}`,
              },
            }
          : null
      );
    } finally {
      setDbLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const stagedJob = staged?.job;

  return (
    <DashboardLayout
      pageTitle="Ingesti Data"
      eyebrow="Administrasi"
      title="Manajemen Ingesti Data"
      description="Unggah JSON hasil ekstraksi model AI atau dataset historis langsung ke Supabase."
    >
      {/* Info Banner untuk Mode AI */}
      {source === "Model AI (JSON)" && (
        <div className="mb-4 rounded-xl border border-[#C9A24B]/25 bg-[#C9A24B]/8 p-3.5 flex gap-3">
          <FileJson size={16} className="text-[#8C6E26] dark:text-[#C9A24B] shrink-0 mt-0.5" strokeWidth={1.7} />
          <div className="text-[12px] text-[#5F6A64] dark:text-[#B8BFB9] leading-relaxed">
            <span className="font-medium text-[#2A3530] dark:text-[#E8E6DF]">Mode Model AI:</span>{" "}
            Upload file JSON dari <code className="font-mono bg-black/5 dark:bg-white/5 px-1 rounded">ai_models/supabase_ready/</code>.
            Urutan import: <code className="font-mono bg-black/5 dark:bg-white/5 px-1 rounded">regions.json</code> → <code className="font-mono bg-black/5 dark:bg-white/5 px-1 rounded">production_history.json</code> → <code className="font-mono bg-black/5 dark:bg-white/5 px-1 rounded">weather_history.json</code> → <code className="font-mono bg-black/5 dark:bg-white/5 px-1 rounded">predictions.json</code>
          </div>
        </div>
      )}

      <section className="rounded-2xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/12 bg-white/40 dark:bg-white/[0.02] p-4 sm:p-5 mb-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Source Selector + Schema Info */}
          <div className="lg:col-span-1 space-y-3">
            <div>
              <label className="block text-[12px] text-[#4A5550] dark:text-[#B8BFB9] mb-1.5">
                Jenis Sumber Data
              </label>
              <select
                value={source}
                onChange={(e) => {
                  setSource(e.target.value as Source);
                  setStaged(null);
                }}
                className="w-full px-3 py-2.5 rounded-lg border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 bg-white/60 dark:bg-white/[0.03] text-[14px] text-[#2A3530] dark:text-[#E8E6DF] outline-none focus:border-[#C9A24B] focus:ring-2 focus:ring-[#C9A24B]/20 transition-colors cursor-pointer"
              >
                {(Object.keys(schemaBySource) as Source[]).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/8 bg-white/30 dark:bg-white/[0.02] p-3.5">
              <div className="flex items-center gap-2 mb-2.5">
                <Database size={14} strokeWidth={1.7} className="text-[#8C6E26] dark:text-[#C9A24B]" />
                <span className="text-[12px] uppercase tracking-wider text-[#5F6A64] dark:text-[#A8AFA9]">
                  Target Supabase
                </span>
              </div>
              <div className="text-[12px] text-[#5F6A64] dark:text-[#B8BFB9] space-y-1.5">
                <div>
                  <span className="text-[#5F6A64] dark:text-[#A8AFA9]">Format: </span>
                  <span className="font-mono text-[#2A3530] dark:text-[#E8E6DF]">
                    {schema.ext.join(", ")}
                  </span>
                </div>
                <div>
                  <span className="text-[#5F6A64] dark:text-[#A8AFA9]">Tabel: </span>
                  <span className="font-mono text-[#2A3530] dark:text-[#E8E6DF] break-all">
                    {schema.table}
                  </span>
                </div>
                {source === "Model AI (JSON)" && (
                  <div className="pt-1.5 border-t border-[#2A3530]/10 dark:border-[#E8E6DF]/8">
                    <div className="text-[#5F6A64] dark:text-[#A8AFA9] mb-1.5">File yang tersedia:</div>
                    <div className="space-y-1">
                      {Object.entries(FILE_TABLE_MAP).map(([file, table]) => (
                        <div key={file} className="flex items-center justify-between gap-1 text-[11px]">
                          <span className="font-mono text-[#2A3530] dark:text-[#E8E6DF]">{file}.json</span>
                          <span className="text-[#5F6A64] dark:text-[#A8AFA9]">→ {table}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Drop Zone */}
          <div className="lg:col-span-2">
            <input
              ref={inputRef}
              type="file"
              accept={schema.ext.join(",")}
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="hidden"
            />
            <label
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
              <span className="inline-flex w-12 h-12 items-center justify-center rounded-full bg-[#C9A24B]/15 text-[#8C6E26] dark:text-[#C9A24B] mb-3">
                <UploadCloud size={20} strokeWidth={1.6} />
              </span>
              <p className="text-[13px] text-[#2A3530] dark:text-[#E8E6DF]">
                Seret file ke sini atau{" "}
                <span className="text-[#8C6E26] dark:text-[#C9A24B]">klik untuk pilih</span>
              </p>
              <p className="text-[12px] text-[#5F6A64] dark:text-[#A8AFA9] mt-1.5">
                {schema.ext.join(", ")} · maks. 50 MB
              </p>
            </label>

            {stagedJob && (
              <div className={`mt-4 rounded-xl border p-3.5 ${statusBoxClass(stagedJob.status)}`}>
                <div className="flex items-start gap-3">
                  <StatusIcon status={stagedJob.status} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-[#2A3530] dark:text-[#E8E6DF]">
                      <FileSpreadsheet size={14} strokeWidth={1.7} className="shrink-0 text-[#5F6A64] dark:text-[#A8AFA9]" />
                      <span className="truncate min-w-0">{stagedJob.fileName}</span>
                      <span className="text-[12px] text-[#5F6A64] dark:text-[#A8AFA9] whitespace-nowrap">
                        · {stagedJob.size}
                      </span>
                      {stagedJob.rows !== undefined && stagedJob.rows > 0 && (
                        <span className="text-[12px] text-[#5F6A64] dark:text-[#A8AFA9] whitespace-nowrap">
                          · {stagedJob.rows.toLocaleString("id-ID")} records
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[12px] text-[#5F6A64] dark:text-[#B8BFB9]">
                      {stagedJob.message}
                    </p>
                  </div>
                  {stagedJob.status !== "inserting" && (
                    <button
                      onClick={() => setStaged(null)}
                      aria-label="Buang"
                      className="w-7 h-7 inline-flex items-center justify-center rounded-md text-[#5F6A64] dark:text-[#A8AFA9] hover:text-[#A04848] transition-colors cursor-pointer shrink-0"
                    >
                      <X size={14} strokeWidth={1.7} />
                    </button>
                  )}
                </div>

                {(stagedJob.status === "valid" || stagedJob.status === "warning") && (
                  <div className="mt-3 pt-3 border-t border-[#2A3530]/10 dark:border-[#E8E6DF]/8 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
                    <button
                      onClick={() => setStaged(null)}
                      className="px-4 py-2 rounded-lg text-[12px] text-[#5F6A64] dark:text-[#B8BFB9] hover:text-[#8C6E26] dark:hover:text-[#C9A24B] transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      onClick={confirmIngest}
                      disabled={dbLoading}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#C9A24B] text-[#2A1F08] text-[12px] hover:bg-[#D4B05E] transition-colors cursor-pointer disabled:opacity-60"
                    >
                      <Database size={13} strokeWidth={1.8} />
                      Suntikkan ke Supabase
                    </button>
                  </div>
                )}

                {stagedJob.status === "inserting" && (
                  <div className="mt-3 pt-3 border-t border-[#2A3530]/10 dark:border-[#E8E6DF]/8 flex items-center gap-2 text-[12px] text-[#5F6A64] dark:text-[#A8AFA9]">
                    <Loader2 size={14} className="animate-spin text-[#C9A24B]" />
                    Sedang menyuntikkan data ke Supabase...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* History */}
      <section className="rounded-2xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/12 bg-white/40 dark:bg-white/[0.02] p-4 sm:p-5">
        <header className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#8C6E26] dark:text-[#C9A24B]">
              Riwayat
            </span>
            <span className="h-px w-6 bg-[#C9A24B]/40" />
            <h3 className="font-serif text-[15px] text-[#2A3530] dark:text-[#E8E6DF]">
              Ingesti Sesi Ini
            </h3>
          </div>
          {history.length > 0 && (
            <span className="text-[12px] text-[#5F6A64] dark:text-[#A8AFA9]">
              {history.length} operasi
            </span>
          )}
        </header>

        {history.length === 0 ? (
          <div className="text-center py-10 text-[13px] text-[#5F6A64] dark:text-[#A8AFA9]">
            Belum ada ingesti dalam sesi ini. Upload file JSON dari folder{" "}
            <code className="font-mono text-[11px] bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded">
              ai_models/supabase_ready/
            </code>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {history.map((j) => (
              <li
                key={j.id}
                className="rounded-xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/8 bg-white/30 dark:bg-white/[0.02] p-3.5"
              >
                <div className="flex items-start gap-3">
                  <StatusIcon status={j.status} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-[#2A3530] dark:text-[#E8E6DF]">
                      <span className="truncate min-w-0">{j.fileName}</span>
                      <span className="inline-flex whitespace-nowrap px-2.5 py-0.5 rounded-full text-[12px] bg-[#2A3530]/8 dark:bg-[#E8E6DF]/8 text-[#5F6A64] dark:text-[#B8BFB9]">
                        {j.source}
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] text-[#5F6A64] dark:text-[#B8BFB9]">{j.message}</p>
                    <div className="mt-1.5 text-[12px] text-[#5F6A64] dark:text-[#A8AFA9]">
                      {j.size} {j.rows ? `· ${j.rows.toLocaleString("id-ID")} records` : ""} · {j.uploadedAt}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
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
      return "border-[#A04848]/15 bg-[#A04848]/12";
    case "inserting":
      return "border-[#2A3530]/15 dark:border-[#E8E6DF]/12 bg-white/30 dark:bg-white/[0.02]";
    default:
      return "border-[#2A3530]/15 dark:border-[#E8E6DF]/12 bg-white/30 dark:bg-white/[0.02]";
  }
}

function StatusIcon({ status }: { status: IngestStatus }) {
  const base = "shrink-0 w-8 h-8 inline-flex items-center justify-center rounded-md";
  if (status === "valid" || status === "ingested")
    return (
      <span className={`${base} bg-[#7A9A6E]/15 text-[#5A8A4E] dark:text-[#7A9A6E]`}>
        <CheckCircle2 size={15} strokeWidth={1.8} />
      </span>
    );
  if (status === "warning")
    return (
      <span className={`${base} bg-[#C9A24B]/15 text-[#8C6E26] dark:text-[#C9A24B]`}>
        <AlertTriangle size={15} strokeWidth={1.8} />
      </span>
    );
  if (status === "invalid")
    return (
      <span className={`${base} bg-[#A04848]/15 text-[#A04848] dark:text-[#D17878]`}>
        <AlertTriangle size={15} strokeWidth={1.8} />
      </span>
    );
  return (
    <span className={`${base} bg-[#2A3530]/8 dark:bg-[#E8E6DF]/8 text-[#5F6A64] dark:text-[#B8BFB9] animate-pulse`}>
      <RefreshCw size={15} strokeWidth={1.8} />
    </span>
  );
}
