-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "total" REAL NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "shippingAddress" TEXT,
    "paymentKey" TEXT,
    "tossOrderId" TEXT,
    "paymentMethod" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedAt" DATETIME,
    "receiptUrl" TEXT,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("createdAt", "id", "isPaid", "shippingAddress", "total", "updatedAt", "userId") SELECT "createdAt", "id", "isPaid", "shippingAddress", "total", "updatedAt", "userId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_paymentKey_key" ON "Order"("paymentKey");
CREATE UNIQUE INDEX "Order_tossOrderId_key" ON "Order"("tossOrderId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
