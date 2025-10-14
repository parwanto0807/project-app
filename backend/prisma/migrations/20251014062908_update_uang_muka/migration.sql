-- CreateEnum
CREATE TYPE "MetodePembayaran" AS ENUM ('CASH', 'BANK_TRANSFER', 'E_WALLET');

-- AlterTable
ALTER TABLE "UangMuka" ADD COLUMN     "metodePencairan" "MetodePembayaran",
ADD COLUMN     "namaBankTujuan" TEXT,
ADD COLUMN     "namaEwalletTujuan" TEXT,
ADD COLUMN     "nomorRekeningTujuan" TEXT;
