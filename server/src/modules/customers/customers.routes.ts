import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createCustomerValidators,
  idParamValidator,
  listCustomersValidators,
  recordPaymentValidators,
  updateCustomerValidators,
} from "./customers.validators";
import * as customersController from "./customers.controller";

export const customersRouter = Router();

customersRouter.use(requireAuth);

customersRouter.get(
  "/",
  requireRole("ADMIN", "MANAGER", "CASHIER"),
  listCustomersValidators,
  validate,
  asyncHandler(customersController.list)
);
customersRouter.get(
  "/:id",
  requireRole("ADMIN", "MANAGER", "CASHIER"),
  idParamValidator,
  validate,
  asyncHandler(customersController.getById)
);
customersRouter.get(
  "/:id/account",
  requireRole("ADMIN", "MANAGER", "CASHIER"),
  idParamValidator,
  validate,
  asyncHandler(customersController.getAccount)
);
customersRouter.post(
  "/",
  requireRole("ADMIN", "MANAGER", "CASHIER"),
  createCustomerValidators,
  validate,
  asyncHandler(customersController.create)
);
customersRouter.post(
  "/:id/payments",
  requireRole("ADMIN", "MANAGER", "CASHIER"),
  recordPaymentValidators,
  validate,
  asyncHandler(customersController.recordPayment)
);
customersRouter.put(
  "/:id",
  requireRole("ADMIN", "MANAGER"),
  updateCustomerValidators,
  validate,
  asyncHandler(customersController.update)
);
customersRouter.delete(
  "/:id",
  requireRole("ADMIN", "MANAGER"),
  idParamValidator,
  validate,
  asyncHandler(customersController.deactivate)
);
