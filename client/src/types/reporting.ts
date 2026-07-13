import type { DashboardRange } from "./dashboard";

export interface BestSellerItem {
  productId: string;
  name: string;
  nameAr: string | null;
  sku: string;
  units: number;
  revenue: number;
}

export interface WorstSellerItem {
  productId: string;
  name: string;
  nameAr: string | null;
  sku: string;
  units: number;
  stock: number;
}

export interface CashierPerformanceItem {
  cashierId: string;
  name: string;
  salesCount: number;
  revenue: number;
}

export interface DeadStockItem {
  productId: string;
  name: string;
  nameAr: string | null;
  sku: string;
  stock: number;
}

export interface StockoutRiskItem {
  productId: string;
  name: string;
  nameAr: string | null;
  sku: string;
  stock: number;
  units: number;
}

export interface DiscountInsight {
  salesWithDiscount: number;
  totalSales: number;
  discountRate: number;
  avgDiscountPct: number;
}

export interface ReportingAnalytics {
  range: DashboardRange;
  period: { start: string; end: string };
  bestSellers: BestSellerItem[];
  worstSellers: WorstSellerItem[];
  cashierPerformance: CashierPerformanceItem[];
  insights: {
    deadStock: DeadStockItem[];
    stockoutRisk: StockoutRiskItem[];
    discount: DiscountInsight;
  };
}
