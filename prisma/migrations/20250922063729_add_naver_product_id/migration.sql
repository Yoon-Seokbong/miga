/*
  Warnings:

  - A unique constraint covering the columns `[naverOriginProductNo]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN "naverOriginProductNo" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Product_naverOriginProductNo_key" ON "Product"("naverOriginProductNo");
