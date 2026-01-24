import { prisma } from "../../config/db.js";

export const staffBalanceController = {
  /**
   * Get all staff balances with pagination and filters
   */
  async getAllStaffBalances(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        category = "",
        sortBy = "updatedAt",
        sortOrder = "desc",
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      // Build where clause
      const where = {};

      // Filter by category if provided
      if (category && category !== "ALL") {
        where.category = category;
      }

      // Search by employee name
      if (search) {
        where.karyawan = {
          namaLengkap: {
            contains: search,
            mode: "insensitive",
          },
        };
      }

      // Query database
      const [staffBalances, totalCount] = await Promise.all([
        prisma.staffBalance.findMany({
          where,
          skip,
          take,
          orderBy: {
            [sortBy]: sortOrder,
          },
          include: {
            karyawan: {
              select: {
                id: true,
                namaLengkap: true,
                email: true,
                departemen: true,
                jabatan: true,
              },
            },
          },
        }),
        prisma.staffBalance.count({ where }),
      ]);

      // Calculate summary statistics using the same where clause
      const summary = await prisma.staffBalance.groupBy({
        by: ["category"],
        _sum: {
          amount: true,
          totalIn: true,
          totalOut: true,
        },
        where, // Use the same where clause as the main query
      });

      const summaryData = {
        totalOperasional: 0,
        totalPinjaman: 0,
        grandTotal: 0,
        totalIn: 0,
        totalOut: 0,
      };

      summary.forEach((item) => {
        const amount = Number(item._sum.amount || 0);
        const totalIn = Number(item._sum.totalIn || 0);
        const totalOut = Number(item._sum.totalOut || 0);

        summaryData.totalIn += totalIn;
        summaryData.totalOut += totalOut;

        if (item.category === "OPERASIONAL_PROYEK") {
          summaryData.totalOperasional = amount;
        } else if (item.category === "PINJAMAN_PRIBADI") {
          summaryData.totalPinjaman = amount;
        }
      });

      summaryData.grandTotal =
        summaryData.totalOperasional + summaryData.totalPinjaman;

      res.json({
        success: true,
        data: staffBalances,
        summary: summaryData,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          totalPages: Math.ceil(totalCount / parseInt(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get staff balance by employee ID
   */
  async getStaffBalanceByKaryawan(req, res, next) {
    try {
      const { karyawanId } = req.params;

      const staffBalances = await prisma.staffBalance.findMany({
        where: { karyawanId },
        include: {
          karyawan: {
            select: {
              id: true,
              namaLengkap: true,
              email: true,
              departemen: true,
              jabatan: true,
            },
          },
        },
      });

      if (!staffBalances || staffBalances.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Staff balance tidak ditemukan untuk karyawan ini",
        });
      }

      res.json({
        success: true,
        data: staffBalances,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get staff ledger (transaction history) by employee ID
   */
  async getStaffLedgerByKaryawan(req, res, next) {
    try {
      const { karyawanId } = req.params;
      const {
        page = 1,
        limit = 20,
        category = "",
        type = "",
        startDate = "",
        endDate = "",
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      // Build where clause
      const where = { karyawanId };

      if (category && category !== "ALL") {
        where.category = category;
      }

      if (type && type !== "ALL") {
        where.type = type;
      }

      if (startDate || endDate) {
        where.tanggal = {};
        if (startDate) where.tanggal.gte = new Date(startDate);
        if (endDate) where.tanggal.lte = new Date(endDate);
      }

      // Query database
      const [ledgerEntries, totalCount] = await Promise.all([
        prisma.staffLedger.findMany({
          where,
          skip,
          take,
          orderBy: {
            tanggal: "desc",
          },
          include: {
            karyawan: {
              select: {
                id: true,
                namaLengkap: true,
              },
            },
            purchaseRequest: {
              select: {
                id: true,
                nomorPr: true,
                keterangan: true,
              },
            },
          },
        }),
        prisma.staffLedger.count({ where }),
      ]);

      res.json({
        success: true,
        data: ledgerEntries,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          totalPages: Math.ceil(totalCount / parseInt(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get summary statistics for all staff balances
   */
  async getStaffBalanceSummary(req, res, next) {
    try {
      // Calculate summary statistics
      const summary = await prisma.staffBalance.groupBy({
        by: ["category"],
        _sum: {
          amount: true,
          totalIn: true,
          totalOut: true,
        },
        _count: {
          id: true,
        },
      });

      const totalEmployees = await prisma.staffBalance.groupBy({
        by: ["karyawanId"],
      });

      const summaryData = {
        totalOperasional: 0,
        totalPinjaman: 0,
        grandTotal: 0,
        countOperasional: 0,
        countPinjaman: 0,
        totalEmployees: totalEmployees.length,
        totalIn: 0,
        totalOut: 0,
      };

      summary.forEach((item) => {
        const amount = Number(item._sum.amount || 0);
        const totalIn = Number(item._sum.totalIn || 0);
        const totalOut = Number(item._sum.totalOut || 0);

        summaryData.totalIn += totalIn;
        summaryData.totalOut += totalOut;
        
        if (item.category === "OPERASIONAL_PROYEK") {
          summaryData.totalOperasional = amount;
          summaryData.countOperasional = item._count.id;
        } else if (item.category === "PINJAMAN_PRIBADI") {
          summaryData.totalPinjaman = amount;
          summaryData.countPinjaman = item._count.id;
        }
      });

      summaryData.grandTotal =
        summaryData.totalOperasional + summaryData.totalPinjaman;

      res.json({
        success: true,
        data: summaryData,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create opening balance for staff
   */
  async createOpeningBalance(req, res, next) {
    try {
      const { karyawanId, category, amount, tanggal, keterangan } = req.body;

      // Validate required fields
      if (!karyawanId || !category || amount === undefined) {
        return res.status(400).json({
          success: false,
          message: "karyawanId, category, dan amount wajib diisi",
        });
      }

      // Check if karyawan exists
      const karyawan = await prisma.karyawan.findUnique({
        where: { id: karyawanId },
      });

      if (!karyawan) {
        return res.status(404).json({
          success: false,
          message: "Karyawan tidak ditemukan",
        });
      }

      // Check if opening balance already exists for this category
      const existingOpening = await prisma.staffLedger.findFirst({
        where: {
          karyawanId,
          category,
          type: "OPENING_BALANCE",
        },
        orderBy: {
          tanggal: "asc",
        },
      });

      if (existingOpening) {
        return res.status(400).json({
          success: false,
          message: `Saldo awal untuk kategori ${category} sudah dibuat pada ${new Date(
            existingOpening.tanggal
          ).toLocaleDateString("id-ID")}. Gunakan fitur koreksi jika ingin mengubah.`,
          existingData: existingOpening,
        });
      }

      const numAmount = Number(amount);

      // Create opening balance in transaction
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create StaffLedger entry
        const ledgerEntry = await tx.staffLedger.create({
          data: {
            karyawanId,
            tanggal: tanggal ? new Date(tanggal) : new Date(),
            keterangan:
              keterangan ||
              `Saldo Awal ${category === "OPERASIONAL_PROYEK" ? "Operasional Proyek" : "Pinjaman Pribadi"}`,
            saldoAwal: 0, // Opening balance starts from 0
            debit: numAmount > 0 ? numAmount : 0,
            kredit: numAmount < 0 ? Math.abs(numAmount) : 0,
            saldo: numAmount, // Final balance = opening amount
            category,
            type: "OPENING_BALANCE",
            createdBy: req.user?.id || "SYSTEM",
          },
          include: {
            karyawan: {
              select: {
                id: true,
                namaLengkap: true,
              },
            },
          },
        });

        // 2. Create or Update StaffBalance
        const staffBalance = await tx.staffBalance.upsert({
          where: {
            karyawanId_category: {
              karyawanId,
              category,
            },
          },
          update: {
            amount: numAmount,
            totalIn: numAmount > 0 ? numAmount : 0,
            totalOut: numAmount < 0 ? Math.abs(numAmount) : 0,
          },
          create: {
            karyawanId,
            category,
            amount: numAmount,
            totalIn: numAmount > 0 ? numAmount : 0,
            totalOut: numAmount < 0 ? Math.abs(numAmount) : 0,
          },
          include: {
            karyawan: {
              select: {
                id: true,
                namaLengkap: true,
              },
            },
          },
        });

        return { ledgerEntry, staffBalance };
      });

      res.status(201).json({
        success: true,
        message: "Saldo awal berhasil dibuat",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Process Staff Refund (Staff returns money to company)
   */
  async processStaffRefund(req, res, next) {
    try {
      const { karyawanId, category, amount, coaId, tanggal, keterangan, refId } = req.body;

      if (!karyawanId || !category || !amount || !coaId) {
        return res.status(400).json({
          success: false,
          message: "Data tidak lengkap (karyawanId, category, amount, coaId wajib diisi)",
        });
      }

      const numAmount = Number(amount);
      const transDate = tanggal ? new Date(tanggal) : new Date();
      const now = new Date();

      const result = await prisma.$transaction(async (tx) => {
        // 1. Get Employee Balance
        const staffBalance = await tx.staffBalance.findUnique({
          where: {
            karyawanId_category: {
              karyawanId,
              category
            }
          },
          include: { karyawan: true }
        });

        if (!staffBalance) {
          throw new Error("Staff Balance tidak ditemukan");
        }

        const currentBalance = Number(staffBalance.amount);
        const newBalance = currentBalance - numAmount;

        // 2. Update StaffBalance
        await tx.staffBalance.update({
          where: { id: staffBalance.id },
          data: {
            amount: newBalance,
            totalOut: { increment: numAmount }
          }
        });

        // 3. Create StaffLedger Entry
        const staffLedger = await tx.staffLedger.create({
          data: {
            karyawanId,
            category,
            type: 'SETTLEMENT_REFUND',
            tanggal: transDate,
            keterangan: keterangan || `Pengembalian dana operasional oleh ${staffBalance.karyawan.namaLengkap}`,
            saldoAwal: currentBalance,
            debit: 0,
            kredit: numAmount, // Staff money decreases
            saldo: newBalance,
            refId: refId || null,
            createdBy: req.user?.id || 'SYSTEM'
          }
        });

        // 4. Accounting Integration (Ledger)
        const period = await getActivePeriod(transDate, tx);
        const ledgerNumber = await generateRefundLedgerNumber(now, tx);

        // Get Accounts
        // Debit: Kas/Bank (Target Account from UI)
        // Credit: Staff Advance (Account 1-10302)
        const creditAccount = await getSystemAccount('STAFF_ADVANCE', tx);
        if (!creditAccount) {
          throw new Error("System Account 'STAFF_ADVANCE' (1-10302) tidak ditemukan");
        }

        const debitAccount = await tx.chartOfAccounts.findUnique({
           where: { id: coaId }
        });

        if (!debitAccount) {
          throw new Error("Akun Kas/Bank tujuan tidak ditemukan");
        }

        // Create General Ledger
        const ledger = await tx.ledger.create({
          data: {
            ledgerNumber,
            referenceNumber: refId || `REFUND-${staffLedger.id.slice(0, 8)}`,
            referenceType: 'RECEIPT',
            transactionDate: transDate,
            postingDate: now,
            description: `Pengembalian Dana Staff: ${staffBalance.karyawan.namaLengkap}`,
            notes: keterangan,
            periodId: period.id,
            status: 'POSTED',
            createdBy: req.user?.id || 'SYSTEM',
            postedBy: req.user?.id || 'SYSTEM',
            postedAt: now
          }
        });

        // Create Ledger Lines
        const ledgerLinesData = [
          {
            ledgerId: ledger.id,
            coaId: debitAccount.id, // Kas/Bank
            debitAmount: numAmount,
            creditAmount: 0,
            localAmount: numAmount,
            description: `Penerimaan dana dari ${staffBalance.karyawan.namaLengkap}`,
            lineNumber: 1
          },
          {
            ledgerId: ledger.id,
            coaId: creditAccount.id, // Staff Advance
            debitAmount: 0,
            creditAmount: numAmount,
            localAmount: numAmount,
            description: `Pengembalian Uang Muka Kerka oleh ${staffBalance.karyawan.namaLengkap}`,
            lineNumber: 2
          }
        ];

        await tx.ledgerLine.createMany({
          data: ledgerLinesData
        });

        // Import services for summary updates
        // Note: Using dynamic imports or assume they are available if we have them at top level
        // But since this is a controller, we should have them at top usually.
        // Let's check imports in this file.
        const { updateTrialBalance, updateGeneralLedgerSummary } = await import('../../services/accounting/financialSummaryService.js');

        for (const line of ledgerLinesData) {
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
            date: transDate,
            debitAmount: line.debitAmount,
            creditAmount: line.creditAmount,
            tx
          });
        }

        return { staffBalance, staffLedger, ledger };
      });

      res.status(200).json({
        success: true,
        message: "Pengembalian dana berhasil diproses",
        data: result
      });

    } catch (error) {
      console.error("Error in processStaffRefund:", error);
      res.status(500).json({
        success: false,
        message: "Gagal memproses pengembalian dana",
        error: error.message
      });
    }
  },

  /**
   * Settle PR Budget (Refund or Reimburse)
   * Logic: Resets sisaBudget to 0 and creates accounting entries
   */
  async settlePRBudget(req, res, next) {
    try {
      const { prId } = req.body;

      if (!prId) {
        return res.status(400).json({ success: false, message: "PR ID diperlukan" });
      }

      const now = new Date();

      const result = await prisma.$transaction(async (tx) => {
        // 1. Get PR Data
        const pr = await tx.purchaseRequest.findUnique({
          where: { id: prId },
          include: { 
            karyawan: true,
            details: true,
            purchaseOrders: { where: { status: { notIn: ['CANCELLED', 'REJECTED'] } } },
            childPrs: { where: { status: { notIn: ['REJECTED'] } }, include: { details: true } }
          }
        });

        if (!pr) throw new Error("PR tidak ditemukan");
        if (pr.status !== "COMPLETED") throw new Error("Hanya PR berstatus COMPLETED yang dapat di-settle");
        
        const sisaBudget = Number(pr.sisaBudget || 0);
        if (sisaBudget === 0) {
          throw new Error("Budget sudah lunas (0)");
        }

        const isRefund = sisaBudget > 0; // Staff returns money
        const amount = Math.abs(sisaBudget);
        const karyawanId = pr.requestedById || pr.karyawanId;
        const category = "OPERASIONAL_PROYEK";

        // 2. Get Accounting Config
        const staffAdvanceCoa = await getSystemAccount('STAFF_ADVANCE', tx);
        const pettyCashCoa = await getSystemAccount('PETTY_CASH', tx);

        if (!staffAdvanceCoa || !pettyCashCoa) {
          throw new Error("Konfigurasi akun STAFF_ADVANCE atau PETTY_CASH tidak ditemukan di System Accounts");
        }

        // 3. Update Staff Balance
        const existingBalance = await tx.staffBalance.findUnique({
          where: { karyawanId_category: { karyawanId, category } }
        });

        const currentBalance = existingBalance ? Number(existingBalance.amount) : 0;
        const newBalance = isRefund ? currentBalance - amount : currentBalance + amount;

        await tx.staffBalance.upsert({
          where: { karyawanId_category: { karyawanId, category } },
          update: {
            amount: newBalance,
            ...(isRefund ? { totalOut: { increment: amount } } : { totalIn: { increment: amount } })
          },
          create: {
            karyawanId,
            category,
            amount: newBalance,
            totalIn: isRefund ? 0 : amount,
            totalOut: isRefund ? amount : 0
          }
        });

        // 4. Create Staff Ledger
        await tx.staffLedger.create({
          data: {
            karyawanId,
            category,
            type: isRefund ? 'SETTLEMENT_REFUND' : 'CASH_ADVANCE',
            tanggal: now,
            keterangan: isRefund 
              ? `Refund Sisa Budget PR: ${pr.nomorPr} (Kembali ke Kas)` 
              : `Penambahan Budget PR: ${pr.nomorPr} (Kurang Bayar)`,
            saldoAwal: currentBalance,
            debit: isRefund ? 0 : amount,
            kredit: isRefund ? amount : 0,
            saldo: newBalance,
            refId: pr.id,
            purchaseRequestId: pr.id,
            createdBy: req.user?.id || 'SYSTEM'
          }
        });

        // 5. General Ledger Entry
        const period = await getActivePeriod(now, tx);
        const prefix = isRefund ? 'RV-SETTLE' : 'PV-SETTLE';
        const ledgerNumber = `${prefix}-${pr.nomorPr.replace(/\//g, '-')}`;

        const ledger = await tx.ledger.create({
          data: {
            ledgerNumber,
            referenceNumber: pr.nomorPr,
            referenceType: isRefund ? 'RECEIPT' : 'PAYMENT',
            transactionDate: now,
            postingDate: now,
            description: isRefund 
              ? `Settlement Refund Sisa Budget PR: ${pr.nomorPr}` 
              : `Settlement Reimbursement PR: ${pr.nomorPr}`,
            periodId: period.id,
            status: 'POSTED',
            createdBy: req.user?.id || 'SYSTEM',
            postedBy: req.user?.id || 'SYSTEM',
            postedAt: now
          }
        });

        // Lines
        // If Refund: DR Petty Cash, CR Staff Advance
        // If Reimburse: DR Staff Advance, CR Petty Cash
        const debitCoaId = isRefund ? pettyCashCoa.id : staffAdvanceCoa.id;
        const creditCoaId = isRefund ? staffAdvanceCoa.id : pettyCashCoa.id;

        const ledgerLines = [
          {
            ledgerId: ledger.id,
            coaId: debitCoaId,
            debitAmount: amount,
            creditAmount: 0,
            localAmount: amount,
            description: isRefund ? `Penerimaan Refund PR ${pr.nomorPr}` : `Penggantian Kurang Bayar PR ${pr.nomorPr}`,
            lineNumber: 1
          },
          {
            ledgerId: ledger.id,
            coaId: creditCoaId,
            debitAmount: 0,
            creditAmount: amount,
            localAmount: amount,
            description: isRefund ? `Settlement Sisa Uang Muka ${pr.nomorPr}` : `Pencairan Dana Tambahan PR ${pr.nomorPr}`,
            lineNumber: 2
          }
        ];

        await tx.ledgerLine.createMany({ data: ledgerLines });

        // Update Summaries
        const { updateTrialBalance, updateGeneralLedgerSummary } = await import('../../services/accounting/financialSummaryService.js');
        
        for (const line of ledgerLines) {
          await updateTrialBalance({
            periodId: period.id,
            coaId: line.coaId,
            debitAmount: line.debitAmount,
            creditAmount: line.creditAmount,
            tx: tx
          });
          await updateGeneralLedgerSummary({
            coaId: line.coaId,
            periodId: period.id,
            date: now,
            debitAmount: line.debitAmount,
            creditAmount: line.creditAmount,
            tx: tx
          });
        }

        // 6. Reset PR sisaBudget to 0
        await tx.purchaseRequest.update({
          where: { id: prId },
          data: { sisaBudget: 0 }
        });

        return { ledgerNumber, amount, isRefund };
      });

      res.status(200).json({
        success: true,
        message: result.isRefund ? "Refund sisa budget berhasil" : "Reimbursement budget berhasil",
        data: result
      });

    } catch (error) {
      console.error("Error in settlePRBudget:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Gagal memproses settlement budget",
      });
    }
  }
};

/**
 * Helper: Get System Account by Key
 */
async function getSystemAccount(key, tx) {
  const prismaClient = tx || prisma;
  const systemAccount = await prismaClient.systemAccount.findUnique({
    where: { key },
    include: { coa: true }
  });
  return systemAccount?.coa || null;
}

/**
 * Helper: Get Active Accounting Period
 */
async function getActivePeriod(transactionDate, tx) {
  const prismaClient = tx || prisma;
  const period = await prismaClient.accountingPeriod.findFirst({
    where: {
      startDate: { lte: transactionDate },
      endDate: { gte: transactionDate },
      isClosed: false
    }
  });

  if (!period) {
    throw new Error(`Periode akuntansi tidak ditemukan atau sudah ditutup untuk tanggal ${transactionDate.toISOString().slice(0, 10)}`);
  }
  return period;
}

/**
 * Helper: Generate Refund Ledger Number
 * Format: RV-STF-YYYYMMDD-XXXX
 */
async function generateRefundLedgerNumber(date, tx) {
  const prismaClient = tx || prisma;
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `RV-STF-${dateStr}`;
  
  const latestLedger = await prismaClient.ledger.findFirst({
    where: {
      ledgerNumber: { startsWith: prefix }
    },
    orderBy: {
      ledgerNumber: 'desc'
    },
    select: {
      ledgerNumber: true
    }
  });

  let nextSequence = 1;
  if (latestLedger) {
    const parts = latestLedger.ledgerNumber.split('-');
    const lastSequenceStr = parts[parts.length - 1];
    const lastSequence = parseInt(lastSequenceStr);
    if (!isNaN(lastSequence)) {
      nextSequence = lastSequence + 1;
    }
  }

  const sequence = String(nextSequence).padStart(4, '0');
  return `${prefix}-${sequence}`;
}
