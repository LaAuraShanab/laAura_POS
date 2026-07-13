import type { Role } from "./user";

export interface AuditLog {
  id: string;
  userId: string | null;
  user: { id: string; name: string; email: string; role: Role } | null;
  action: string;
  date: string;
  ipAddress: string | null;
  metadata: Record<string, unknown> | null;
}

export interface AuditLogFilters {
  search?: string;
  action?: string;
  userId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface AuditLogListResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
}
