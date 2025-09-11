/*
  Warnings:

  - The values [IN_PROGRESS] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('DRAFT', 'SENT', 'CONFIRMED', 'IN_PROGRESS_SPK', 'FULFILLED', 'PARTIALLY_INVOICED', 'INVOICED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED');
ALTER TABLE "SalesOrder" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "SalesOrder" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
ALTER TABLE "SalesOrder" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;
