/*
  Warnings:

  - Added the required column `productId` to the `PurchaseOrderLine` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('PO', 'DIRECT', 'PROJECT', 'RETURN', 'OPNAME', 'WASTAGE');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MRStatus" AS ENUM ('PENDING', 'APPROVED', 'ISSUED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentTermPurchaseOrder" AS ENUM ('CASH', 'COD', 'NET_7', 'NET_14', 'NET_30', 'DP_PERCENTAGE');

-- AlterTable
ALTER TABLE "PurchaseOrder" ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "paymentTerm" "PaymentTermPurchaseOrder" NOT NULL DEFAULT 'COD',
ADD COLUMN     "purchaseRequestId" TEXT;

-- AlterTable
ALTER TABLE "PurchaseOrderLine" ADD COLUMN     "prDetailId" TEXT,
ADD COLUMN     "productId" TEXT NOT NULL,
ADD COLUMN     "receivedQuantity" DECIMAL(18,4) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "PurchaseRequestDetail" ADD COLUMN     "jumlahDipesan" DECIMAL(18,4) DEFAULT 0,
ADD COLUMN     "jumlahTerpenuhi" DECIMAL(18,4) DEFAULT 0,
ADD COLUMN     "stokTersediaSaatIni" DECIMAL(18,4) DEFAULT 0;

-- CreateTable
CREATE TABLE "StockBalance" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "stockAwal" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "stockIn" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "stockOut" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "justIn" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "justOut" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "onPR" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "bookedStock" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "stockAkhir" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "availableStock" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "inventoryValue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockDetail" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "stockAwalSnapshot" DECIMAL(18,4) NOT NULL,
    "stockAkhirSnapshot" DECIMAL(18,4) NOT NULL,
    "transQty" DECIMAL(18,4) NOT NULL,
    "transUnit" TEXT NOT NULL,
    "baseQty" DECIMAL(18,4) NOT NULL,
    "residualQty" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "isFullyConsumed" BOOLEAN NOT NULL DEFAULT false,
    "type" "TransactionType" NOT NULL,
    "source" "SourceType" NOT NULL,
    "pricePerUnit" DECIMAL(18,2) NOT NULL,
    "referenceNo" TEXT,
    "notes" TEXT,
    "originalTransactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "materialRequisitionItemId" TEXT,

    CONSTRAINT "StockDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceipt" (
    "id" TEXT NOT NULL,
    "grNumber" TEXT NOT NULL,
    "receivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vendorDeliveryNote" TEXT NOT NULL,
    "vehicleNumber" TEXT,
    "driverName" TEXT,
    "purchaseOrderId" TEXT,
    "receivedById" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'COMPLETED',
    "notes" TEXT,

    CONSTRAINT "GoodsReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceiptItem" (
    "id" TEXT NOT NULL,
    "goodsReceiptId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "qtyReceived" DECIMAL(18,4) NOT NULL,
    "unit" TEXT NOT NULL,
    "stockDetailId" TEXT,
    "purchaseRequestDetailId" TEXT,
    "purchaseOrderLineId" TEXT,

    CONSTRAINT "GoodsReceiptItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialRequisition" (
    "id" TEXT NOT NULL,
    "mrNumber" TEXT NOT NULL,
    "issuedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT NOT NULL,
    "projectName" TEXT,
    "requestedById" TEXT NOT NULL,
    "status" "MRStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialRequisition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialRequisitionItem" (
    "id" TEXT NOT NULL,
    "materialRequisitionId" TEXT NOT NULL,
    "purchaseRequestDetailId" TEXT,
    "productId" TEXT NOT NULL,
    "qtyIssued" DECIMAL(18,4) NOT NULL,
    "unit" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaterialRequisitionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StockBalance_productId_period_key" ON "StockBalance"("productId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "GoodsReceipt_grNumber_key" ON "GoodsReceipt"("grNumber");

-- CreateIndex
CREATE UNIQUE INDEX "GoodsReceiptItem_stockDetailId_key" ON "GoodsReceiptItem"("stockDetailId");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialRequisition_mrNumber_key" ON "MaterialRequisition"("mrNumber");

-- AddForeignKey
ALTER TABLE "StockBalance" ADD CONSTRAINT "StockBalance_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockDetail" ADD CONSTRAINT "StockDetail_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockDetail" ADD CONSTRAINT "StockDetail_originalTransactionId_fkey" FOREIGN KEY ("originalTransactionId") REFERENCES "StockDetail"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockDetail" ADD CONSTRAINT "StockDetail_materialRequisitionItemId_fkey" FOREIGN KEY ("materialRequisitionItemId") REFERENCES "MaterialRequisitionItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_goodsReceiptId_fkey" FOREIGN KEY ("goodsReceiptId") REFERENCES "GoodsReceipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_stockDetailId_fkey" FOREIGN KEY ("stockDetailId") REFERENCES "StockDetail"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_purchaseRequestDetailId_fkey" FOREIGN KEY ("purchaseRequestDetailId") REFERENCES "PurchaseRequestDetail"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_purchaseOrderLineId_fkey" FOREIGN KEY ("purchaseOrderLineId") REFERENCES "PurchaseOrderLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRequisitionItem" ADD CONSTRAINT "MaterialRequisitionItem_materialRequisitionId_fkey" FOREIGN KEY ("materialRequisitionId") REFERENCES "MaterialRequisition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRequisitionItem" ADD CONSTRAINT "MaterialRequisitionItem_purchaseRequestDetailId_fkey" FOREIGN KEY ("purchaseRequestDetailId") REFERENCES "PurchaseRequestDetail"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRequisitionItem" ADD CONSTRAINT "MaterialRequisitionItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderLine" ADD CONSTRAINT "PurchaseOrderLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderLine" ADD CONSTRAINT "PurchaseOrderLine_prDetailId_fkey" FOREIGN KEY ("prDetailId") REFERENCES "PurchaseRequestDetail"("id") ON DELETE SET NULL ON UPDATE CASCADE;
