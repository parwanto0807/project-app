/*
  Warnings:

  - You are about to drop the column `after` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `before` on the `AuditLog` table. All the data in the column will be lost.
  - Added the required column `data` to the `AuditLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `durationMs` to the `AuditLog` table without a default value. This is not possible if the table is not empty.
  - Made the column `userId` on table `AuditLog` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "after",
DROP COLUMN "before",
ADD COLUMN     "data" TEXT NOT NULL,
ADD COLUMN     "durationMs" INTEGER NOT NULL,
ALTER COLUMN "userId" SET NOT NULL;
