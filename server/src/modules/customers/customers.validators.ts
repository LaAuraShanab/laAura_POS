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
