-- CreateTable
CREATE TABLE "ProductRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productName" TEXT NOT NULL,
    "productUrl" TEXT,
    "description" TEXT,
    "requesterEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
