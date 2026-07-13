import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { listAuditLogsValidators } from "./audit.validators";
import * as auditController from "./audit.controller";

export const auditRouter = Router();

auditRouter.use(requireAuth, requireRole("ADMIN"));

auditRouter.get("/", listAuditLogsValidators, validate, asyncHandler(auditController.list));
