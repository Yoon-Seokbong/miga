/*
  Warnings:

  - You are about to alter the column `description` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Category" ("id", "name") SELECT "id", "name" FROM "Category";
DROP TABLE "Category";
ALTER TABLE "new_Category" RENAME TO "Category";
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" JSONB,
    "price" REAL NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "brand" TEXT,
    "tags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "categoryId" TEXT,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("categoryId", "createdAt", "description", "id", "name", "price", "stock", "updatedAt") SELECT "categoryId", "createdAt", "description", "id", "name", "price", "stock", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX "Product_createdAt_idx" ON "Product"("createdAt");
CREATE INDEX "Product_updatedAt_idx" ON "Product"("updatedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
