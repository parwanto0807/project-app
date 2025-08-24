/*
  Warnings:

  - Added the required column `lineNo` to the `SalesOrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SalesOrderItem" ADD COLUMN     "lineNo" INTEGER NOT NULL;
