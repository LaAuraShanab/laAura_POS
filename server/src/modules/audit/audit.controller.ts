import { Request, Response } from "express";
import { ok } from "../../utils/response";
import * as auditService from "./audit.service";

export async function list(req: Request, res: Response) {
  const { search, action, userId, from, to, page, pageSize } = req.query as {
    search?: string;
    action?: string;
    userId?: string;
    from?: string;
    to?: string;
    page?: string;
    pageSize?: string;
  };
  ok(
    res,
    await auditService.listAuditLogs({
      search,
      action,
      userId,
      from,
      to,
      page: page !== undefined ? Number(page) : undefined,
      pageSize: pageSize !== undefined ? Number(pageSize) : undefined,
    })
  );
}
