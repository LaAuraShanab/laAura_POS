import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { dashboardQueryValidators } from "./reports.validators";
import * as reportsController from "./reports.controller";

export const reportsRouter = Router();

reportsRouter.use(requireAuth);

reportsRouter.get(
  "/dashboard",
  requireRole("ADMIN", "MANAGER", "REPORTER"),
  dashboardQueryValidators,
  validate,
  asyncHandler(reportsController.getDashboard)
);

reportsRouter.get(
  "/analytics",
  requireRole("ADMIN", "MANAGER", "REPORTER"),
  dashboardQueryValidators,
  validate,
  asyncHandler(reportsController.getAnalytics)
);

reportsRouter.get(
  "/export",
  requireRole("ADMIN", "MANAGER", "REPORTER"),
  dashboardQueryValidators,
  validate,
  asyncHandler(reportsController.exportPdf)
);
