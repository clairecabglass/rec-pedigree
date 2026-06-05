-- AlterTable
ALTER TABLE "BreedingPlan" ALTER COLUMN "damId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "BreedingPlan_damId_idx" ON "BreedingPlan"("damId");

-- CreateIndex
CREATE INDEX "BreedingPlan_sireId_idx" ON "BreedingPlan"("sireId");

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "Horse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BreedingPlan" ADD CONSTRAINT "BreedingPlan_damId_fkey" FOREIGN KEY ("damId") REFERENCES "Horse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BreedingPlan" ADD CONSTRAINT "BreedingPlan_sireId_fkey" FOREIGN KEY ("sireId") REFERENCES "Horse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
