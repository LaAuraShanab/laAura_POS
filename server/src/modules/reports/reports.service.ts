import { prisma } from "../../lib/prisma";

export type DashboardRange = "today" | "week" | "month";

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_MS = 24 * 60 * 60 * 1000;
const LOW_STOCK_THRESHOLD = 10;

interface RangeBounds {
  currentStart: Date;
  currentEnd: Date;
  previousStart: Date;
  previousEnd: Date;
  bucketUnit: "hour" | "day";
  isCurrent: boolean;
}

function utcMidnight(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

// `offset` counts whole periods into the past: 0 = the live/current period,
// 1 = the immediately-previous one, etc. Past periods are always complete
// windows (a whole day/week/month); only the current period is partial (ends now).
export function getRangeBounds(range: DashboardRange, now: Date, offset = 0): RangeBounds {
  const isCurrent = offset === 0;

  if (range === "today") {
    const currentStart = new Date(utcMidnight(now).getTime() - offset * DAY_MS);
    const currentEnd = isCurrent ? now : new Date(currentStart.getTime() + DAY_MS - 1);
    return {
      currentStart,
      currentEnd,
      previousStart: new Date(currentStart.getTime() - DAY_MS),
      previousEnd: currentStart,
      bucketUnit: "hour",
      isCurrent,
    };
  }

  if (range === "week") {
    const currentStart = new Date(utcMidnight(now).getTime() - (6 + offset * 7) * DAY_MS);
    const currentEnd = isCurrent ? now : new Date(currentStart.getTime() + 7 * DAY_MS - 1);
    return {
      currentStart,
      currentEnd,
      previousStart: new Date(currentStart.getTime() - 7 * DAY_MS),
      previousEnd: currentStart,
      bucketUnit: "day",
      isCurrent,
    };
  }

  const currentStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset + 1, 0, 23, 59, 59, 999));
  const currentEnd = isCurrent ? now : monthEnd;
  const previousStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset - 1, 1));
  const endOfPrevMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 0, 23, 59, 59, 999));

  let previousEnd: Date;
  if (isCurrent) {
    // compare like-for-like: same elapsed slice of the previous month
    const candidateEnd = new Date(previousStart.getTime() + now.getUTCDate() * DAY_MS);
    previousEnd = candidateEnd < endOfPrevMonth ? candidateEnd : endOfPrevMonth;
  } else {
    // a completed past month compares against the full month before it
    previousEnd = endOfPrevMonth;
  }

  return { currentStart, currentEnd, previousStart, previousEnd, bucketUnit: "day", isCurrent };
}

