import { prisma } from '../../config/db.js';
import { updateTrialBalance, updateGeneralLedgerSummary } from '../accounting/financialSummaryService.js';

/**
 * Service untuk Fund Transfer (Antar Bank/Kas)
 */

export const fundTransferService = {
    // 1. Generate Transfer Number (TRF/YYYY/MM/XXXX)
    async generateTransferNo() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const prefix = `TRF/${year}/${month}/`;

        const lastTransfer = await prisma.fundTransfer.findFirst({
            where: { transferNo: { startsWith: prefix } },
            orderBy: { transferNo: 'desc' }
        });

        let nextNum = 1;
        if (lastTransfer) {
            const lastNum = parseInt(lastTransfer.transferNo.split('/').pop());
            nextNum = lastNum + 1;
        }

        return `${prefix}${String(nextNum).padStart(4, '0')}`;
    },

    // 2. Create Fund Transfer & Post to Ledger (Atomic)
    async createTransfer(data, userId) {
        return await prisma.$transaction(async (tx) => {
            // A. Get Active Period
            const period = await tx.accountingPeriod.findFirst({
                where: {
                    startDate: { lte: new Date(data.transferDate) },
                    endDate: { gte: new Date(data.transferDate) },
                    isClosed: false
                }
            });

            if (!period) throw new Error("No active accounting period found for this date.");

            // B. Generate No
            const transferNo = await this.generateTransferNo();
            const totalAmount = Number(data.amount) + Number(data.feeAmount || 0);

            // C. Create Jurnal (Ledger Header)
            const ledger = await tx.ledger.create({
                data: {
                    ledgerNumber: `JV-TRF-${transferNo.replace(/\//g, '-')}`,
                    referenceNumber: transferNo,
                    referenceType: 'JOURNAL',
                    transactionDate: new Date(data.transferDate),
                    postingDate: new Date(),
                    description: `Fund Transfer: ${data.notes || 'Internal Transfer'}`,
                    periodId: period.id,
                    status: 'POSTED',
                    createdBy: userId,
                    postedBy: userId,
                    postedAt: new Date()
                }
            });

            // D. Create Ledger Lines (Accounting Rules)
            const ledgerLines = [
                // 1. Debit Akun Tujuan (Uang Masuk)
                {
                    ledgerId: ledger.id,
                    coaId: data.toAccountId,
                    lineNumber: 1,
                    description: `Transfer in from ${data.fromAccountName}`,
                    debitAmount: Number(data.amount),
                    creditAmount: 0,
                    localAmount: Number(data.amount)
                },
                // 2. Credit Akun Sumber (Uang Keluar)
                {
                    ledgerId: ledger.id,
                    coaId: data.fromAccountId,
                    lineNumber: 2,
                    description: `Transfer out to ${data.toAccountName}`,
                    debitAmount: 0,
                    creditAmount: totalAmount,
                    localAmount: -totalAmount
                }
            ];

            // 3. Optional: Debit Akun Biaya Admin (Jika ada fee)
            if (Number(data.feeAmount) > 0 && data.feeAccountId) {
                ledgerLines.push({
                    ledgerId: ledger.id,
                    coaId: data.feeAccountId,
                    lineNumber: 3,
                    description: `Bank admin fee for ${transferNo}`,
                    debitAmount: Number(data.feeAmount),
                    creditAmount: 0,
                    localAmount: Number(data.feeAmount)
                });
            }

            await tx.ledgerLine.createMany({ data: ledgerLines });

            // E. Create Fund Transfer Record
            const fundTransfer = await tx.fundTransfer.create({
                data: {
                    transferNo,
                    transferDate: new Date(data.transferDate),
                    amount: data.amount,
                    feeAmount: data.feeAmount || 0,
                    totalAmount: totalAmount,
                    fromAccountId: data.fromAccountId,
                    toAccountId: data.toAccountId,
                    feeAccountId: data.feeAccountId || null,
                    referenceNo: data.referenceNo,
                    notes: data.notes,
                    status: 'POSTED',
                    ledgerId: ledger.id,
                    periodId: period.id,
                    createdById: userId
                }
            });

            // F. Update Financial Summaries (Trial Balance & GL Summary)
            for (const line of ledgerLines) {
                await updateTrialBalance({
                    periodId: period.id,
                    coaId: line.coaId,
                    debitAmount: line.debitAmount,
                    creditAmount: line.creditAmount,
                    tx
                });

                await updateGeneralLedgerSummary({
                    coaId: line.coaId,
                    periodId: period.id,
                    date: new Date(data.transferDate),
                    debitAmount: line.debitAmount,
                    creditAmount: line.creditAmount,
                    tx
                });
            }

            return fundTransfer;
        });
    }
};
