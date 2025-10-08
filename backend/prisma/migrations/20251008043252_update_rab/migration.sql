/*
  Warnings:

  - Added the required column `updatedAt` to the `RABDetail` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `RABDetail` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "CategoryRAB" AS ENUM ('PRELIMINARY', 'SITEPREP', 'STRUCTURE', 'ARCHITECTURE', 'MEP', 'FINISHING', 'LANDSCAPE', 'EQUIPMENT', 'OVERHEAD', 'OTHER');

-- DropForeignKey
ALTER TABLE "RABDetail" DROP CONSTRAINT "RABDetail_rabId_fkey";

-- AlterTable
ALTER TABLE "RABDetail" ADD COLUMN     "categoryRab" "CategoryRAB" NOT NULL DEFAULT 'STRUCTURE',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "description" SET NOT NULL;

-- CreateIndex
CREATE INDEX "RABDetail_rabId_idx" ON "RABDetail"("rabId");

-- CreateIndex
CREATE INDEX "RABDetail_categoryRab_idx" ON "RABDetail"("categoryRab");

-- CreateIndex
CREATE INDEX "RABDetail_costType_idx" ON "RABDetail"("costType");

-- AddForeignKey
ALTER TABLE "RABDetail" ADD CONSTRAINT "RABDetail_rabId_fkey" FOREIGN KEY ("rabId") REFERENCES "RAB"("id") ON DELETE CASCADE ON UPDATE CASCADE;
