-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Question_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Question_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Question" ("createdAt", "id", "productId", "questionText", "updatedAt", "userId") SELECT "createdAt", "id", "productId", "questionText", "updatedAt", "userId" FROM "Question";
DROP TABLE "Question";
ALTER TABLE "new_Question" RENAME TO "Question";
CREATE TABLE "new_Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Review" ("comment", "createdAt", "id", "productId", "rating", "updatedAt", "userId") SELECT "comment", "createdAt", "id", "productId", "rating", "updatedAt", "userId" FROM "Review";
DROP TABLE "Review";
ALTER TABLE "new_Review" RENAME TO "Review";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
