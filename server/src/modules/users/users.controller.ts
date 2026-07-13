import { Request, Response } from "express";
import { ok } from "../../utils/response";
import { recordAudit } from "../../middleware/auditLog";
import * as usersService from "./users.service";

export async function list(req: Request, res: Response) {
  ok(res, await usersService.listUsers());
}

export async function getById(req: Request, res: Response) {
  ok(res, await usersService.getUser(req.params.id as string));
}

export async function create(req: Request, res: Response) {
  const user = await usersService.createUser(req.body);
  await recordAudit({
    userId: req.user!.id,
    action: "USER_CREATED",
    req,
    metadata: { createdUserId: user.id },
  });
  ok(res, user, 201);
}

export async function update(req: Request, res: Response) {
  const user = await usersService.updateUser(req.params.id as string, req.body);
  await recordAudit({
    userId: req.user!.id,
    action: "USER_UPDATED",
    req,
    metadata: { updatedUserId: user.id },
  });
  ok(res, user);
}

export async function deactivate(req: Request, res: Response) {
  const user = await usersService.deactivateUser(req.params.id as string);
  await recordAudit({
    userId: req.user!.id,
    action: "USER_DEACTIVATED",
    req,
    metadata: { deactivatedUserId: user.id },
  });
  ok(res, user);
}
