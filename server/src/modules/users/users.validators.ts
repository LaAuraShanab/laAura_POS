import { body, param } from "express-validator";

const roles = ["ADMIN", "MANAGER", "CASHIER", "REPORTER"];
const statuses = ["ACTIVE", "INACTIVE"];

export const createUserValidators = [
  body("name").isString().trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password").isString().isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  body("role").isIn(roles).withMessage(`Role must be one of: ${roles.join(", ")}`),
];

export const updateUserValidators = [
  param("id").isUUID(),
  body("name").optional().isString().trim().notEmpty(),
  body("email").optional().isEmail().normalizeEmail(),
  body("role").optional().isIn(roles).withMessage(`Role must be one of: ${roles.join(", ")}`),
  body("status").optional().isIn(statuses).withMessage(`Status must be one of: ${statuses.join(", ")}`),
  body("password").optional().isString().isLength({ min: 8 }),
];

export const idParamValidator = [param("id").isUUID()];
