import { prisma } from "../../lib/prisma";
import { Prisma } from "../../generated/prisma/client";

interface ListAuditLogsFilters {
  search?: string;
  action?: string;
  userId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export async function listAuditLogs(filters: ListAuditLogsFilters) {
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const pageSize = filters.pageSize && filters.pageSize > 0 ? Math.min(filters.pageSize, 100) : 25;

  const where: Prisma.AuditLogWhereInput = {
    action: filters.action,
    userId: filters.userId,
    date: {
      gte: filters.from ? new Date(filters.from) : undefined,
      lte: filters.to ? new Date(filters.to) : undefined,
    },
    OR: filters.search
      ? [
          { action: { contains: filters.search, mode: "insensitive" } },
          { user: { name: { contains: filters.search, mode: "insensitive" } } },
          { user: { email: { contains: filters.search, mode: "insensitive" } } },
        ]
      : undefined,
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total, page, pageSize };
}
