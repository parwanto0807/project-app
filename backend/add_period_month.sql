-- Add periodMonth column to AccountingPeriod
ALTER TABLE "AccountingPeriod" ADD COLUMN IF NOT EXISTS "periodMonth" INTEGER;

-- Populate periodMonth from existing startDate
UPDATE "AccountingPeriod" 
SET "periodMonth" = EXTRACT(MONTH FROM "startDate")
WHERE "periodMonth" IS NULL;

-- Make periodMonth NOT NULL
ALTER TABLE "AccountingPeriod" ALTER COLUMN "periodMonth" SET NOT NULL;
