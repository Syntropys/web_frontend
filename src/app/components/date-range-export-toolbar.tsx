import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Calendar,
  Download,
  FileSpreadsheet,
  FileText,
  FileJson,
  Globe,
  Archive,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import { applyPlugin } from "jspdf-autotable";
applyPlugin(jsPDF);
import * as XLSX from "xlsx";

type ExportFormat = "csv" | "xlsx" | "json" | "geojson" | "pdf" | "zip";

export function DateRangeAndExportToolbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [startYear, setStartYear] = useState(2018);
  const [endYear, setEndYear] = useState(2026);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const dispatchRange = (start: number, end: number) => {
    window.dispatchEvent(
      new CustomEvent("agrolytics_year_range_changed", { detail: { startYear: start, endYear: end } })
    );
  };

  const handlePreset = (start: number, end: number) => {
    setStartYear(start);
    setEndYear(end);
    setIsOpen(false);
    dispatchRange(start, end);
  };

  const applyCustom = () => {
    setIsOpen(false);
    dispatchRange(startYear, endYear);
  };

  // ─── Fetch helper ───────────────────────────────────────────────────────────
  async function fetchData() {
    const [regRes, prodRes, predRes, clRes, wxRes] = await Promise.all([
      supabase.from("regions").select("id, name, province, centroid_lat, centroid_lng"),
      supabase.from("production_history").select("*, regions(name, province)").gte("year", startYear).lte("year", endYear).limit(5000),
      supabase.from("predictions").select("*, regions(name, province)").gte("target_year", startYear).lte("target_year", endYear).limit(5000),
      supabase.from("cluster_assignments").select("*"),
      supabase.from("weather_history").select("*").gte("year", startYear).lte("year", endYear).limit(5000),
    ]);
    return {
      regions: regRes.data || [],
      production: prodRes.data || [],
      predictions: predRes.data || [],
      clusters: clRes.data || [],
      weather: wxRes.data || [],
    };
  }

  // ─── CSV ────────────────────────────────────────────────────────────────────
  const handleExportCSV = async () => {
    try {
      setExportingFormat("csv");
      const { production } = await fetchData();
      if (production.length === 0) { alert("Tidak ada data untuk diekspor."); return; }

      const csvRows = [["Provinsi", "Kabupaten", "Tahun", "Produksi (Ton)", "Luas Panen (Ha)", "Yield (Ton/Ha)"]];
      production.forEach((row: Record<string, unknown>) => {
        const reg = row.regions as Record<string, string> | null;
        csvRows.push([
          reg?.province || "-", reg?.name || "-",
          String(row.year),
          String(row.production_ton), String(row.area_harvest_ha || "-"), String(row.yield_ton_ha || "-"),
        ]);
      });

      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.map((r) => r.join(",")).join("\n");
      downloadBlob(encodeURI(csvContent), `agrolytics_produksi_${startYear}_${endYear}.csv`);
    } catch (err) { console.error(err); } finally { setExportingFormat(null); }
  };

  // ─── XLSX (SheetJS) ──────────────────────────────────────────────────────────
  const handleExportXLSX = async () => {
    try {
      setExportingFormat("xlsx");
      const { production, predictions } = await fetchData();

      const wb = XLSX.utils.book_new();

      // Sheet 1: Produksi Historis
      const prodRows = production.map((row: Record<string, unknown>) => {
        const reg = row.regions as Record<string, string> | null;
        return {
          Provinsi: reg?.province || "-",
          Kabupaten: reg?.name || "-",
          Tahun: row.year,
          "Produksi (Ton)": row.production_ton || 0,
          "Luas Panen (Ha)": row.area_harvest_ha || "-",
          "Yield (Ton/Ha)": row.yield_ton_ha || "-",
        };
      });
      const wsProd = XLSX.utils.json_to_sheet(prodRows);
      wsProd["!cols"] = [
        { wch: 22 }, { wch: 28 }, { wch: 8 },
        { wch: 16 }, { wch: 16 }, { wch: 14 },
      ];
      XLSX.utils.book_append_sheet(wb, wsProd, "Produksi Historis");

      // Sheet 2: Prediksi
      if (predictions.length > 0) {
        const predRows = predictions.map((p: Record<string, unknown>) => {
          const reg = p.regions as Record<string, string> | null;
          return {
            Provinsi: reg?.province || "-",
            Kabupaten: reg?.name || "-",
            Model: p.model_name || "-",
            "Tahun Target": p.target_year,
            "Prediksi Yield (t/ha)": p.predicted_yield || 0,
            "Prediksi Produksi (ton)": p.predicted_prod_ton || 0,
          };
        });
        const wsPred = XLSX.utils.json_to_sheet(predRows);
        wsPred["!cols"] = [
          { wch: 22 }, { wch: 28 }, { wch: 14 }, { wch: 14 },
          { wch: 20 }, { wch: 22 },
        ];
        XLSX.utils.book_append_sheet(wb, wsPred, "Prediksi");
      }

      XLSX.writeFile(wb, `agrolytics_${startYear}_${endYear}.xlsx`);
    } catch (err) { console.error(err); } finally { setExportingFormat(null); }
  };

  // ─── JSON ────────────────────────────────────────────────────────────────────
  const handleExportJSON = async () => {
    try {
      setExportingFormat("json");
      const { regions, production, predictions, clusters, weather } = await fetchData();
      const payload = {
        meta: { exportedAt: new Date().toISOString(), startYear, endYear, source: "Agrolytics v2" },
        regions,
        production,
        predictions,
        clusters,
        weather,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      blobToDownload(blob, `agrolytics_data_${startYear}_${endYear}.json`);
    } catch (err) { console.error(err); } finally { setExportingFormat(null); }
  };

  // ─── GeoJSON ─────────────────────────────────────────────────────────────────
  const handleExportGeoJSON = async () => {
    try {
      setExportingFormat("geojson");
      const { regions, production, predictions, clusters } = await fetchData();

      const features = regions
        .filter((r: Record<string, unknown>) => r.centroid_lat != null && r.centroid_lng != null)
        .map((r: Record<string, unknown>) => {
          const prodRows = production.filter((p: Record<string, unknown>) => p.region_id === r.id);
          const lastProd = prodRows.slice(-1)[0] as Record<string, unknown> | undefined;
          const pred2026 = predictions.find((p: Record<string, unknown>) => p.region_id === r.id && p.target_year === 2026 && p.model_name === "xgboost") as Record<string, unknown> | undefined;
          const cluster = clusters.find((c: Record<string, unknown>) => c.region_id === r.id) as Record<string, unknown> | undefined;
          const riskLabel = cluster?.cluster_label === 0 ? "Tinggi" : cluster?.cluster_label === 1 ? "Sedang" : "Rendah";
          return {
            type: "Feature",
            geometry: { type: "Point", coordinates: [r.centroid_lng, r.centroid_lat] },
            properties: {
              id: r.id, name: r.name, province: r.province,
              last_production_ton: lastProd?.production_ton ?? null,
              last_yield_ton_ha: lastProd?.yield_ton_ha ?? null,
              last_year: lastProd?.year ?? null,
              pred_yield_2026: pred2026?.predicted_yield ?? null,
              pred_prod_2026: pred2026?.predicted_prod_ton ?? null,
              cluster_label: cluster?.cluster_label ?? null,
              risk: riskLabel,
            },
          };
        });

      const geojson = {
        type: "FeatureCollection",
        properties: { exportedAt: new Date().toISOString(), source: "Agrolytics v2", model: "XGBoost v1-real" },
        features,
      };
      const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/geo+json" });
      blobToDownload(blob, `agrolytics_wilayah_${startYear}_${endYear}.geojson`);
    } catch (err) { console.error(err); } finally { setExportingFormat(null); }
  };

  // ─── PDF ─────────────────────────────────────────────────────────────────────
  const handleExportPDF = async () => {
    try {
      setExportingFormat("pdf");
      const { regions, production, predictions, clusters } = await fetchData();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdf = new jsPDF("p", "mm", "a4") as any;
      const pageW = pdf.internal.pageSize.getWidth();

      // Header
      pdf.setFontSize(18);
      pdf.setTextColor(42, 53, 48); // #2A3530
      pdf.text("Agrolytics — Laporan Data", 14, 20);
      pdf.setFontSize(10);
      pdf.setTextColor(95, 106, 100); // #5F6A64
      pdf.text(`Periode: ${startYear} – ${endYear}  |  Diekspor: ${new Date().toLocaleDateString("id-ID")}`, 14, 27);
      pdf.setDrawColor(201, 162, 75); // #C9A24B
      pdf.setLineWidth(0.5);
      pdf.line(14, 30, pageW - 14, 30);

      // Table 1: Produksi Historis
      const prodHead = [["Provinsi", "Kabupaten", "Tahun", "Produksi (Ton)", "Yield (t/ha)"]];
      const prodBody = production.map((row: Record<string, unknown>) => {
        const reg = row.regions as Record<string, string> | null;
        return [
          reg?.province || "-",
          reg?.name || "-",
          String(row.year),
          row.production_ton ? Number(row.production_ton).toLocaleString("id-ID") : "-",
          row.yield_ton_ha ? Number(row.yield_ton_ha).toFixed(2) : "-",
        ];
      });

      pdf.setFontSize(12);
      pdf.setTextColor(42, 53, 48);
      pdf.text("Produksi Historis BPS", 14, 38);

      pdf.autoTable({
        startY: 41,
        head: prodHead,
        body: prodBody,
        theme: "grid",
        headStyles: { fillColor: [201, 162, 75], textColor: [42, 31, 8], fontSize: 8, fontStyle: "bold" },
        bodyStyles: { fontSize: 7, textColor: [42, 53, 48] },
        alternateRowStyles: { fillColor: [247, 244, 238] },
        margin: { left: 14, right: 14 },
        styles: { cellPadding: 2, overflow: "linebreak" },
      });

      // Table 2: Prediksi (new page if needed)
      if (predictions.length > 0) {
        const lastY = pdf.lastAutoTable?.finalY ?? 50;
        const startY2 = lastY + 12 > 270 ? (pdf.addPage(), 20) : lastY + 12;

        pdf.setFontSize(12);
        pdf.setTextColor(42, 53, 48);
        pdf.text("Prediksi Model ML", 14, startY2 - 3);

        const predHead = [["Provinsi", "Kabupaten", "Model", "Tahun", "Yield (t/ha)", "Produksi (ton)"]];
        const predBody = predictions.map((p: Record<string, unknown>) => {
          const reg = p.regions as Record<string, string> | null;
          return [
            reg?.province || "-",
            reg?.name || "-",
            String(p.model_name || "-"),
            String(p.target_year),
            p.predicted_yield ? Number(p.predicted_yield).toFixed(2) : "-",
            p.predicted_prod_ton ? Number(p.predicted_prod_ton).toLocaleString("id-ID") : "-",
          ];
        });

        pdf.autoTable({
          startY: startY2,
          head: predHead,
          body: predBody,
          theme: "grid",
          headStyles: { fillColor: [122, 154, 110], textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold" },
          bodyStyles: { fontSize: 7, textColor: [42, 53, 48] },
          alternateRowStyles: { fillColor: [247, 244, 238] },
          margin: { left: 14, right: 14 },
          styles: { cellPadding: 2, overflow: "linebreak" },
        });
      }

      // Table 3: Ringkasan Risiko
      const riskCounts = { tinggi: 0, sedang: 0, rendah: 0 };
      clusters.forEach((c: Record<string, unknown>) => {
        if (c.cluster_label === 0) riskCounts.tinggi++;
        else if (c.cluster_label === 1) riskCounts.sedang++;
        else riskCounts.rendah++;
      });

      const lastY2 = pdf.lastAutoTable?.finalY ?? 50;
      const startY3 = lastY2 + 12 > 270 ? (pdf.addPage(), 20) : lastY2 + 12;
      pdf.setFontSize(12);
      pdf.setTextColor(42, 53, 48);
      pdf.text("Distribusi Risiko Wilayah", 14, startY3 - 3);

      pdf.autoTable({
        startY: startY3,
        head: [["Kategori Risiko", "Jumlah Wilayah"]],
        body: [
          ["Tinggi", String(riskCounts.tinggi)],
          ["Sedang", String(riskCounts.sedang)],
          ["Rendah", String(riskCounts.rendah)],
          ["Total", String(riskCounts.tinggi + riskCounts.sedang + riskCounts.rendah)],
        ],
        theme: "grid",
        headStyles: { fillColor: [160, 72, 72], textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold" },
        bodyStyles: { fontSize: 8, textColor: [42, 53, 48] },
        margin: { left: 14, right: 14 },
        columnStyles: { 1: { halign: "center" } },
      });

      // Footer
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text(`Agrolytics v2 — Halaman ${i}/${pageCount}`, pageW / 2, 290, { align: "center" });
      }

      pdf.save(`agrolytics_laporan_${startYear}_${endYear}.pdf`);
    } catch (err) { console.error(err); } finally { setExportingFormat(null); }
  };

  // ─── ZIP (bundle semua) ──────────────────────────────────────────────────────
  const handleExportZIP = async () => {
    try {
      setExportingFormat("zip");
      const { regions, production, predictions, clusters, weather } = await fetchData();

      // Build CSV content
      const csvRows = [["Provinsi", "Kabupaten", "Tahun", "Produksi (Ton)", "Yield (Ton/Ha)"]];
      production.forEach((row: Record<string, unknown>) => {
        const reg = row.regions as Record<string, string> | null;
        csvRows.push([reg?.province || "-", reg?.name || "-", String(row.year), String(row.production_ton || 0), String(row.yield_ton_ha || 0)]);
      });
      const csvContent = csvRows.map((r) => r.join(",")).join("\n");

      // Build JSON content
      const jsonContent = JSON.stringify({ meta: { exportedAt: new Date().toISOString(), startYear, endYear }, regions, production, predictions, clusters, weather }, null, 2);

      // Build GeoJSON content
      const geoFeatures = regions
        .filter((r: Record<string, unknown>) => r.centroid_lat != null && r.centroid_lng != null)
        .map((r: Record<string, unknown>) => {
          const pred = predictions.find((p: Record<string, unknown>) => p.region_id === r.id && p.target_year === 2026 && p.model_name === "xgboost") as Record<string, unknown> | undefined;
          const cl = clusters.find((c: Record<string, unknown>) => c.region_id === r.id) as Record<string, unknown> | undefined;
          return { type: "Feature", geometry: { type: "Point", coordinates: [r.centroid_lng, r.centroid_lat] }, properties: { name: r.name, province: r.province, pred_yield: pred?.predicted_yield ?? null, risk: cl?.cluster_label === 0 ? "Tinggi" : cl?.cluster_label === 1 ? "Sedang" : "Rendah" } };
        });
      const geojsonContent = JSON.stringify({ type: "FeatureCollection", features: geoFeatures }, null, 2);

      // Simple ZIP structure as multi-part download (since no JSZip available)
      // We'll download each as separate files
      const blobCSV = new Blob(["\uFEFF" + csvContent], { type: "text/csv" });
      const blobJSON = new Blob([jsonContent], { type: "application/json" });
      const blobGEO = new Blob([geojsonContent], { type: "application/geo+json" });

      const label = `${startYear}_${endYear}`;
      blobToDownload(blobCSV, `agrolytics_${label}_produksi.csv`);
      await new Promise((r) => setTimeout(r, 300));
      blobToDownload(blobJSON, `agrolytics_${label}_data.json`);
      await new Promise((r) => setTimeout(r, 300));
      blobToDownload(blobGEO, `agrolytics_${label}_wilayah.geojson`);
    } catch (err) { console.error(err); } finally { setExportingFormat(null); }
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  function downloadBlob(href: string, filename: string) {
    const link = document.createElement("a");
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function blobToDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    downloadBlob(url, filename);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const isExporting = exportingFormat !== null;

  const EXPORT_BUTTONS: { format: ExportFormat; icon: React.ElementType; title: string; onClick: () => void }[] = [
    { format: "csv",     icon: FileText,        title: "Ekspor CSV",     onClick: handleExportCSV },
    { format: "xlsx",    icon: FileSpreadsheet, title: "Ekspor XLSX",    onClick: handleExportXLSX },
    { format: "json",    icon: FileJson,        title: "Ekspor JSON",    onClick: handleExportJSON },
    { format: "geojson", icon: Globe,           title: "Ekspor GeoJSON", onClick: handleExportGeoJSON },
    { format: "pdf",     icon: Download,        title: "Unduh PDF",      onClick: handleExportPDF },
    { format: "zip",     icon: Archive,         title: "Bundle ZIP", onClick: handleExportZIP },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2" ref={ref}>
      {/* Date Range Picker */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-2 h-9 px-3.5 rounded-xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 bg-white/60 dark:bg-white/[0.04] text-[13px] hover:border-[#C9A24B] hover:text-[#A07F2E] dark:hover:text-[#C9A24B] transition-all cursor-pointer font-medium text-[#2A3530] dark:text-[#E8E6DF]"
        >
          <Calendar size={13} className="text-[#735A1E] dark:text-[#C9A24B] shrink-0" />
          <span>{startYear} – {endYear}</span>
          <ChevronDown size={11} className="opacity-50" />
        </button>

        {isOpen && (
          <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-72 rounded-2xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/12 bg-[#F4F0E6] dark:bg-[#0E1619] p-4 shadow-xl z-50">
            <h4 className="font-serif text-[14px] italic font-semibold mb-3 text-[#2A3530] dark:text-[#E8E6DF]">
              Rentang Tahun
            </h4>
            <div className="grid grid-cols-3 gap-1.5 mb-4">
              {[
                { label: "Historis BPS", start: 2018, end: 2025 },
                { label: "Prediksi 2026", start: 2026, end: 2026 },
                { label: "Semua Data", start: 2018, end: 2026 },
              ].map((p) => (
                <button
                  key={p.label}
                  onClick={() => handlePreset(p.start, p.end)}
                  className="px-2 py-1.5 rounded-lg text-left text-[11px] bg-white/40 dark:bg-white/[0.03] border border-[#2A3530]/10 dark:border-[#E8E6DF]/10 hover:border-[#C9A24B] hover:text-[#A07F2E] dark:hover:text-[#C9A24B] text-[#5F6A64] dark:text-[#B8BFB9] transition-all cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2.5 mb-4">
              {[
                { label: "Mulai", val: startYear, setter: setStartYear },
                { label: "Selesai", val: endYear, setter: setEndYear },
              ].map((inp) => (
                <div key={inp.label} className="flex-1">
                  <label className="block text-[10px] text-[#5F6A64] dark:text-[#A8AFA9] uppercase tracking-wider mb-1">{inp.label}</label>
                  <input
                    type="number"
                    min={2018}
                    max={2026}
                    value={inp.val}
                    onChange={(e) => inp.setter(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 bg-white/40 dark:bg-white/[0.03] text-[12px] text-[#2A3530] dark:text-[#E8E6DF] focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={applyCustom}
              className="w-full inline-flex items-center justify-center h-9 rounded-lg bg-[#C9A24B] text-[#2A1F08] text-[12px] hover:bg-[#D4B05E] transition-colors cursor-pointer font-medium"
            >
              Terapkan
            </button>
          </div>
        )}
      </div>

      {/* Export Dropdown */}
      <div className="relative" ref={exportRef}>
        <button
          onClick={() => setExportOpen(!exportOpen)}
          disabled={isExporting}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 bg-white/60 dark:bg-white/[0.04] text-[13px] hover:border-[#C9A24B] hover:text-[#A07F2E] dark:hover:text-[#C9A24B] transition-all cursor-pointer font-medium text-[#2A3530] dark:text-[#E8E6DF] disabled:opacity-50"
        >
          {isExporting ? (
            <Loader2 size={13} className="animate-spin text-[#C9A24B]" />
          ) : (
            <Download size={13} className="text-[#735A1E] dark:text-[#C9A24B] shrink-0" />
          )}
          <span>{isExporting ? "Mengekspor…" : "Ekspor"}</span>
          <ChevronDown size={11} className="opacity-50" />
        </button>

        {exportOpen && !isExporting && (
          <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-60 rounded-2xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/12 bg-[#F4F0E6] dark:bg-[#0E1619] p-2 shadow-xl z-50">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#5F6A64] dark:text-[#A8AFA9] px-2 py-1.5 mb-1">
              Format Ekspor
            </p>
            {EXPORT_BUTTONS.map((btn) => {
              const Icon = btn.icon;
              return (
                <button
                  key={btn.format}
                  onClick={() => { btn.onClick(); setExportOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-[#2A3530] dark:text-[#E8E6DF] hover:bg-[#C9A24B]/10 dark:hover:bg-[#C9A24B]/10 hover:text-[#735A1E] dark:hover:text-[#C9A24B] transition-all cursor-pointer text-left"
                >
                  <Icon size={14} className="shrink-0 opacity-70" />
                  {btn.title}
                  {btn.format === "zip" && (
                    <span className="ml-auto text-[9px] bg-[#C9A24B]/15 text-[#735A1E] dark:text-[#C9A24B] px-1.5 py-0.5 rounded font-mono uppercase">Bundle</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
