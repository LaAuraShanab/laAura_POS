import { axiosClient, unwrap } from "./axiosClient";
import type { AuditLogFilters, AuditLogListResponse } from "../types/auditLog";

export const auditLogApi = {
  list: (filters: AuditLogFilters = {}) =>
    unwrap<AuditLogListResponse>(axiosClient.get("/audit-logs", { params: filters })),
};
