import { Request, Response } from "express";
import { ok } from "../../utils/response";
import { recordAudit } from "../../middleware/auditLog";
import * as customersService from "./customers.service";

export async function list(req: Request, res: Response) {
  const { search } = req.query as { search?: string };
  ok(res, await customersService.listCustomers({ search }));
}

export async function getById(req: Request, res: Response) {
  ok(res, await customersService.getCustomer(req.params.id as string));
}

export async function create(req: Request, res: Response) {
  const customer = await customersService.createCustomer(req.body);
  await recordAudit({
    userId: req.user!.id,
    action: "CUSTOMER_CREATED",
    req,
    metadata: { customerId: customer.id, customerName: customer.name },
  });
  ok(res, customer, 201);
}

export async function update(req: Request, res: Response) {
  const customer = await customersService.updateCustomer(req.params.id as string, req.body);
  await recordAudit({
    userId: req.user!.id,
    action: "CUSTOMER_UPDATED",
    req,
    metadata: { customerId: customer.id, customerName: customer.name },
  });
  ok(res, customer);
}

export async function deactivate(req: Request, res: Response) {
  const customer = await customersService.deactivateCustomer(req.params.id as string);
  await recordAudit({
    userId: req.user!.id,
    action: "CUSTOMER_DEACTIVATED",
    req,
    metadata: { customerId: customer.id, customerName: customer.name },
  });
  ok(res, customer);
}
