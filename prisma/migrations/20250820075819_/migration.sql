-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OrderLineItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quantity" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    CONSTRAINT "OrderLineItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OrderLineItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_OrderLineItem" ("id", "orderId", "price", "productId", "quantity") SELECT "id", "orderId", "price", "productId", "quantity" FROM "OrderLineItem";
DROP TABLE "OrderLineItem";
ALTER TABLE "new_OrderLineItem" RENAME TO "OrderLineItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
