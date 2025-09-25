-- CreateEnum
CREATE TYPE "BAPStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'APPROVED');

-- CreateTable
CREATE TABLE "BAP" (
    "id" TEXT NOT NULL,
    "bapNumber" TEXT NOT NULL,
    "bapDate" TIMESTAMP(3) NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workDescription" TEXT,
    "location" TEXT,
    "status" "BAPStatus" NOT NULL DEFAULT 'DRAFT',
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BAP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BAPPhoto" (
    "id" TEXT NOT NULL,
    "bapId" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BAPPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BAP_bapNumber_key" ON "BAP"("bapNumber");

-- CreateIndex
CREATE INDEX "BAP_salesOrderId_idx" ON "BAP"("salesOrderId");

-- CreateIndex
CREATE INDEX "BAP_bapNumber_idx" ON "BAP"("bapNumber");

-- CreateIndex
CREATE INDEX "BAP_status_idx" ON "BAP"("status");

-- CreateIndex
CREATE INDEX "BAPPhoto_bapId_idx" ON "BAPPhoto"("bapId");

-- AddForeignKey
ALTER TABLE "BAP" ADD CONSTRAINT "BAP_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BAP" ADD CONSTRAINT "BAP_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BAPPhoto" ADD CONSTRAINT "BAPPhoto_bapId_fkey" FOREIGN KEY ("bapId") REFERENCES "BAP"("id") ON DELETE CASCADE ON UPDATE CASCADE;
