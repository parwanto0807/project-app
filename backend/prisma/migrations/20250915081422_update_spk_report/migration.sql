/*
  Warnings:

  - You are about to drop the column `spkDetailId` on the `SPKFieldReport` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "SPKFieldReport" DROP CONSTRAINT "SPKFieldReport_spkDetailId_fkey";

-- AlterTable
ALTER TABLE "SPKFieldReport" DROP COLUMN "spkDetailId",
ADD COLUMN     "soDetailId" TEXT;

-- AddForeignKey
ALTER TABLE "SPKFieldReport" ADD CONSTRAINT "SPKFieldReport_soDetailId_fkey" FOREIGN KEY ("soDetailId") REFERENCES "SalesOrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
