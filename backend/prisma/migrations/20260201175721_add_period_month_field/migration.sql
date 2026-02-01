-- AlterTable
ALTER TABLE "AccountingPeriod" ADD COLUMN "periodMonth" INTEGER;

-- Update existing records to populate periodMonth from startDate
UPDATE "AccountingPeriod" 
SET "periodMonth" = EXTRACT(MONTH FROM "startDate")
WHERE "periodMonth" IS NULL;

-- Make the column NOT NULL after populating data
ALTER TABLE "AccountingPeriod" ALTER COLUMN "periodMonth" SET NOT NULL;
