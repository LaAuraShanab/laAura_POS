import { Request, Response } from "express";
import { ok } from "../../utils/response";
import { PaymentMethod, SaleStatus } from "../../generated/prisma/client";
import * as salesService from "./sales.service";

export async function create(req: Request, res: Response) {
  const { customerId, items, discount, tax, note, paymentMethod } = req.body;
  const sale = await salesService.createSale(
    { customerId, items, discount: discount ?? 0, tax: tax ?? 0, note, paymentMethod },
    req.user!.id,
    req
  );
  ok(res, sale, 201);
}

export async function list(req: Request, res: Response) {
  const { search, paymentMethod, status, from, to, page, pageSize } = req.query as {
    search?: string;
    paymentMethod?: PaymentMethod;
    status?: SaleStatus;
    from?: string;
    to?: string;
    page?: string;
    pageSize?: string;
  };
  ok(
    res,
    await salesService.listSales({
      search,
      paymentMethod,
      status,
      from,
      to,
      page: page !== undefined ? Number(page) : undefined,
      pageSize: pageSize !== undefined ? Number(pageSize) : undefined,
    })
  );
}

export async function getById(req: Request, res: Response) {
  ok(res, await salesService.getSale(req.params.id as string));
}

export async function voidSale(req: Request, res: Response) {
  const { status, reason } = req.body as { status: "VOIDED" | "REFUNDED"; reason?: string };
  const sale = await salesService.voidSale(req.params.id as string, status, reason, req.user!.id, req);
  ok(res, sale);
}
