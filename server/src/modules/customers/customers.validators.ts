import { body, param, query } from "express-validator";

export const createCustomerValidators = [
  body("name").isString().trim().notEmpty().withMessage("Name is required"),
  body("phone").isString().trim().notEmpty().withMessage("Phone number is required"),
];

export const updateCustomerValidators = [
  param("id").isUUID(),
  body("name").optional().isString().trim().notEmpty(),
  body("phone").optional().isString().trim().notEmpty(),
];

export const idParamValidator = [param("id").isUUID()];

export const listCustomersValidators = [query("search").optional().isString().trim()];

const paymentMethods = ["CASH", "CARD", "MOBILE_MONEY", "OTHER"];

export const recordPaymentValidators = [
  param("id").isUUID(),
  body("amount").isFloat({ gt: 0 }).withMessage("Payment amount must be greater than 0"),
  body("method").optional().isIn(paymentMethods),
  body("note").optional({ values: "falsy" }).isString().trim().isLength({ max: 500 }),
  body("allocations").optional().isArray(),
  body("allocations.*.saleId").isUUID(),
  body("allocations.*.amount").isFloat({ gt: 0 }),
];
