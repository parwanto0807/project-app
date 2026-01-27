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

    // 2. Create Fund Transfer (DRAFT)
    async createTransfer(data, userId) {
        // Generate No
        const transferNo = await this.generateTransferNo();
        const totalAmount = Number(data.amount) + Number(data.feeAmount || 0);

        return await prisma.fundTransfer.create({
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
                status: 'DRAFT',
                createdById: userId
            }
        });
    },

    // 3. Post Transfer to Ledger (Atomic)
    async postTransfer(id, userId) {
        return await prisma.$transaction(async (tx) => {
            // A. Get Data
            const transfer = await tx.fundTransfer.findUnique({
                where: { id },
                include: {
                    fromAccount: true,
                    toAccount: true,
                    feeAccount: true
                }
            });

            if (!transfer) throw new Error("Transfer not found");
            if (transfer.status !== 'DRAFT') throw new Error("Only DRAFT transfers can be posted");

            // B. Get Active Period
            const period = await tx.accountingPeriod.findFirst({
                where: {
                    startDate: { lte: transfer.transferDate },
                    endDate: { gte: transfer.transferDate },
                    isClosed: false
                }
            });

            if (!period) throw new Error("No active accounting period found for this date.");

            // C. Create Jurnal (Ledger Header)
            const ledger = await tx.ledger.create({
                data: {
                    ledgerNumber: `JV-TRF-${transfer.transferNo.replace(/\//g, '-')}`,
                    referenceNumber: transfer.transferNo,
                    referenceType: 'JOURNAL',
                    transactionDate: transfer.transferDate,
                    postingDate: new Date(),
                    description: `Fund Transfer: ${transfer.notes || 'Internal Transfer'}`,
                    periodId: period.id,
                    status: 'POSTED',
                    createdBy: userId,
                    postedBy: userId,
                    postedAt: new Date()
                }
            });

            // D. Create Ledger Lines
            const ledgerLines = [
                // 1. Debit Akun Tujuan (Uang Masuk)
                {
                    ledgerId: ledger.id,
                    coaId: transfer.toAccountId,
                    lineNumber: 1,
                    description: `Transfer in from ${transfer.fromAccount.name}`,
                    debitAmount: Number(transfer.amount),
                    creditAmount: 0,
                    localAmount: Number(transfer.amount)
                },
                // 2. Credit Akun Sumber (Uang Keluar)
                {
                    ledgerId: ledger.id,
                    coaId: transfer.fromAccountId,
                    lineNumber: 2,
                    description: `Transfer out to ${transfer.toAccount.name}`,
                    debitAmount: 0,
                    creditAmount: Number(transfer.totalAmount),
                    localAmount: -Number(transfer.totalAmount)
                }
            ];

            // 3. Optional: Debit Akun Biaya Admin (Jika ada fee)
            if (Number(transfer.feeAmount) > 0 && transfer.feeAccountId) {
                ledgerLines.push({
                    ledgerId: ledger.id,
                    coaId: transfer.feeAccountId,
                    lineNumber: 3,
                    description: `Bank admin fee for ${transfer.transferNo}`,
                    debitAmount: Number(transfer.feeAmount),
                    creditAmount: 0,
                    localAmount: Number(transfer.feeAmount)
                });
            }

            await tx.ledgerLine.createMany({ data: ledgerLines });

            // E. Update Fund Transfer Record
            const updatedTransfer = await tx.fundTransfer.update({
                where: { id },
                data: {
                    status: 'POSTED',
                    ledgerId: ledger.id,
                    periodId: period.id,
                    approvedById: userId,
                    approvedAt: new Date()
                }
            });

            // F. Update Financial Summaries
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
                    date: transfer.transferDate,
                    debitAmount: line.debitAmount,
                    creditAmount: line.creditAmount,
                    tx
                });
            }

            return updatedTransfer;
        });
    },

    // 4. Update Fund Transfer (Only if DRAFT)
    async updateTransfer(id, data, userId) {
        const transfer = await prisma.fundTransfer.findUnique({ where: { id } });
        if (!transfer) throw new Error("Transfer not found");
        if (transfer.status !== 'DRAFT') throw new Error("Only DRAFT transfers can be updated");

        const totalAmount = Number(data.amount) + Number(data.feeAmount || 0);

        return await prisma.fundTransfer.update({
            where: { id },
            data: {
                transferDate: new Date(data.transferDate),
                amount: data.amount,
                feeAmount: data.feeAmount || 0,
                totalAmount: totalAmount,
                fromAccountId: data.fromAccountId,
                toAccountId: data.toAccountId,
                feeAccountId: data.feeAccountId || null,
                referenceNo: data.referenceNo,
                notes: data.notes,
                // createdById remains the same, but we could track updatedBy if needed
            }
        });
    },

    // 5. Delete Fund Transfer (Only if DRAFT)
    async deleteTransfer(id) {
        const transfer = await prisma.fundTransfer.findUnique({ where: { id } });
        if (!transfer) throw new Error("Transfer not found");
        if (transfer.status !== 'DRAFT') throw new Error("Only DRAFT transfers can be deleted");

        return await prisma.fundTransfer.delete({ where: { id } });
    }
};
