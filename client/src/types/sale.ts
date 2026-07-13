import type { Product, ProductVariant } from "./product";

export type PaymentMethod = "CASH" | "CARD" | "MOBILE_MONEY" | "OTHER";
export type SaleStatus = "COMPLETED" | "VOIDED" | "REFUNDED";

export interface SaleItemExtra {
  id: string;
  extraId: string | null;
  name: string;
  price: string;
  extra: { name: string; nameAr: string | null } | null;
}

export interface SaleItem {
  id: string;
  productId: string;
  variantId: string | null;
  variantName: string | null;
  quantity: number;
  price: string;
  product: Product;
  variant: ProductVariant | null;
  extras: SaleItemExtra[];
}

export interface Sale {
  id: string;
  reference: string;
  customerId: string | null;
  cashierId: string;
  date: string;
  subtotal: string;
  tax: string;
  discount: string;
  grandTotal: string;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  voidedAt: string | null;
  voidReason: string | null;
  voidedBy: { id: string; name: string } | null;
  items: SaleItem[];
  cashier: { id: string; name: string };
  customer: { id: string; name: string; phone: string | null; email: string | null } | null;
}

export interface CreateSaleInput {
  customerId?: string;
  items: Array<{ productId: string; variantId?: string; extraIds?: string[]; quantity: number }>;
  discount: number;
  tax: number;
  paymentMethod: PaymentMethod;
}

export interface SaleListFilters {
  search?: string;
  paymentMethod?: PaymentMethod;
  status?: SaleStatus;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface SaleListResponse {
  sales: Sale[];
  total: number;
  page: number;
  pageSize: number;
}
