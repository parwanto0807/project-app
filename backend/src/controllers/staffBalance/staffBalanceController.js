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

      // Calculate summary statistics
      const summary = await prisma.staffBalance.groupBy({
        by: ["category"],
        _sum: {
          amount: true,
        },
        where: search
          ? {
              karyawan: {
                namaLengkap: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            }
          : {},
      });

      const summaryData = {
        totalOperasional: 0,
        totalPinjaman: 0,
        grandTotal: 0,
      };

      summary.forEach((item) => {
        const amount = Number(item._sum.amount || 0);
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
      const summary = await prisma.staffBalance.groupBy({
        by: ["category"],
        _sum: {
          amount: true,
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
      };

      summary.forEach((item) => {
        const amount = Number(item._sum.amount || 0);
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
};
