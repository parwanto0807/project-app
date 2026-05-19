import { prisma } from "../../config/db.js";
import { createLedgerEntry } from "../../utils/journalHelper.js";
import { NotificationService } from "../../utils/firebase/notificationService.js";

// --- PINJAMAN ---

/**
 * Get all loans
 */
export const getAllPinjaman = async (req, res) => {
  try {
    const { status, karyawanId } = req.query;
    const loans = await prisma.pinjaman.findMany({
      where: {
        ...(status && { status }),
        ...(karyawanId && { karyawanId }),
      },
      include: {
        karyawan: {
          select: {
            id: true,
            namaLengkap: true,
            nik: true,
            jabatan: true,
          },
        },
        details: {
          orderBy: { bulanKe: "asc" },
        },
      },
      orderBy: { tanggalPinjam: "desc" },
    });
    res.json(loans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Create new loan with disbursement journal
 */
export const createPinjaman = async (req, res) => {
  try {
    const {
      karyawanId,
      tanggalPinjam,
      jumlahPinjaman,
      tenor,
      bunga = 0,
      keterangan,
      bankAccountId,
    } = req.body;

    const amount = parseFloat(jumlahPinjaman);
    const months = parseInt(tenor);
    const interest = parseFloat(bunga || 0);

    const totalWithInterest = amount + (amount * (interest / 100));
    const angsuranBulanan = Math.ceil(totalWithInterest / months);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Pinjaman as DRAFT
      const loan = await tx.pinjaman.create({
        data: {
          karyawanId,
          tanggalPinjam: new Date(tanggalPinjam || Date.now()),
          jumlahPinjaman: amount,
          tenor: months,
          bunga: interest,
          angsuranBulanan: angsuranBulanan,
          sisaPinjaman: totalWithInterest,
          status: "DRAFT",
          keterangan,
          bankAccountId,
        },
      });

      // 2. Create PinjamanDetails (Schedule)
      const startDate = new Date(tanggalPinjam || Date.now());
      const detailsData = [];
      for (let i = 1; i <= months; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        detailsData.push({
          pinjamanId: loan.id,
          bulanKe: i,
          tanggalJatuhTempo: dueDate,
          jumlahBayar: angsuranBulanan,
          status: "PENDING",
        });
      }
      await tx.pinjamanDetail.createMany({ data: detailsData });

      return loan;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Error creating loan:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update loan (DRAFT only)
 */
export const updatePinjaman = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      karyawanId,
      tanggalPinjam,
      jumlahPinjaman,
      tenor,
      bunga = 0,
      keterangan,
      bankAccountId,
    } = req.body;

    const loan = await prisma.pinjaman.findUnique({ where: { id } });
    if (!loan) return res.status(404).json({ message: "Pinjaman tidak ditemukan" });
    if (loan.status !== "DRAFT") return res.status(400).json({ message: "Hanya pinjaman berstatus DRAFT yang dapat diedit" });

    const amount = parseFloat(jumlahPinjaman);
    const months = parseInt(tenor);
    const interest = parseFloat(bunga || 0);
    const totalWithInterest = amount + (amount * (interest / 100));
    const angsuranBulanan = Math.ceil(totalWithInterest / months);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Pinjaman
      const updated = await tx.pinjaman.update({
        where: { id },
        data: {
          karyawanId,
          tanggalPinjam: new Date(tanggalPinjam || Date.now()),
          jumlahPinjaman: amount,
          tenor: months,
          bunga: interest,
          angsuranBulanan,
          sisaPinjaman: totalWithInterest,
          keterangan,
          bankAccountId: bankAccountId || null,
        },
      });

      // 2. Regenerate PinjamanDetails
      await tx.pinjamanDetail.deleteMany({ where: { pinjamanId: id } });
      const startDate = new Date(tanggalPinjam || Date.now());
      const detailsData = [];
      for (let i = 1; i <= months; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        detailsData.push({
          pinjamanId: id,
          bulanKe: i,
          tanggalJatuhTempo: dueDate,
          jumlahBayar: angsuranBulanan,
          status: "PENDING",
        });
      }
      await tx.pinjamanDetail.createMany({ data: detailsData });

      return updated;
    });

    res.json(result);
  } catch (error) {
    console.error("Error updating loan:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete loan (DRAFT only)
 */
export const deletePinjaman = async (req, res) => {
  try {
    const { id } = req.params;

    const loan = await prisma.pinjaman.findUnique({ where: { id } });
    if (!loan) return res.status(404).json({ message: "Pinjaman tidak ditemukan" });
    if (loan.status !== "DRAFT") return res.status(400).json({ message: "Hanya pinjaman berstatus DRAFT yang dapat dihapus" });

    // Cascade delete (PinjamanDetail will be deleted via onDelete: Cascade in schema)
    await prisma.pinjaman.delete({ where: { id } });

    res.json({ message: "Pinjaman berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting loan:", error);
    res.status(500).json({ message: error.message });
  }
};


/**
 * Post Pinjaman to General Ledger
 */
export const postPinjaman = async (req, res) => {
  try {
    const { id } = req.params;

    const loan = await prisma.pinjaman.findUnique({
      where: { id },
      include: { karyawan: true }
    });

    if (!loan) return res.status(404).json({ message: "Pinjaman tidak ditemukan" });
    if (loan.status !== "DRAFT") return res.status(400).json({ message: "Hanya pinjaman status DRAFT yang bisa di-posting" });
    if (!loan.bankAccountId) return res.status(400).json({ message: "Akun bank pencairan belum dipilih" });

    const bankAccount = await prisma.bankAccount.findUnique({
      where: { id: loan.bankAccountId },
      include: { accountCOA: true }
    });

    if (!bankAccount || !bankAccount.accountCOA) {
      return res.status(400).json({ message: "Akun bank atau COA tidak valid" });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Status to ACTIVE
      const updatedLoan = await tx.pinjaman.update({
        where: { id },
        data: { status: "ACTIVE" }
      });

      // 2. Create Ledger Entry
      await createLedgerEntry({
        referenceType: "JOURNAL",
        referenceId: loan.id,
        referenceNumber: `LOAN-${loan.id.substring(0, 8).toUpperCase()}`,
        tanggal: loan.tanggalPinjam,
        keterangan: `Pencairan Pinjaman Karyawan: ${loan.keterangan || ''}`,
        entries: [
          {
            systemAccountKey: "EMPLOYEE_LOAN_ACCOUNT",
            debit: loan.sisaPinjaman,
            karyawanId: loan.karyawanId,
          },
          {
            coaId: bankAccount.accountCOA.id,
            credit: loan.jumlahPinjaman, // Principal disbursed
          }
        ],
        createdById: req.user?.id || "SYSTEM",
        tx,
      });

      return updatedLoan;
    }, { timeout: 30000 });

    res.json(result);
  } catch (error) {
    console.error("Error posting loan:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Record payment manually (if not via payroll)
 */
export const recordManualRepayment = async (req, res) => {
  try {
    const { detailId } = req.params;
    const { bankAccountId, tanggalBayar, keterangan } = req.body;

    const detail = await prisma.pinjamanDetail.findUnique({
      where: { id: detailId },
      include: { pinjaman: true },
    });

    if (!detail) return res.status(404).json({ message: "Installment record not found" });
    if (detail.status === "PAID") return res.status(400).json({ message: "Installment already paid" });

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Detail
      const updatedDetail = await tx.pinjamanDetail.update({
        where: { id: detailId },
        data: {
          status: "PAID",
          tanggalBayar: new Date(tanggalBayar || Date.now()),
        },
      });

      // 2. Update Pinjaman Balance
      const updatedLoan = await tx.pinjaman.update({
        where: { id: detail.pinjamanId },
        data: {
          sisaPinjaman: { decrement: detail.jumlahBayar },
        },
      });

      // If sisa is 0, mark as COMPLETED
      if (Number(updatedLoan.sisaPinjaman) <= 0) {
        await tx.pinjaman.update({
          where: { id: detail.pinjamanId },
          data: { status: "COMPLETED" },
        });
      }

      // 3. Create Ledger Entry
      if (bankAccountId) {
        const bankAccount = await tx.bankAccount.findUnique({
          where: { id: bankAccountId },
          include: { accountCOA: true }
        });

        if (bankAccount && bankAccount.accountCOA) {
          await createLedgerEntry({
            referenceType: "JOURNAL",
            referenceId: detail.id,
            referenceNumber: `PAY-LOAN-${detail.id.substring(0, 8).toUpperCase()}`,
            tanggal: new Date(tanggalBayar || Date.now()),
            keterangan: `Pembayaran Angsuran Pinjaman #${detail.bulanKe}: ${keterangan || ''}`,
            entries: [
              {
                coaId: bankAccount.accountCOA.id,
                debit: detail.jumlahBayar,
              },
              {
                systemAccountKey: "EMPLOYEE_LOAN_ACCOUNT",
                credit: detail.jumlahBayar,
                karyawanId: detail.pinjaman.karyawanId,
              }
            ],
            createdById: req.user?.id || "SYSTEM",
            tx,
          });
        }
      }

      return updatedDetail;
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- KASBON SEMENTARA ---

export const getAllKasbon = async (req, res) => {
  try {
    const { karyawanId, status } = req.query;
    const kasbon = await prisma.kasbonSementara.findMany({
      where: {
        ...(karyawanId && { karyawanId }),
        ...(status && { status }),
      },
      include: {
        karyawan: {
          select: { id: true, namaLengkap: true, nik: true, jabatan: true, gajiPokok: true },
        },
      },
      orderBy: { tanggal: "desc" },
    });
    res.json(kasbon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createKasbon = async (req, res) => {
  try {
    const { karyawanId, jumlah, keperluan, bulanPotong, catatan } = req.body;

    if (!karyawanId || !jumlah) {
      return res.status(400).json({ message: "karyawanId dan jumlah wajib diisi" });
    }

    const amount = parseFloat(jumlah);

    // Validasi 50% gaji — soft warning, tidak block
    const karyawan = await prisma.karyawan.findUnique({
      where: { id: karyawanId },
      select: { gajiPokok: true },
    });

    let warningMessage = null;
    if (karyawan?.gajiPokok && amount > karyawan.gajiPokok * 0.5) {
      warningMessage = `Jumlah kasbon melebihi 50% gaji pokok (${karyawan.gajiPokok * 0.5})`;
    }

    const kasbon = await prisma.kasbonSementara.create({
      data: {
        karyawanId,
        jumlah: amount,
        keperluan,
        bulanPotong: bulanPotong ? new Date(bulanPotong) : null,
        catatan,
        status: "PENDING",
      },
      include: {
        karyawan: { select: { namaLengkap: true, nik: true } },
      },
    });

    res.status(201).json({ ...kasbon, warning: warningMessage });
  } catch (error) {
    console.error("Error creating kasbon:", error);
    res.status(500).json({ message: error.message });
  }
};

export const approveKasbon = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedBy, catatan } = req.body;

    const kasbon = await prisma.kasbonSementara.findUnique({ where: { id } });
    if (!kasbon) return res.status(404).json({ message: "Kasbon tidak ditemukan" });
    if (kasbon.status !== "PENDING") {
      return res.status(400).json({ message: "Hanya kasbon berstatus PENDING yang dapat disetujui" });
    }

    const updated = await prisma.kasbonSementara.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedBy: approvedBy || "Admin",
        approvedAt: new Date(),
        catatan: catatan || kasbon.catatan,
      },
      include: {
        karyawan: { select: { namaLengkap: true, nik: true } },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Error approving kasbon:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /kasbon/:id/post
 * Posting kasbon ke General Ledger setelah APPROVED
 * Jurnal: Dr. Piutang Karyawan Lainnya (1-10303) / Cr. Kas Peti Cash (1-10001)
 */
export const postKasbon = async (req, res) => {
  try {
    const { id } = req.params;
    const { cashAccountKey = "PETTY_CASH" } = req.body; // default Kas Peti Cash

    const kasbon = await prisma.kasbonSementara.findUnique({
      where: { id },
      include: { karyawan: { select: { namaLengkap: true, nik: true } } },
    });

    if (!kasbon) return res.status(404).json({ message: "Kasbon tidak ditemukan" });
    if (kasbon.status !== "APPROVED") {
      return res.status(400).json({ message: "Hanya kasbon berstatus APPROVED yang dapat di-posting" });
    }
    if (kasbon.isPosted) {
      return res.status(400).json({ message: "Kasbon ini sudah pernah di-posting ke jurnal" });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark as posted
      const updated = await tx.kasbonSementara.update({
        where: { id },
        data: { isPosted: true },
        include: { karyawan: { select: { namaLengkap: true, nik: true } } },
      });

      // 2. Create GL Entry
      // Dr. Piutang Karyawan Lainnya (EMPLOYEE_CASH_ADVANCE) — aset bertambah
      // Cr. Kas/Bank (cashAccountKey) — kas berkurang
      await createLedgerEntry({
        referenceType: "JOURNAL",
        referenceId: kasbon.id,
        referenceNumber: `KASBON-${kasbon.id.substring(0, 8).toUpperCase()}`,
        tanggal: kasbon.tanggal,
        keterangan: `Pencairan Kasbon Karyawan: ${kasbon.karyawan.namaLengkap} - ${kasbon.keperluan || ""}`,
        entries: [
          {
            systemAccountKey: "EMPLOYEE_CASH_ADVANCE",
            debit: Number(kasbon.jumlah),
            karyawanId: kasbon.karyawanId,
          },
          {
            systemAccountKey: cashAccountKey,
            credit: Number(kasbon.jumlah),
          },
        ],
        createdById: req.user?.id || "SYSTEM",
        tx,
      });

      return updated;
    }, { timeout: 30000 });

    res.json(result);
  } catch (error) {
    console.error("Error posting kasbon:", error);
    res.status(500).json({ message: error.message });
  }
};

export const rejectKasbon = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectedReason } = req.body;

    const kasbon = await prisma.kasbonSementara.findUnique({
      where: { id },
      include: { karyawan: { select: { namaLengkap: true, nik: true } } },
    });
    if (!kasbon) return res.status(404).json({ message: "Kasbon tidak ditemukan" });

    // PENDING → REJECTED: langsung
    if (kasbon.status === "PENDING") {
      const updated = await prisma.kasbonSementara.update({
        where: { id },
        data: {
          status: "REJECTED",
          rejectedReason: rejectedReason || "Tidak ada alasan",
        },
        include: { karyawan: { select: { namaLengkap: true, nik: true } } },
      });
      return res.json(updated);
    }

    // APPROVED + belum di-posting → batalkan approval (kembali ke PENDING)
    if (kasbon.status === "APPROVED" && !kasbon.isPosted) {
      const updated = await prisma.kasbonSementara.update({
        where: { id },
        data: {
          status: "REJECTED",
          rejectedReason: rejectedReason || "Dibatalkan setelah approval",
          approvedBy: null,
          approvedAt: null,
        },
        include: { karyawan: { select: { namaLengkap: true, nik: true } } },
      });
      return res.json(updated);
    }

    // APPROVED + sudah di-posting → tidak bisa ditolak biasa, harus void
    if (kasbon.status === "APPROVED" && kasbon.isPosted) {
      return res.status(400).json({
        message:
          "Kasbon ini sudah di-posting ke Jurnal. Tidak dapat ditolak langsung — lakukan Void/Reverse Journal terlebih dahulu.",
        code: "ALREADY_POSTED",
      });
    }

    return res.status(400).json({ message: `Kasbon berstatus ${kasbon.status} tidak dapat ditolak` });
  } catch (error) {
    console.error("Error rejecting kasbon:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * PUT /kasbon/:id — Edit kasbon (PENDING only)
 */
export const updateKasbon = async (req, res) => {
  try {
    const { id } = req.params;
    const { jumlah, keperluan, bulanPotong, catatan } = req.body;

    const kasbon = await prisma.kasbonSementara.findUnique({
      where: { id },
      include: { karyawan: { select: { gajiPokok: true } } },
    });
    if (!kasbon) return res.status(404).json({ message: "Kasbon tidak ditemukan" });
    if (kasbon.status !== "PENDING") {
      return res.status(400).json({ message: "Hanya kasbon berstatus PENDING yang dapat diedit" });
    }

    const amount = jumlah ? parseFloat(jumlah) : Number(kasbon.jumlah);

    let warningMessage = null;
    if (kasbon.karyawan?.gajiPokok && amount > kasbon.karyawan.gajiPokok * 0.5) {
      warningMessage = `Jumlah kasbon melebihi 50% gaji pokok (${kasbon.karyawan.gajiPokok * 0.5})`;
    }

    const updated = await prisma.kasbonSementara.update({
      where: { id },
      data: {
        jumlah: amount,
        keperluan: keperluan !== undefined ? keperluan : kasbon.keperluan,
        bulanPotong: bulanPotong ? new Date(bulanPotong) : kasbon.bulanPotong,
        catatan: catatan !== undefined ? catatan : kasbon.catatan,
      },
      include: { karyawan: { select: { namaLengkap: true, nik: true } } },
    });

    res.json({ ...updated, warning: warningMessage });
  } catch (error) {
    console.error("Error updating kasbon:", error);
    res.status(500).json({ message: error.message });
  }
};

export const settleKasbon = async (req, res) => {
  try {
    const { id } = req.params;

    const kasbon = await prisma.kasbonSementara.findUnique({
      where: { id },
      include: { karyawan: { select: { namaLengkap: true, nik: true } } },
    });
    if (!kasbon) return res.status(404).json({ message: "Kasbon tidak ditemukan" });
    if (kasbon.status !== "APPROVED") {
      return res.status(400).json({ message: "Hanya kasbon berstatus APPROVED yang dapat diselesaikan" });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update status
      const updated = await tx.kasbonSementara.update({
        where: { id },
        data: {
          status: "SETTLED",
          tanggalPenyelesaian: new Date(),
        },
        include: {
          karyawan: { select: { namaLengkap: true, nik: true } },
        },
      });

      // 2. GL Entry hanya jika kasbon sudah pernah di-posting
      // Dr. Beban Gaji Karyawan (EXPENSE_SALARY) — beban bertambah
      // Cr. Piutang Karyawan Lainnya (EMPLOYEE_CASH_ADVANCE) — piutang berkurang
      if (kasbon.isPosted) {
        await createLedgerEntry({
          referenceType: "JOURNAL",
          referenceId: kasbon.id,
          referenceNumber: `SETTLE-KASBON-${kasbon.id.substring(0, 8).toUpperCase()}`,
          tanggal: new Date(),
          keterangan: `Pelunasan Kasbon via Potong Gaji: ${kasbon.karyawan.namaLengkap}`,
          entries: [
            {
              systemAccountKey: "EXPENSE_SALARY",
              debit: Number(kasbon.jumlah),
              karyawanId: kasbon.karyawanId,
            },
            {
              systemAccountKey: "EMPLOYEE_CASH_ADVANCE",
              credit: Number(kasbon.jumlah),
              karyawanId: kasbon.karyawanId,
            },
          ],
          createdById: req.user?.id || "SYSTEM",
          tx,
        });
      }

      return updated;
    });

    res.json(result);
  } catch (error) {
    console.error("Error settling kasbon:", error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteKasbon = async (req, res) => {
  try {
    const { id } = req.params;

    const kasbon = await prisma.kasbonSementara.findUnique({ where: { id } });
    if (!kasbon) return res.status(404).json({ message: "Kasbon tidak ditemukan" });
    if (kasbon.status !== "PENDING") {
      return res.status(400).json({ message: "Hanya kasbon berstatus PENDING yang dapat dihapus" });
    }

    await prisma.kasbonSementara.delete({ where: { id } });
    res.json({ message: "Kasbon berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting kasbon:", error);
    res.status(500).json({ message: error.message });
  }
};

// Legacy — kept for backward compatibility
export const updateKasbonStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, tanggalPenyelesaian } = req.body;
    const kasbon = await prisma.kasbonSementara.update({
      where: { id },
      data: {
        status,
        tanggalPenyelesaian: tanggalPenyelesaian ? new Date(tanggalPenyelesaian) : undefined,
      },
    });
    res.json(kasbon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- MOBILE/FLUTTER CUSTOM EMPLOYEE ENDPOINTS ---

/**
 * Fetch loans for the currently logged-in employee
 * GET /api/loans/my-loans
 */
export const getMyLoans = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Authentication required" });

    const karyawan = await prisma.karyawan.findUnique({
      where: { userId },
    });
    if (!karyawan) {
      return res.status(404).json({ message: "Data karyawan tidak ditemukan" });
    }

    const loans = await prisma.pinjaman.findMany({
      where: { karyawanId: karyawan.id },
      include: {
        details: {
          orderBy: { bulanKe: "asc" },
        },
      },
      orderBy: { tanggalPinjam: "desc" },
    });

    res.json(loans);
  } catch (error) {
    console.error("Error fetching my loans:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Fetch kasbon history for the currently logged-in employee
 * GET /api/loans/my-kasbon
 */
export const getMyKasbon = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Authentication required" });

    const karyawan = await prisma.karyawan.findUnique({
      where: { userId },
    });
    if (!karyawan) {
      return res.status(404).json({ message: "Data karyawan tidak ditemukan" });
    }

    const kasbon = await prisma.kasbonSementara.findMany({
      where: { karyawanId: karyawan.id },
      orderBy: { tanggal: "desc" },
    });

    res.json(kasbon);
  } catch (error) {
    console.error("Error fetching my kasbon:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Apply for a new kasbon as the logged-in employee
 * POST /api/loans/my-kasbon
 */
export const applyMyKasbon = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Authentication required" });

    const karyawan = await prisma.karyawan.findUnique({
      where: { userId },
      select: { id: true, gajiPokok: true },
    });
    if (!karyawan) {
      return res.status(404).json({ message: "Data karyawan tidak ditemukan" });
    }

    const { jumlah, keperluan, bulanPotong, catatan } = req.body;
    if (!jumlah) {
      return res.status(400).json({ message: "Jumlah kasbon wajib diisi" });
    }

    const amount = parseFloat(jumlah);

    // Soft warning if exceeds 50% basic salary
    let warningMessage = null;
    if (karyawan.gajiPokok && amount > karyawan.gajiPokok * 0.5) {
      warningMessage = `Jumlah kasbon melebihi 50% gaji pokok (${karyawan.gajiPokok * 0.5})`;
    }

    const kasbon = await prisma.kasbonSementara.create({
      data: {
        karyawanId: karyawan.id,
        jumlah: amount,
        keperluan,
        bulanPotong: bulanPotong ? new Date(bulanPotong) : null,
        catatan,
        status: "PENDING",
      },
    });

    // Send Real-time Notification to Admins
    try {
      const employeeDetails = await prisma.karyawan.findUnique({
        where: { id: karyawan.id },
        select: { namaLengkap: true }
      });
      await NotificationService.broadcastToAdmins({
        title: "🪙 Pengajuan Kasbon Baru",
        body: `${employeeDetails?.namaLengkap || 'Karyawan'} mengajukan Kasbon sebesar Rp${amount.toLocaleString('id-ID')}.`,
        type: "cash_advance_request",
        data: {
          id: kasbon.id,
          karyawanId: karyawan.id,
          karyawanName: employeeDetails?.namaLengkap || '',
          jumlah: String(amount),
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
      });
    } catch (notifError) {
      console.error("[Notification] Failed to send admin notification for kasbon request:", notifError.message);
    }

    res.status(201).json({ ...kasbon, warning: warningMessage });
  } catch (error) {
    console.error("Error applying my kasbon:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Apply for a new loan as the logged-in employee
 * POST /api/loans/apply-loan
 */
export const applyLoan = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Authentication required" });

    const karyawan = await prisma.karyawan.findUnique({
      where: { userId },
      select: { id: true, gajiPokok: true },
    });
    if (!karyawan) {
      return res.status(404).json({ message: "Data karyawan tidak ditemukan" });
    }

    const { jumlahPinjaman, tenor, keterangan, bunga = 0 } = req.body;
    if (!jumlahPinjaman || !tenor) {
      return res.status(400).json({ message: "Jumlah pinjaman dan tenor wajib diisi" });
    }

    const amount = parseFloat(jumlahPinjaman);
    const months = parseInt(tenor);
    const interest = parseFloat(bunga || 0);

    if (amount <= 0 || months <= 0) {
      return res.status(400).json({ message: "Jumlah pinjaman dan tenor harus lebih besar dari 0" });
    }

    const totalWithInterest = amount + (amount * (interest / 100));
    const angsuranBulanan = Math.ceil(totalWithInterest / months);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Pinjaman as DRAFT
      const loan = await tx.pinjaman.create({
        data: {
          karyawanId: karyawan.id,
          tanggalPinjam: new Date(),
          jumlahPinjaman: amount,
          tenor: months,
          bunga: interest,
          angsuranBulanan: angsuranBulanan,
          sisaPinjaman: totalWithInterest,
          status: "DRAFT",
          keterangan,
        },
      });

      // 2. Create PinjamanDetails (Schedule)
      const startDate = new Date();
      const detailsData = [];
      for (let i = 1; i <= months; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        detailsData.push({
          pinjamanId: loan.id,
          bulanKe: i,
          tanggalJatuhTempo: dueDate,
          jumlahBayar: angsuranBulanan,
          status: "PENDING",
        });
      }
      await tx.pinjamanDetail.createMany({ data: detailsData });

      return loan;
    });

    // Send Real-time Notification to Admins
    try {
      const employeeDetails = await prisma.karyawan.findUnique({
        where: { id: karyawan.id },
        select: { namaLengkap: true }
      });
      await NotificationService.broadcastToAdmins({
        title: "💵 Pengajuan Pinjaman Baru",
        body: `${employeeDetails?.namaLengkap || 'Karyawan'} mengajukan Pinjaman sebesar Rp${amount.toLocaleString('id-ID')} dengan tenor ${months} bulan.`,
        type: "loan_request",
        data: {
          id: result.id,
          karyawanId: karyawan.id,
          karyawanName: employeeDetails?.namaLengkap || '',
          jumlah: String(amount),
          tenor: String(months),
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
      });
    } catch (notifError) {
      console.error("[Notification] Failed to send admin notification for loan request:", notifError.message);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error("Error applying loan:", error);
    res.status(500).json({ message: error.message });
  }
};


