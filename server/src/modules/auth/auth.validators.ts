import { body } from "express-validator";

export const loginValidators = [
  body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password").isString().notEmpty().withMessage("Password is required"),
];
