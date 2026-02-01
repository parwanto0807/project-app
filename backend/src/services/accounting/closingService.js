import { prisma } from '../../config/db.js';
import financialSummaryService from './financialSummaryService.js';

class ClosingService {
    /**
     * Helper: Get System Account by Key
     */
    async getSystemAccount(tx, key) {
        const systemAccount = await tx.systemAccount.findUnique({
            where: { key },
            include: { coa: true }
        });

        if (!systemAccount || !systemAccount.coa) {
            throw new Error(`System account mapping '${key}' not found. Please configure in System Account Mapping (Audit/Settings).`);
        }

        return systemAccount.coa;
    }

    /**
     * Helper: Get Jakarta Date Components (UTC+7)
     */
    getJakartaComponents(dateInput) {
        const date = new Date(dateInput);
        const shifted = new Date(date.getTime() + (7 * 60 * 60 * 1000));
        return {
            year: shifted.getUTCFullYear(),
            month: shifted.getUTCMonth() + 1,
            day: shifted.getUTCDate(),
            hours: shifted.getUTCHours()
        };
    }

    /**
     * Helper: Generate Adjustment Ledger Number
     */
    async generateAdjustmentLedgerNumber(tx, date) {
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const prefix = `JV-ADJ-STK-${dateStr}`;
        
        const latestLedger = await tx.ledger.findFirst({
            where: { ledgerNumber: { startsWith: prefix } },
            orderBy: { ledgerNumber: 'desc' },
            select: { ledgerNumber: true }
        });

        let nextSequence = 1;
        if (latestLedger) {
            const parts = latestLedger.ledgerNumber.split('-');
            const lastSequence = parseInt(parts[parts.length - 1]);
            if (!isNaN(lastSequence)) nextSequence = lastSequence + 1;
        }

        return `${prefix}-${String(nextSequence).padStart(4, '0')}`;
    }

    async rolloverTrialBalances(tx, currentPeriodId, nextPeriodId) {
        console.log(`[CLOSING] Rolling over Trial Balances from ${currentPeriodId} to ${nextPeriodId}...`);

        const currentPeriod = await tx.accountingPeriod.findUnique({ where: { id: currentPeriodId } });
        const nextPeriod = await tx.accountingPeriod.findUnique({ where: { id: nextPeriodId } });
        
        const isFiscalYearReset = currentPeriod.fiscalYear !== nextPeriod.fiscalYear;

        // Get all accounts that have balances
        const currentTBs = await tx.trialBalance.findMany({
            where: { periodId: currentPeriodId },
            include: { coa: true }
        });

        for (const tb of currentTBs) {
            let openingDebit = Number(tb.endingDebit);
            let openingCredit = Number(tb.endingCredit);
            
            const isNominalAccount = ['REVENUE', 'EXPENSE', 'HPP', 'OTHER_INCOME', 'OTHER_EXPENSE'].includes(tb.coa.type);
            
            if (isFiscalYearReset && isNominalAccount) {
                 openingDebit = 0;
                 openingCredit = 0;
            }

            // Upsert ke Next Period
            const existingNext = await tx.trialBalance.findUnique({
                where: { periodId_coaId: { periodId: nextPeriodId, coaId: tb.coaId } }
            });

            if (existingNext) {
                const currentPeriodD = Number(existingNext.periodDebit);
                const currentPeriodC = Number(existingNext.periodCredit);
                
                const totalD = openingDebit + currentPeriodD;
                const totalC = openingCredit + currentPeriodC;
                
                let endD = 0, endC = 0;
                if (tb.coa.normalBalance === 'DEBIT') {
                    const net = totalD - totalC;
                    if (net >= 0) endD = net; else endC = Math.abs(net);
                } else {
                    const net = totalC - totalD;
                    if (net >= 0) endC = net; else endD = Math.abs(net);
                }

                await tx.trialBalance.update({
                    where: { id: existingNext.id },
                    data: {
                        openingDebit: openingDebit,
                        openingCredit: openingCredit,
                        endingDebit: endD,
                        endingCredit: endC,
                        calculatedAt: new Date()
                    }
                });
            } else {
                await tx.trialBalance.create({
                    data: {
                        periodId: nextPeriodId,
                        coaId: tb.coaId,
                        openingDebit: openingDebit,
                        openingCredit: openingCredit,
                        periodDebit: 0,
                        periodCredit: 0,
                        endingDebit: openingDebit,
                        endingCredit: openingCredit,
                        currency: 'IDR',
                        calculatedAt: new Date()
                    }
                });
            }
        }
    }

