-- AlterTable
ALTER TABLE "sales" ADD COLUMN "reference" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "sales_reference_key" ON "sales"("reference");
