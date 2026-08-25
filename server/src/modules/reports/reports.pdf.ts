import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import type { Response } from "express";
import type { getDashboardSummary, ReportingAnalytics, DashboardRange } from "./reports.service";

type DashboardSummary = Awaited<ReturnType<typeof getDashboardSummary>>;

// Kept outside src/ (server/assets) so it isn't touched by the tsc build step —
// the relative path below resolves the same way from both src/ (dev, via tsx)
// and dist/ (prod), since both sit at the same depth under server/.
const LOGO_PATH = path.join(__dirname, "../../../assets/logo.png");
const LOGO_EXISTS = fs.existsSync(LOGO_PATH);

// Brand palette (mirrors the app's forest/gold tokens)
const FOREST = "#1f3d2b";
const GOLD = "#b9872e";
const GOLD_SOFT = "#d9c08f";
const INK = "#17261c";
const MUTED = "#7c847e";
const BORDER = "#e5e7e4";
const ZEBRA = "#f7f6f2";
const WHITE = "#ffffff";
const STAT_BG = "#faf6ec";

const PAGE_MARGIN = 40;
const CONTENT_WIDTH = 515; // A4 width (595pt) minus 2×40pt margin

const RANGE_LABEL: Record<DashboardRange, string> = {
  today: "Today",
  week: "This week",
  month: "This month",
};

function formatCurrency(value: number): string {
  // "ILS" text (not the ₪ glyph) — pdfkit's built-in Helvetica font can't render ₪.
  return `ILS ${value.toFixed(2)}`;
}

function bottomLimit(doc: PDFKit.PDFDocument): number {
  return doc.page.height - doc.page.margins.bottom;
}

// Forces a page break (which also fires the slim continuation header, see below)
// whenever the next block wouldn't fit in the remaining space on the page.
function ensureSpace(doc: PDFKit.PDFDocument, height: number) {
  if (doc.y + height > bottomLimit(doc)) {
    doc.addPage();
  }
}

function sectionTitle(doc: PDFKit.PDFDocument, title: string) {
  ensureSpace(doc, 34);
  doc.moveDown(0.6);
  doc.fontSize(13).fillColor(FOREST).font("Helvetica-Bold").text(title, PAGE_MARGIN, doc.y, { width: CONTENT_WIDTH });
  doc.moveDown(0.3);
  doc.fillColor(INK).font("Helvetica");
  doc.x = PAGE_MARGIN;
}

function subTitle(doc: PDFKit.PDFDocument, title: string) {
  ensureSpace(doc, 26);
  doc.fontSize(10).font("Helvetica-Bold").fillColor(INK).text(title, PAGE_MARGIN, doc.y, { width: CONTENT_WIDTH });
  doc.moveDown(0.2);
  doc.font("Helvetica");
  doc.x = PAGE_MARGIN;
}

function noneMessage(doc: PDFKit.PDFDocument, text: string) {
  doc.fontSize(9).fillColor(MUTED).text(text, PAGE_MARGIN, doc.y, { width: CONTENT_WIDTH });
  doc.moveDown(0.6);
  doc.x = PAGE_MARGIN;
}

function drawMasthead(doc: PDFKit.PDFDocument, summary: DashboardSummary) {
  const bandHeight = 92;
  doc.rect(0, 0, doc.page.width, bandHeight).fill(FOREST);

  // Circular-clipped logo, matching how the app itself frames it (sidebar, login).
  const logoSize = 44;
  const logoX = PAGE_MARGIN;
  const logoY = 24;
  let textX = PAGE_MARGIN;
  if (LOGO_EXISTS) {
    doc.save();
    doc.circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2).clip();
    doc.image(LOGO_PATH, logoX, logoY, { width: logoSize, height: logoSize });
    doc.restore();
    textX = logoX + logoSize + 12;
  }

  doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(22).text("La Aura", textX, 26, { lineBreak: false });
  doc
    .fillColor(GOLD_SOFT)
    .font("Helvetica")
    .fontSize(10)
    .text("Sales & Performance Report", textX, 54, { lineBreak: false });

  const label = RANGE_LABEL[summary.range] ?? summary.range;
  const periodStart = new Date(summary.period.start).toLocaleDateString();
  const periodEnd = new Date(summary.period.end).toLocaleDateString();

  doc
    .fillColor(WHITE)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(label, PAGE_MARGIN, 26, { width: CONTENT_WIDTH, align: "right" });
  doc
    .fillColor(GOLD_SOFT)
    .font("Helvetica")
    .fontSize(8.5)
    .text(`${periodStart} – ${periodEnd}`, PAGE_MARGIN, 43, { width: CONTENT_WIDTH, align: "right" });
  doc
    .fillColor(GOLD_SOFT)
    .fontSize(8.5)
    .text(`Generated ${new Date().toLocaleString()}`, PAGE_MARGIN, 56, { width: CONTENT_WIDTH, align: "right" });

  doc.y = bandHeight + 24;
  doc.x = PAGE_MARGIN;
}

