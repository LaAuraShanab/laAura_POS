import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { Prisma } from "../generated/prisma/client";
import { AppError } from "../errors/AppError";
import { fail } from "../utils/response";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AppError) {
    return fail(res, err.message, err.errors, err.statusCode);
  }

  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE" ? "Image must be 5MB or smaller" : `Upload error: ${err.message}`;
    return fail(res, message, [], 400);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[] | undefined)?.join(", ") ?? "field";
      return fail(res, `A record with this ${target} already exists`, [], 409);
    }
    if (err.code === "P2025") {
      return fail(res, "Resource not found", [], 404);
    }
  }

  console.error(err);
  return fail(res, "Internal server error", [], 500);
}
