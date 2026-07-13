import { body, param } from "express-validator";

export const nameValidators = [
  body("name").isString().trim().notEmpty().withMessage("Name is required"),
  body("nameAr").optional({ values: "falsy" }).isString().trim(),
];

export const idParamValidator = [param("id").isUUID()];
