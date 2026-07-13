import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "../api/reportsApi";
import type { DashboardRange } from "../types/dashboard";

export function useReportingAnalytics(range: DashboardRange) {
  return useQuery({
    queryKey: ["reporting-analytics", range],
    queryFn: () => reportsApi.getAnalytics(range),
  });
}
