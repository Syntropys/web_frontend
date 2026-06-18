import { useState, useRef, useEffect } from "react";
import { ChevronDown, Calendar, Download, FileSpreadsheet, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export function DateRangeAndExportToolbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [startYear, setStartYear] = useState(2018);
  const [endYear, setEndYear] = useState(2026);
  const [isExporting, setIsExporting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePreset = (start: number, end: number) => {
    setStartYear(start);
    setEndYear(end);
    setIsOpen(false);
    // Dispatch custom event to notify widgets
    window.dispatchEvent(
      new CustomEvent("agrolytics_year_range_changed", { detail: { startYear: start, endYear: end } })
    );
  };

  const applyCustom = () => {
    setIsOpen(false);
    window.dispatchEvent(
      new CustomEvent("agrolytics_year_range_changed", { detail: { startYear, endYear } })
    );
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const { data: regions } = await supabase.from("regions").select("id, name, province");
      const { data: production } = await supabase
        .from("production_history")
        .select("*")
        .gte("year", startYear)
        .lte("year", endYear);

      if (!production || production.length === 0) {
        alert("Tidak ada data untuk diekspor pada rentang tahun terpilih.");
        return;
      }

      const csvRows = [["Provinsi", "Kabupaten", "Tahun", "Bulan", "Produksi (Ton)", "Luas Panen (Ha)", "Yield (Ton/Ha)"]];
      production.forEach((row) => {
        const region = regions?.find((r) => r.id === row.region_id);
        csvRows.push([
          region?.province || "-",
          region?.name || "-",
          String(row.year),
          String(row.month || "-"),
          String(row.production_ton),
          String(row.area_harvest_ha || "-"),
          String(row.yield_ton_ha || "-"),
        ]);
      });

      const csvContent = "data:text/csv;charset=utf-8," + csvRows.map((e) => e.join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `laporan_produksi_${startYear}_${endYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportXLSX = async () => {
    // Generate simplified spreadsheet XML schema format compatible with excel
    try {
      setIsExporting(true);
      const { data: regions } = await supabase.from("regions").select("id, name, province");
      const { data: production } = await supabase
        .from("production_history")
        .select("*")
        .gte("year", startYear)
        .lte("year", endYear);

      if (!production || production.length === 0) {
        alert("Tidak ada data untuk diekspor pada rentang tahun terpilih.");
        return;
      }

      let xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Produksi Padi">
  <Table>`;
      
      xml += `
   <Row>
    <Cell><Data ss:Type="String">Provinsi</Data></Cell>
    <Cell><Data ss:Type="String">Kabupaten</Data></Cell>
    <Cell><Data ss:Type="String">Tahun</Data></Cell>
    <Cell><Data ss:Type="String">Bulan</Data></Cell>
    <Cell><Data ss:Type="String">Produksi (Ton)</Data></Cell>
    <Cell><Data ss:Type="String">Luas Panen (Ha)</Data></Cell>
    <Cell><Data ss:Type="String">Yield (Ton/Ha)</Data></Cell>
   </Row>`;

      production.forEach((row) => {
        const region = regions?.find((r) => r.id === row.region_id);
        xml += `
   <Row>
    <Cell><Data ss:Type="String">${region?.province || "-"}</Data></Cell>
    <Cell><Data ss:Type="String">${region?.name || "-"}</Data></Cell>
    <Cell><Data ss:Type="Number">${row.year}</Data></Cell>
    <Cell><Data ss:Type="String">${row.month || "-"}</Data></Cell>
    <Cell><Data ss:Type="Number">${row.production_ton}</Data></Cell>
    <Cell><Data ss:Type="String">${row.area_harvest_ha || "-"}</Data></Cell>
    <Cell><Data ss:Type="String">${row.yield_ton_ha || "-"}</Data></Cell>
   </Row>`;
      });

      xml += `
  </Table>
 </Worksheet>
</Workbook>`;

      const blob = new Blob([xml], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `laporan_produksi_${startYear}_${endYear}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      const element = document.querySelector("main");
      if (!element) return;
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`laporan_dashboard_${startYear}_${endYear}.pdf`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2" ref={ref}>
      {/* Date Range Picker Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 bg-white/60 dark:bg-white/[0.04] text-[13px] hover:border-[#C9A24B] hover:text-[#A07F2E] dark:hover:text-[#C9A24B] transition-all cursor-pointer font-medium"
        >
          <Calendar size={14} className="text-[#8C6E26] dark:text-[#C9A24B]" />
          <span>
            {startYear} – {endYear}
          </span>
          <ChevronDown size={12} className="opacity-60" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/12 bg-[#EFEBE1] dark:bg-[#0E1619] p-4 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <h4 className="font-serif text-[14px] italic font-semibold mb-3 text-[#2A3530] dark:text-[#E8E6DF]">
              Pilih Rentang Tahun
            </h4>
            
            {/* Presets */}
            <div className="grid grid-cols-2 gap-1.5 mb-4">
              {[
                { label: "Historis BPS", start: 2018, end: 2025 },
                { label: "Prediksi 2026", start: 2026, end: 2026 },
                { label: "Semua Data", start: 2018, end: 2026 },
              ].map((p) => (
                <button
                  key={p.label}
                  onClick={() => handlePreset(p.start, p.end)}
                  className="px-2.5 py-1.5 rounded-lg text-left text-[11px] bg-white/40 dark:bg-white/[0.03] border border-[#2A3530]/10 dark:border-[#E8E6DF]/10 hover:border-[#C9A24B] hover:text-[#A07F2E] dark:hover:text-[#C9A24B] text-[#5F6A64] dark:text-[#B8BFB9] transition-all cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom inputs */}
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex-1">
                <label className="block text-[10px] text-[#5F6A64] dark:text-[#A8AFA9] uppercase tracking-wider mb-1">
                  Mulai
                </label>
                <input
                  type="number"
                  min={2018}
                  max={2026}
                  value={startYear}
                  onChange={(e) => setStartYear(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 bg-white/40 dark:bg-white/[0.03] text-[12px] text-[#2A3530] dark:text-[#E8E6DF] focus:outline-none focus:border-[#C9A24B]"
                />
              </div>
              <span className="text-[12px] text-[#5F6A64] mt-4">—</span>
              <div className="flex-1">
                <label className="block text-[10px] text-[#5F6A64] dark:text-[#A8AFA9] uppercase tracking-wider mb-1">
                  Selesai
                </label>
                <input
                  type="number"
                  min={2018}
                  max={2026}
                  value={endYear}
                  onChange={(e) => setEndYear(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 bg-white/40 dark:bg-white/[0.03] text-[12px] text-[#2A3530] dark:text-[#E8E6DF] focus:outline-none focus:border-[#C9A24B]"
                />
              </div>
            </div>

            <button
              onClick={applyCustom}
              className="w-full inline-flex items-center justify-center h-9 rounded-lg bg-[#C9A24B] text-[#2A1F08] text-[12px] hover:bg-[#D4B05E] transition-colors cursor-pointer font-medium"
            >
              Terapkan Rentang
            </button>
          </div>
        )}
      </div>

      {/* Export Button Options */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleExportCSV}
          disabled={isExporting}
          title="Ekspor CSV"
          className="w-10 h-10 rounded-xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 bg-white/60 dark:bg-white/[0.04] text-[#5F6A64] dark:text-[#B8BFB9] hover:border-[#C9A24B] hover:text-[#A07F2E] dark:hover:text-[#C9A24B] flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
        >
          <FileText size={15} />
        </button>
        <button
          onClick={handleExportXLSX}
          disabled={isExporting}
          title="Ekspor XLSX"
          className="w-10 h-10 rounded-xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 bg-white/60 dark:bg-white/[0.04] text-[#5F6A64] dark:text-[#B8BFB9] hover:border-[#C9A24B] hover:text-[#A07F2E] dark:hover:text-[#C9A24B] flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
        >
          <FileSpreadsheet size={15} />
        </button>
        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          title="Unduh PDF Laporan"
          className="w-10 h-10 rounded-xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 bg-white/60 dark:bg-white/[0.04] text-[#5F6A64] dark:text-[#B8BFB9] hover:border-[#C9A24B] hover:text-[#A07F2E] dark:hover:text-[#C9A24B] flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
        >
          <Download size={15} />
        </button>
      </div>
    </div>
  );
}
