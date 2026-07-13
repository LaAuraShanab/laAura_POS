import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../errors/AppError";

interface ListFilters {
  search?: string;
}

export function listCustomers(filters: ListFilters) {
  return prisma.customer.findMany({
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
