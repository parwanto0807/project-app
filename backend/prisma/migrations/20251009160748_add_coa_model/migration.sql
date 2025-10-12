-- CreateEnum
CREATE TYPE "CoaType" AS ENUM ('ASET', 'LIABILITAS', 'EKUITAS', 'PENDAPATAN', 'HPP', 'BEBAN');

-- CreateEnum
CREATE TYPE "CoaNormalBalance" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "CoaPostingType" AS ENUM ('HEADER', 'POSTING');

-- CreateEnum
CREATE TYPE "CoaCashflowType" AS ENUM ('OPERATING', 'INVESTING', 'FINANCING', 'NONE');

-- CreateEnum
CREATE TYPE "CoaStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'LOCKED');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "cogsAccountId" TEXT,
ADD COLUMN     "inventoryAccountId" TEXT,
ADD COLUMN     "revenueAccountId" TEXT;

-- CreateTable
CREATE TABLE "TaxRate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rate" DECIMAL(65,30) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChartOfAccounts" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "CoaType" NOT NULL,
    "normalBalance" "CoaNormalBalance" NOT NULL,
    "postingType" "CoaPostingType" NOT NULL DEFAULT 'POSTING',
    "cashflowType" "CoaCashflowType" NOT NULL DEFAULT 'NONE',
    "status" "CoaStatus" NOT NULL DEFAULT 'ACTIVE',
    "isReconcilable" BOOLEAN NOT NULL DEFAULT false,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'IDR',
    "parentId" TEXT,
    "taxRateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChartOfAccounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaxRate_name_key" ON "TaxRate"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ChartOfAccounts_code_key" ON "ChartOfAccounts"("code");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_revenueAccountId_fkey" FOREIGN KEY ("revenueAccountId") REFERENCES "ChartOfAccounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_cogsAccountId_fkey" FOREIGN KEY ("cogsAccountId") REFERENCES "ChartOfAccounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_inventoryAccountId_fkey" FOREIGN KEY ("inventoryAccountId") REFERENCES "ChartOfAccounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChartOfAccounts" ADD CONSTRAINT "ChartOfAccounts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ChartOfAccounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChartOfAccounts" ADD CONSTRAINT "ChartOfAccounts_taxRateId_fkey" FOREIGN KEY ("taxRateId") REFERENCES "TaxRate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
