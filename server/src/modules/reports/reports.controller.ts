import { Request, Response } from "express";
import { ok } from "../../utils/response";
import * as reportsService from "./reports.service";
import { DashboardRange } from "./reports.service";
import { renderAnalyticsPdf } from "./reports.pdf";

function parseOffset(req: Request): number {
  const raw = Number(req.query.offset);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 0;
}

export async function getDashboard(req: Request, res: Response) {
  const range = req.query.range as DashboardRange;
  ok(res, await reportsService.getDashboardSummary(range, parseOffset(req)));
}

export async function getAnalytics(req: Request, res: Response) {
  const range = req.query.range as DashboardRange;
  ok(res, await reportsService.getReportingAnalytics(range, parseOffset(req)));
}

export async function exportPdf(req: Request, res: Response) {
  const range = req.query.range as DashboardRange;
  const analytics = await reportsService.getReportingAnalytics(range, parseOffset(req));
  renderAnalyticsPdf(analytics, res);
}
