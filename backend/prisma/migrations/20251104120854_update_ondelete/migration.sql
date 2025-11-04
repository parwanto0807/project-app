-- DropForeignKey
ALTER TABLE "SPKDetail" DROP CONSTRAINT "SPKDetail_salesOrderItemId_fkey";

-- DropForeignKey
ALTER TABLE "SPKFieldReport" DROP CONSTRAINT "SPKFieldReport_soDetailId_fkey";

-- DropForeignKey
ALTER TABLE "SalesOrderItem" DROP CONSTRAINT "SalesOrderItem_productId_fkey";

-- AddForeignKey
ALTER TABLE "SalesOrderItem" ADD CONSTRAINT "SalesOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SPKDetail" ADD CONSTRAINT "SPKDetail_salesOrderItemId_fkey" FOREIGN KEY ("salesOrderItemId") REFERENCES "SalesOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SPKFieldReport" ADD CONSTRAINT "SPKFieldReport_soDetailId_fkey" FOREIGN KEY ("soDetailId") REFERENCES "SalesOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
