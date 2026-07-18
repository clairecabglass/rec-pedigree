-- CreateTable
CREATE TABLE "Result" (
    "id" TEXT NOT NULL,
    "horseId" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "event" TEXT NOT NULL,
    "placement" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BreedingPlan" (
    "id" TEXT NOT NULL,
    "damId" TEXT NOT NULL,
    "damName" TEXT NOT NULL,
    "sireId" TEXT,
    "sireName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BreedingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Result_horseId_idx" ON "Result"("horseId");

