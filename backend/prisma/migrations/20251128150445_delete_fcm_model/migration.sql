/*
  Warnings:

  - You are about to drop the `FCMToken` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "FCMToken" DROP CONSTRAINT "FCMToken_deviceId_fkey";

-- DropForeignKey
ALTER TABLE "FCMToken" DROP CONSTRAINT "FCMToken_userId_fkey";

-- DropIndex
DROP INDEX "TrustedDevice_deviceId_key";

-- AlterTable
ALTER TABLE "TrustedDevice" ALTER COLUMN "deviceId" DROP NOT NULL;

-- DropTable
DROP TABLE "FCMToken";
