-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProductType" ADD VALUE 'FinishedGoods';
ALTER TYPE "ProductType" ADD VALUE 'SparePart';
ALTER TYPE "ProductType" ADD VALUE 'Consumable';
ALTER TYPE "ProductType" ADD VALUE 'Asset';
ALTER TYPE "ProductType" ADD VALUE 'Rental';
ALTER TYPE "ProductType" ADD VALUE 'Software';
ALTER TYPE "ProductType" ADD VALUE 'Packaging';
ALTER TYPE "ProductType" ADD VALUE 'MRO';
ALTER TYPE "ProductType" ADD VALUE 'Scrap';
ALTER TYPE "ProductType" ADD VALUE 'Refurbished';
ALTER TYPE "ProductType" ADD VALUE 'Return';