function drawKpiRow(doc: PDFKit.PDFDocument, summary: DashboardSummary) {
  const tiles: { label: string; value: string; accent: string }[] = [
    { label: "TOTAL SALES", value: formatCurrency(summary.totals.periodTotal), accent: GOLD },
    { label: "TRANSACTIONS", value: String(summary.activity.totalTransactions), accent: FOREST },
    { label: "ITEMS SOLD", value: String(summary.activity.itemsSold), accent: FOREST },
    { label: "AVERAGE SALE", value: formatCurrency(summary.averages.avgSaleValue), accent: FOREST },
  ];

  const gap = 12;
  const tileWidth = (CONTENT_WIDTH - gap * (tiles.length - 1)) / tiles.length;
  const tileHeight = 54;
  ensureSpace(doc, tileHeight + 22);
  const y = doc.y;

  tiles.forEach((tile, i) => {
    const x = PAGE_MARGIN + i * (tileWidth + gap);
    doc.roundedRect(x, y, tileWidth, tileHeight, 6).fillAndStroke(WHITE, BORDER);
    doc
      .fillColor(MUTED)
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .text(tile.label, x + 10, y + 10, { width: tileWidth - 20, characterSpacing: 0.3 });
    doc.fillColor(tile.accent).font("Helvetica-Bold").fontSize(15).text(tile.value, x + 10, y + 25, { width: tileWidth - 20 });
  });

  doc.y = y + tileHeight + 22;
  doc.x = PAGE_MARGIN;
}

function drawTrendChart(doc: PDFKit.PDFDocument, summary: DashboardSummary) {
  sectionTitle(doc, "Sales trend");
  const series = summary.series;

  if (series.length === 0 || series.every((s) => s.value === 0)) {
    noneMessage(doc, "No sales recorded in this period.");
    return;
  }

  const chartX = PAGE_MARGIN;
  const chartHeight = 90;
  ensureSpace(doc, chartHeight + 26);
  const chartTop = doc.y;
  const baseY = chartTop + chartHeight;
  const max = Math.max(...series.map((s) => s.value), 1);
  const stepX = series.length > 1 ? CONTENT_WIDTH / (series.length - 1) : 0;
  const points = series.map((s, i) => ({
    x: chartX + (series.length > 1 ? i * stepX : CONTENT_WIDTH / 2),
    y: baseY - (s.value / max) * (chartHeight - 10),
  }));

  // area fill under the line
  doc.save();
  doc.fillOpacity(0.18);
  const areaPoints: [number, number][] = [
    [chartX, baseY],
    ...points.map((p): [number, number] => [p.x, p.y]),
    [chartX + CONTENT_WIDTH, baseY],
  ];
  doc.polygon(...areaPoints).fill(GOLD);
  doc.restore();

  // the trend line itself
  doc.lineWidth(1.5).strokeColor(GOLD);
  doc.moveTo(points[0].x, points[0].y);
  for (const p of points.slice(1)) doc.lineTo(p.x, p.y);
  doc.stroke();

  // baseline
  doc.lineWidth(0.5).strokeColor(BORDER);
  doc.moveTo(chartX, baseY).lineTo(chartX + CONTENT_WIDTH, baseY).stroke();

  // x-axis labels — a subset, so labels never crowd/overlap
  const labelStep = Math.max(1, Math.ceil(series.length / 8));
  doc.fontSize(6.5).fillColor(MUTED).font("Helvetica");
  series.forEach((s, i) => {
    if (i % labelStep === 0 || i === series.length - 1) {
      doc.text(s.label, points[i]!.x - 15, baseY + 5, { width: 30, align: "center", lineBreak: false });
    }
  });

  doc.y = baseY + 22;
  doc.x = PAGE_MARGIN;
}

