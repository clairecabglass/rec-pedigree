-- CreateTable
CREATE TABLE "Horse" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "dob" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Horse_name_key" ON "Horse"("name");
