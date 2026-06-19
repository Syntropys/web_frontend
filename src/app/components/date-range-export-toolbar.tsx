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
  MapPin,
  X,
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
  const [filterOpen, setFilterOpen] = useState(false);
  const [startYear, setStartYear] = useState(2018);
  const [endYear, setEndYear] = useState(2026);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Region filter state
  const [allRegions, setAllRegions] = useState<{ id: string; name: string; province: string }[]>([]);
  const [filterProvince, setFilterProvince] = useState("");
  const [filterRegionId, setFilterRegionId] = useState("");

  // Load regions on mount
  useEffect(() => {
    supabase.from("regions").select("id, name, province").order("province").order("name").then(({ data }) => {
      setAllRegions((data || []) as { id: string; name: string; province: string }[]);
    });
  }, []);

  const provinces = [...new Set(allRegions.map((r) => r.province))].sort();
  const filteredRegions = filterProvince
    ? allRegions.filter((r) => r.province === filterProvince)
    : allRegions;
  const activeFilterCount = (filterProvince ? 1 : 0) + (filterRegionId ? 1 : 0);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
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

  // ─── Fetch helper (respects province/region filter) ────────────────────────
  async function fetchData() {
    // Build region IDs to filter
    let regionIds: string[] | null = null;
    if (filterRegionId) {
      regionIds = [filterRegionId];
    } else if (filterProvince) {
      regionIds = allRegions.filter((r) => r.province === filterProvince).map((r) => r.id);
    }

    let regQ = supabase.from("regions").select("id, name, province, centroid_lat, centroid_lng");
    let predQ = supabase.from("predictions").select("*, regions(name, province)").gte("target_year", startYear).lte("target_year", endYear).limit(5000);
    let clQ = supabase.from("cluster_assignments").select("*");
    let wxQ = supabase.from("weather_history").select("*").gte("year", startYear).lte("year", endYear).limit(5000);

    if (regionIds) {
      regQ = regQ.in("id", regionIds);
      predQ = predQ.in("region_id", regionIds);
      clQ = clQ.in("region_id", regionIds);
      wxQ = wxQ.in("region_id", regionIds);
    }

    const [regRes, predRes, clRes, wxRes] = await Promise.all([regQ, predQ, clQ, wxQ]);
    return {
      regions: regRes.data || [],
      predictions: predRes.data || [],
      clusters: clRes.data || [],
      weather: wxRes.data || [],
    };
  }

  // ─── CSV (Prediksi only) ─────────────────────────────────────────────────────
  const handleExportCSV = async () => {
    try {
      setExportingFormat("csv");
      const { predictions } = await fetchData();
      if (predictions.length === 0) { alert("Tidak ada data prediksi untuk diekspor."); return; }

      const csvRows = [["Provinsi", "Kabupaten", "Model", "Tahun", "Prediksi Yield (t/ha)", "Prediksi Produksi (ton)"]];
      predictions.forEach((p: Record<string, unknown>) => {
        const reg = p.regions as Record<string, string> | null;
        csvRows.push([
          reg?.province || "-", reg?.name || "-",
          String(p.model_name || "-"),
          String(p.target_year),
          String(p.predicted_yield || "-"), String(p.predicted_prod_ton || "-"),
        ]);
      });

      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.map((r) => r.join(",")).join("\n");
      downloadBlob(encodeURI(csvContent), `agrolytics_prediksi_${startYear}_${endYear}.csv`);
    } catch (err) { console.error(err); } finally { setExportingFormat(null); }
  };

  // ─── XLSX (SheetJS) — Prediksi only ──────────────────────────────────────────
  const handleExportXLSX = async () => {
    try {
      setExportingFormat("xlsx");
      const { predictions } = await fetchData();

      const wb = XLSX.utils.book_new();

      // Sheet: Prediksi ML
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
      XLSX.utils.book_append_sheet(wb, wsPred, "Prediksi ML");

      XLSX.writeFile(wb, `agrolytics_prediksi_${startYear}_${endYear}.xlsx`);
    } catch (err) { console.error(err); } finally { setExportingFormat(null); }
  };

  // ─── JSON (tanpa BPS) ───────────────────────────────────────────────────────
  const handleExportJSON = async () => {
    try {
      setExportingFormat("json");
      const { regions, predictions, clusters, weather } = await fetchData();
      const payload = {
        meta: { exportedAt: new Date().toISOString(), startYear, endYear, source: "Agrolytics v2" },
        regions,
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
      const { regions, predictions, clusters } = await fetchData();

      const features = regions
        .filter((r: Record<string, unknown>) => r.centroid_lat != null && r.centroid_lng != null)
        .map((r: Record<string, unknown>) => {
          const pred2026 = predictions.find((p: Record<string, unknown>) => p.region_id === r.id && p.target_year === 2026 && p.model_name === "xgboost") as Record<string, unknown> | undefined;
          const cluster = clusters.find((c: Record<string, unknown>) => c.region_id === r.id) as Record<string, unknown> | undefined;
          const riskLabel = cluster?.cluster_label === 0 ? "Tinggi" : cluster?.cluster_label === 1 ? "Sedang" : "Rendah";
          return {
            type: "Feature",
            geometry: { type: "Point", coordinates: [r.centroid_lng, r.centroid_lat] },
            properties: {
              id: r.id, name: r.name, province: r.province,
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
      const { regions, predictions, clusters } = await fetchData();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdf = new jsPDF("p", "mm", "a4") as any;
      const pageW = pdf.internal.pageSize.getWidth();

      // Header
      pdf.setFontSize(18);
      pdf.setTextColor(42, 53, 48); // #2A3530
      pdf.text("Agrolytics — Laporan Prediksi", 14, 20);
      pdf.setFontSize(10);
      pdf.setTextColor(95, 106, 100); // #5F6A64
      pdf.text(`Periode: ${startYear} – ${endYear}  |  Diekspor: ${new Date().toLocaleDateString("id-ID")}`, 14, 27);
      pdf.setDrawColor(201, 162, 75); // #C9A24B
      pdf.setLineWidth(0.5);
      pdf.line(14, 30, pageW - 14, 30);

      // Table 1: Prediksi ML
      if (predictions.length > 0) {
        const startY2 = 38;

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

  // ─── ZIP (bundle — tanpa BPS) ────────────────────────────────────────────────
  const handleExportZIP = async () => {
    try {
      setExportingFormat("zip");
      const { regions, predictions, clusters, weather } = await fetchData();

      // Build CSV content (predictions only)
      const csvRows = [["Provinsi", "Kabupaten", "Model", "Tahun", "Prediksi Yield (t/ha)", "Prediksi Produksi (ton)"]];
      predictions.forEach((p: Record<string, unknown>) => {
        const reg = p.regions as Record<string, string> | null;
        csvRows.push([reg?.province || "-", reg?.name || "-", String(p.model_name || "-"), String(p.target_year), String(p.predicted_yield || "-"), String(p.predicted_prod_ton || "-")]);
      });
      const csvContent = csvRows.map((r) => r.join(",")).join("\n");

      // Build JSON content
      const jsonContent = JSON.stringify({ meta: { exportedAt: new Date().toISOString(), startYear, endYear }, regions, predictions, clusters, weather }, null, 2);

      // Build GeoJSON content
      const geoFeatures = regions
        .filter((r: Record<string, unknown>) => r.centroid_lat != null && r.centroid_lng != null)
        .map((r: Record<string, unknown>) => {
          const pred = predictions.find((p: Record<string, unknown>) => p.region_id === r.id && p.target_year === 2026 && p.model_name === "xgboost") as Record<string, unknown> | undefined;
          const cl = clusters.find((c: Record<string, unknown>) => c.region_id === r.id) as Record<string, unknown> | undefined;
          return { type: "Feature", geometry: { type: "Point", coordinates: [r.centroid_lng, r.centroid_lat] }, properties: { name: r.name, province: r.province, pred_yield: pred?.predicted_yield ?? null, risk: cl?.cluster_label === 0 ? "Tinggi" : cl?.cluster_label === 1 ? "Sedang" : "Rendah" } };
        });
      const geojsonContent = JSON.stringify({ type: "FeatureCollection", features: geoFeatures }, null, 2);

      const blobCSV = new Blob(["\uFEFF" + csvContent], { type: "text/csv" });
      const blobJSON = new Blob([jsonContent], { type: "application/json" });
      const blobGEO = new Blob([geojsonContent], { type: "application/geo+json" });

      const label = `${startYear}_${endYear}`;
      blobToDownload(blobCSV, `agrolytics_${label}_prediksi.csv`);
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
          <div className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/12 bg-[#F4F0E6] dark:bg-[#0E1619] p-4 shadow-xl z-[60]">
            <h4 className="font-serif text-[14px] italic font-semibold mb-3 text-[#2A3530] dark:text-[#E8E6DF]">
              Rentang Tahun
            </h4>
            <div className="grid grid-cols-2 gap-1.5 mb-4">
              {[
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
          <div className="absolute right-0 mt-2 w-60 max-w-[calc(100vw-2rem)] rounded-2xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/12 bg-[#F4F0E6] dark:bg-[#0E1619] p-2 shadow-xl z-[60]">
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

      {/* Region Filter */}
      <div className="relative" ref={filterRef}>
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border text-[13px] transition-all cursor-pointer font-medium ${
            activeFilterCount > 0
              ? "border-[#C9A24B]/40 bg-[#C9A24B]/8 text-[#735A1E] dark:text-[#C9A24B]"
              : "border-[#2A3530]/15 dark:border-[#E8E6DF]/15 bg-white/60 dark:bg-white/[0.04] text-[#2A3530] dark:text-[#E8E6DF] hover:border-[#C9A24B] hover:text-[#A07F2E] dark:hover:text-[#C9A24B]"
          }`}
        >
          <MapPin size={13} className="text-[#735A1E] dark:text-[#C9A24B] shrink-0" />
          <span className="hidden sm:inline">{activeFilterCount > 0 ? (filterRegionId ? filteredRegions.find((r) => r.id === filterRegionId)?.name || "Filter" : filterProvince) : "Wilayah"}</span>
          <span className="sm:hidden">{activeFilterCount > 0 ? activeFilterCount : ""}</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#C9A24B] text-[#2A1F08] text-[9px] font-bold flex items-center justify-center">{activeFilterCount}</span>
          )}
          <ChevronDown size={11} className="opacity-50" />
        </button>

        {filterOpen && (
          <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/12 bg-[#F4F0E6] dark:bg-[#0E1619] p-4 shadow-xl z-[60]">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-serif text-[14px] italic font-semibold text-[#2A3530] dark:text-[#E8E6DF]">
                Filter Wilayah
              </h4>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => { setFilterProvince(""); setFilterRegionId(""); }}
                  className="text-[10px] text-[#A04848] dark:text-[#D17878] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <X size={10} /> Reset
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-[#5F6A64] dark:text-[#A8AFA9] uppercase tracking-wider mb-1">Provinsi</label>
                <select
                  value={filterProvince}
                  onChange={(e) => { setFilterProvince(e.target.value); setFilterRegionId(""); }}
                  className="w-full px-2.5 py-2 rounded-lg border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 bg-white/40 dark:bg-white/[0.03] text-[12px] text-[#2A3530] dark:text-[#E8E6DF] focus:outline-none focus:border-[#C9A24B] cursor-pointer"
                >
                  <option value="">Semua Provinsi</option>
                  {provinces.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-[#5F6A64] dark:text-[#A8AFA9] uppercase tracking-wider mb-1">Kabupaten/Kota</label>
                <select
                  value={filterRegionId}
                  onChange={(e) => setFilterRegionId(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 bg-white/40 dark:bg-white/[0.03] text-[12px] text-[#2A3530] dark:text-[#E8E6DF] focus:outline-none focus:border-[#C9A24B] cursor-pointer"
                >
                  <option value="">{filterProvince ? `Semua di ${filterProvince}` : "Semua Kabupaten"}</option>
                  {filteredRegions.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <p className="mt-3 text-[10px] text-[#5F6A64] dark:text-[#A8AFA9]">
              {activeFilterCount > 0
                ? `Ekspor akan memuat ${filterRegionId ? "1 kabupaten" : `${filteredRegions.length} kabupaten`}`
                : "Ekspor akan memuat seluruh 56 kabupaten"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