// Page-break-safe, zebra-striped table. Column headers repeat automatically on
// any continuation page, and every cell is truncated with an ellipsis to a
// single line so long product names can never overlap the row below.
function drawTable(doc: PDFKit.PDFDocument, headers: string[], rows: string[][], colWidths: number[]) {
  const headerHeight = 20;
  const rowHeight = 18;

  function drawHeaderRow() {
    const y = doc.y;
    doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, headerHeight).fill(FOREST);
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(WHITE);
    headers.forEach((header, i) => {
      const x = PAGE_MARGIN + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc.text(header, x + 6, y + 6, { width: colWidths[i]! - 10, ellipsis: true, lineBreak: false });
    });
    doc.y = y + headerHeight;
  }

  ensureSpace(doc, headerHeight + rowHeight);
  drawHeaderRow();

  rows.forEach((row, rowIndex) => {
    if (doc.y + rowHeight > bottomLimit(doc)) {
      doc.addPage();
      drawHeaderRow();
    }
    const y = doc.y;
    if (rowIndex % 2 === 1) {
      doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, rowHeight).fill(ZEBRA);
    }
    doc.font("Helvetica").fontSize(8.5).fillColor(INK);
    row.forEach((cell, i) => {
      const x = PAGE_MARGIN + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc.text(cell, x + 6, y + 5, { width: colWidths[i]! - 10, height: rowHeight - 4, ellipsis: true, lineBreak: false });
    });
    doc.y = y + rowHeight;
  });

  doc.moveTo(PAGE_MARGIN, doc.y).lineTo(PAGE_MARGIN + CONTENT_WIDTH, doc.y).strokeColor(BORDER).lineWidth(0.5).stroke();
  doc.y += 12;
  doc.x = PAGE_MARGIN;
}

// Horizontal bar chart (best sellers), also page-break-safe.
function drawBarChart(doc: PDFKit.PDFDocument, items: { label: string; value: number }[]) {
  if (items.length === 0) return;
  const maxValue = Math.max(...items.map((i) => i.value), 1);
  const labelWidth = 150;
  const chartWidth = CONTENT_WIDTH - labelWidth - 90;
  const barHeight = 12;
  const rowGap = 10;
  const rowHeight = barHeight + rowGap;

  for (const item of items) {
    ensureSpace(doc, rowHeight);
    const y = doc.y;
    const barWidth = Math.max(2, (item.value / maxValue) * chartWidth);
    doc
      .fontSize(8)
      .fillColor(INK)
      .font("Helvetica")
      .text(item.label, PAGE_MARGIN, y + 2, { width: labelWidth, ellipsis: true, lineBreak: false });
    doc.rect(PAGE_MARGIN + labelWidth + 6, y, barWidth, barHeight).fill(GOLD);
    doc
      .fillColor(INK)
      .fontSize(8)
      .text(formatCurrency(item.value), PAGE_MARGIN + labelWidth + 6 + barWidth + 6, y + 2, { lineBreak: false });
    doc.y = y + rowHeight;
  }
  doc.x = PAGE_MARGIN;
  doc.y += 6;
}

function drawDiscountStat(doc: PDFKit.PDFDocument, discount: ReportingAnalytics["insights"]["discount"]) {
  const boxHeight = 40;
  ensureSpace(doc, boxHeight + 10);
  const y = doc.y;
  doc.roundedRect(PAGE_MARGIN, y, CONTENT_WIDTH, boxHeight, 6).fillAndStroke(STAT_BG, BORDER);
  doc
    .fillColor(INK)
    .font("Helvetica")
    .fontSize(9)
    .text(
      `Discount usage: ${discount.salesWithDiscount} of ${discount.totalSales} sales (${discount.discountRate}%) included a discount, averaging ${discount.avgDiscountPct}% off subtotal.`,
      PAGE_MARGIN + 14,
      y + 13,
      { width: CONTENT_WIDTH - 28 }
    );
  doc.y = y + boxHeight + 12;
  doc.x = PAGE_MARGIN;
}

