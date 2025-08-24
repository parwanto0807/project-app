/*
  Warnings:

  - You are about to drop the column `poNumber` on the `SalesOrder` table. All the data in the column will be lost.
  - You are about to drop the column `isBap` on the `SalesOrderDocument` table. All the data in the column will be lost.
  - You are about to drop the column `isInvoice` on the `SalesOrderDocument` table. All the data in the column will be lost.
  - You are about to drop the column `isOffer` on the `SalesOrderDocument` table. All the data in the column will be lost.
  - You are about to drop the column `isPaymentStatus` on the `SalesOrderDocument` table. All the data in the column will be lost.
  - You are about to drop the column `isPo` on the `SalesOrderDocument` table. All the data in the column will be lost.
  - You are about to alter the column `qty` on the `SalesOrderItem` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(18,4)`.
  - You are about to alter the column `unitPrice` on the `SalesOrderItem` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(18,2)`.
  - Added the required column `updatedAt` to the `SalesOrder` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `SalesOrder` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `docType` to the `SalesOrderDocument` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `SalesOrderItem` table without a default value. This is not possible if the table is not empty.
  - Made the column `productId` on table `SalesOrderItem` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('REGULAR', 'SUPPORT');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'SENT', 'CONFIRMED', 'IN_PROGRESS', 'FULFILLED', 'PARTIALLY_INVOICED', 'INVOICED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('PRODUCT', 'SERVICE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "DocType" AS ENUM ('QUOTATION', 'PO', 'BAP', 'INVOICE', 'PAYMENT_RECEIPT');

-- DropForeignKey
ALTER TABLE "SalesOrderDocument" DROP CONSTRAINT "SalesOrderDocument_salesOrderId_fkey";

-- DropForeignKey
ALTER TABLE "SalesOrderItem" DROP CONSTRAINT "SalesOrderItem_salesOrderId_fkey";

-- DropIndex
DROP INDEX "SalesOrderDocument_salesOrderId_key";

-- AlterTable
ALTER TABLE "SalesOrder" DROP COLUMN "poNumber",
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'IDR',
ADD COLUMN     "discountTotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "grandTotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "subtotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "taxTotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "OrderType" NOT NULL;

-- AlterTable
ALTER TABLE "SalesOrderDocument" DROP COLUMN "isBap",
DROP COLUMN "isInvoice",
DROP COLUMN "isOffer",
DROP COLUMN "isPaymentStatus",
DROP COLUMN "isPo",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "docDate" TIMESTAMP(3),
ADD COLUMN     "docNumber" TEXT,
ADD COLUMN     "docType" "DocType" NOT NULL,
ADD COLUMN     "fileUrl" TEXT,
ADD COLUMN     "meta" JSONB;

-- AlterTable
ALTER TABLE "SalesOrderItem" ADD COLUMN     "discount" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "itemType" "ItemType" NOT NULL DEFAULT 'PRODUCT',
ADD COLUMN     "lineTotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
ALTER COLUMN "productId" SET NOT NULL,
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "qty" SET DATA TYPE DECIMAL(18,4),
ALTER COLUMN "unitPrice" SET DATA TYPE DECIMAL(18,2);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "salesOrderId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "subtotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "discountTotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "taxTotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'UNPAID',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "soItemId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "uom" TEXT,
    "qty" DECIMAL(18,4) NOT NULL,
    "unitPrice" DECIMAL(18,2) NOT NULL,
    "discount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(18,2) NOT NULL DEFAULT 0,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "payDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "method" TEXT,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_salesOrderId_idx" ON "Invoice"("salesOrderId");

-- CreateIndex
CREATE INDEX "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_payDate_idx" ON "Payment"("invoiceId", "payDate");

-- CreateIndex
CREATE INDEX "SalesOrder_customerId_soDate_idx" ON "SalesOrder"("customerId", "soDate");

-- CreateIndex
CREATE INDEX "SalesOrder_status_idx" ON "SalesOrder"("status");

-- CreateIndex
CREATE INDEX "SalesOrder_projectId_idx" ON "SalesOrder"("projectId");

-- CreateIndex
CREATE INDEX "SalesOrderDocument_salesOrderId_docType_idx" ON "SalesOrderDocument"("salesOrderId", "docType");

-- CreateIndex
CREATE INDEX "SalesOrderItem_salesOrderId_idx" ON "SalesOrderItem"("salesOrderId");

-- CreateIndex
CREATE INDEX "SalesOrderItem_productId_idx" ON "SalesOrderItem"("productId");

-- AddForeignKey
ALTER TABLE "SalesOrderItem" ADD CONSTRAINT "SalesOrderItem_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderDocument" ADD CONSTRAINT "SalesOrderDocument_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
