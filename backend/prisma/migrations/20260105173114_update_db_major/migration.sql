/*
  Warnings:

  - You are about to drop the column `projectName` on the `MaterialRequisition` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `MaterialRequisitionItem` table. All the data in the column will be lost.
  - You are about to drop the column `amountAllocated` on the `PaymentAllocation` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `PaymentAllocation` table. All the data in the column will be lost.
  - You are about to drop the column `dueDate` on the `PurchaseOrder` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `PurchaseOrder` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethod` on the `PurchaseOrder` table. All the data in the column will be lost.
  - You are about to drop the column `shippingAddress` on the `PurchaseOrder` table. All the data in the column will be lost.
  - You are about to drop the column `shippingCost` on the `PurchaseOrder` table. All the data in the column will be lost.
  - You are about to drop the column `spkId` on the `PurchaseOrder` table. All the data in the column will be lost.
  - You are about to drop the column `taxRate` on the `PurchaseOrderLine` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[qrToken]` on the table `MaterialRequisition` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[paymentVoucherId,supplierInvoiceId,supplierPaymentId]` on the table `PaymentAllocation` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[productId,warehouseId,period]` on the table `StockBalance` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `qtyPassed` to the `GoodsReceiptItem` table without a default value. This is not possible if the table is not empty.
  - The required column `qrToken` was added to the `MaterialRequisition` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `qtyRequested` to the `MaterialRequisitionItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `amount` to the `PaymentAllocation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplierPaymentId` to the `PaymentAllocation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `warehouseId` to the `PurchaseOrder` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "QCStatus" AS ENUM ('PENDING', 'ARRIVED', 'PASSED', 'REJECTED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('RECEIVED', 'PARTIAL', 'REJECTED');

-- CreateEnum
CREATE TYPE "PurchaseExecutionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReceiptPhotoType" AS ENUM ('BON', 'PRODUCT', 'OTHER');

-- CreateEnum
CREATE TYPE "LedgerCategory" AS ENUM ('OPERASIONAL_PROYEK', 'PINJAMAN_PRIBADI');

-- CreateEnum
CREATE TYPE "TransactionStafBalanceType" AS ENUM ('OPENING_BALANCE', 'CASH_ADVANCE', 'EXPENSE_REPORT', 'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT', 'REIMBURSEMENT');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('JOURNAL', 'PAYMENT', 'RECEIPT', 'ADJUSTMENT', 'CLOSING', 'REVERSAL');

-- CreateEnum
CREATE TYPE "LedgerStatus" AS ENUM ('DRAFT', 'POSTED', 'VOID', 'LOCKED', 'RECONCILED', 'PARTIAL_RECONCILED');

-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('UNRECONCILED', 'PENDING', 'RECONCILED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "ReportTypeFinancial" AS ENUM ('BALANCE_SHEET', 'INCOME_STATEMENT', 'CASHFLOW_STATEMENT', 'TRIAL_BALANCE', 'GENERAL_LEDGER', 'PROFIT_LOSS', 'RETAINED_EARNINGS', 'BUDGET_VS_ACTUAL', 'AGING_REPORT');

-- CreateEnum
CREATE TYPE "CalculationType" AS ENUM ('HEADER', 'SUM', 'AVERAGE', 'FORMULA', 'PERCENTAGE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DocumentStatus" ADD VALUE 'ARRIVED';
ALTER TYPE "DocumentStatus" ADD VALUE 'PASSED';

-- AlterEnum
ALTER TYPE "MRStatus" ADD VALUE 'READY_TO_PICKUP';

-- AlterEnum
ALTER TYPE "OpnameStatus" ADD VALUE 'COMPLETED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PurchaseOrderStatus" ADD VALUE 'REVISION_NEEDED';
ALTER TYPE "PurchaseOrderStatus" ADD VALUE 'REQUEST_REVISION';
ALTER TYPE "PurchaseOrderStatus" ADD VALUE 'INVOICE_RECEIVED';
ALTER TYPE "PurchaseOrderStatus" ADD VALUE 'UNVERIFIED_ACCOUNTING';
ALTER TYPE "PurchaseOrderStatus" ADD VALUE 'VERIFIED_ACCOUNTING';
ALTER TYPE "PurchaseOrderStatus" ADD VALUE 'APPROVED_ACCOUNTING';
ALTER TYPE "PurchaseOrderStatus" ADD VALUE 'POSTED';
ALTER TYPE "PurchaseOrderStatus" ADD VALUE 'AWAITING_PAYMENT';
ALTER TYPE "PurchaseOrderStatus" ADD VALUE 'PARTIALLY_PAID';
ALTER TYPE "PurchaseOrderStatus" ADD VALUE 'FULLY_PAID';

-- AlterEnum
ALTER TYPE "SourceType" ADD VALUE 'TRANSFER';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SupplierInvoiceStatus" ADD VALUE 'REVISION_NEEDED';
ALTER TYPE "SupplierInvoiceStatus" ADD VALUE 'UNVERIFIED';
ALTER TYPE "SupplierInvoiceStatus" ADD VALUE 'VERIFIED';
ALTER TYPE "SupplierInvoiceStatus" ADD VALUE 'APPROVED';
ALTER TYPE "SupplierInvoiceStatus" ADD VALUE 'POSTED';
ALTER TYPE "SupplierInvoiceStatus" ADD VALUE 'VOIDED';
ALTER TYPE "SupplierInvoiceStatus" ADD VALUE 'DISPUTED';
ALTER TYPE "SupplierInvoiceStatus" ADD VALUE 'WRITTEN_OFF';

-- DropForeignKey
ALTER TABLE "PurchaseOrder" DROP CONSTRAINT "PurchaseOrder_spkId_fkey";

-- DropForeignKey
ALTER TABLE "UangMuka" DROP CONSTRAINT "UangMuka_spkId_fkey";

-- DropIndex
DROP INDEX "PaymentAllocation_paymentVoucherId_supplierInvoiceId_key";

-- DropIndex
DROP INDEX "StockBalance_productId_period_key";

-- AlterTable
ALTER TABLE "GoodsReceipt" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expectedDate" TIMESTAMP(3),
ADD COLUMN     "sourceType" "SourceType" NOT NULL DEFAULT 'PO',
ALTER COLUMN "receivedDate" DROP NOT NULL,
ALTER COLUMN "receivedDate" DROP DEFAULT;

-- AlterTable
ALTER TABLE "GoodsReceiptItem" ADD COLUMN     "qcNotes" TEXT,
ADD COLUMN     "qcStatus" "QCStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "qtyPassed" DECIMAL(18,4) NOT NULL,
ADD COLUMN     "qtyPlanReceived" DECIMAL(18,4) NOT NULL DEFAULT 0,
ADD COLUMN     "qtyRejected" DECIMAL(18,4) NOT NULL DEFAULT 0,
ADD COLUMN     "status" "ItemStatus" NOT NULL DEFAULT 'RECEIVED',
ADD COLUMN     "unitPrice" DECIMAL(18,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "MaterialRequisition" DROP COLUMN "projectName",
ADD COLUMN     "issuedById" TEXT,
ADD COLUMN     "preparedById" TEXT,
ADD COLUMN     "purchaseOrderId" TEXT,
ADD COLUMN     "qrToken" TEXT NOT NULL,
ADD COLUMN     "sourceType" "SourceType" NOT NULL DEFAULT 'PO',
ALTER COLUMN "projectId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "MaterialRequisitionItem" DROP COLUMN "createdAt",
ADD COLUMN     "priceUnit" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "qtyRequested" DECIMAL(18,4) NOT NULL;

-- AlterTable
ALTER TABLE "PaymentAllocation" DROP COLUMN "amountAllocated",
DROP COLUMN "createdAt",
ADD COLUMN     "amount" DECIMAL(18,2) NOT NULL,
ADD COLUMN     "supplierPaymentId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PurchaseOrder" DROP COLUMN "dueDate",
DROP COLUMN "notes",
DROP COLUMN "paymentMethod",
DROP COLUMN "shippingAddress",
DROP COLUMN "shippingCost",
DROP COLUMN "spkId",
ADD COLUMN     "requestRevisi" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sPKId" TEXT,
ADD COLUMN     "teamId" TEXT,
ADD COLUMN     "warehouseId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PurchaseOrderLine" DROP COLUMN "taxRate",
ADD COLUMN     "checkMatch" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "checkPurchaseExecution" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "purchasedQuantity" DECIMAL(18,4) NOT NULL DEFAULT 0,
ADD COLUMN     "qtyActual" DECIMAL(18,4) NOT NULL DEFAULT 0,
ADD COLUMN     "remainingQuantity" DECIMAL(18,4) NOT NULL DEFAULT 0,
ADD COLUMN     "unitPriceActual" DECIMAL(18,2) NOT NULL DEFAULT 0,
ALTER COLUMN "quantity" SET DEFAULT 0,
ALTER COLUMN "unitPrice" SET DEFAULT 0,
ALTER COLUMN "totalAmount" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "PurchaseRequest" ADD COLUMN     "requestedById" TEXT;

-- AlterTable
ALTER TABLE "PurchaseRequestDetail" ADD COLUMN     "warehouseAllocation" JSONB;

-- AlterTable
ALTER TABLE "StockTransferItem" ADD COLUMN     "cogs" DECIMAL(18,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "onWip" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "SupplierInvoice" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "UangMuka" ALTER COLUMN "spkId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Warehouse" ADD COLUMN     "isWip" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "StockAllocation" (
    "id" TEXT NOT NULL,
    "mrItemId" TEXT NOT NULL,
    "stockDetailId" TEXT NOT NULL,
    "qtyTaken" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "StockAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseExecution" (
    "id" TEXT NOT NULL,
    "poId" TEXT NOT NULL,
    "executorId" TEXT NOT NULL,
    "executionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "PurchaseExecutionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "totalSpent" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseReceipt" (
    "id" TEXT NOT NULL,
    "receiptNumber" TEXT,
    "storeName" TEXT,
    "receiptDate" TIMESTAMP(3) NOT NULL,
    "totalAmount" DECIMAL(18,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "executionId" TEXT NOT NULL,
    "ledgerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceiptPhoto" (
    "id" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "receiptItemId" TEXT,
    "photoUrl" TEXT NOT NULL,
    "photoType" "ReceiptPhotoType" NOT NULL DEFAULT 'BON',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReceiptPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceiptItem" (
    "id" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "poLineId" TEXT,
    "isAdditional" BOOLEAN NOT NULL DEFAULT false,
    "productName" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPrice" DECIMAL(18,2) NOT NULL,
    "totalPrice" DECIMAL(18,2) NOT NULL,
    "storeName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReceiptItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierInvoiceItem" (
    "id" TEXT NOT NULL,
    "supplierInvoiceId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "poLineId" TEXT,
    "goodsReceivedItemId" TEXT,
    "quantity" DECIMAL(18,4) NOT NULL,
    "unitPrice" DECIMAL(18,2) NOT NULL,
    "totalPrice" DECIMAL(18,2) NOT NULL,
    "priceVariance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierInvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierPayment" (
    "id" TEXT NOT NULL,
    "paymentNumber" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(18,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "bankAccountId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffBalance" (
    "id" TEXT NOT NULL,
    "karyawanId" TEXT NOT NULL,
    "category" "LedgerCategory" NOT NULL,
    "totalIn" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalOut" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffLedger" (
    "id" TEXT NOT NULL,
    "karyawanId" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "keterangan" TEXT NOT NULL,
    "saldoAwal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "debit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "kredit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "saldo" DECIMAL(15,2) NOT NULL,
    "category" "LedgerCategory" NOT NULL,
    "type" "TransactionStafBalanceType" NOT NULL,
    "purchaseRequestId" TEXT,
    "refId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ledger" (
    "id" TEXT NOT NULL,
    "ledgerNumber" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "referenceType" "LedgerEntryType" NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "postingDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "notes" TEXT,
    "periodId" TEXT NOT NULL,
    "status" "LedgerStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "exchangeRate" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdBy" TEXT NOT NULL,
    "postedBy" TEXT,
    "postedAt" TIMESTAMP(3),
    "voidBy" TEXT,
    "voidAt" TIMESTAMP(3),
    "voidReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "journalEntryId" TEXT,
    "paymentVoucherId" TEXT,

    CONSTRAINT "Ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerLine" (
    "id" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "coaId" TEXT NOT NULL,
    "debitAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "creditAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "localAmount" DOUBLE PRECISION NOT NULL,
    "foreignCurrency" TEXT,
    "foreignAmount" DOUBLE PRECISION,
    "exchangeRate" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "projectId" TEXT,
    "customerId" TEXT,
    "supplierId" TEXT,
    "karyawanId" TEXT,
    "description" TEXT,
    "reference" TEXT,
    "lineNumber" INTEGER NOT NULL,
    "reconciliationStatus" "ReconciliationStatus" NOT NULL DEFAULT 'UNRECONCILED',
    "reconciledDate" TIMESTAMP(3),
    "reconciledBy" TEXT,
    "bankStatementRef" TEXT,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxRateId" TEXT,
    "taxInclusive" BOOLEAN NOT NULL DEFAULT false,
    "isAllocated" BOOLEAN NOT NULL DEFAULT false,
    "allocationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LedgerLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingPeriod" (
    "id" TEXT NOT NULL,
    "periodCode" TEXT NOT NULL,
    "periodName" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "quarter" INTEGER NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "closedAt" TIMESTAMP(3),
    "closedBy" TEXT,
    "reopenAt" TIMESTAMP(3),
    "reopenBy" TEXT,
    "reopenReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrialBalance" (
    "id" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "coaId" TEXT NOT NULL,
    "openingDebit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "openingCredit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "periodDebit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "periodCredit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "endingDebit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "endingCredit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ytdDebit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ytdCredit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "calculatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrialBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneralLedgerSummary" (
    "id" TEXT NOT NULL,
    "coaId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "openingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "debitTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "creditTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "closingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "transactionCount" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'IDR',

    CONSTRAINT "GeneralLedgerSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reconciliation" (
    "id" TEXT NOT NULL,
    "reconciliationNumber" TEXT NOT NULL,
    "coaId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "bookBalance" DOUBLE PRECISION NOT NULL,
    "bookCurrency" TEXT NOT NULL DEFAULT 'IDR',
    "statementBalance" DOUBLE PRECISION NOT NULL,
    "statementDate" TIMESTAMP(3) NOT NULL,
    "statementRef" TEXT NOT NULL,
    "reconciledBalance" DOUBLE PRECISION NOT NULL,
    "difference" DOUBLE PRECISION NOT NULL,
    "status" "ReconciliationStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "notes" TEXT,
    "preparedBy" TEXT NOT NULL,
    "preparedAt" TIMESTAMP(3) NOT NULL,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconciliationItem" (
    "id" TEXT NOT NULL,
    "reconciliationId" TEXT NOT NULL,
    "ledgerLineId" TEXT NOT NULL,
    "transactionAmount" DOUBLE PRECISION NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "statementAmount" DOUBLE PRECISION,
    "statementDate" TIMESTAMP(3),
    "isCleared" BOOLEAN NOT NULL DEFAULT false,
    "clearedDate" TIMESTAMP(3),
    "description" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReconciliationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialReport" (
    "id" TEXT NOT NULL,
    "reportNumber" TEXT NOT NULL,
    "reportTypeFinancial" "ReportTypeFinancial" NOT NULL,
    "periodId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL,
    "generatedBy" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "filePath" TEXT,
    "fileFormat" TEXT,
    "templateId" TEXT,
    "parameters" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialReportSection" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "sectionCode" TEXT NOT NULL,
    "sectionName" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "calculationType" "CalculationType" NOT NULL,
    "formula" TEXT,
    "parentId" TEXT,

    CONSTRAINT "FinancialReportSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SupplierPayment_paymentNumber_key" ON "SupplierPayment"("paymentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "StaffBalance_karyawanId_category_key" ON "StaffBalance"("karyawanId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "Ledger_ledgerNumber_key" ON "Ledger"("ledgerNumber");

-- CreateIndex
CREATE INDEX "Ledger_transactionDate_idx" ON "Ledger"("transactionDate");

-- CreateIndex
CREATE INDEX "Ledger_postingDate_idx" ON "Ledger"("postingDate");

-- CreateIndex
CREATE INDEX "Ledger_periodId_idx" ON "Ledger"("periodId");

-- CreateIndex
CREATE INDEX "Ledger_status_idx" ON "Ledger"("status");

-- CreateIndex
CREATE INDEX "LedgerLine_ledgerId_idx" ON "LedgerLine"("ledgerId");

-- CreateIndex
CREATE INDEX "LedgerLine_coaId_idx" ON "LedgerLine"("coaId");

-- CreateIndex
CREATE INDEX "LedgerLine_reconciliationStatus_idx" ON "LedgerLine"("reconciliationStatus");

-- CreateIndex
CREATE INDEX "LedgerLine_projectId_idx" ON "LedgerLine"("projectId");

-- CreateIndex
CREATE INDEX "LedgerLine_customerId_idx" ON "LedgerLine"("customerId");

-- CreateIndex
CREATE INDEX "LedgerLine_supplierId_idx" ON "LedgerLine"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerLine_ledgerId_lineNumber_key" ON "LedgerLine"("ledgerId", "lineNumber");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingPeriod_periodCode_key" ON "AccountingPeriod"("periodCode");

-- CreateIndex
CREATE INDEX "AccountingPeriod_fiscalYear_idx" ON "AccountingPeriod"("fiscalYear");

-- CreateIndex
CREATE INDEX "AccountingPeriod_startDate_endDate_idx" ON "AccountingPeriod"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "TrialBalance_periodId_idx" ON "TrialBalance"("periodId");

-- CreateIndex
CREATE INDEX "TrialBalance_coaId_idx" ON "TrialBalance"("coaId");

-- CreateIndex
CREATE UNIQUE INDEX "TrialBalance_periodId_coaId_key" ON "TrialBalance"("periodId", "coaId");

-- CreateIndex
CREATE INDEX "GeneralLedgerSummary_coaId_date_idx" ON "GeneralLedgerSummary"("coaId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "GeneralLedgerSummary_coaId_periodId_date_key" ON "GeneralLedgerSummary"("coaId", "periodId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Reconciliation_reconciliationNumber_key" ON "Reconciliation"("reconciliationNumber");

-- CreateIndex
CREATE INDEX "Reconciliation_coaId_idx" ON "Reconciliation"("coaId");

-- CreateIndex
CREATE INDEX "Reconciliation_periodId_idx" ON "Reconciliation"("periodId");

-- CreateIndex
CREATE INDEX "Reconciliation_status_idx" ON "Reconciliation"("status");

-- CreateIndex
CREATE INDEX "ReconciliationItem_reconciliationId_idx" ON "ReconciliationItem"("reconciliationId");

-- CreateIndex
CREATE INDEX "ReconciliationItem_ledgerLineId_idx" ON "ReconciliationItem"("ledgerLineId");

-- CreateIndex
CREATE UNIQUE INDEX "ReconciliationItem_reconciliationId_ledgerLineId_key" ON "ReconciliationItem"("reconciliationId", "ledgerLineId");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialReport_reportNumber_key" ON "FinancialReport"("reportNumber");

-- CreateIndex
CREATE INDEX "FinancialReport_periodId_idx" ON "FinancialReport"("periodId");

-- CreateIndex
CREATE INDEX "FinancialReport_reportTypeFinancial_idx" ON "FinancialReport"("reportTypeFinancial");

-- CreateIndex
CREATE INDEX "FinancialReportSection_reportId_idx" ON "FinancialReportSection"("reportId");

-- CreateIndex
CREATE INDEX "FinancialReportSection_sectionCode_idx" ON "FinancialReportSection"("sectionCode");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialRequisition_qrToken_key" ON "MaterialRequisition"("qrToken");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAllocation_paymentVoucherId_supplierInvoiceId_suppli_key" ON "PaymentAllocation"("paymentVoucherId", "supplierInvoiceId", "supplierPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "StockBalance_productId_warehouseId_period_key" ON "StockBalance"("productId", "warehouseId", "period");

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRequisition" ADD CONSTRAINT "MaterialRequisition_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAllocation" ADD CONSTRAINT "StockAllocation_mrItemId_fkey" FOREIGN KEY ("mrItemId") REFERENCES "MaterialRequisitionItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAllocation" ADD CONSTRAINT "StockAllocation_stockDetailId_fkey" FOREIGN KEY ("stockDetailId") REFERENCES "StockDetail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "Karyawan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UangMuka" ADD CONSTRAINT "UangMuka_spkId_fkey" FOREIGN KEY ("spkId") REFERENCES "SPK"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_sPKId_fkey" FOREIGN KEY ("sPKId") REFERENCES "SPK"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseExecution" ADD CONSTRAINT "PurchaseExecution_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseExecution" ADD CONSTRAINT "PurchaseExecution_executorId_fkey" FOREIGN KEY ("executorId") REFERENCES "Karyawan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReceipt" ADD CONSTRAINT "PurchaseReceipt_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "PurchaseExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReceipt" ADD CONSTRAINT "PurchaseReceipt_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "Ledger"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptPhoto" ADD CONSTRAINT "ReceiptPhoto_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "PurchaseReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptPhoto" ADD CONSTRAINT "ReceiptPhoto_receiptItemId_fkey" FOREIGN KEY ("receiptItemId") REFERENCES "ReceiptItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptItem" ADD CONSTRAINT "ReceiptItem_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "PurchaseReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptItem" ADD CONSTRAINT "ReceiptItem_poLineId_fkey" FOREIGN KEY ("poLineId") REFERENCES "PurchaseOrderLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierInvoiceItem" ADD CONSTRAINT "SupplierInvoiceItem_supplierInvoiceId_fkey" FOREIGN KEY ("supplierInvoiceId") REFERENCES "SupplierInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_supplierPaymentId_fkey" FOREIGN KEY ("supplierPaymentId") REFERENCES "SupplierPayment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffBalance" ADD CONSTRAINT "StaffBalance_karyawanId_fkey" FOREIGN KEY ("karyawanId") REFERENCES "Karyawan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffLedger" ADD CONSTRAINT "StaffLedger_karyawanId_fkey" FOREIGN KEY ("karyawanId") REFERENCES "Karyawan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffLedger" ADD CONSTRAINT "StaffLedger_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ledger" ADD CONSTRAINT "Ledger_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AccountingPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ledger" ADD CONSTRAINT "Ledger_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ledger" ADD CONSTRAINT "Ledger_paymentVoucherId_fkey" FOREIGN KEY ("paymentVoucherId") REFERENCES "PaymentVoucher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerLine" ADD CONSTRAINT "LedgerLine_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "Ledger"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerLine" ADD CONSTRAINT "LedgerLine_coaId_fkey" FOREIGN KEY ("coaId") REFERENCES "ChartOfAccounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerLine" ADD CONSTRAINT "LedgerLine_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerLine" ADD CONSTRAINT "LedgerLine_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerLine" ADD CONSTRAINT "LedgerLine_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerLine" ADD CONSTRAINT "LedgerLine_karyawanId_fkey" FOREIGN KEY ("karyawanId") REFERENCES "Karyawan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerLine" ADD CONSTRAINT "LedgerLine_taxRateId_fkey" FOREIGN KEY ("taxRateId") REFERENCES "TaxRate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrialBalance" ADD CONSTRAINT "TrialBalance_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AccountingPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrialBalance" ADD CONSTRAINT "TrialBalance_coaId_fkey" FOREIGN KEY ("coaId") REFERENCES "ChartOfAccounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralLedgerSummary" ADD CONSTRAINT "GeneralLedgerSummary_coaId_fkey" FOREIGN KEY ("coaId") REFERENCES "ChartOfAccounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralLedgerSummary" ADD CONSTRAINT "GeneralLedgerSummary_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AccountingPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reconciliation" ADD CONSTRAINT "Reconciliation_coaId_fkey" FOREIGN KEY ("coaId") REFERENCES "ChartOfAccounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reconciliation" ADD CONSTRAINT "Reconciliation_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AccountingPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationItem" ADD CONSTRAINT "ReconciliationItem_reconciliationId_fkey" FOREIGN KEY ("reconciliationId") REFERENCES "Reconciliation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationItem" ADD CONSTRAINT "ReconciliationItem_ledgerLineId_fkey" FOREIGN KEY ("ledgerLineId") REFERENCES "LedgerLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialReport" ADD CONSTRAINT "FinancialReport_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AccountingPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialReportSection" ADD CONSTRAINT "FinancialReportSection_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "FinancialReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialReportSection" ADD CONSTRAINT "FinancialReportSection_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "FinancialReportSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
