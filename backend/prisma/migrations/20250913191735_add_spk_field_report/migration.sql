-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('BEFORE_START', 'PROGRESS', 'FINAL');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "SPKFieldReport" (
    "id" TEXT NOT NULL,
    "spkId" TEXT NOT NULL,
    "karyawanId" TEXT NOT NULL,
    "type" "ReportType" NOT NULL DEFAULT 'PROGRESS',
    "note" TEXT,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SPKFieldReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SPKFieldReportPhoto" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SPKFieldReportPhoto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SPKFieldReport" ADD CONSTRAINT "SPKFieldReport_spkId_fkey" FOREIGN KEY ("spkId") REFERENCES "SPK"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SPKFieldReport" ADD CONSTRAINT "SPKFieldReport_karyawanId_fkey" FOREIGN KEY ("karyawanId") REFERENCES "Karyawan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SPKFieldReportPhoto" ADD CONSTRAINT "SPKFieldReportPhoto_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "SPKFieldReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
