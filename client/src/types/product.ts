import type { Category } from "./category";

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  nameAr: string | null;
  price: string;
  sortOrder: number;
}

export interface ProductExtra {
  id: string;
  productId: string;
  name: string;
  nameAr: string | null;
  price: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  nameAr: string | null;
  price: string;
  categoryId: string | null;
  category: Category | null;
  stock: number;
  image: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  variants: ProductVariant[];
  extras: ProductExtra[];
}

export interface ProductVariantInput {
  id?: string;
  name: string;
  nameAr?: string;
  price: number;
}

export interface ProductExtraInput {
  id?: string;
  name: string;
  nameAr?: string;
  price: number;
}

export interface ProductInput {
  sku: string;
  barcode?: string;
  name: string;
  nameAr?: string;
  price: number;
  categoryId?: string;
  stock: number;
  image?: string;
  variants?: ProductVariantInput[];
  extras?: ProductExtraInput[];
}
