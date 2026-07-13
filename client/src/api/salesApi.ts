import { axiosClient, unwrap } from "./axiosClient";
import type { CreateSaleInput, Sale, SaleListFilters, SaleListResponse, SaleStatus } from "../types/sale";

export const salesApi = {
  create: (input: CreateSaleInput) => unwrap<Sale>(axiosClient.post("/sales", input)),
  list: (filters: SaleListFilters = {}) =>
    unwrap<SaleListResponse>(axiosClient.get("/sales", { params: filters })),
  getById: (id: string) => unwrap<Sale>(axiosClient.get(`/sales/${id}`)),
  updateStatus: (id: string, status: Extract<SaleStatus, "VOIDED" | "REFUNDED">, reason?: string) =>
    unwrap<Sale>(axiosClient.patch(`/sales/${id}/status`, { status, reason })),
};