function dayKey(date: Date): string {
  return `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;
}

function dayLabel(date: Date): string {
  return `${MONTH_ABBR[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

function buildBucketPlan(
  range: DashboardRange,
  bounds: RangeBounds,
  now: Date
): { key: string; label: string; start: Date }[] {
  if (range === "today") {
    // current day stops at the current hour; a past day shows all 24 hours
    const hours = bounds.isCurrent ? now.getUTCHours() + 1 : 24;
    return Array.from({ length: hours }, (_, hour) => ({
      key: String(hour),
      label: `${String(hour).padStart(2, "0")}:00`,
      start: new Date(bounds.currentStart.getTime() + hour * 60 * 60 * 1000),
    }));
  }

  // week = 7 days; month = elapsed days (current) or the full month (past)
  const days = range === "week" ? 7 : bounds.isCurrent ? now.getUTCDate() : bounds.currentEnd.getUTCDate();
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(bounds.currentStart.getTime() + i * DAY_MS);
    return { key: dayKey(date), label: dayLabel(date), start: date };
  });
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function getDashboardSummary(range: DashboardRange, offset = 0) {
  const now = new Date();
  const bounds = getRangeBounds(range, now, offset);

  const [currentSales, previousSales, lowStock, recentSales] = await Promise.all([
    prisma.sale.findMany({
      where: { status: "COMPLETED", date: { gte: bounds.currentStart, lte: bounds.currentEnd } },
      include: { items: true },
      orderBy: { date: "desc" },
    }),
    prisma.sale.findMany({
      where: { status: "COMPLETED", date: { gte: bounds.previousStart, lte: bounds.previousEnd } },
      select: { grandTotal: true },
    }),
    prisma.product.findMany({
      where: { isActive: true, stock: { lte: LOW_STOCK_THRESHOLD } },
      orderBy: { stock: "asc" },
      take: 5,
      select: { id: true, name: true, nameAr: true, sku: true, stock: true },
    }),
    prisma.sale.findMany({
      where: { status: "COMPLETED" },
      orderBy: { date: "desc" },
      take: 5,
      include: { items: { include: { product: { select: { name: true, nameAr: true } } } } },
    }),
  ]);

  const periodTotal = currentSales.reduce((sum, sale) => sum + Number(sale.grandTotal), 0);
  const previousTotal = previousSales.reduce((sum, sale) => sum + Number(sale.grandTotal), 0);
  const deltaPct = previousTotal === 0 ? null : round2(((periodTotal - previousTotal) / previousTotal) * 100);

  const totalTransactions = currentSales.length;
  const itemsSold = currentSales.reduce(
    (sum, sale) => sum + sale.items.reduce((qty, item) => qty + item.quantity, 0),
    0
  );
  const avgSaleValue = totalTransactions === 0 ? 0 : round2(periodTotal / totalTransactions);
  const avgItemsPerSale = totalTransactions === 0 ? 0 : round2(itemsSold / totalTransactions);

  const bucketPlan = buildBucketPlan(range, bounds, now);
  const bucketTotals = new Map<string, number>();
  const bucketCounts = new Map<string, number>();
  for (const sale of currentSales) {
    const key = bounds.bucketUnit === "hour" ? String(sale.date.getUTCHours()) : dayKey(sale.date);
    bucketTotals.set(key, (bucketTotals.get(key) ?? 0) + Number(sale.grandTotal));
    bucketCounts.set(key, (bucketCounts.get(key) ?? 0) + 1);
  }
  const series = bucketPlan.map((bucket) => ({
    label: bucket.label,
    value: round2(bucketTotals.get(bucket.key) ?? 0),
    count: bucketCounts.get(bucket.key) ?? 0,
    start: bucket.start.toISOString(),
  }));

  return {
    range,
    offset,
    bucketUnit: bounds.bucketUnit,
    period: { start: bounds.currentStart.toISOString(), end: bounds.currentEnd.toISOString() },
    totals: { periodTotal: round2(periodTotal), previousTotal: round2(previousTotal), deltaPct },
    averages: { avgSaleValue, avgItemsPerSale },
    activity: { totalTransactions, itemsSold },
    series,
    lowStock,
    recentSales: recentSales.map((sale) => ({
      id: sale.id,
      reference: sale.reference,
      date: sale.date.toISOString(),
      grandTotal: Number(sale.grandTotal),
      itemCount: sale.items.reduce((qty, item) => qty + item.quantity, 0),
      firstItemName: sale.items[0]?.product.name ?? null,
      firstItemNameAr: sale.items[0]?.product.nameAr ?? null,
    })),
  };
}

const TOP_N = 5;

export interface ReportingAnalytics {
  range: DashboardRange;
  offset: number;
  period: { start: string; end: string };
  bestSellers: { productId: string; name: string; nameAr: string | null; sku: string; units: number; revenue: number }[];
  worstSellers: { productId: string; name: string; nameAr: string | null; sku: string; units: number; stock: number }[];
  cashierPerformance: { cashierId: string; name: string; salesCount: number; revenue: number }[];
  insights: {
    deadStock: { productId: string; name: string; nameAr: string | null; sku: string; stock: number }[];
    stockoutRisk: { productId: string; name: string; nameAr: string | null; sku: string; stock: number; units: number }[];
    discount: { salesWithDiscount: number; totalSales: number; discountRate: number; avgDiscountPct: number };
  };
}

export async function getReportingAnalytics(range: DashboardRange, offset = 0): Promise<ReportingAnalytics> {
  const now = new Date();
  const bounds = getRangeBounds(range, now, offset);

  const [currentSales, activeProducts] = await Promise.all([
    prisma.sale.findMany({
      where: { status: "COMPLETED", date: { gte: bounds.currentStart, lte: bounds.currentEnd } },
      include: {
        items: { include: { product: { select: { id: true, name: true, nameAr: true, sku: true, stock: true } } } },
        cashier: { select: { id: true, name: true } },
      },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, nameAr: true, sku: true, stock: true },
    }),
  ]);

  const unitsSoldByProduct = new Map<string, number>();
  const revenueByProduct = new Map<string, number>();
  const productMeta = new Map<string, { name: string; nameAr: string | null; sku: string; stock: number }>();
  const performanceByCashier = new Map<string, { name: string; salesCount: number; revenue: number }>();

  let salesWithDiscount = 0;
  let discountPctSum = 0;
  let discountPctCount = 0;

  for (const sale of currentSales) {
    for (const item of sale.items) {
      unitsSoldByProduct.set(item.productId, (unitsSoldByProduct.get(item.productId) ?? 0) + item.quantity);
      revenueByProduct.set(
        item.productId,
        (revenueByProduct.get(item.productId) ?? 0) + Number(item.price) * item.quantity
      );
      productMeta.set(item.productId, {
        name: item.product.name,
        nameAr: item.product.nameAr,
        sku: item.product.sku,
        stock: item.product.stock,
      });
    }

    const cashierEntry = performanceByCashier.get(sale.cashierId) ?? {
      name: sale.cashier.name,
      salesCount: 0,
      revenue: 0,
    };
    cashierEntry.salesCount += 1;
    cashierEntry.revenue += Number(sale.grandTotal);
    performanceByCashier.set(sale.cashierId, cashierEntry);

    const discount = Number(sale.discount);
    const subtotal = Number(sale.subtotal);
    if (discount > 0) {
      salesWithDiscount += 1;
      if (subtotal > 0) {
        discountPctSum += (discount / subtotal) * 100;
        discountPctCount += 1;
      }
    }
  }

  const bestSellers = Array.from(revenueByProduct.entries())
    .map(([productId, revenue]) => ({
      productId,
      name: productMeta.get(productId)!.name,
      nameAr: productMeta.get(productId)!.nameAr,
      sku: productMeta.get(productId)!.sku,
      units: unitsSoldByProduct.get(productId) ?? 0,
      revenue: round2(revenue),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, TOP_N);

  const worstSellers = activeProducts
    .map((product) => ({
      productId: product.id,
      name: product.name,
      nameAr: product.nameAr,
      sku: product.sku,
      units: unitsSoldByProduct.get(product.id) ?? 0,
      stock: product.stock,
    }))
    .sort((a, b) => a.units - b.units)
    .slice(0, TOP_N);

  const cashierPerformance = Array.from(performanceByCashier.entries())
    .map(([cashierId, entry]) => ({
      cashierId,
      name: entry.name,
      salesCount: entry.salesCount,
      revenue: round2(entry.revenue),
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const deadStock = activeProducts
    .filter((product) => product.stock > 0 && (unitsSoldByProduct.get(product.id) ?? 0) === 0)
    .sort((a, b) => b.stock - a.stock)
    .slice(0, TOP_N)
    .map((product) => ({
      productId: product.id,
      name: product.name,
      nameAr: product.nameAr,
      sku: product.sku,
      stock: product.stock,
    }));

  const stockoutRisk = activeProducts
    .filter((product) => product.stock <= LOW_STOCK_THRESHOLD && (unitsSoldByProduct.get(product.id) ?? 0) > 0)
    .sort((a, b) => (unitsSoldByProduct.get(b.id) ?? 0) - (unitsSoldByProduct.get(a.id) ?? 0))
    .slice(0, TOP_N)
    .map((product) => ({
      productId: product.id,
      name: product.name,
      nameAr: product.nameAr,
      sku: product.sku,
      stock: product.stock,
      units: unitsSoldByProduct.get(product.id) ?? 0,
    }));

  return {
    range,
    offset,
    period: { start: bounds.currentStart.toISOString(), end: bounds.currentEnd.toISOString() },
    bestSellers,
    worstSellers,
    cashierPerformance,
    insights: {
      deadStock,
      stockoutRisk,
      discount: {
        salesWithDiscount,
        totalSales: currentSales.length,
        discountRate: currentSales.length === 0 ? 0 : round2((salesWithDiscount / currentSales.length) * 100),
        avgDiscountPct: discountPctCount === 0 ? 0 : round2(discountPctSum / discountPctCount),
      },
    },
  };
}
