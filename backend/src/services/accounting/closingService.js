import { prisma } from '../../config/db.js';

class ClosingService {
    /**
     * Validasi data sebelum tutup buku
     */
    async validatePreClosing(periodId) {
        const period = await prisma.accountingPeriod.findUnique({
            where: { id: periodId }
        });

        if (!period) throw new Error("Periode tidak ditemukan");

        const dateFilter = {
            gte: period.startDate,
            lte: period.endDate
        };

        // 1. Cek Ledger Draft
        const draftLedgers = await prisma.ledger.count({
            where: {
                periodId: periodId,
                status: 'DRAFT'
            }
        });

        // 2. Cek Dokumen Sumber yang masih DRAFT/PENDING
        const draftInvoices = await prisma.invoice.count({
            where: {
                invoiceDate: dateFilter,
                status: { in: ['DRAFT', 'WAITING_APPROVAL'] }
            }
        });

        const draftOpEx = await prisma.operationalExpense.count({
            where: {
                date: dateFilter,
                status: { in: ['DRAFT', 'PENDING_APPROVAL'] }
            }
        });

        const draftProjectEx = await prisma.projectExpense.count({
            where: {
                expenseDate: dateFilter,
                status: { in: ['DRAFT', 'PENDING_APPROVAL'] }
            }
        });

        const draftPurchaseOrders = await prisma.purchaseOrder.count({
            where: {
                orderDate: dateFilter,
                status: { in: ['DRAFT', 'PENDING_APPROVAL'] }
            }
        });

        // 3. Cek Balance (Total Debit vs Total Credit)
        const balanceCheck = await prisma.ledgerLine.aggregate({
            where: {
                ledger: { periodId: periodId, status: 'POSTED' }
            },
            _sum: {
                debitAmount: true,
                creditAmount: true
            }
        });

        const totalDebit = balanceCheck._sum.debitAmount || 0;
        const totalCredit = balanceCheck._sum.creditAmount || 0;
        const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

        const totalDrafts = draftLedgers + draftInvoices + draftOpEx + draftProjectEx + draftPurchaseOrders;

        return {
            success: isBalanced && totalDrafts === 0,
            summary: {
                draftLedgers,
                draftInvoices,
                draftExpenses: draftOpEx + draftProjectEx,
                draftPurchaseOrders,
                totalDebit,
                totalCredit,
                isBalanced
            }
        };
    }

    /**
     * Proses Tutup Buku
     */
    async performClosing(periodId, userId, autoCreateNext = false) {
        const validation = await this.validatePreClosing(periodId);
        
        if (!validation.success) {
            throw new Error("Gagal Tutup Buku: Masih ada dokumen DRAFT atau Jurnal tidak balance.");
        }

        const period = await prisma.accountingPeriod.findUnique({
            where: { id: periodId }
        });

        return await prisma.$transaction(async (tx) => {
            // Find or create next period
            let nextPeriod = await tx.accountingPeriod.findFirst({
                where: {
                    startDate: { gte: period.endDate },
                    id: { not: periodId }
                },
                orderBy: { startDate: 'asc' }
            });

            if (!nextPeriod && autoCreateNext) {
                // Calculate next month
                const nextStart = new Date(period.endDate);
                nextStart.setMilliseconds(nextStart.getMilliseconds() + 1); // 1ms after Jan 31 23:59:59 is Feb 1 00:00:00
                
                const nextEnd = new Date(nextStart.getFullYear(), nextStart.getMonth() + 1, 0, 23, 59, 59, 999);
                
                const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
                const nextMonthIndex = nextStart.getMonth();
                const nextYear = nextStart.getFullYear();
                
                const nextPeriodCode = `${String(nextMonthIndex + 1).padStart(2, '0')}${nextYear}`;
                const nextPeriodName = `${monthNames[nextMonthIndex]}-${nextYear}`;

                nextPeriod = await tx.accountingPeriod.create({
                    data: {
                        periodCode: nextPeriodCode,
                        periodName: nextPeriodName,
                        startDate: nextStart,
                        endDate: nextEnd,
                        fiscalYear: nextYear,
                        periodMonth: nextMonthIndex + 1,
                        quarter: Math.ceil((nextMonthIndex + 1) / 3),
                        isClosed: false
                    }
                });
            }

            // 1. Hitung Saldo Akhir semua COA untuk periode ini
            const coas = await tx.chartOfAccounts.findMany({
                where: { postingType: 'POSTING' }
            });

            for (const coa of coas) {
                // Hitung mutasi debit/credit di periode ini
                const mutation = await tx.ledgerLine.aggregate({
                    where: {
                        coaId: coa.id,
                        ledger: { periodId: periodId, status: 'POSTED' }
                    },
                    _sum: {
                        debitAmount: true,
                        creditAmount: true
                    }
                });

                const periodDebit = mutation._sum.debitAmount || 0;
                const periodCredit = mutation._sum.creditAmount || 0;

                // Ambil saldo awal (opening) periode ini
                const currentTB = await tx.trialBalance.findUnique({
                    where: { periodId_coaId: { periodId, coaId: coa.id } }
                });

                const openingDebit = currentTB?.openingDebit || 0;
                const openingCredit = currentTB?.openingCredit || 0;

                // Hitung Saldo Akhir
                // Formula: (Open + Period) - Other side
                let endingDebit = 0;
                let endingCredit = 0;

                const netDebit = (openingDebit + periodDebit);
                const netCredit = (openingCredit + periodCredit);

                if (coa.normalBalance === 'DEBIT') {
                    endingDebit = netDebit - netCredit;
                    if (endingDebit < 0) {
                        endingCredit = Math.abs(endingDebit);
                        endingDebit = 0;
                    }
                } else {
                    endingCredit = netCredit - netDebit;
                    if (endingCredit < 0) {
                        endingDebit = Math.abs(endingCredit);
                        endingCredit = 0;
                    }
                }

                // Update TrialBalance periode ini (Final Seal)
                await tx.trialBalance.upsert({
                    where: { periodId_coaId: { periodId, coaId: coa.id } },
                    update: {
                        periodDebit,
                        periodCredit,
                        endingDebit,
                        endingCredit,
                        calculatedAt: new Date()
                    },
                    create: {
                        periodId,
                        coaId: coa.id,
                        openingDebit,
                        openingCredit,
                        periodDebit,
                        periodCredit,
                        endingDebit,
                        endingCredit,
                        calculatedAt: new Date()
                    }
                });

                // Roll-over ke periode berikutnya jika ada
                if (nextPeriod) {
                    await tx.trialBalance.upsert({
                        where: { periodId_coaId: { periodId: nextPeriod.id, coaId: coa.id } },
                        update: {
                            openingDebit: endingDebit,
                            openingCredit: endingCredit,
                            calculatedAt: new Date()
                        },
                        create: {
                            periodId: nextPeriod.id,
                            coaId: coa.id,
                            openingDebit: endingDebit,
                            openingCredit: endingCredit,
                            periodDebit: 0,
                            periodCredit: 0,
                            endingDebit: 0,
                            endingCredit: 0,
                            calculatedAt: new Date()
                        }
                    });
                }
            }

            // 2. Tandai periode sebagai CLOSED
            const updatedPeriod = await tx.accountingPeriod.update({
                where: { id: periodId },
                data: {
                    isClosed: true,
                    closedAt: new Date(),
                    closedBy: userId || 'System'
                }
            });

            return updatedPeriod;
        });
    }
}

export default new ClosingService();
