-- AlterTable
ALTER TABLE "SalesOrderItem" ADD COLUMN     "uom" TEXT,
ALTER COLUMN "productId" DROP NOT NULL;
