-- CreateTable
CREATE TABLE "SPK" (
    "id" TEXT NOT NULL,
    "spkNumber" TEXT NOT NULL,
    "spkDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "teamId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SPK_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SPKDetail" (
    "id" TEXT NOT NULL,
    "spkId" TEXT NOT NULL,
    "karyawanId" TEXT,
    "salesOrderItemId" TEXT,
    "lokasiUnit" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SPKDetail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SPK_spkNumber_key" ON "SPK"("spkNumber");

-- AddForeignKey
ALTER TABLE "SPK" ADD CONSTRAINT "SPK_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Karyawan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SPK" ADD CONSTRAINT "SPK_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SPK" ADD CONSTRAINT "SPK_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SPKDetail" ADD CONSTRAINT "SPKDetail_spkId_fkey" FOREIGN KEY ("spkId") REFERENCES "SPK"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SPKDetail" ADD CONSTRAINT "SPKDetail_karyawanId_fkey" FOREIGN KEY ("karyawanId") REFERENCES "Karyawan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SPKDetail" ADD CONSTRAINT "SPKDetail_salesOrderItemId_fkey" FOREIGN KEY ("salesOrderItemId") REFERENCES "SalesOrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
