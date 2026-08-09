import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "../api/reportsApi";
import type { DashboardRange } from "../types/dashboard";

export function useDashboard(range: DashboardRange, offset = 0) {
  return useQuery({
    queryKey: ["dashboard", range, offset],
    queryFn: () => reportsApi.getDashboard(range, offset),
  });
}
