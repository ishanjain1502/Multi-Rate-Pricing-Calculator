import { jsPDF } from "jspdf";
import type { SummaryReport } from "./types";
import { formatMoney } from "./money";

export type SummaryReportPdfOptions = {
  rates?: Record<string, number>;
};

function line(doc: jsPDF, y: number, text: string, x = 14): number {
  doc.text(text, x, y);
  return y + 7;
}

/**
 * Builds and downloads a PDF for a generated summary report (client-only).
 */
export function downloadSummaryReportPdf(
  report: SummaryReport,
  options: SummaryReportPdfOptions = {},
): void {
  const doc = new jsPDF();
  const target = report.targetCurrency.toUpperCase();

  let y = 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  y = line(doc, y, "Summary Report");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  y = line(doc, y, `Period: ${report.from} to ${report.to}`);
  y = line(doc, y, `Report currency: ${target}`);
  y = line(doc, y, `Generated: ${new Date().toISOString().slice(0, 10)}`);
  y = line(doc, y, "Scope: finalized documents by issue date");

  if (options.rates && Object.keys(options.rates).length > 0) {
    y += 4;
    doc.setFont("helvetica", "bold");
    y = line(doc, y, "Exchange rates (1 unit → " + target + ")");
    doc.setFont("helvetica", "normal");
    for (const [currency, rate] of Object.entries(options.rates).sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      y = line(doc, y, `${currency.toUpperCase()}: ${rate}`);
    }
  }

  y += 6;
  doc.setFont("helvetica", "bold");
  y = line(doc, y, "Totals");
  doc.setFont("helvetica", "normal");
  y = line(doc, y, `Documents: ${report.documentCount}`);
  y = line(doc, y, `Grand total: ${formatMoney(report.grandTotal, report.targetCurrency)}`);
  y = line(doc, y, `Total tax: ${formatMoney(report.totalTax, report.targetCurrency)}`);
  y = line(doc, y, `Total discount: ${formatMoney(report.totalDiscount, report.targetCurrency)}`);

  if (report.breakdown.length > 0) {
    y += 6;
    doc.setFont("helvetica", "bold");
    y = line(doc, y, "By source currency");
    doc.setFont("helvetica", "normal");

    const colX = [14, 50, 75, 120];
    const headers = ["Currency", "Count", "Native total", "Converted"];
    headers.forEach((h, i) => doc.text(h, colX[i], y));
    y += 7;

    for (const row of report.breakdown) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(row.currency.toUpperCase(), colX[0], y);
      doc.text(String(row.documentCount), colX[1], y);
      doc.text(formatMoney(row.grandTotal, row.currency), colX[2], y);
      doc.text(formatMoney(row.convertedGrandTotal, report.targetCurrency), colX[3], y);
      y += 7;
    }
  }

  const filename = `summary-report-${report.from}-${report.to}-${report.targetCurrency}.pdf`;
  doc.save(filename);
}
