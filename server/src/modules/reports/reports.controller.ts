import { Request, Response } from "express";
import { ok } from "../../utils/response";
import * as reportsService from "./reports.service";
import { DashboardRange } from "./reports.service";
import { renderAnalyticsPdf } from "./reports.pdf";

export async function getDashboard(req: Request, res: Response) {
  const range = req.query.range as DashboardRange;
  ok(res, await reportsService.getDashboardSummary(range));
}

export async function getAnalytics(req: Request, res: Response) {
  const range = req.query.range as DashboardRange;
  ok(res, await reportsService.getReportingAnalytics(range));
}

export async function exportPdf(req: Request, res: Response) {
  const range = req.query.range as DashboardRange;
  const analytics = await reportsService.getReportingAnalytics(range);
  renderAnalyticsPdf(analytics, res);
}
