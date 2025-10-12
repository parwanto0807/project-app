-- CreateEnum
CREATE TYPE "PurchaseRequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "UangMukaStatus" AS ENUM ('PENDING', 'DISBURSED', 'SETTLED', 'REJECTED');

-- CreateTable
CREATE TABLE "PurchaseRequest" (
    "id" TEXT NOT NULL,
    "nomorPr" TEXT NOT NULL,
    "tanggalPr" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "keterangan" TEXT,
    "status" "PurchaseRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "projectId" TEXT NOT NULL,
    "karyawanId" TEXT NOT NULL,
    "spkId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequestDetail" (
    "id" TEXT NOT NULL,
    "purchaseRequestId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "projectBudgetId" TEXT NOT NULL,
    "jumlah" DECIMAL(10,2) NOT NULL,
    "satuan" TEXT NOT NULL,
    "estimasiHargaSatuan" DECIMAL(19,2) NOT NULL,
    "estimasiTotalHarga" DECIMAL(19,2) NOT NULL,
    "catatanItem" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseRequestDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UangMuka" (
    "id" TEXT NOT NULL,
    "nomor" TEXT NOT NULL,
    "tanggalPengajuan" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tanggalPencairan" TIMESTAMP(3),
    "jumlah" DECIMAL(19,2) NOT NULL,
    "keterangan" TEXT,
    "status" "UangMukaStatus" NOT NULL DEFAULT 'PENDING',
    "purchaseRequestId" TEXT,
    "karyawanId" TEXT NOT NULL,
    "spkId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UangMuka_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pertanggungjawaban" (
    "id" TEXT NOT NULL,
    "nomor" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalBiaya" DECIMAL(19,2) NOT NULL,
    "sisaUangDikembalikan" DECIMAL(19,2) NOT NULL,
    "keterangan" TEXT,
    "uangMukaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pertanggungjawaban_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RincianPertanggungjawaban" (
    "id" TEXT NOT NULL,
    "pertanggungjawabanId" TEXT NOT NULL,
    "tanggalTransaksi" TIMESTAMP(3) NOT NULL,
    "keterangan" TEXT NOT NULL,
    "jumlah" DECIMAL(19,2) NOT NULL,
    "nomorBukti" TEXT,
    "purchaseRequestDetailId" TEXT,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RincianPertanggungjawaban_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseRequest_nomorPr_key" ON "PurchaseRequest"("nomorPr");

-- CreateIndex
CREATE UNIQUE INDEX "UangMuka_nomor_key" ON "UangMuka"("nomor");

-- CreateIndex
CREATE UNIQUE INDEX "UangMuka_purchaseRequestId_key" ON "UangMuka"("purchaseRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "Pertanggungjawaban_nomor_key" ON "Pertanggungjawaban"("nomor");

-- CreateIndex
CREATE UNIQUE INDEX "Pertanggungjawaban_uangMukaId_key" ON "Pertanggungjawaban"("uangMukaId");

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_karyawanId_fkey" FOREIGN KEY ("karyawanId") REFERENCES "Karyawan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_spkId_fkey" FOREIGN KEY ("spkId") REFERENCES "SPK"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequestDetail" ADD CONSTRAINT "PurchaseRequestDetail_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequestDetail" ADD CONSTRAINT "PurchaseRequestDetail_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequestDetail" ADD CONSTRAINT "PurchaseRequestDetail_projectBudgetId_fkey" FOREIGN KEY ("projectBudgetId") REFERENCES "ProjectBudget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UangMuka" ADD CONSTRAINT "UangMuka_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UangMuka" ADD CONSTRAINT "UangMuka_karyawanId_fkey" FOREIGN KEY ("karyawanId") REFERENCES "Karyawan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UangMuka" ADD CONSTRAINT "UangMuka_spkId_fkey" FOREIGN KEY ("spkId") REFERENCES "SPK"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pertanggungjawaban" ADD CONSTRAINT "Pertanggungjawaban_uangMukaId_fkey" FOREIGN KEY ("uangMukaId") REFERENCES "UangMuka"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RincianPertanggungjawaban" ADD CONSTRAINT "RincianPertanggungjawaban_pertanggungjawabanId_fkey" FOREIGN KEY ("pertanggungjawabanId") REFERENCES "Pertanggungjawaban"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RincianPertanggungjawaban" ADD CONSTRAINT "RincianPertanggungjawaban_purchaseRequestDetailId_fkey" FOREIGN KEY ("purchaseRequestDetailId") REFERENCES "PurchaseRequestDetail"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RincianPertanggungjawaban" ADD CONSTRAINT "RincianPertanggungjawaban_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
