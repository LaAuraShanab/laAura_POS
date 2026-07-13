import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { ValidationError } from "../errors/AppError";

export function validate(req: Request, res: Response, next: NextFunction) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const errors = result.array().map((e) => ({
      field: "path" in e ? (e as { path: string }).path : undefined,
      message: e.msg,
    }));
    return next(new ValidationError(errors));
  }
  next();
}
