-- CreateEnum
CREATE TYPE "StatusRincianPj" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REVISION');

-- CreateEnum
CREATE TYPE "JenisPembayaran" AS ENUM ('CASH', 'TRANSFER', 'DEBIT', 'CREDIT_CARD', 'QRIS');

-- AlterTable
ALTER TABLE "Pertanggungjawaban" ADD COLUMN     "status" "StatusRincianPj" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "RincianPertanggungjawaban" ADD COLUMN     "jenisPembayaran" "JenisPembayaran" NOT NULL DEFAULT 'CASH';

-- CreateTable
CREATE TABLE "FotoBuktiPertanggungjawaban" (
    "id" TEXT NOT NULL,
    "rincianPjId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FotoBuktiPertanggungjawaban_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FotoBuktiPertanggungjawaban" ADD CONSTRAINT "FotoBuktiPertanggungjawaban_rincianPjId_fkey" FOREIGN KEY ("rincianPjId") REFERENCES "RincianPertanggungjawaban"("id") ON DELETE CASCADE ON UPDATE CASCADE;
