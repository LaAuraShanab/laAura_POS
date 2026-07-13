import fs from "node:fs";
import path from "node:path";
import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../errors/AppError";

interface ListFilters {
  search?: string;
  categoryId?: string;
  includeInactive?: boolean;
}

interface VariantInput {
  id?: string;
  name: string;
  nameAr?: string;
  price: number;
}

interface ExtraInput {
  id?: string;
  name: string;
  nameAr?: string;
  price: number;
}

const productInclude = {
  category: true,
  variants: { orderBy: { sortOrder: "asc" as const } },
  extras: { orderBy: { sortOrder: "asc" as const } },
};

export function listProducts(filters: ListFilters) {
  return prisma.product.findMany({
    where: {
      isActive: filters.includeInactive ? undefined : true,
      categoryId: filters.categoryId,
      OR: filters.search
        ? [
            { name: { contains: filters.search, mode: "insensitive" } },
            { sku: { contains: filters.search, mode: "insensitive" } },
            { barcode: { contains: filters.search, mode: "insensitive" } },
          ]
        : undefined,
    },
    include: productInclude,
    orderBy: { name: "asc" },
  });
}

export async function getProduct(id: string) {
  const product = await prisma.product.findUnique({ where: { id }, include: productInclude });
  if (!product) throw new NotFoundError("Product not found");
  return product;
}

export function createProduct(input: {
  sku: string;
  barcode?: string;
  name: string;
  nameAr?: string;
  price: number;
  categoryId?: string;
  stock: number;
  image?: string;
  variants?: VariantInput[];
  extras?: ExtraInput[];
}) {
  return prisma.product.create({
    data: {
      sku: input.sku,
      barcode: input.barcode || null,
      name: input.name,
      nameAr: input.nameAr || null,
      price: input.price,
      categoryId: input.categoryId || null,
      stock: input.stock,
      image: input.image || null,
      variants: input.variants?.length
        ? {
            create: input.variants.map((variant, index) => ({
              name: variant.name,
              nameAr: variant.nameAr || null,
              price: variant.price,
              sortOrder: index,
            })),
          }
        : undefined,
      extras: input.extras?.length
        ? {
            create: input.extras.map((extra, index) => ({
              name: extra.name,
              nameAr: extra.nameAr || null,
              price: extra.price,
              sortOrder: index,
            })),
          }
        : undefined,
    },
    include: productInclude,
  });
}

export async function updateProduct(
  id: string,
  input: {
    sku?: string;
    barcode?: string;
    name?: string;
    nameAr?: string;
    price?: number;
    categoryId?: string;
    stock?: number;
    image?: string;
    variants?: VariantInput[];
    extras?: ExtraInput[];
  },
  updatedById: string
) {
  const existing = await getProduct(id);

  return prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: {
        sku: input.sku,
        barcode: input.barcode,
        name: input.name,
        nameAr: input.nameAr !== undefined ? input.nameAr || null : undefined,
        price: input.price,
        categoryId: input.categoryId,
        stock: input.stock,
        image: input.image,
      },
    });

    if (input.stock !== undefined && input.stock !== existing.stock) {
      await tx.inventoryHistory.create({
        data: {
          productId: id,
          oldStock: existing.stock,
          newStock: input.stock,
          reason: "ADJUSTMENT",
          updatedById,
        },
      });
    }

    let variantChanges: { added: string[]; removed: string[] } | undefined;
    if (input.variants !== undefined) {
      const existingIds = new Set(existing.variants.map((v) => v.id));
      const incomingIds = new Set(input.variants.filter((v) => v.id).map((v) => v.id));

      const toDelete = existing.variants.filter((v) => !incomingIds.has(v.id));
      if (toDelete.length > 0) {
        await tx.productVariant.deleteMany({ where: { id: { in: toDelete.map((v) => v.id) } } });
      }

      for (let index = 0; index < input.variants.length; index += 1) {
        const variant = input.variants[index]!;
        if (variant.id && existingIds.has(variant.id)) {
          await tx.productVariant.update({
            where: { id: variant.id },
            data: { name: variant.name, nameAr: variant.nameAr || null, price: variant.price, sortOrder: index },
          });
        } else {
          await tx.productVariant.create({
            data: {
              productId: id,
              name: variant.name,
              nameAr: variant.nameAr || null,
              price: variant.price,
              sortOrder: index,
            },
          });
        }
      }

      variantChanges = {
        added: input.variants.filter((v) => !v.id).map((v) => v.name),
        removed: toDelete.map((v) => v.name),
      };
    }

    let extraChanges: { added: string[]; removed: string[] } | undefined;
    if (input.extras !== undefined) {
      const existingIds = new Set(existing.extras.map((e) => e.id));
      const incomingIds = new Set(input.extras.filter((e) => e.id).map((e) => e.id));

      const toDelete = existing.extras.filter((e) => !incomingIds.has(e.id));
      if (toDelete.length > 0) {
        await tx.productExtra.deleteMany({ where: { id: { in: toDelete.map((e) => e.id) } } });
      }

      for (let index = 0; index < input.extras.length; index += 1) {
        const extra = input.extras[index]!;
        if (extra.id && existingIds.has(extra.id)) {
          await tx.productExtra.update({
            where: { id: extra.id },
            data: { name: extra.name, nameAr: extra.nameAr || null, price: extra.price, sortOrder: index },
          });
        } else {
          await tx.productExtra.create({
            data: {
              productId: id,
              name: extra.name,
              nameAr: extra.nameAr || null,
              price: extra.price,
              sortOrder: index,
            },
          });
        }
      }

      extraChanges = {
        added: input.extras.filter((e) => !e.id).map((e) => e.name),
        removed: toDelete.map((e) => e.name),
      };
    }

    const product = await tx.product.findUniqueOrThrow({ where: { id }, include: productInclude });
    return { product, variantChanges, extraChanges };
  });
}

export async function deactivateProduct(id: string) {
  await getProduct(id);
  return prisma.product.update({ where: { id }, data: { isActive: false } });
}

export async function setProductImage(id: string, imagePath: string) {
  const existing = await getProduct(id);
  const product = await prisma.product.update({
    where: { id },
    data: { image: imagePath },
    include: productInclude,
  });

  if (existing.image && existing.image !== imagePath) {
    const oldFilePath = path.join(process.cwd(), existing.image.replace(/^\//, ""));
    fs.unlink(oldFilePath, (err) => {
      if (err) console.error(`Failed to delete old product image: ${oldFilePath}`, err);
    });
  }

  return product;
}
