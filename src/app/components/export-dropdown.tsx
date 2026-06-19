import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
} from "lucide-react";

type ExportFormat = "csv" | "xlsx" | "pdf";

type ExportOption = {
  format: ExportFormat;
  icon: React.ElementType;
  title: string;
};

const EXPORT_OPTIONS: ExportOption[] = [
  { format: "csv", icon: FileText, title: "Ekspor CSV" },
  { format: "xlsx", icon: FileSpreadsheet, title: "Ekspor XLSX" },
  { format: "pdf", icon: Download, title: "Unduh PDF" },
];

type Props = {
  onExport: (format: ExportFormat) => Promise<void>;
  label?: string;
};

export function ExportDropdown({ onExport, label = "Ekspor" }: Props) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleExport = async (format: ExportFormat) => {
    setOpen(false);
    setExporting(format);
    try {
      await onExport(format);
    } catch (err) {
      console.error(`Export ${format} failed:`, err);
    } finally {
      setExporting(null);
    }
  };

  const isExporting = exporting !== null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        disabled={isExporting}
        className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 bg-white/60 dark:bg-white/[0.04] text-[13px] hover:border-[#C9A24B] hover:text-[#A07F2E] dark:hover:text-[#C9A24B] transition-all cursor-pointer font-medium text-[#2A3530] dark:text-[#E8E6DF] disabled:opacity-50"
      >
        {isExporting ? (
          <Loader2 size={13} className="animate-spin text-[#C9A24B]" />
        ) : (
          <Download size={13} className="text-[#735A1E] dark:text-[#C9A24B] shrink-0" />
        )}
        <span>{isExporting ? "Mengekspor…" : label}</span>
        <ChevronDown size={11} className="opacity-50" />
      </button>

      {open && !isExporting && (
        <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/12 bg-[#F4F0E6] dark:bg-[#0E1619] p-2 shadow-xl z-50">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#5F6A64] dark:text-[#A8AFA9] px-2 py-1.5 mb-1">
            Format Ekspor
          </p>
          {EXPORT_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.format}
                onClick={() => handleExport(opt.format)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-[#2A3530] dark:text-[#E8E6DF] hover:bg-[#C9A24B]/10 dark:hover:bg-[#C9A24B]/10 hover:text-[#735A1E] dark:hover:text-[#C9A24B] transition-all cursor-pointer text-left"
              >
                <Icon size={14} className="shrink-0 opacity-70" />
                {opt.title}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
