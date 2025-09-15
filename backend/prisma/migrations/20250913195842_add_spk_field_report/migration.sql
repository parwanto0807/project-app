/*
  Warnings:

  - The values [BEFORE_START,PROGRESS] on the enum `ReportType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ReportType_new" AS ENUM ('PRE_WORK', 'FINAL');
ALTER TABLE "SPKFieldReport" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "SPKFieldReport" ALTER COLUMN "type" TYPE "ReportType_new" USING ("type"::text::"ReportType_new");
ALTER TYPE "ReportType" RENAME TO "ReportType_old";
ALTER TYPE "ReportType_new" RENAME TO "ReportType";
DROP TYPE "ReportType_old";
ALTER TABLE "SPKFieldReport" ALTER COLUMN "type" SET DEFAULT 'PRE_WORK';
COMMIT;

-- AlterTable
ALTER TABLE "SPKFieldReport" ALTER COLUMN "type" SET DEFAULT 'PRE_WORK';
