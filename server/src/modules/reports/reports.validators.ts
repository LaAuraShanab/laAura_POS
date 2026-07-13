import { query } from "express-validator";

export const dashboardQueryValidators = [
  query("range").isIn(["today", "week", "month"]).withMessage("range must be today, week, or month"),
];
