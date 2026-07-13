import { Request } from "express";
import { Prisma, PrismaClient } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";

interface RecordAuditParams {
  userId: string | null;
  action: string;
  req: Request;
  metadata?: Record<string, unknown>;
  client?: PrismaClient | Prisma.TransactionClient;
}

export async function recordAudit({ userId, action, req, metadata, client }: RecordAuditParams) {
  const db = client ?? prisma;
  await db.auditLog.create({
    data: {
      userId: userId ?? undefined,
      action,
      ipAddress: req.ip,
      metadata: metadata as Prisma.InputJsonValue | undefined,
    },
  });
}
