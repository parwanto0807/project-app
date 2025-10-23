/*
  Warnings:

  - The values [PEMBELIAN,STOCK] on the enum `SourceProductType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SourceProductType_new" AS ENUM ('PEMBELIAN_BARANG', 'PENGAMBILAN_STOK', 'OPERATIONAL', 'JASA_PEMBELIAN', 'JASA_INTERNAL');
ALTER TABLE "PurchaseRequestDetail" ALTER COLUMN "sourceProduct" TYPE "SourceProductType_new" USING ("sourceProduct"::text::"SourceProductType_new");
ALTER TYPE "SourceProductType" RENAME TO "SourceProductType_old";
ALTER TYPE "SourceProductType_new" RENAME TO "SourceProductType";
DROP TYPE "SourceProductType_old";
COMMIT;
