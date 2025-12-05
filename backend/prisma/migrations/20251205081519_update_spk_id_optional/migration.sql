-- DropForeignKey
ALTER TABLE "PurchaseRequest" DROP CONSTRAINT "PurchaseRequest_spkId_fkey";

-- AlterTable
ALTER TABLE "PurchaseRequest" ALTER COLUMN "spkId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_spkId_fkey" FOREIGN KEY ("spkId") REFERENCES "SPK"("id") ON DELETE SET NULL ON UPDATE CASCADE;
