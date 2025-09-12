-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "address1" TEXT NOT NULL,
    "address2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "zipCode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT '대한민국',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
