import { prisma } from "../../config/db.js";
import { createLedgerEntry } from "../../utils/journalHelper.js";

// --- GAJI ---
export const getAllGaji = async (req, res) => {
  try {
    const { periode } = req.query;
    const gaji = await prisma.gaji.findMany({
      where: {
        ...(periode && {
          periode: {
            gte: new Date(periode),
            lt: new Date(new Date(periode).setMonth(new Date(periode).getMonth() + 1)),
          },
        }),
      },
      include: {
        karyawan: {
          select: {
            namaLengkap: true,
            nik: true,
            jabatan: true,
            departemen: true,
          },
        },
      },
      orderBy: { periode: "desc" },
    });
    res.json(gaji);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createGaji = async (req, res) => {
  try {
    const {
      karyawanId,
      periode,
      periodeMulai,
      periodeSelesai,
      gajiPokok,
      tunjangan = 0,
      potongan = 0,
      totalJamLembur = 0,
      pajak = 0,
      potonganPinjaman = 0,
      potonganKasbon = 0,
      potonganDpGaji = 0,
    } = req.body;

    const periodDate = new Date(periode);
    const startOfMonth = new Date(periodDate.getFullYear(), periodDate.getMonth(), 1);
    const endOfMonth = new Date(periodDate.getFullYear(), periodDate.getMonth() + 1, 0, 23, 59, 59);

    // Find active loan installments for this period
    const loanDetails = await prisma.pinjamanDetail.findMany({
      where: {
        pinjaman: { karyawanId },
        status: "PENDING",
        tanggalJatuhTempo: {
          gte: startOfMonth,
          lte: endOfMonth,
        }
      },
      include: { pinjaman: true }
    });

    const totalLoanDeduction = loanDetails.reduce((sum, detail) => sum + Number(detail.jumlahBayar), 0);
    const actualPotonganPinjaman = totalLoanDeduction || parseFloat(potonganPinjaman || 0);

    const total = parseFloat(gajiPokok) + parseFloat(tunjangan) - parseFloat(potongan) - parseFloat(pajak) - actualPotonganPinjaman - parseFloat(potonganKasbon) - parseFloat(potonganDpGaji);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Gaji
      const gaji = await tx.gaji.create({
        data: {
          karyawanId,
          periode: new Date(periode),
          periodeMulai: new Date(periodeMulai),
          periodeSelesai: new Date(periodeSelesai),
          gajiPokok: parseFloat(gajiPokok),
          tunjangan: parseFloat(tunjangan),
          potongan: parseFloat(potongan),
          totalJamLembur: parseFloat(totalJamLembur),
          pajak: parseFloat(pajak),
          potonganPinjaman: actualPotonganPinjaman,
          potonganKasbon: parseFloat(potonganKasbon),
          potonganDpGaji: parseFloat(potonganDpGaji),
          total: parseFloat(total),
        },
      });

      // 2. Mark Loan Details as PAID
      if (loanDetails.length > 0) {
        for (const detail of loanDetails) {
          await tx.pinjamanDetail.update({
            where: { id: detail.id },
            data: {
              status: "PAID",
              tanggalBayar: new Date(),
            }
          });

          await tx.pinjaman.update({
            where: { id: detail.pinjamanId },
            data: {
              sisaPinjaman: { decrement: detail.jumlahBayar }
            }
          });

          // Check if loan is completed
          const updatedLoan = await tx.pinjaman.findUnique({
            where: { id: detail.pinjamanId }
          });
          if (updatedLoan && Number(updatedLoan.sisaPinjaman) <= 0) {
            await tx.pinjaman.update({
              where: { id: detail.pinjamanId },
              data: { status: "COMPLETED" }
            });
          }
        }
      }

      // 3. Financial Integration (Journal Entry)
      const ledgerEntries = [
        {
          systemAccountKey: "EXPENSE_SALARY",
          debit: parseFloat(gajiPokok) + parseFloat(tunjangan),
        }
      ];

      if (actualPotonganPinjaman > 0) {
        ledgerEntries.push({
          systemAccountKey: "EMPLOYEE_LOAN_ACCOUNT",
          credit: actualPotonganPinjaman,
          karyawanId: karyawanId,
        });
      }

      ledgerEntries.push({
        systemAccountKey: "ACCOUNTS_PAYABLE",
        credit: total,
      });

      if (parseFloat(pajak) > 0) {
        ledgerEntries.push({
          systemAccountKey: "ACCOUNTS_PAYABLE",
          credit: parseFloat(pajak),
          keterangan: "Potongan Pajak PPh21",
        });
      }

      await createLedgerEntry({
        referenceType: "JOURNAL",
        referenceId: gaji.id,
        referenceNumber: `PAYROLL-${gaji.id.substring(0, 8).toUpperCase()}`,
        tanggal: new Date(periode),
        keterangan: `Payroll Periode ${periode} - Karyawan ID: ${karyawanId}`,
        entries: ledgerEntries,
        createdById: "SYSTEM",
        tx
      });

      return gaji;
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- PAYROLL CONFIG ---
export const getPayrollConfigs = async (req, res) => {
  try {
    const configs = await prisma.payrollConfig.findMany();
    res.json(configs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createPayrollConfig = async (req, res) => {
  try {
    const { name, gajiPerHari, lemburPerJam, isActive } = req.body;
    const config = await prisma.payrollConfig.create({
      data: {
        name,
        gajiPerHari: parseFloat(gajiPerHari),
        lemburPerJam: parseFloat(lemburPerJam),
        isActive: isActive !== undefined ? isActive : true,
      },
    });
    res.status(201).json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePayrollConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, gajiPerHari, lemburPerJam, isActive } = req.body;
    const config = await prisma.payrollConfig.update({
      where: { id },
      data: {
        name,
        gajiPerHari: gajiPerHari !== undefined ? parseFloat(gajiPerHari) : undefined,
        lemburPerJam: lemburPerJam !== undefined ? parseFloat(lemburPerJam) : undefined,
        isActive,
      },
    });
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
