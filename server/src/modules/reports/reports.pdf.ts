import PDFDocument from "pdfkit";
import type { Response } from "express";
import type { ReportingAnalytics } from "./reports.service";

const FOREST = "#1f3d2b";
const GOLD = "#b9872e";
const INK = "#17261c";
const MUTED = "#7c847e";

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

function sectionTitle(doc: PDFKit.PDFDocument, title: string) {
  doc.moveDown(1);
  doc.fontSize(13).fillColor(FOREST).font("Helvetica-Bold").text(title);
  doc.moveDown(0.3);
  doc.fillColor(INK).font("Helvetica");
}

function table(doc: PDFKit.PDFDocument, headers: string[], rows: string[][], colWidths: number[]) {
  const startX = doc.x;
  let y = doc.y;

  doc.fontSize(9).fillColor(MUTED).font("Helvetica-Bold");
  headers.forEach((header, i) => {
    const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
    doc.text(header, x, y, { width: colWidths[i] });
  });
  y += 16;
  doc.moveTo(startX, y - 4).lineTo(startX + colWidths.reduce((a, b) => a + b, 0), y - 4).strokeColor("#e5e7e4").stroke();

  doc.font("Helvetica").fillColor(INK);
  for (const row of rows) {
    row.forEach((cell, i) => {
      const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc.fontSize(9).text(cell, x, y, { width: colWidths[i] });
    });
    y += 16;
  }
  doc.y = y + 4;
}

function barChart(doc: PDFKit.PDFDocument, items: { label: string; value: number }[]) {
  if (items.length === 0) return;
  const maxValue = Math.max(...items.map((i) => i.value), 1);
  const chartWidth = 340;
  const barHeight = 14;
  const gap = 8;
  const startX = doc.x;
  let y = doc.y;

  for (const item of items) {
    const barWidth = Math.max(2, (item.value / maxValue) * chartWidth);
    doc.fontSize(8).fillColor(INK).text(item.label, startX, y, { width: 130 });
    doc.rect(startX + 135, y, barWidth, barHeight).fill(GOLD);
    doc.fillColor(INK).fontSize(8).text(formatCurrency(item.value), startX + 135 + barWidth + 6, y + 2);
    y += barHeight + gap;
  }
  doc.y = y + 4;
}

export function renderAnalyticsPdf(analytics: ReportingAnalytics, res: Response) {
  const doc = new PDFDocument({ size: "A4", margin: 40 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="la-aura-report-${analytics.range}.pdf"`);
  doc.pipe(res);

  doc.fontSize(20).fillColor(FOREST).font("Helvetica-Bold").text("La Aura POS");
  doc.fontSize(13).fillColor(INK).font("Helvetica").text("Reporting Area export");
  doc
    .fontSize(9)
    .fillColor(MUTED)
    .text(
      `Range: ${analytics.range} · ${new Date(analytics.period.start).toLocaleString()} - ${new Date(
        analytics.period.end
      ).toLocaleString()}`
    );
  doc.fontSize(9).fillColor(MUTED).text(`Generated ${new Date().toLocaleString()}`);

  sectionTitle(doc, "Best sellers (by revenue)");
  barChart(doc, analytics.bestSellers.map((item) => ({ label: item.name, value: item.revenue })));
  table(
    doc,
    ["Product", "SKU", "Units", "Revenue"],
    analytics.bestSellers.map((item) => [item.name, item.sku, String(item.units), formatCurrency(item.revenue)]),
    [180, 100, 60, 90]
  );

  sectionTitle(doc, "Slow movers (lowest units sold)");
  table(
    doc,
    ["Product", "SKU", "Units sold", "Current stock"],
    analytics.worstSellers.map((item) => [item.name, item.sku, String(item.units), String(item.stock)]),
    [180, 100, 80, 80]
  );

  sectionTitle(doc, "Cashier performance");
  table(
    doc,
    ["Cashier", "Sales", "Revenue"],
    analytics.cashierPerformance.map((item) => [item.name, String(item.salesCount), formatCurrency(item.revenue)]),
    [220, 80, 100]
  );

  sectionTitle(doc, "Areas for improvement");
  doc.fontSize(10).font("Helvetica-Bold").fillColor(INK).text("Dead stock (in stock, zero sales this period)");
  doc.font("Helvetica");
  if (analytics.insights.deadStock.length === 0) {
    doc.fontSize(9).fillColor(MUTED).text("None — every active product sold at least once.");
  } else {
    table(
      doc,
      ["Product", "SKU", "Stock"],
      analytics.insights.deadStock.map((item) => [item.name, item.sku, String(item.stock)]),
      [220, 100, 80]
    );
  }

  doc.moveDown(0.5);
  doc.fontSize(10).font("Helvetica-Bold").fillColor(INK).text("Stockout risk (popular and running low)");
  doc.font("Helvetica");
  if (analytics.insights.stockoutRisk.length === 0) {
    doc.fontSize(9).fillColor(MUTED).text("None — no popular items are currently low on stock.");
  } else {
    table(
      doc,
      ["Product", "SKU", "Stock", "Units sold"],
      analytics.insights.stockoutRisk.map((item) => [item.name, item.sku, String(item.stock), String(item.units)]),
      [180, 100, 70, 80]
    );
  }

  doc.moveDown(0.5);
  const { discount } = analytics.insights;
  doc
    .fontSize(9)
    .fillColor(INK)
    .text(
      `Discount usage: ${discount.salesWithDiscount} of ${discount.totalSales} sales (${discount.discountRate}%) included a discount, averaging ${discount.avgDiscountPct}% off subtotal.`
    );

  doc.end();
}