    async rolloverTrialBalances(tx, currentPeriodId, nextPeriodId) {
        console.log(`[CLOSING] Rolling over Trial Balances from ${currentPeriodId} to ${nextPeriodId}...`);

        const currentPeriod = await tx.accountingPeriod.findUnique({ where: { id: currentPeriodId } });
        const nextPeriod = await tx.accountingPeriod.findUnique({ where: { id: nextPeriodId } });
        
        const isFiscalYearReset = currentPeriod.fiscalYear !== nextPeriod.fiscalYear;

        // Get all accounts that have balances
        const currentTBs = await tx.trialBalance.findMany({
            where: { periodId: currentPeriodId },
            include: { coa: true }
        });

        for (const tb of currentTBs) {
            let openingDebit = Number(tb.endingDebit);
            let openingCredit = Number(tb.endingCredit);
            
            const isNominalAccount = ['REVENUE', 'EXPENSE', 'HPP', 'OTHER_INCOME', 'OTHER_EXPENSE'].includes(tb.coa.type);
            
            if (isFiscalYearReset && isNominalAccount) {
                 openingDebit = 0;
                 openingCredit = 0;
            }

            // Upsert ke Next Period
            const existingNext = await tx.trialBalance.findUnique({
                where: { periodId_coaId: { periodId: nextPeriodId, coaId: tb.coaId } }
            });

            if (existingNext) {
                const currentPeriodD = Number(existingNext.periodDebit);
                const currentPeriodC = Number(existingNext.periodCredit);
                
                const totalD = openingDebit + currentPeriodD;
                const totalC = openingCredit + currentPeriodC;
                
                let endD = 0, endC = 0;
                if (tb.coa.normalBalance === 'DEBIT') {
                    const net = totalD - totalC;
                    if (net >= 0) endD = net; else endC = Math.abs(net);
                } else {
                    const net = totalC - totalD;
                    if (net >= 0) endC = net; else endD = Math.abs(net);
                }

                await tx.trialBalance.update({
                    where: { id: existingNext.id },
                    data: {
                        openingDebit: openingDebit,
                        openingCredit: openingCredit,
                        endingDebit: endD,
                        endingCredit: endC,
                        calculatedAt: new Date()
                    }
                });
            } else {
                await tx.trialBalance.create({
                    data: {
                        periodId: nextPeriodId,
                        coaId: tb.coaId,
                        openingDebit: openingDebit,
                        openingCredit: openingCredit,
                        periodDebit: 0,
                        periodCredit: 0,
                        endingDebit: openingDebit,
                        endingCredit: openingCredit,
                        currency: 'IDR',
                        calculatedAt: new Date()
                    }
                });
            }
        }
    }

    /**
     * Rekonsiliasi Nilai Inventaris (Sub-ledger vs GL)
     */
    async reconcileInventoryValues(tx, periodId, userId, periodStart) {
        const adjustmentAccount = await this.getSystemAccount(tx, 'INVENTORY_ADJUSTMENT_ACCOUNT');
        const warehouses = await tx.warehouse.findMany({
            where: { inventoryAccountId: { not: null } },
            include: { inventoryAccount: true }
        });

        for (const warehouse of warehouses) {
            // 1. Hitung total nilai di Sub-ledger (StockBalance)
            const subLedgerValue = await tx.stockBalance.aggregate({
                where: {
                    warehouseId: warehouse.id,
                    period: periodStart
                },
                _sum: { inventoryValue: true }
            });

            const totalSubLedger = Number(subLedgerValue._sum.inventoryValue || 0);

            // 2. Ambil saldo di GL (TrialBalance)
            const trialBalance = await tx.trialBalance.findUnique({
                where: {
                    periodId_coaId: {
                        periodId,
                        coaId: warehouse.inventoryAccountId
                    }
                }
            });

            // Hitung ending balance GL secara manual (Open + Period) 
            // Jangan hanya pakai 'endingDebit' karena bisa saja record baru di-upsert (0) saat rollover
            const opening = trialBalance ? (Number(trialBalance.openingDebit) - Number(trialBalance.openingCredit)) : 0;
            const periodMutation = trialBalance ? (Number(trialBalance.periodDebit) - Number(trialBalance.periodCredit)) : 0;
            const currentGLValue = opening + periodMutation;
            
            const diff = totalSubLedger - currentGLValue;

            if (Math.abs(diff) > 0.01) {
                // Buat Jurnal Penyesuaian
                const ledgerNumber = await this.generateAdjustmentLedgerNumber(tx, new Date());
                const description = `Stock Recon - ${warehouse.name} (Sub-ledger: ${totalSubLedger.toLocaleString()}, GL: ${currentGLValue.toLocaleString()}, Adj: ${diff.toLocaleString()})`;

                const ledger = await tx.ledger.create({
                    data: {
                        ledgerNumber,
                        referenceNumber: `RECON-${warehouse.code}`,
                        referenceType: 'ADJUSTMENT',
                        transactionDate: periodStart,
                        postingDate: periodStart,
                        description,
                        periodId,
                        status: 'POSTED',
                        createdBy: userId || 'System',
                        postedBy: userId || 'System',
                        postedAt: new Date()
                    }
                });

                const lines = [];
                // Line 1: Warehouse Inventory Account
                lines.push({
                    ledgerId: ledger.id,
                    coaId: warehouse.inventoryAccountId,
                    debitAmount: diff > 0 ? diff : 0,
                    creditAmount: diff < 0 ? Math.abs(diff) : 0,
                    localAmount: diff,
                    lineNumber: 1,
                    description: `Adjustment to match actual inventory value`
                });

                // Line 2: Adjustment Account (Contra)
                lines.push({
                    ledgerId: ledger.id,
                    coaId: adjustmentAccount.id,
                    debitAmount: diff < 0 ? Math.abs(diff) : 0,
                    creditAmount: diff > 0 ? diff : 0,
                    localAmount: -diff,
                    lineNumber: 2,
                    description: `Inventory discrepancy offsets`
                });

                await tx.ledgerLine.createMany({ data: lines });

                // Update Trial Balance & GL Summary
                for (const line of lines) {
                    await financialSummaryService.updateTrialBalance({
                        periodId,
                        coaId: line.coaId,
                        debitAmount: line.debitAmount,
                        creditAmount: line.creditAmount,
                        tx
                    });
                    await financialSummaryService.updateGeneralLedgerSummary({
                        coaId: line.coaId,
                        periodId,
                        date: periodStart,
                        debitAmount: line.debitAmount,
                        creditAmount: line.creditAmount,
                        tx
                    });
                }
            }
        }
    }
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
            // 0. Identify Dates for StockBalance
            const startComp = this.getJakartaComponents(period.startDate);
            const periodStart = new Date(Date.UTC(startComp.year, startComp.month - 1, startComp.day, 0, 0, 0, 0));

