/*
  Warnings:

  - A unique constraint covering the columns `[coupangSellerProductId]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN "coupangSellerProductId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Product_coupangSellerProductId_key" ON "Product"("coupangSellerProductId");
