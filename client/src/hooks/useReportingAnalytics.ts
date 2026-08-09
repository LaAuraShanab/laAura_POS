import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "../api/reportsApi";
import type { DashboardRange } from "../types/dashboard";

export function useReportingAnalytics(range: DashboardRange, offset = 0) {
  return useQuery({
    queryKey: ["reporting-analytics", range, offset],
    queryFn: () => reportsApi.getAnalytics(range, offset),
  });
}
