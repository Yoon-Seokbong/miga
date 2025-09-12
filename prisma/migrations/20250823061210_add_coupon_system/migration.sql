-- AlterTable
ALTER TABLE "Order" ADD COLUMN "appliedCouponCode" TEXT;
ALTER TABLE "Order" ADD COLUMN "discountAmount" REAL DEFAULT 0;

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "discountType" TEXT NOT NULL,
    "discountValue" REAL NOT NULL,
    "expiresAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageLimit" INTEGER,
    "timesUsed" INTEGER NOT NULL DEFAULT 0,
    "minPurchaseAmount" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");
