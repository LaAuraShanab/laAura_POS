-- CreateTable
CREATE TABLE "product_extras" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_extras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_item_extras" (
    "id" TEXT NOT NULL,
    "saleItemId" TEXT NOT NULL,
    "extraId" TEXT,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "sale_item_extras_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_extras_productId_name_key" ON "product_extras"("productId", "name");

-- CreateIndex
CREATE INDEX "sale_item_extras_saleItemId_idx" ON "sale_item_extras"("saleItemId");

-- AddForeignKey
ALTER TABLE "product_extras" ADD CONSTRAINT "product_extras_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_item_extras" ADD CONSTRAINT "sale_item_extras_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "sale_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_item_extras" ADD CONSTRAINT "sale_item_extras_extraId_fkey" FOREIGN KEY ("extraId") REFERENCES "product_extras"("id") ON DELETE SET NULL ON UPDATE CASCADE;
