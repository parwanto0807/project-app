/*
  Warnings:

  - Added the required column `category` to the `BAPPhoto` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PhotoCategory" AS ENUM ('BEFORE', 'PROCESS', 'AFTER');

-- AlterTable
ALTER TABLE "BAPPhoto" ADD COLUMN     "category" "PhotoCategory" NOT NULL;

-- CreateIndex
CREATE INDEX "BAPPhoto_category_idx" ON "BAPPhoto"("category");
