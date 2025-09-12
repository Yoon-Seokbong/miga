-- DropIndex
DROP INDEX "ProductImage_url_key";

-- AlterTable
ALTER TABLE "SourcedProduct" ADD COLUMN "detailContent" JSONB;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "brand" TEXT,
    "tags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "categoryId" TEXT,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("brand", "categoryId", "createdAt", "description", "id", "name", "price", "stock", "tags", "updatedAt") SELECT "brand", "categoryId", "createdAt", "description", "id", "name", "price", "stock", "tags", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_name_key" ON "Product"("name");
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX "Product_createdAt_idx" ON "Product"("createdAt");
CREATE INDEX "Product_updatedAt_idx" ON "Product"("updatedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
