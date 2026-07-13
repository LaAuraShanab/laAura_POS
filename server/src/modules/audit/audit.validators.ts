import { query } from "express-validator";

export const listAuditLogsValidators = [
  query("search").optional().isString().trim(),
  query("action").optional().isString().trim(),
  query("userId").optional().isUUID(),
  query("from").optional().isISO8601(),
  query("to").optional().isISO8601(),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("pageSize").optional().isInt({ min: 1, max: 100 }).toInt(),
];
