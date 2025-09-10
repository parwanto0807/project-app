/*
  Warnings:

  - You are about to drop the column `deskripsi` on the `TeamKaryawan` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "deskripsi" TEXT;

-- AlterTable
ALTER TABLE "TeamKaryawan" DROP COLUMN "deskripsi";
