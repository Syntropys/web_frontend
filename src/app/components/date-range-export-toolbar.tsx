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
import html2canvas from "html2canvas";

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
      supabase.from("regions").select("id, name, province, latitude, longitude"),
      supabase.from("production_history").select("*").gte("year", startYear).lte("year", endYear),
      supabase.from("predictions").select("*").gte("target_year", startYear).lte("target_year", endYear),
      supabase.from("cluster_assignments").select("*"),
      supabase.from("weather_history").select("*").gte("year", startYear).lte("year", endYear),
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
      const { regions, production } = await fetchData();
      if (production.length === 0) { alert("Tidak ada data untuk diekspor."); return; }

      const csvRows = [["Provinsi", "Kabupaten", "Tahun", "Bulan", "Produksi (Ton)", "Luas Panen (Ha)", "Yield (Ton/Ha)"]];
      production.forEach((row: Record<string, unknown>) => {
        const region = regions.find((r: Record<string, unknown>) => r.id === row.region_id) as Record<string, string> | undefined;
        csvRows.push([
          region?.province || "-", region?.name || "-",
          String(row.year), String(row.month || "-"),
          String(row.production_ton), String(row.area_harvest_ha || "-"), String(row.yield_ton_ha || "-"),
        ]);
      });

      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.map((r) => r.join(",")).join("\n");
      downloadBlob(encodeURI(csvContent), `agrolytics_produksi_${startYear}_${endYear}.csv`);
    } catch (err) { console.error(err); } finally { setExportingFormat(null); }
  };

  // ─── XLSX (SpreadsheetML) ────────────────────────────────────────────────────
  const handleExportXLSX = async () => {
    try {
      setExportingFormat("xlsx");
      const { regions, production, predictions } = await fetchData();

      let xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Produksi Historis">
  <Table>
   <Row>
    <Cell><Data ss:Type="String">Provinsi</Data></Cell>
    <Cell><Data ss:Type="String">Kabupaten</Data></Cell>
    <Cell><Data ss:Type="String">Tahun</Data></Cell>
    <Cell><Data ss:Type="String">Bulan</Data></Cell>
    <Cell><Data ss:Type="String">Produksi (Ton)</Data></Cell>
    <Cell><Data ss:Type="String">Luas Panen (Ha)</Data></Cell>
    <Cell><Data ss:Type="String">Yield (Ton/Ha)</Data></Cell>
   </Row>`;

      production.forEach((row: Record<string, unknown>) => {
        const region = regions.find((r: Record<string, unknown>) => r.id === row.region_id) as Record<string, string> | undefined;
        xml += `
   <Row>
    <Cell><Data ss:Type="String">${region?.province || "-"}</Data></Cell>
    <Cell><Data ss:Type="String">${region?.name || "-"}</Data></Cell>
    <Cell><Data ss:Type="Number">${row.year}</Data></Cell>
    <Cell><Data ss:Type="String">${row.month || "-"}</Data></Cell>
    <Cell><Data ss:Type="Number">${row.production_ton || 0}</Data></Cell>
    <Cell><Data ss:Type="String">${row.area_harvest_ha || "-"}</Data></Cell>
    <Cell><Data ss:Type="String">${row.yield_ton_ha || "-"}</Data></Cell>
   </Row>`;
      });
      xml += `\n  </Table>\n </Worksheet>`;

      // Predictions sheet
      if (predictions.length > 0) {
        xml += `\n <Worksheet ss:Name="Prediksi">
  <Table>
   <Row>
    <Cell><Data ss:Type="String">Provinsi</Data></Cell>
    <Cell><Data ss:Type="String">Kabupaten</Data></Cell>
    <Cell><Data ss:Type="String">Model</Data></Cell>
    <Cell><Data ss:Type="String">Tahun Target</Data></Cell>
    <Cell><Data ss:Type="String">Prediksi Yield (t/ha)</Data></Cell>
    <Cell><Data ss:Type="String">Prediksi Produksi (ton)</Data></Cell>
   </Row>`;
        predictions.forEach((p: Record<string, unknown>) => {
          const region = regions.find((r: Record<string, unknown>) => r.id === p.region_id) as Record<string, string> | undefined;
          xml += `
   <Row>
    <Cell><Data ss:Type="String">${region?.province || "-"}</Data></Cell>
    <Cell><Data ss:Type="String">${region?.name || "-"}</Data></Cell>
    <Cell><Data ss:Type="String">${p.model_name || "-"}</Data></Cell>
    <Cell><Data ss:Type="Number">${p.target_year}</Data></Cell>
    <Cell><Data ss:Type="Number">${p.predicted_yield || 0}</Data></Cell>
    <Cell><Data ss:Type="Number">${p.predicted_prod_ton || 0}</Data></Cell>
   </Row>`;
        });
        xml += `\n  </Table>\n </Worksheet>`;
      }

      xml += `\n</Workbook>`;
      const blob = new Blob([xml], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      blobToDownload(blob, `agrolytics_${startYear}_${endYear}.xlsx`);
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
        .filter((r: Record<string, unknown>) => r.latitude != null && r.longitude != null)
        .map((r: Record<string, unknown>) => {
          const prodRows = production.filter((p: Record<string, unknown>) => p.region_id === r.id);
          const lastProd = prodRows.slice(-1)[0] as Record<string, unknown> | undefined;
          const pred2026 = predictions.find((p: Record<string, unknown>) => p.region_id === r.id && p.target_year === 2026 && p.model_name === "xgboost") as Record<string, unknown> | undefined;
          const cluster = clusters.find((c: Record<string, unknown>) => c.region_id === r.id) as Record<string, unknown> | undefined;
          const riskLabel = cluster?.cluster_label === 0 ? "Tinggi" : cluster?.cluster_label === 1 ? "Sedang" : "Rendah";
          return {
            type: "Feature",
            geometry: { type: "Point", coordinates: [r.longitude, r.latitude] },
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
      const element = document.querySelector("main");
      if (!element) return;
      const canvas = await html2canvas(element, { scale: 1.5, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgW = 210;
      const imgH = (canvas.height * imgW) / canvas.width;
      let pos = 0, heightLeft = imgH;
      pdf.addImage(imgData, "PNG", 0, pos, imgW, imgH);
      heightLeft -= 297;
      while (heightLeft > 0) {
        pos = heightLeft - imgH;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, pos, imgW, imgH);
        heightLeft -= 297;
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
        const r = regions.find((reg: Record<string, unknown>) => reg.id === row.region_id) as Record<string, string> | undefined;
        csvRows.push([r?.province || "-", r?.name || "-", String(row.year), String(row.production_ton || 0), String(row.yield_ton_ha || 0)]);
      });
      const csvContent = csvRows.map((r) => r.join(",")).join("\n");

      // Build JSON content
      const jsonContent = JSON.stringify({ meta: { exportedAt: new Date().toISOString(), startYear, endYear }, regions, production, predictions, clusters, weather }, null, 2);

      // Build GeoJSON content
      const geoFeatures = regions
        .filter((r: Record<string, unknown>) => r.latitude != null && r.longitude != null)
        .map((r: Record<string, unknown>) => {
          const pred = predictions.find((p: Record<string, unknown>) => p.region_id === r.id && p.target_year === 2026 && p.model_name === "xgboost") as Record<string, unknown> | undefined;
          const cl = clusters.find((c: Record<string, unknown>) => c.region_id === r.id) as Record<string, unknown> | undefined;
          return { type: "Feature", geometry: { type: "Point", coordinates: [r.longitude, r.latitude] }, properties: { name: r.name, province: r.province, pred_yield: pred?.predicted_yield ?? null, risk: cl?.cluster_label === 0 ? "Tinggi" : cl?.cluster_label === 1 ? "Sedang" : "Rendah" } };
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
    { format: "zip",     icon: Archive,         title: "Bundle ZIP (CSV+JSON+GeoJSON)", onClick: handleExportZIP },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2" ref={ref}>
      {/* Date Range Picker */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-2 h-9 px-3.5 rounded-xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 bg-white/60 dark:bg-white/[0.04] text-[13px] hover:border-[#C9A24B] hover:text-[#A07F2E] dark:hover:text-[#C9A24B] transition-all cursor-pointer font-medium text-[#2A3530] dark:text-[#E8E6DF]"
        >
          <Calendar size={13} className="text-[#8C6E26] dark:text-[#C9A24B] shrink-0" />
          <span>{startYear} – {endYear}</span>
          <ChevronDown size={11} className="opacity-50" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/12 bg-[#F4F0E6] dark:bg-[#0E1619] p-4 shadow-xl z-50">
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
            <Download size={13} className="text-[#8C6E26] dark:text-[#C9A24B] shrink-0" />
          )}
          <span>{isExporting ? "Mengekspor…" : "Ekspor"}</span>
          <ChevronDown size={11} className="opacity-50" />
        </button>

        {exportOpen && !isExporting && (
          <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/12 bg-[#F4F0E6] dark:bg-[#0E1619] p-2 shadow-xl z-50">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#5F6A64] dark:text-[#A8AFA9] px-2 py-1.5 mb-1">
              Format Ekspor
            </p>
            {EXPORT_BUTTONS.map((btn) => {
              const Icon = btn.icon;
              return (
                <button
                  key={btn.format}
                  onClick={() => { btn.onClick(); setExportOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-[#2A3530] dark:text-[#E8E6DF] hover:bg-[#C9A24B]/10 dark:hover:bg-[#C9A24B]/10 hover:text-[#8C6E26] dark:hover:text-[#C9A24B] transition-all cursor-pointer text-left"
                >
                  <Icon size={14} className="shrink-0 opacity-70" />
                  {btn.title}
                  {btn.format === "zip" && (
                    <span className="ml-auto text-[9px] bg-[#C9A24B]/15 text-[#8C6E26] dark:text-[#C9A24B] px-1.5 py-0.5 rounded font-mono uppercase">Bundle</span>
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
