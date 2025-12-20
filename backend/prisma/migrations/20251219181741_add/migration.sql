-- CreateEnum
CREATE TYPE "OpnameType" AS ENUM ('INITIAL', 'PERIODIC', 'AD_HOC');

-- CreateEnum
CREATE TYPE "OpnameStatus" AS ENUM ('DRAFT', 'ADJUSTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "StockOpname" (
    "id" TEXT NOT NULL,
    "nomorOpname" TEXT NOT NULL,
    "tanggalOpname" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "OpnameType" NOT NULL DEFAULT 'PERIODIC',
    "status" "OpnameStatus" NOT NULL DEFAULT 'DRAFT',
    "keterangan" TEXT,
    "petugasId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockOpname_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockOpnameItem" (
    "id" TEXT NOT NULL,
    "stockOpnameId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "stokSistem" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "stokFisik" DECIMAL(18,4) NOT NULL,
    "selisih" DECIMAL(18,4) NOT NULL,
    "hargaSatuan" DECIMAL(19,2) NOT NULL,
    "totalNilai" DECIMAL(19,2) NOT NULL,
    "catatanItem" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockOpnameItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StockOpname_nomorOpname_key" ON "StockOpname"("nomorOpname");

-- AddForeignKey
ALTER TABLE "StockOpname" ADD CONSTRAINT "StockOpname_petugasId_fkey" FOREIGN KEY ("petugasId") REFERENCES "Karyawan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockOpnameItem" ADD CONSTRAINT "StockOpnameItem_stockOpnameId_fkey" FOREIGN KEY ("stockOpnameId") REFERENCES "StockOpname"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockOpnameItem" ADD CONSTRAINT "StockOpnameItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
