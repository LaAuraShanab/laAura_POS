import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { salesApi } from "../api/salesApi";
import type { CreateSaleInput, SaleListFilters, SaleStatus } from "../types/sale";

export function useSalesQuery(filters: SaleListFilters = {}) {
  return useQuery({
    queryKey: ["sales", filters],
    queryFn: () => salesApi.list(filters),
  });
}

export function useSaleQuery(id: string | null) {
  return useQuery({
    queryKey: ["sale", id],
    queryFn: () => salesApi.getById(id as string),
    enabled: !!id,
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSaleInput) => salesApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useVoidSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: Extract<SaleStatus, "VOIDED" | "REFUNDED">;
      reason?: string;
    }) => salesApi.updateStatus(id, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["reporting-analytics"] });
    },
  });
}
