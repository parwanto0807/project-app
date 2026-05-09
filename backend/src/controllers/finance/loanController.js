import { prisma } from "../../config/db.js";
import { createLedgerEntry } from "../../utils/journalHelper.js";

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
    });

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
        karyawan: { select: { namaLengkap: true, nik: true } },
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
    const { karyawanId, jumlah, keperluan } = req.body;
    const kasbon = await prisma.kasbonSementara.create({
      data: {
        karyawanId,
        jumlah: parseFloat(jumlah),
        keperluan,
        status: "PENDING",
      },
    });
    res.status(201).json(kasbon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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
