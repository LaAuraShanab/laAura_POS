import { body, param, query } from "express-validator";

const paymentMethods = ["CASH", "CARD", "MOBILE_MONEY", "OTHER"];
const saleStatuses = ["COMPLETED", "VOIDED", "REFUNDED"];

export const listSalesValidators = [
  query("search").optional().isString().trim(),
  query("paymentMethod").optional().isIn(paymentMethods),
  query("status").optional().isIn(saleStatuses),
  query("from").optional().isISO8601(),
  query("to").optional().isISO8601(),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("pageSize").optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const voidSaleValidators = [
  param("id").isUUID(),
  body("status").isIn(["VOIDED", "REFUNDED"]).withMessage("Status must be VOIDED or REFUNDED"),
  body("reason").optional({ values: "falsy" }).isString().trim().isLength({ max: 500 }),
];

export const createSaleValidators = [
  body("customerId").optional({ values: "falsy" }).isUUID(),
  body("items").isArray({ min: 1 }).withMessage("At least one item is required"),
  body("items.*.productId").isUUID().withMessage("Each item needs a valid productId"),
  body("items.*.variantId").optional({ values: "falsy" }).isUUID(),
  body("items.*.extraIds").optional().isArray().withMessage("extraIds must be an array"),
  body("items.*.extraIds.*").isUUID(),
  body("items.*.quantity").isInt({ min: 1 }).withMessage("Each item needs a quantity of at least 1"),
  body("discount").optional().isFloat({ min: 0 }),
  body("tax").optional().isFloat({ min: 0 }),
  body("note").optional({ values: "falsy" }).isString().trim().isLength({ max: 500 }),
  body("paymentMethod")
    .isIn(paymentMethods)
    .withMessage(`Payment method must be one of: ${paymentMethods.join(", ")}`),
];

export const idParamValidator = [param("id").isUUID()];
