-- CreateEnum
CREATE TYPE "SourceProductType" AS ENUM ('PEMBELIAN', 'STOCK');

-- AlterTable
ALTER TABLE "PurchaseRequestDetail" ADD COLUMN     "sourceProduct" "SourceProductType";
