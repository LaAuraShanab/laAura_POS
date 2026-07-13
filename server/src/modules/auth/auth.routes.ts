import { Router } from "express";
import { authLimiter, refreshLimiter } from "../../middleware/rateLimiter";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { loginValidators } from "./auth.validators";
import * as authController from "./auth.controller";

export const authRouter = Router();

authRouter.post("/login", authLimiter, loginValidators, validate, asyncHandler(authController.login));
authRouter.post("/refresh-token", refreshLimiter, asyncHandler(authController.refreshToken));
authRouter.post("/logout", asyncHandler(authController.logout));
