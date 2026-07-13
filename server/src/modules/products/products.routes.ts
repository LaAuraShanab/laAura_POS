import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createProductValidators,
  idParamValidator,
  listProductsValidators,
  updateProductValidators,
} from "./products.validators";
import { productImageUpload } from "./products.upload";
import * as productsController from "./products.controller";

export const productsRouter = Router();

productsRouter.use(requireAuth);

productsRouter.get("/", listProductsValidators, validate, asyncHandler(productsController.list));
productsRouter.get("/:id", idParamValidator, validate, asyncHandler(productsController.getById));

productsRouter.post(
  "/",
  requireRole("ADMIN", "MANAGER"),
  createProductValidators,
  validate,
  asyncHandler(productsController.create)
);
productsRouter.put(
  "/:id",
  requireRole("ADMIN", "MANAGER"),
  updateProductValidators,
  validate,
  asyncHandler(productsController.update)
);
productsRouter.delete(
  "/:id",
  requireRole("ADMIN", "MANAGER"),
  idParamValidator,
  validate,
  asyncHandler(productsController.remove)
);

productsRouter.post(
  "/:id/image",
  requireRole("ADMIN", "MANAGER"),
  idParamValidator,
  validate,
  productImageUpload.single("image"),
  asyncHandler(productsController.uploadImage)
);