            console.log('[CLOSING] Period Start (UTC-anchored):', periodStart.toISOString());

            // Find or create next period
            let nextPeriod = await tx.accountingPeriod.findFirst({
                where: {
                    startDate: { gte: period.endDate },
                    id: { not: periodId }
                },
                orderBy: { startDate: 'asc' }
            });

            if (!nextPeriod && autoCreateNext) {
                // Calculate next month using Jakarta components
                const nextStart = new Date(new Date(period.endDate).getTime() + 1);
                const nextComp = this.getJakartaComponents(nextStart);
                
                // End of next month in Jakarta time
                // next month = nextComp.month (1-indexed)
                // date 0 of month + 2 is end of month + 1
                const day0 = new Date(Date.UTC(nextComp.year, nextComp.month, 0));
                const nextEnd = new Date(Date.UTC(nextComp.year, nextComp.month - 1, day0.getUTCDate(), 16, 59, 59, 999));
                
                const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
                const nextYear = nextComp.year;
                const nextMonthIndex = nextComp.month - 1;
                
                const nextPeriodCode = `${String(nextComp.month).padStart(2, '0')}${nextYear}`;
                const nextPeriodName = `${monthNames[nextMonthIndex]}-${nextYear}`;

                nextPeriod = await tx.accountingPeriod.create({
                    data: {
                        periodCode: nextPeriodCode,
                        periodName: nextPeriodName,
                        startDate: nextStart,
                        endDate: nextEnd,
                        fiscalYear: nextYear,
                        periodMonth: nextComp.month,
                        quarter: Math.ceil(nextComp.month / 3),
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
                    // Check if it's a new fiscal year
                    const isNewFiscalYear = nextPeriod.fiscalYear !== period.fiscalYear;
                    const isIncomeStatementAccount = ['PENDAPATAN', 'HPP', 'BEBAN'].includes(coa.type);
                    
                    // Reset IS accounts to zero at year-end rollover
                    const rolloverDebit = (isNewFiscalYear && isIncomeStatementAccount) ? 0 : endingDebit;
                    const rolloverCredit = (isNewFiscalYear && isIncomeStatementAccount) ? 0 : endingCredit;

                    await tx.trialBalance.upsert({
                        where: { periodId_coaId: { periodId: nextPeriod.id, coaId: coa.id } },
                        update: {
                            openingDebit: rolloverDebit,
                            openingCredit: rolloverCredit,
                            calculatedAt: new Date()
                        },
                        create: {
                            periodId: nextPeriod.id,
                            coaId: coa.id,
                            openingDebit: rolloverDebit,
                            openingCredit: rolloverCredit,
                            periodDebit: 0,
                            periodCredit: 0,
                            endingDebit: 0,
                            endingCredit: 0,
                            calculatedAt: new Date()
                        }
                    });
                }
            }

            // 1.5. Rollover StockBalance
            let nextPeriodStart = null;
            if (nextPeriod) {
                const nextComp = this.getJakartaComponents(nextPeriod.startDate);
                nextPeriodStart = new Date(Date.UTC(nextComp.year, nextComp.month - 1, nextComp.day, 0, 0, 0, 0));
            }

            console.log('[CLOSING] Next Period:', nextPeriod ? nextPeriod.periodName : 'NONE');
            console.log('[CLOSING] Next Period Start:', nextPeriodStart);

            if (nextPeriodStart) {
                // A. Hapus "data stock sampah" di periode berikutnya
                // Sampah = data yang tidak ada mutasi (stockIn/Out/JustIn/Out = 0) tapi sudah terlanjur dibuat
                await tx.stockBalance.deleteMany({
                    where: {
                        period: nextPeriodStart,
                        stockIn: 0,
                        stockOut: 0,
                        justIn: 0,
                        justOut: 0
                    }
                });

                // B. Rollover semua stok aktif bulan ini
                const currentStockBalances = await tx.stockBalance.findMany({
                    where: { period: periodStart }
                });

                console.log(`[CLOSING] Found ${currentStockBalances.length} stock records to rollover from ${period.periodName}`);

                for (const sb of currentStockBalances) {
                    const nextSB = await tx.stockBalance.findUnique({
                        where: {
                            productId_warehouseId_period: {
                                productId: sb.productId,
                                warehouseId: sb.warehouseId,
                                period: nextPeriodStart
                            }
                        }
                    });

                    const nStockAwal = Number(sb.stockAkhir);
                    const nOnPR = Number(sb.onPR);
                    const nBooked = Number(sb.bookedStock);
                    const nValue = Number(sb.inventoryValue);

                    if (nextSB) {
                        // Jika sudah ada, kita perlu recalculate semua field
                        // Karena ini bisa jadi re-close, kita harus SET ulang, bukan INCREMENT
                        
                        const oldStockAwal = Number(nextSB.stockAwal);
                        const diffStock = nStockAwal - oldStockAwal;
                        
                        // Hitung mutasi yang sudah terjadi di periode berikutnya
                        const nextStockIn = Number(nextSB.stockIn);
                        const nextStockOut = Number(nextSB.stockOut);
                        const nextJustIn = Number(nextSB.justIn);
                        const nextJustOut = Number(nextSB.justOut);
                        
                        // Stock Akhir = Stock Awal (baru) + Mutasi periode berikutnya
                        const newStockAkhir = nStockAwal + nextStockIn - nextStockOut + nextJustIn - nextJustOut;
                        
                        // Available Stock = Stock Akhir - Booked Stock
                        const newAvailableStock = newStockAkhir - nBooked;

                        await tx.stockBalance.update({
                            where: { id: nextSB.id },
                            data: {
                                // SET (overwrite) semua field dari periode sebelumnya
                                stockAwal: nStockAwal,
                                onPR: nOnPR,
                                bookedStock: nBooked,
                                inventoryValue: nValue,
                                // Recalculate berdasarkan stock awal baru + mutasi periode ini
                                stockAkhir: newStockAkhir,
                                availableStock: newAvailableStock
                            }
                        });
                    } else {
                        // Create new record untuk periode depan
                        console.log(`[CLOSING] Creating new stock record for Product ${sb.productId}, Warehouse ${sb.warehouseId}`);
                        await tx.stockBalance.create({
                            data: {
                                productId: sb.productId,
                                warehouseId: sb.warehouseId,
                                period: nextPeriodStart,
                                stockAwal: nStockAwal,
                                stockIn: 0,
                                stockOut: 0,
                                justIn: 0,
                                justOut: 0,
                                onPR: nOnPR,
                                bookedStock: nBooked,
                                stockAkhir: nStockAwal,
                                availableStock: nStockAwal - nBooked,
                                inventoryValue: nValue
                            }
                        });
                    }
                }
            }

            // 1.7. Rekonsiliasi Nilai Inventaris ke GL (Target Next Period)
            if (nextPeriod && nextPeriodStart) {
                // 1.7.a First, Rollover Trial Balances to ensure Opening Balances exist!
                await this.rolloverTrialBalances(tx, periodId, nextPeriod.id);

                // 1.7.b Then reconcile next period's opening against the sub-ledger
                await this.reconcileInventoryValues(tx, nextPeriod.id, userId, nextPeriodStart);
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
