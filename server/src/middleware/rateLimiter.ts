import rateLimit from "express-rate-limit";
import { fail } from "../utils/response";

const rateLimitedResponse = (req: import("express").Request, res: import("express").Response) => {
  fail(res, "Too many attempts. Please try again later.", [], 429);
};

// Strict: guards against brute-force password guessing.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitedResponse,
});

// Lenient: silent refresh fires on every page load/tab (including React StrictMode's
// double-invoked mount effect), so it shares no budget with the login brute-force guard.
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitedResponse,
});
