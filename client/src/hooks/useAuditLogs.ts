import { useQuery } from "@tanstack/react-query";
import { auditLogApi } from "../api/auditLogApi";
import type { AuditLogFilters } from "../types/auditLog";

export function useAuditLogsQuery(filters: AuditLogFilters = {}) {
  return useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: () => auditLogApi.list(filters),
  });
}
