-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ReviewVideo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewId" TEXT NOT NULL,
    CONSTRAINT "ReviewVideo_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ReviewVideo" ("createdAt", "id", "reviewId", "url") SELECT "createdAt", "id", "reviewId", "url" FROM "ReviewVideo";
DROP TABLE "ReviewVideo";
ALTER TABLE "new_ReviewVideo" RENAME TO "ReviewVideo";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
