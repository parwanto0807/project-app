-- CreateTable
CREATE TABLE "OperationalExpense" (
    "id" TEXT NOT NULL,
    "expenseNumber" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "receiptUrl" TEXT,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "expenseAccountId" TEXT NOT NULL,
    "paidFromAccountId" TEXT,
    "journalEntryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationalExpense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OperationalExpense_expenseNumber_key" ON "OperationalExpense"("expenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "OperationalExpense_journalEntryId_key" ON "OperationalExpense"("journalEntryId");

-- CreateIndex
CREATE INDEX "OperationalExpense_date_idx" ON "OperationalExpense"("date");

-- CreateIndex
CREATE INDEX "OperationalExpense_status_idx" ON "OperationalExpense"("status");

-- AddForeignKey
ALTER TABLE "OperationalExpense" ADD CONSTRAINT "OperationalExpense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalExpense" ADD CONSTRAINT "OperationalExpense_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalExpense" ADD CONSTRAINT "OperationalExpense_expenseAccountId_fkey" FOREIGN KEY ("expenseAccountId") REFERENCES "ChartOfAccounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalExpense" ADD CONSTRAINT "OperationalExpense_paidFromAccountId_fkey" FOREIGN KEY ("paidFromAccountId") REFERENCES "ChartOfAccounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalExpense" ADD CONSTRAINT "OperationalExpense_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

