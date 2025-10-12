-- DropForeignKey
ALTER TABLE "PurchaseRequestDetail" DROP CONSTRAINT "PurchaseRequestDetail_projectBudgetId_fkey";

-- AlterTable
ALTER TABLE "PurchaseRequestDetail" ALTER COLUMN "projectBudgetId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "PurchaseRequestDetail" ADD CONSTRAINT "PurchaseRequestDetail_projectBudgetId_fkey" FOREIGN KEY ("projectBudgetId") REFERENCES "ProjectBudget"("id") ON DELETE SET NULL ON UPDATE CASCADE;
