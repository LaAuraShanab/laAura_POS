import { axiosClient, unwrap } from "./axiosClient";
import type { DashboardRange, DashboardSummary } from "../types/dashboard";
import type { ReportingAnalytics } from "../types/reporting";

export const reportsApi = {
  getDashboard: (range: DashboardRange) =>
    unwrap<DashboardSummary>(axiosClient.get("/reports/dashboard", { params: { range } })),
  getAnalytics: (range: DashboardRange) =>
    unwrap<ReportingAnalytics>(axiosClient.get("/reports/analytics", { params: { range } })),
  exportPdf: async (range: DashboardRange) => {
    const response = await axiosClient.get("/reports/export", {
      params: { range },
      responseType: "blob",
    });
    return response.data as Blob;
  },
};
