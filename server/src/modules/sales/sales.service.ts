import { randomUUID } from "node:crypto";
import { prisma } from "../../lib/prisma";
import { ConflictError, NotFoundError, ValidationError } from "../../errors/AppError";
import { recordAudit } from "../../middleware/auditLog";
import { PaymentMethod, Prisma, SaleStatus } from "../../generated/prisma/client";
import { Request } from "express";

function generateSaleReference(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `SALE-${datePart}-${randomPart}`;
}

interface SaleItemInput {
  productId: string;
  variantId?: string;
  extraIds?: string[];
  quantity: number;
}

interface CreateSaleInput {
  customerId?: string;
  items: SaleItemInput[];
  discount: number;
  tax: number;
  note?: string;
  paymentMethod: PaymentMethod;
}

const saleInclude = {
  items: { include: { product: true, variant: true, extras: { include: { extra: true } } } },
  cashier: { select: { id: true, name: true } },
  customer: true,
  voidedBy: { select: { id: true, name: true } },
};

export async function createSale(input: CreateSaleInput, cashierId: string, req: Request) {
  if (input.items.length === 0) {
    throw new ValidationError([{ field: "items", message: "Sale must contain at least one item" }]);
  }

  return prisma.$transaction(async (tx) => {
    const productIds = input.items.map((item) => item.productId);
    const products = await tx.product.findMany({ where: { id: { in: productIds } } });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const variantIds = input.items.map((item) => item.variantId).filter((id): id is string => !!id);
    const variants = variantIds.length
      ? await tx.productVariant.findMany({ where: { id: { in: variantIds } } })
      : [];
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    const extraIds = input.items.flatMap((item) => item.extraIds ?? []);
    const extras = extraIds.length ? await tx.productExtra.findMany({ where: { id: { in: extraIds } } }) : [];
    const extraMap = new Map(extras.map((e) => [e.id, e]));

    let subtotal = 0;
    const lineData: {
      productId: string;
      variantId: string | null;
      variantName: string | null;
      quantity: number;
      price: number;
      extras: { create: { extraId: string; name: string; price: number }[] };
    }[] = [];
    for (const item of input.items) {
      const product = productMap.get(item.productId);
      if (!product || !product.isActive) {
        throw new NotFoundError(`Product ${item.productId} not found`);
      }
      if (product.stock < item.quantity) {
        throw new ConflictError(`Insufficient stock for ${product.name}`);
      }

      let unitPrice = Number(product.price);
      let variantName: string | null = null;
      if (item.variantId) {
        const variant = variantMap.get(item.variantId);
        if (!variant || variant.productId !== item.productId) {
          throw new NotFoundError(`Variant ${item.variantId} not found for product ${product.name}`);
        }
        unitPrice = Number(variant.price);
        variantName = variant.name;
      }

      const itemExtras: { extraId: string; name: string; price: number }[] = [];
      for (const extraId of item.extraIds ?? []) {
        const extra = extraMap.get(extraId);
        if (!extra || extra.productId !== item.productId) {
          throw new NotFoundError(`Extra ${extraId} not found for product ${product.name}`);
        }
        const extraPrice = Number(extra.price);
        unitPrice += extraPrice;
        itemExtras.push({ extraId: extra.id, name: extra.name, price: extraPrice });
      }

      subtotal += unitPrice * item.quantity;
      lineData.push({
        productId: item.productId,
        variantId: item.variantId || null,
        variantName,
        quantity: item.quantity,
        price: unitPrice,
        extras: { create: itemExtras },
      });
    }

    const discount = Math.max(0, input.discount);
    const tax = Math.max(0, input.tax);
    if (discount > subtotal) {
      throw new ValidationError([{ field: "discount", message: "Discount cannot exceed subtotal" }]);
    }
    const grandTotal = subtotal - discount + tax;

    const sale = await tx.sale.create({
      data: {
        reference: generateSaleReference(),
        customerId: input.customerId || null,
        cashierId,
        subtotal,
        discount,
        tax,
        grandTotal,
        paymentMethod: input.paymentMethod,
        note: input.note?.trim() || null,
        items: { create: lineData },
      },
      include: saleInclude,
    });

    for (const item of input.items) {
      const product = productMap.get(item.productId)!;
      const newStock = product.stock - item.quantity;
      await tx.product.update({ where: { id: item.productId }, data: { stock: newStock } });
      await tx.inventoryHistory.create({
        data: {
          productId: item.productId,
          oldStock: product.stock,
          newStock,
          reason: "SALE",
          updatedById: cashierId,
        },
      });
    }

    await recordAudit({
      userId: cashierId,
      action: "SALE_CREATED",
      req,
      metadata: {
        saleId: sale.id,
        reference: sale.reference,
        grandTotal,
        ...(sale.customer && { customerId: sale.customer.id, customerName: sale.customer.name }),
      },
      client: tx,
    });

    return sale;
  });
}

interface ListSalesFilters {
  search?: string;
  paymentMethod?: PaymentMethod;
  status?: SaleStatus;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export async function listSales(filters: ListSalesFilters) {
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const pageSize = filters.pageSize && filters.pageSize > 0 ? Math.min(filters.pageSize, 100) : 20;

  const where: Prisma.SaleWhereInput = {
    paymentMethod: filters.paymentMethod,
    status: filters.status,
    date: {
      gte: filters.from ? new Date(filters.from) : undefined,
      lte: filters.to ? new Date(filters.to) : undefined,
    },
    OR: filters.search
      ? [
          { reference: { contains: filters.search, mode: "insensitive" } },
          { cashier: { name: { contains: filters.search, mode: "insensitive" } } },
          { customer: { name: { contains: filters.search, mode: "insensitive" } } },
          { items: { some: { product: { name: { contains: filters.search, mode: "insensitive" } } } } },
        ]
      : undefined,
  };

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: saleInclude,
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.sale.count({ where }),
  ]);

  return { sales, total, page, pageSize };
}

export async function getSale(id: string) {
  const sale = await prisma.sale.findUnique({ where: { id }, include: saleInclude });
  if (!sale) throw new NotFoundError("Sale not found");
  return sale;
}

export async function voidSale(
  id: string,
  status: "VOIDED" | "REFUNDED",
  reason: string | undefined,
  userId: string,
  req: Request
) {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUnique({ where: { id }, include: { items: true } });
    if (!sale) throw new NotFoundError("Sale not found");
    if (sale.status !== "COMPLETED") {
      throw new ConflictError(`Sale is already ${sale.status.toLowerCase()}`);
    }

    for (const item of sale.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product) continue;
      const newStock = product.stock + item.quantity;
      await tx.product.update({ where: { id: item.productId }, data: { stock: newStock } });
      await tx.inventoryHistory.create({
        data: {
          productId: item.productId,
          oldStock: product.stock,
          newStock,
          reason: "RETURN",
          updatedById: userId,
        },
      });
    }

    const updated = await tx.sale.update({
      where: { id },
      data: {
        status,
        voidedAt: new Date(),
        voidedById: userId,
        voidReason: reason || null,
      },
      include: saleInclude,
    });

    await recordAudit({
      userId,
      action: status === "VOIDED" ? "SALE_VOIDED" : "SALE_REFUNDED",
      req,
      metadata: { saleId: sale.id, reference: sale.reference, grandTotal: Number(sale.grandTotal), reason },
      client: tx,
    });

    return updated;
  });
}
