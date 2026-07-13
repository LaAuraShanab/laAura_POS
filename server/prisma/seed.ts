import bcrypt from "bcrypt";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SALT_ROUNDS = 12;

async function main() {
  const adminPassword = "Admin@12345";
  const cashierPassword = "Cashier@12345";
  const reporterPassword = "Reporter@12345";

  const admin = await prisma.user.upsert({
    where: { email: "admin@laaura.pos" },
    update: {},
    create: {
      name: "Ada Admin",
      email: "admin@laaura.pos",
      passwordHash: await bcrypt.hash(adminPassword, SALT_ROUNDS),
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "cashier@laaura.pos" },
    update: {},
    create: {
      name: "Casey Cashier",
      email: "cashier@laaura.pos",
      passwordHash: await bcrypt.hash(cashierPassword, SALT_ROUNDS),
      role: "CASHIER",
    },
  });

  await prisma.user.upsert({
    where: { email: "reporter@laaura.pos" },
    update: {},
    create: {
      name: "Riley Reporter",
      email: "reporter@laaura.pos",
      passwordHash: await bcrypt.hash(reporterPassword, SALT_ROUNDS),
      role: "REPORTER",
    },
  });

  const categoryNames = ["Beverages", "Snacks", "Household"];
  const categories: Record<string, string> = {};
  for (const name of categoryNames) {
    const category = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categories[name] = category.id;
  }

  const products = [
    { sku: "BEV-001", barcode: "8901000000011", name: "Cola 500ml", price: 1.5, category: "Beverages", stock: 120 },
    { sku: "BEV-002", barcode: "8901000000028", name: "Orange Juice 1L", price: 2.75, category: "Beverages", stock: 60 },
    { sku: "BEV-003", barcode: "8901000000035", name: "Bottled Water 500ml", price: 0.9, category: "Beverages", stock: 200 },
    { sku: "SNK-001", barcode: "8901000000042", name: "Potato Chips 150g", price: 2.2, category: "Snacks", stock: 80 },
    { sku: "SNK-002", barcode: "8901000000059", name: "Chocolate Bar", price: 1.3, category: "Snacks", stock: 150 },
    { sku: "SNK-003", barcode: "8901000000066", name: "Mixed Nuts 200g", price: 3.5, category: "Snacks", stock: 45 },
    { sku: "HH-001", barcode: "8901000000073", name: "Dish Soap 500ml", price: 2.9, category: "Household", stock: 40 },
    { sku: "HH-002", barcode: "8901000000080", name: "Paper Towels (2pk)", price: 3.2, category: "Household", stock: 55 },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: {
        sku: product.sku,
        barcode: product.barcode,
        name: product.name,
        price: product.price,
        stock: product.stock,
        categoryId: categories[product.category],
      },
    });
  }

  console.log("\nSeed complete. Login with:");
  console.log(`  Admin:    admin@laaura.pos / ${adminPassword}`);
  console.log(`  Cashier:  cashier@laaura.pos / ${cashierPassword}`);
  console.log(`  Reporter: reporter@laaura.pos / ${reporterPassword}`);
  console.log(`  (admin user id: ${admin.id})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
