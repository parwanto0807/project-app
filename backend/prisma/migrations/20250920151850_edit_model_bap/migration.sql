/*
  Warnings:

  - Added the required column `createdById` to the `BAP` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BAP" ADD COLUMN     "createdById" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "BAP" ADD CONSTRAINT "BAP_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
