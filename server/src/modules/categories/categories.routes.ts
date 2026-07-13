import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { idParamValidator, nameValidators } from "./categories.validators";
import * as categoriesController from "./categories.controller";

export const categoriesRouter = Router();

categoriesRouter.use(requireAuth);

categoriesRouter.get("/", asyncHandler(categoriesController.list));
categoriesRouter.get("/:id", idParamValidator, validate, asyncHandler(categoriesController.getById));

categoriesRouter.post(
  "/",
  requireRole("ADMIN", "MANAGER"),
  nameValidators,
  validate,
  asyncHandler(categoriesController.create)
);
categoriesRouter.put(
  "/:id",
  requireRole("ADMIN", "MANAGER"),
  idParamValidator,
  nameValidators,
  validate,
  asyncHandler(categoriesController.update)
);
categoriesRouter.delete(
  "/:id",
  requireRole("ADMIN", "MANAGER"),
  idParamValidator,
  validate,
  asyncHandler(categoriesController.remove)
);
