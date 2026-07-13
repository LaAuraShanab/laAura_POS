import { Request, Response } from "express";
import { ok } from "../../utils/response";
import { recordAudit } from "../../middleware/auditLog";
import { ValidationError } from "../../errors/AppError";
import * as productsService from "./products.service";

export async function list(req: Request, res: Response) {
  const { search, categoryId } = req.query as { search?: string; categoryId?: string };
  ok(res, await productsService.listProducts({ search, categoryId }));
}

export async function getById(req: Request, res: Response) {
  ok(res, await productsService.getProduct(req.params.id as string));
}

export async function create(req: Request, res: Response) {
  const product = await productsService.createProduct(req.body);
  await recordAudit({
    userId: req.user!.id,
    action: "PRODUCT_CREATED",
    req,
    metadata: {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      ...(product.variants.length > 0 && { variants: product.variants.map((v) => v.name) }),
      ...(product.extras.length > 0 && { extras: product.extras.map((e) => e.name) }),
    },
  });
  ok(res, product, 201);
}

export async function update(req: Request, res: Response) {
  const { product, variantChanges, extraChanges } = await productsService.updateProduct(
    req.params.id as string,
    req.body,
    req.user!.id
  );
  await recordAudit({
    userId: req.user!.id,
    action: "PRODUCT_UPDATED",
    req,
    metadata: {
      productId: product.id,
      productName: product.name,
      ...(variantChanges && { variantChanges }),
      ...(extraChanges && { extraChanges }),
    },
  });
  ok(res, product);
}

export async function uploadImage(req: Request, res: Response) {
  if (!req.file) {
    throw new ValidationError([{ field: "image", message: "An image file is required" }]);
  }
  const product = await productsService.setProductImage(
    req.params.id as string,
    `/uploads/products/${req.file.filename}`
  );
  await recordAudit({
    userId: req.user!.id,
    action: "PRODUCT_IMAGE_UPDATED",
    req,
    metadata: { productId: product.id, productName: product.name },
  });
  ok(res, product);
}

export async function remove(req: Request, res: Response) {
  const product = await productsService.deactivateProduct(req.params.id as string);
  await recordAudit({
    userId: req.user!.id,
    action: "PRODUCT_DEACTIVATED",
    req,
    metadata: { productId: product.id, productName: product.name },
  });
  ok(res, product);
}
