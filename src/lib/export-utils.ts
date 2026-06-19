import jsPDF from "jspdf";
import { applyPlugin } from "jspdf-autotable";
applyPlugin(jsPDF);
import * as XLSX from "xlsx";

// ─── Download helpers ────────────────────────────────────────────────────────
export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ─── CSV ─────────────────────────────────────────────────────────────────────
export function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const csvRows = [headers, ...rows];
  const csvContent = "\uFEFF" + csvRows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
  triggerDownload(blob, filename);
}

// ─── XLSX ────────────────────────────────────────────────────────────────────
export type SheetData = {
  name: string;
  data: Record<string, unknown>[];
  colWidths?: number[];
};

export function downloadXlsx(filename: string, sheets: SheetData[]) {
  const wb = XLSX.utils.book_new();
  sheets.forEach((s) => {
    const ws = XLSX.utils.json_to_sheet(s.data);
    if (s.colWidths) {
      ws["!cols"] = s.colWidths.map((w) => ({ wch: w }));
    }
    XLSX.utils.book_append_sheet(wb, ws, s.name);
  });
  XLSX.writeFile(wb, filename);
}

// ─── PDF ─────────────────────────────────────────────────────────────────────
export type PdfTable = {
  title: string;
  head: string[][];
  body: string[][];
  headColor?: [number, number, number];
};

export function downloadPdf(filename: string, reportTitle: string, subtitle: string, tables: PdfTable[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdf = new jsPDF("p", "mm", "a4") as any;
  const pageW = pdf.internal.pageSize.getWidth();

  // Header
  pdf.setFontSize(18);
  pdf.setTextColor(42, 53, 48);
  pdf.text(reportTitle, 14, 20);
  pdf.setFontSize(10);
  pdf.setTextColor(95, 106, 100);
  pdf.text(`${subtitle}  |  Diekspor: ${new Date().toLocaleDateString("id-ID")}`, 14, 27);
  pdf.setDrawColor(201, 162, 75);
  pdf.setLineWidth(0.5);
  pdf.line(14, 30, pageW - 14, 30);

  let currentY = 38;

  tables.forEach((table, idx) => {
    if (idx > 0) {
      const lastY = pdf.lastAutoTable?.finalY ?? currentY;
      currentY = lastY + 12 > 270 ? (pdf.addPage(), 20) : lastY + 12;
    }

    pdf.setFontSize(12);
    pdf.setTextColor(42, 53, 48);
    pdf.text(table.title, 14, currentY);

    pdf.autoTable({
      startY: currentY + 3,
      head: table.head,
      body: table.body,
      theme: "grid",
      headStyles: {
        fillColor: table.headColor || [201, 162, 75],
        textColor: table.headColor ? [255, 255, 255] : [42, 31, 8],
        fontSize: 8,
        fontStyle: "bold",
      },
      bodyStyles: { fontSize: 7, textColor: [42, 53, 48] },
      alternateRowStyles: { fillColor: [247, 244, 238] },
      margin: { left: 14, right: 14 },
      styles: { cellPadding: 2, overflow: "linebreak" },
    });
  });

  // Footer
  const pageCount = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150);
    pdf.text(`Agrolytics v2 — Halaman ${i}/${pageCount}`, pageW / 2, 290, { align: "center" });
  }

  pdf.save(filename);
}
