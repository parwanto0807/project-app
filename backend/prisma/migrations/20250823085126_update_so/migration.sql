/*
  Warnings:

  - Made the column `projectId` on table `SalesOrder` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "SalesOrder" ALTER COLUMN "projectId" SET NOT NULL;
