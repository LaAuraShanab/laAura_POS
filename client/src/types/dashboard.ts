export type DashboardRange = "today" | "week" | "month";
export type BucketUnit = "hour" | "day";

export interface DashboardSeriesPoint {
  label: string;
  value: number;
  count: number;
  start: string;
}

export interface DashboardLowStockItem {
  id: string;
  name: string;
  nameAr: string | null;
  sku: string;
  stock: number;
}

export interface DashboardRecentSale {
  id: string;
  reference: string;
  date: string;
  grandTotal: number;
  itemCount: number;
  firstItemName: string | null;
  firstItemNameAr: string | null;
}

// Note: unlike most endpoints, this one returns plain numbers (not numeric strings)
// for money fields, since the server already does the arithmetic.
export interface DashboardSummary {
  range: DashboardRange;
  offset: number;
  bucketUnit: BucketUnit;
  period: { start: string; end: string };
  totals: { periodTotal: number; previousTotal: number; deltaPct: number | null };
  averages: { avgSaleValue: number; avgItemsPerSale: number };
  activity: { totalTransactions: number; itemsSold: number };
  series: DashboardSeriesPoint[];
  lowStock: DashboardLowStockItem[];
  recentSales: DashboardRecentSale[];
}
