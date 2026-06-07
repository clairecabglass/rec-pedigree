-- AlterTable
ALTER TABLE "Horse" ADD COLUMN     "assignedCharacter" TEXT;

-- CreateTable
CREATE TABLE "DiaryNote" (
    "key" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiaryNote_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "PreferredService" (
    "id" TEXT NOT NULL,
    "providerName" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "priceCents" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreferredService_pkey" PRIMARY KEY ("id")
);


-- Backfill: every existing Home horse defaults to "Athena Redfield".
UPDATE "Horse" SET "assignedCharacter" = 'Athena Redfield'
 WHERE "ownership" = 'Home' AND "assignedCharacter" IS NULL;
