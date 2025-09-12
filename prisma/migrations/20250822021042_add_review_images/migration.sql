-- CreateTable
CREATE TABLE "ReviewImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewId" TEXT NOT NULL,
    CONSTRAINT "ReviewImage_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
