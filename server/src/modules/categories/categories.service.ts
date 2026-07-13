import { prisma } from "../../lib/prisma";
import { NotFoundError, ConflictError } from "../../errors/AppError";

export function listCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export async function getCategory(id: string) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new NotFoundError("Category not found");
  return category;
}

export function createCategory(input: { name: string; nameAr?: string }) {
  return prisma.category.create({ data: { name: input.name, nameAr: input.nameAr || null } });
}

export async function updateCategory(id: string, input: { name: string; nameAr?: string }) {
  await getCategory(id);
  return prisma.category.update({
    where: { id },
    data: { name: input.name, nameAr: input.nameAr || null },
  });
}

export async function deleteCategory(id: string) {
  await getCategory(id);
  const inUse = await prisma.product.count({ where: { categoryId: id } });
  if (inUse > 0) {
    throw new ConflictError("Cannot delete a category that still has products assigned to it");
  }
  await prisma.category.delete({ where: { id } });
}
