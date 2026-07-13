import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "../api/reportsApi";
import type { DashboardRange } from "../types/dashboard";

export function useDashboard(range: DashboardRange) {
  return useQuery({
    queryKey: ["dashboard", range],
    queryFn: () => reportsApi.getDashboard(range),
  });
}
