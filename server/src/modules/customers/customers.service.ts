import { Request } from "express";
import { prisma } from "../../lib/prisma";
import { NotFoundError, ValidationError } from "../../errors/AppError";
import { recordAudit } from "../../middleware/auditLog";
import { PaymentMethod } from "../../generated/prisma/client";

interface ListFilters {
  search?: string;
}

// Round to 2 decimals to keep money math free of float drift before it hits Decimal columns.
const money = (n: number) => Math.round(n * 100) / 100;

export async function listCustomers(filters: ListFilters) {
  const customers = await prisma.customer.findMany({
    where: {
      isActive: true,
      OR: filters.search
        ? [
            { name: { contains: filters.search, mode: "insensitive" } },
            { phone: { contains: filters.search, mode: "insensitive" } },
          ]
        : undefined,
    },
    orderBy: { name: "asc" },
  });

  if (customers.length === 0) return customers;

  // Outstanding balance per customer = sum(grandTotal - amountPaid) over their
  // completed, not-fully-paid sales. Voided/refunded sales are excluded.
  const owing = await prisma.sale.groupBy({
    by: ["customerId"],
    where: {
      customerId: { in: customers.map((c) => c.id) },
      status: "COMPLETED",
      paymentStatus: { in: ["UNPAID", "PARTIALLY_PAID"] },
    },
    _sum: { grandTotal: true, amountPaid: true },
  });
  const balanceMap = new Map(
    owing.map((o) => [o.customerId, money(Number(o._sum.grandTotal ?? 0) - Number(o._sum.amountPaid ?? 0))])
  );

  return customers.map((c) => ({ ...c, balance: balanceMap.get(c.id) ?? 0 }));
}

export async function getCustomer(id: string) {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) throw new NotFoundError("Customer not found");
  return customer;
}

export function createCustomer(input: { name: string; phone: string }) {
  return prisma.customer.create({
    data: { name: input.name, phone: input.phone },
  });
}

export async function updateCustomer(id: string, input: { name?: string; phone?: string }) {
  await getCustomer(id);
  return prisma.customer.update({
    where: { id },
    data: { name: input.name, phone: input.phone },
  });
}

export async function deactivateCustomer(id: string) {
  await getCustomer(id);
  return prisma.customer.update({ where: { id }, data: { isActive: false } });
}

const accountSaleSelect = {
  id: true,
  reference: true,
  date: true,
  grandTotal: true,
  amountPaid: true,
  paymentStatus: true,
} as const;

// Full credit picture for one customer: outstanding balance, the unpaid/partially-paid
// invoices making it up, lifetime total spent, and the payment history.
export async function getCustomerAccount(id: string) {
  const customer = await getCustomer(id);

  const unpaidSales = await prisma.sale.findMany({
    where: { customerId: id, status: "COMPLETED", paymentStatus: { in: ["UNPAID", "PARTIALLY_PAID"] } },
    orderBy: { date: "asc" },
    select: accountSaleSelect,
  });

  const payments = await prisma.customerPayment.findMany({
    where: { customerId: id },
    orderBy: { receivedAt: "desc" },
    include: {
      recordedBy: { select: { id: true, name: true } },
      allocations: { select: { id: true, saleId: true, amount: true } },
    },
  });

  const spentAgg = await prisma.sale.aggregate({
    where: { customerId: id, status: "COMPLETED" },
    _sum: { grandTotal: true },
  });

  const balance = money(
    unpaidSales.reduce((sum, s) => sum + (Number(s.grandTotal) - Number(s.amountPaid)), 0)
  );

  return {
    customer,
    balance,
    totalSpent: money(Number(spentAgg._sum.grandTotal ?? 0)),
    unpaidSales: unpaidSales.map((s) => ({
      ...s,
      remaining: money(Number(s.grandTotal) - Number(s.amountPaid)),
    })),
    payments,
  };
}

interface PaymentInput {
  amount: number;
  method?: PaymentMethod;
  note?: string;
  allocations?: { saleId: string; amount: number }[];
}

// Record a payment against a customer's account. Payments apply to specific unpaid
// invoices: either the caller supplies explicit allocations, or we auto-allocate the
// amount oldest-invoice-first (FIFO). Each affected sale's amountPaid/paymentStatus
// is updated in the same transaction so balances never drift.
export async function recordPayment(customerId: string, input: PaymentInput, userId: string, req: Request) {
  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new NotFoundError("Customer not found");

    const amount = money(input.amount);
    if (amount <= 0) {
      throw new ValidationError([{ field: "amount", message: "Payment amount must be greater than 0" }]);
    }

    const outstanding = await tx.sale.findMany({
      where: { customerId, status: "COMPLETED", paymentStatus: { in: ["UNPAID", "PARTIALLY_PAID"] } },
      orderBy: { date: "asc" },
    });
    const remainingBySale = new Map(
      outstanding.map((s) => [s.id, money(Number(s.grandTotal) - Number(s.amountPaid))])
    );
    const totalOutstanding = money([...remainingBySale.values()].reduce((a, b) => a + b, 0));

    if (amount > totalOutstanding) {
      throw new ValidationError([
        { field: "amount", message: "Payment exceeds the customer's outstanding balance" },
      ]);
    }

    let allocations: { saleId: string; amount: number }[];
    if (input.allocations && input.allocations.length > 0) {
      allocations = input.allocations.map((a) => ({ saleId: a.saleId, amount: money(a.amount) }));
      for (const a of allocations) {
        const rem = remainingBySale.get(a.saleId);
        if (rem === undefined) {
          throw new ValidationError([
            { field: "allocations", message: "An allocation targets a sale that is not outstanding for this customer" },
          ]);
        }
        if (a.amount > rem) {
          throw new ValidationError([
            { field: "allocations", message: "An allocation exceeds the remaining balance on its invoice" },
          ]);
        }
      }
      const allocTotal = money(allocations.reduce((s, a) => s + a.amount, 0));
      if (allocTotal !== amount) {
        throw new ValidationError([
          { field: "allocations", message: "Allocations must add up to the payment amount" },
        ]);
      }
    } else {
      // Auto FIFO: apply to oldest invoices first.
      allocations = [];
      let left = amount;
      for (const s of outstanding) {
        if (left <= 0) break;
        const rem = remainingBySale.get(s.id)!;
        const applied = money(Math.min(rem, left));
        if (applied > 0) {
          allocations.push({ saleId: s.id, amount: applied });
          left = money(left - applied);
        }
      }
    }

    const payment = await tx.customerPayment.create({
      data: {
        customerId,
        amount,
        method: input.method ?? "CASH",
        recordedById: userId,
        note: input.note?.trim() || null,
        allocations: { create: allocations.map((a) => ({ saleId: a.saleId, amount: a.amount })) },
      },
      include: {
        recordedBy: { select: { id: true, name: true } },
        allocations: { select: { id: true, saleId: true, amount: true } },
      },
    });

    for (const a of allocations) {
      const sale = outstanding.find((s) => s.id === a.saleId)!;
      const newPaid = money(Number(sale.amountPaid) + a.amount);
      const fullyPaid = newPaid >= money(Number(sale.grandTotal));
      await tx.sale.update({
        where: { id: a.saleId },
        data: { amountPaid: newPaid, paymentStatus: fullyPaid ? "PAID" : "PARTIALLY_PAID" },
      });
    }

    await recordAudit({
      userId,
      action: "CUSTOMER_PAYMENT_RECORDED",
      req,
      metadata: {
        customerId,
        customerName: customer.name,
        paymentId: payment.id,
        amount,
        invoicesSettled: allocations.length,
      },
      client: tx,
    });

    return payment;
  });
}