// pdfkit's bufferPages mode lets us go back and stamp every page — including
// ones created by later auto-pagination — with a consistent footer/page count.
function stampFooters(doc: PDFKit.PDFDocument) {
  const range = doc.bufferedPageRange();
  const originalBottomMargin = doc.page.margins.bottom;
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    // Drawing inside the bottom margin makes pdfkit's own layout engine think
    // the content overflows and silently append a blank page — even though we
    // gave an explicit x/y. Lifting the margin to 0 while we stamp avoids that.
    doc.page.margins.bottom = 0;
    const pageNum = i - range.start + 1;
    const y = doc.page.height - 28;
    doc.fontSize(7.5).fillColor(MUTED).font("Helvetica");
    doc.text("La Aura POS · Reporting Export", PAGE_MARGIN, y, { width: CONTENT_WIDTH / 2, lineBreak: false });
    doc.text(`Page ${pageNum} of ${range.count}`, PAGE_MARGIN, y, {
      width: CONTENT_WIDTH,
      align: "right",
      lineBreak: false,
    });
    doc.page.margins.bottom = originalBottomMargin;
  }
}

export function renderAnalyticsPdf(summary: DashboardSummary, analytics: ReportingAnalytics, res: Response) {
  const doc = new PDFDocument({ size: "A4", margin: PAGE_MARGIN, bufferPages: true });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="la-aura-report-${analytics.range}.pdf"`);
  doc.pipe(res);

  // Slim continuation header for every page after the first (the masthead below
  // handles page 1). Registered before any content is drawn.
  doc.on("pageAdded", () => {
    doc.fontSize(8).font("Helvetica-Bold").fillColor(MUTED).text("La Aura POS · Reporting Export", PAGE_MARGIN, 24, {
      lineBreak: false,
    });
    doc.moveTo(PAGE_MARGIN, 40).lineTo(doc.page.width - PAGE_MARGIN, 40).strokeColor(BORDER).lineWidth(0.5).stroke();
    doc.y = 52;
    doc.x = PAGE_MARGIN;
    doc.font("Helvetica").fillColor(INK);
  });

  drawMasthead(doc, summary);
  drawKpiRow(doc, summary);
  drawTrendChart(doc, summary);

  sectionTitle(doc, "Best sellers (by revenue)");
  if (analytics.bestSellers.length === 0) {
    noneMessage(doc, "No sales recorded in this period.");
  } else {
    drawBarChart(
      doc,
      analytics.bestSellers.map((item) => ({ label: item.name, value: item.revenue }))
    );
    drawTable(
      doc,
      ["Product", "SKU", "Units", "Revenue"],
      analytics.bestSellers.map((item) => [item.name, item.sku, String(item.units), formatCurrency(item.revenue)]),
      [220, 110, 80, 105]
    );
  }

  sectionTitle(doc, "Slow movers (lowest units sold)");
  if (analytics.worstSellers.length === 0) {
    noneMessage(doc, "No active products to report.");
  } else {
    drawTable(
      doc,
      ["Product", "SKU", "Units sold", "Current stock"],
      analytics.worstSellers.map((item) => [item.name, item.sku, String(item.units), String(item.stock)]),
      [220, 110, 90, 95]
    );
  }

  sectionTitle(doc, "Cashier performance");
  if (analytics.cashierPerformance.length === 0) {
    noneMessage(doc, "No sales recorded in this period.");
  } else {
    drawTable(
      doc,
      ["Cashier", "Sales", "Revenue"],
      analytics.cashierPerformance.map((item) => [item.name, String(item.salesCount), formatCurrency(item.revenue)]),
      [280, 110, 125]
    );
  }

  sectionTitle(doc, "Areas for improvement");
  subTitle(doc, "Dead stock (in stock, zero sales this period)");
  if (analytics.insights.deadStock.length === 0) {
    noneMessage(doc, "None — every active product sold at least once.");
  } else {
    drawTable(
      doc,
      ["Product", "SKU", "Stock"],
      analytics.insights.deadStock.map((item) => [item.name, item.sku, String(item.stock)]),
      [280, 120, 115]
    );
  }

  subTitle(doc, "Stockout risk (popular and running low)");
  if (analytics.insights.stockoutRisk.length === 0) {
    noneMessage(doc, "None — no popular items are currently low on stock.");
  } else {
    drawTable(
      doc,
      ["Product", "SKU", "Stock", "Units sold"],
      analytics.insights.stockoutRisk.map((item) => [item.name, item.sku, String(item.stock), String(item.units)]),
      [220, 110, 90, 95]
    );
  }

  drawDiscountStat(doc, analytics.insights.discount);

  stampFooters(doc);
  doc.end();
}
