-- DropForeignKey
ALTER TABLE "StockOpname" DROP CONSTRAINT "StockOpname_petugasId_fkey";

-- AddForeignKey
ALTER TABLE "StockOpname" ADD CONSTRAINT "StockOpname_petugasId_fkey" FOREIGN KEY ("petugasId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
