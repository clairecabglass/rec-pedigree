-- Migrate priceCents (Int) to price (Text), preserving existing values as strings.
ALTER TABLE "PreferredService" ADD COLUMN IF NOT EXISTS "price" TEXT;
UPDATE "PreferredService" SET "price" = CAST("priceCents" AS TEXT) WHERE "priceCents" IS NOT NULL;
ALTER TABLE "PreferredService" DROP COLUMN IF EXISTS "priceCents";
