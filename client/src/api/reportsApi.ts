import { axiosClient, unwrap } from "./axiosClient";
import type { DashboardRange, DashboardSummary } from "../types/dashboard";
import type { ReportingAnalytics } from "../types/reporting";

export const reportsApi = {
  getDashboard: (range: DashboardRange, offset = 0) =>
    unwrap<DashboardSummary>(axiosClient.get("/reports/dashboard", { params: { range, offset } })),
  getAnalytics: (range: DashboardRange, offset = 0) =>
    unwrap<ReportingAnalytics>(axiosClient.get("/reports/analytics", { params: { range, offset } })),
  exportPdf: async (range: DashboardRange, offset = 0) => {
    const response = await axiosClient.get("/reports/export", {
      params: { range, offset },
      responseType: "blob",
    });
    return response.data as Blob;
  },
};
