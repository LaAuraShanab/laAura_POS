import { query } from "express-validator";

export const dashboardQueryValidators = [
  query("range").isIn(["today", "week", "month"]).withMessage("range must be today, week, or month"),
  query("offset").optional().isInt({ min: 0, max: 120 }).withMessage("offset must be a non-negative integer").toInt(),
];
