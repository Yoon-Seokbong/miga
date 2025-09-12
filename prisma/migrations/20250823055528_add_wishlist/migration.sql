-- CreateTable
CREATE TABLE "SourcedProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceUrl" TEXT NOT NULL,
    "sourceProductId" TEXT,
    "sourcePlatform" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "translatedName" TEXT,
    "originalDescription" TEXT,
    "translatedDescription" TEXT,
    "originalPrice" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "localPrice" REAL,
    "images" JSONB,
    "videos" JSONB,
    "attributes" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Wishlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Wishlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Wishlist_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SourcedProduct_sourceUrl_key" ON "SourcedProduct"("sourceUrl");

-- CreateIndex
CREATE UNIQUE INDEX "Wishlist_userId_productId_key" ON "Wishlist"("userId", "productId");
