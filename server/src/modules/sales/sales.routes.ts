import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { createSaleValidators, idParamValidator, listSalesValidators, voidSaleValidators } from "./sales.validators";
import * as salesController from "./sales.controller";

export const salesRouter = Router();

salesRouter.use(requireAuth);

salesRouter.post(
  "/",
  requireRole("ADMIN", "MANAGER", "CASHIER"),
  createSaleValidators,
  validate,
  asyncHandler(salesController.create)
);
salesRouter.get(
  "/",
  requireRole("ADMIN", "MANAGER", "REPORTER", "CASHIER"),
  listSalesValidators,
  validate,
  asyncHandler(salesController.list)
);
salesRouter.get(
  "/:id",
  requireRole("ADMIN", "MANAGER", "REPORTER", "CASHIER"),
  idParamValidator,
  validate,
  asyncHandler(salesController.getById)
);
salesRouter.patch(
  "/:id/status",
  requireRole("ADMIN", "MANAGER"),
  voidSaleValidators,
  validate,
  asyncHandler(salesController.voidSale)
);
