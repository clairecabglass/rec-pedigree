-- CreateTable
CREATE TABLE "Pregnancy" (
    "id" TEXT NOT NULL,
    "damId" TEXT NOT NULL,
    "sireName" TEXT,
    "coverDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'expecting',
    "foalId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pregnancy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Pregnancy_damId_idx" ON "Pregnancy"("damId");

