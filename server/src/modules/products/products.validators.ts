import { body, param, query } from "express-validator";

const variantValidators = [
  body("variants").optional().isArray().withMessage("Variants must be an array"),
  body("variants.*.id").optional().isUUID(),
  body("variants.*.name").isString().trim().notEmpty().withMessage("Variant name is required"),
  body("variants.*.nameAr").optional({ values: "falsy" }).isString().trim(),
  body("variants.*.price").isFloat({ min: 0 }).withMessage("Variant price must be a non-negative number"),
];

const extraValidators = [
  body("extras").optional().isArray().withMessage("Extras must be an array"),
  body("extras.*.id").optional().isUUID(),
  body("extras.*.name").isString().trim().notEmpty().withMessage("Extra name is required"),
  body("extras.*.nameAr").optional({ values: "falsy" }).isString().trim(),
  body("extras.*.price").isFloat({ min: 0 }).withMessage("Extra price must be a non-negative number"),
];

export const createProductValidators = [
  body("sku").isString().trim().notEmpty().withMessage("SKU is required"),
  body("barcode").optional({ values: "falsy" }).isString().trim(),
  body("name").isString().trim().notEmpty().withMessage("Name is required"),
  body("nameAr").optional({ values: "falsy" }).isString().trim(),
  body("price").isFloat({ min: 0 }).withMessage("Price must be a non-negative number"),
  body("categoryId").optional({ values: "falsy" }).isUUID(),
  body("stock").isInt({ min: 0 }).withMessage("Stock must be a non-negative integer"),
  body("image").optional({ values: "falsy" }).isString(),
  ...variantValidators,
  ...extraValidators,
];

export const updateProductValidators = [
  param("id").isUUID(),
  body("sku").optional().isString().trim().notEmpty(),
  body("barcode").optional({ values: "falsy" }).isString().trim(),
  body("name").optional().isString().trim().notEmpty(),
  body("nameAr").optional({ values: "falsy" }).isString().trim(),
  body("price").optional().isFloat({ min: 0 }),
  body("categoryId").optional({ values: "falsy" }).isUUID(),
  body("stock").optional().isInt({ min: 0 }),
  body("image").optional({ values: "falsy" }).isString(),
  ...variantValidators,
  ...extraValidators,
];

export const idParamValidator = [param("id").isUUID()];

export const listProductsValidators = [
  query("search").optional().isString(),
  query("categoryId").optional().isUUID(),
];
