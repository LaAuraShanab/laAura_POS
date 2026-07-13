import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { createUserValidators, idParamValidator, updateUserValidators } from "./users.validators";
import * as usersController from "./users.controller";

export const usersRouter = Router();

usersRouter.use(requireAuth, requireRole("ADMIN"));

usersRouter.get("/", asyncHandler(usersController.list));
usersRouter.get("/:id", idParamValidator, validate, asyncHandler(usersController.getById));
usersRouter.post("/", createUserValidators, validate, asyncHandler(usersController.create));
usersRouter.put("/:id", updateUserValidators, validate, asyncHandler(usersController.update));
usersRouter.delete("/:id", idParamValidator, validate, asyncHandler(usersController.deactivate));
