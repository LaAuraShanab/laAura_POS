import { Response } from "express";

export function ok<T>(res: Response, data: T, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

export function fail(
  res: Response,
  message: string,
  errors: Array<{ field?: string; message: string }> = [],
  statusCode = 400
) {
  return res.status(statusCode).json({ success: false, message, errors });
}
