/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[url]` on the table `ProductImage` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Product_name_key" ON "Product"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProductImage_url_key" ON "ProductImage"("url");
