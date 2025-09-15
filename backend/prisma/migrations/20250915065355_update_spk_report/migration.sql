-- AlterTable
ALTER TABLE "SPKFieldReport" ADD COLUMN     "progress" INTEGER DEFAULT 0,
ADD COLUMN     "spkDetailId" TEXT;

-- AddForeignKey
ALTER TABLE "SPKFieldReport" ADD CONSTRAINT "SPKFieldReport_spkDetailId_fkey" FOREIGN KEY ("spkDetailId") REFERENCES "SPKDetail"("id") ON DELETE SET NULL ON UPDATE CASCADE;
