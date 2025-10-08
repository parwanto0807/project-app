-- CreateEnum
CREATE TYPE "CostType" AS ENUM ('MATERIAL', 'LABOR', 'OTHER');

-- CreateEnum
CREATE TYPE "RABStatus" AS ENUM ('DRAFT', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "RAB" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" "RABStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "RAB_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RABDetail" (
    "id" TEXT NOT NULL,
    "rabId" TEXT NOT NULL,
    "productId" TEXT,
    "description" TEXT,
    "qty" DECIMAL(65,30) NOT NULL,
    "unit" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "costType" "CostType" NOT NULL DEFAULT 'MATERIAL',
    "notes" TEXT,

    CONSTRAINT "RABDetail_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RAB" ADD CONSTRAINT "RAB_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RAB" ADD CONSTRAINT "RAB_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RABDetail" ADD CONSTRAINT "RABDetail_rabId_fkey" FOREIGN KEY ("rabId") REFERENCES "RAB"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RABDetail" ADD CONSTRAINT "RABDetail_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
