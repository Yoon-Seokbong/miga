/*
  Warnings:

  - You are about to alter the column `localPrice` on the `SourcedProduct` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SourcedProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceUrl" TEXT NOT NULL,
    "sourceProductId" TEXT,
    "sourcePlatform" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "translatedName" TEXT,
    "originalDescription" TEXT,
    "originalProductDataJson" JSONB,
    "translatedDescription" TEXT,
    "originalPrice" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "localPrice" INTEGER,
    "images" JSONB,
    "videos" JSONB,
    "attributes" JSONB,
    "detailContent" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SourcedProduct" ("attributes", "createdAt", "currency", "detailContent", "id", "images", "localPrice", "originalDescription", "originalName", "originalPrice", "originalProductDataJson", "sourcePlatform", "sourceProductId", "sourceUrl", "status", "translatedDescription", "translatedName", "updatedAt", "videos") SELECT "attributes", "createdAt", "currency", "detailContent", "id", "images", "localPrice", "originalDescription", "originalName", "originalPrice", "originalProductDataJson", "sourcePlatform", "sourceProductId", "sourceUrl", "status", "translatedDescription", "translatedName", "updatedAt", "videos" FROM "SourcedProduct";
DROP TABLE "SourcedProduct";
ALTER TABLE "new_SourcedProduct" RENAME TO "SourcedProduct";
CREATE UNIQUE INDEX "SourcedProduct_sourceUrl_key" ON "SourcedProduct"("sourceUrl");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
