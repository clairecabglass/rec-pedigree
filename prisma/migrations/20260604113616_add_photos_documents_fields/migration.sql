-- AlterTable
ALTER TABLE "Horse" ADD COLUMN "achievements" TEXT;
ALTER TABLE "Horse" ADD COLUMN "discipline" TEXT;
ALTER TABLE "Horse" ADD COLUMN "height" TEXT;
ALTER TABLE "Horse" ADD COLUMN "price" TEXT;
ALTER TABLE "Horse" ADD COLUMN "regNumber" TEXT;
ALTER TABLE "Horse" ADD COLUMN "saleContact" TEXT;
ALTER TABLE "Horse" ADD COLUMN "saleDescription" TEXT;
ALTER TABLE "Horse" ADD COLUMN "videoUrl" TEXT;

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "horseId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "caption" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Photo_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "Horse" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "horseId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Document_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "Horse" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SiteContent" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Photo_horseId_idx" ON "Photo"("horseId");

-- CreateIndex
CREATE INDEX "Document_horseId_idx" ON "Document"("horseId");
