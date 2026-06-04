-- CreateTable
CREATE TABLE "Horse" (
    "id" TEXT NOT NULL,
    "microchip" TEXT,
    "name" TEXT NOT NULL,
    "breed" TEXT,
    "gender" TEXT,
    "sireName" TEXT,
    "damName" TEXT,
    "coat" TEXT,
    "withFoal" BOOLEAN NOT NULL DEFAULT false,
    "ownership" TEXT,
    "notes" TEXT,
    "dob" TIMESTAMP(3),
    "height" TEXT,
    "discipline" TEXT,
    "regNumber" TEXT,
    "achievements" TEXT,
    "videoUrl" TEXT,
    "personality" TEXT,
    "genotype" TEXT,
    "eyeColor" TEXT,
    "baseStats" TEXT,
    "description" TEXT,
    "ownerName" TEXT,
    "ownerCharacter" TEXT,
    "stablePrefix" TEXT,
    "breedingFee" TEXT,
    "breedingPolicies" TEXT,
    "price" TEXT,
    "saleDescription" TEXT,
    "saleContact" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Horse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "horseId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "caption" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "horseId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteContent" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteContent_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "Horse_name_key" ON "Horse"("name");

-- CreateIndex
CREATE INDEX "Photo_horseId_idx" ON "Photo"("horseId");

-- CreateIndex
CREATE INDEX "Document_horseId_idx" ON "Document"("horseId");

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "Horse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "Horse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

