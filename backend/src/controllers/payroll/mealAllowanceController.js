import { prisma } from "../../config/db.js";

function getMealAllowanceDateRanges(periodeBulan, siklus) {
  const [year, month] = periodeBulan.split("-").map(Number);
  
  let cutOffStart, cutOffEnd;
  
  if (siklus === 1) {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    cutOffStart = new Date(prevYear, prevMonth - 1, 21, 0, 0, 0);
    cutOffEnd = new Date(year, month - 1, 5, 23, 59, 59, 999);
  } else if (siklus === 2) {
    cutOffStart = new Date(year, month - 1, 6, 0, 0, 0);
    cutOffEnd = new Date(year, month - 1, 20, 23, 59, 59, 999);
  } else {
    throw new Error("Siklus invalid");
  }

  return { cutOffStart, cutOffEnd };
}

export const getPreview = async (req, res) => {
  try {
    const { karyawanId } = req.params;
    const { periodeBulan, siklus } = req.query; 
    
    if (!periodeBulan || !siklus) {
      return res.status(400).json({ message: "periodeBulan dan siklus wajib diisi" });
    }

    const s = parseInt(siklus);
    const { cutOffStart, cutOffEnd } = getMealAllowanceDateRanges(periodeBulan, s);

    let karyawans = [];
    if (karyawanId === "ALL") {
      karyawans = await prisma.karyawan.findMany({
        where: { isActive: true },
        include: { payrollConfig: true }
      });
    } else {
      const karyawan = await prisma.karyawan.findUnique({
        where: { id: karyawanId },
        include: { payrollConfig: true }
      });
      if (karyawan) karyawans = [karyawan];
    }

    if (karyawans.length === 0) return res.status(404).json({ message: "Karyawan tidak ditemukan" });

    const globalConfig = await prisma.payrollConfig.findFirst({ where: { isActive: true } });

    const absensiList = await prisma.absensi.findMany({
      where: {
        karyawanId: { in: karyawans.map(k => k.id) },
        tanggal: { gte: cutOffStart, lte: cutOffEnd },
      },
      orderBy: { tanggal: "asc" }
    });

    const results = [];

    for (const karyawan of karyawans) {
      const config = karyawan.payrollConfig || globalConfig;
      
      const minJamKerjaUangMakan = config?.minJamKerjaUangMakan || 4;
      const minJamLemburUangMakan = config?.minJamLemburUangMakan || 3;
      const baseTunjanganMakan = karyawan.tunjanganMakan || config?.tunjanganMakan || 0;
      const baseUangMakanLembur = karyawan.uangMakanLembur || config?.uangMakanLembur || 0;

      const kAbsensi = absensiList.filter(a => a.karyawanId === karyawan.id);

      let totalHariHadir = 0;
      let totalJamLembur = 0;
      let nominalUangMakan = 0;
      let nominalUangMakanLembur = 0;
      let totalJamKerja = 0;
      const detailHarian = [];

      for (const a of kAbsensi) {
        let jamKerja = 0;
        if (a.jamMasuk && (a.jamKeluar || a.jamKeluarDisetujui)) {
          let diffMs = 0;
          if (a.jamKeluarDisetujui) {
            diffMs = new Date(a.jamKeluarDisetujui).getTime() - new Date(a.jamMasuk).getTime();
          } else {
            diffMs = new Date(a.jamKeluar).getTime() - new Date(a.jamMasuk).getTime();
          }
          jamKerja = diffMs > 0 ? diffMs / (1000 * 60 * 60) : 0;
        }
        
        totalJamKerja += jamKerja;

        let rawLembur = a.jamLembur || 0;
        let jamLembur = 0;
        
        if (rawLembur > 0) {
          let intPart = Math.floor(rawLembur);
          let fracPart = rawLembur - intPart;
          jamLembur = fracPart < 0.5 ? intPart : Math.round(rawLembur * 100) / 100;
        }

        let umHariIni = 0;
        if (a.status === "HADIR" || a.status === "TERLAMBAT") {
          if (jamKerja > minJamKerjaUangMakan) {
            umHariIni = baseTunjanganMakan;
            totalHariHadir += 1;
          }
        }

        let umlHariIni = 0;
        if (jamLembur > minJamLemburUangMakan) {
          umlHariIni = baseUangMakanLembur;
        }

        nominalUangMakan += umHariIni;
        nominalUangMakanLembur += umlHariIni;
        totalJamLembur += jamLembur;

        detailHarian.push({
          tanggal: a.tanggal,
          status: a.status,
          jamMasuk: a.jamMasuk,
          jamKeluar: a.jamKeluar,
          jamKerja: Math.round(jamKerja * 100) / 100,
          jamLembur,
          uangMakanHariIni: umHariIni,
          uangMakanLemburHariIni: umlHariIni
        });
      }

      if (karyawanId === "ALL" && totalJamKerja === 0 && totalJamLembur === 0) {
        continue;
      }

      const totalPencairan = nominalUangMakan + nominalUangMakanLembur;

      const existing = await prisma.pencairanUangMakan.findFirst({
        where: { karyawanId: karyawan.id, periodeBulan, siklus: s }
      });

      results.push({
        karyawan,
        kalkulasi: {
          totalHariHadir,
          totalJamLembur,
          nominalUangMakan,
          nominalUangMakanLembur,
          totalPencairan,
          detailHarian
        },
        sudahDiproses: !!existing,
        existingId: existing?.id || null
      });
    }

    if (karyawanId === "ALL") {
      let massHariHadir = 0;
      let massJamLembur = 0;
      let massNominalUangMakan = 0;
      let massNominalUangMakanLembur = 0;
      let massTotalPencairan = 0;

      for (const r of results) {
        if (!r.sudahDiproses) {
          massHariHadir += r.kalkulasi.totalHariHadir;
          massJamLembur += r.kalkulasi.totalJamLembur;
          massNominalUangMakan += r.kalkulasi.nominalUangMakan;
          massNominalUangMakanLembur += r.kalkulasi.nominalUangMakanLembur;
          massTotalPencairan += r.kalkulasi.totalPencairan;
        }
      }

      res.json({
        isAll: true,
        periodeBulan,
        siklus: s,
        cutOffStart,
        cutOffEnd,
        karyawan: { namaLengkap: `Semua Karyawan (${results.filter(r => !r.sudahDiproses).length} Orang)` },
        kalkulasi: {
          totalHariHadir: massHariHadir,
          totalJamLembur: massJamLembur,
          nominalUangMakan: massNominalUangMakan,
          nominalUangMakanLembur: massNominalUangMakanLembur,
          totalPencairan: massTotalPencairan
        },
        sudahDiproses: results.every(r => r.sudahDiproses),
        results
      });
    } else {
      res.json({
        isAll: false,
        karyawan: results[0].karyawan,
        periodeBulan,
        siklus: s,
        cutOffStart,
        cutOffEnd,
        kalkulasi: results[0].kalkulasi,
        sudahDiproses: results[0].sudahDiproses,
        existingId: results[0].existingId
      });
    }

  } catch (error) {
    console.error("getPreview error", error);
    res.status(500).json({ message: error.message });
  }
};

export const createDisbursement = async (req, res) => {
  try {
    const { karyawanId, periodeBulan, siklus } = req.body;
    if (!karyawanId || !periodeBulan || !siklus) return res.status(400).json({ message: "karyawanId, periodeBulan, siklus wajib diisi" });

    const s = parseInt(siklus);
    
    let karyawans = [];
    if (karyawanId === "ALL") {
      karyawans = await prisma.karyawan.findMany({
        where: { isActive: true },
        include: { payrollConfig: true }
      });
    } else {
      const karyawan = await prisma.karyawan.findUnique({ where: { id: karyawanId }, include: { payrollConfig: true } });
      if (karyawan) karyawans = [karyawan];
    }

    if (karyawans.length === 0) return res.status(404).json({ message: "Karyawan tidak ditemukan" });

    const { cutOffStart, cutOffEnd } = getMealAllowanceDateRanges(periodeBulan, s);
    const globalConfig = await prisma.payrollConfig.findFirst({ where: { isActive: true } });

    const absensiList = await prisma.absensi.findMany({
      where: { karyawanId: { in: karyawans.map(k => k.id) }, tanggal: { gte: cutOffStart, lte: cutOffEnd } }
    });

    const createdList = [];

    for (const karyawan of karyawans) {
      const existing = await prisma.pencairanUangMakan.findFirst({
        where: { karyawanId: karyawan.id, periodeBulan, siklus: s }
      });
      if (existing) continue; // Skip jika sudah ada untuk karyawan ini

      const config = karyawan.payrollConfig || globalConfig;

      const minJamKerjaUangMakan = config?.minJamKerjaUangMakan || 4;
      const minJamLemburUangMakan = config?.minJamLemburUangMakan || 3;
      const baseTunjanganMakan = karyawan.tunjanganMakan || config?.tunjanganMakan || 0;
      const baseUangMakanLembur = karyawan.uangMakanLembur || config?.uangMakanLembur || 0;

      const kAbsensi = absensiList.filter(a => a.karyawanId === karyawan.id);

      let totalHariHadir = 0;
      let totalJamLembur = 0;
      let nominalUangMakan = 0;
      let nominalUangMakanLembur = 0;
      let totalJamKerja = 0;

      for (const a of kAbsensi) {
        let jamKerja = 0;
        if (a.jamMasuk && (a.jamKeluar || a.jamKeluarDisetujui)) {
          let diffMs = new Date(a.jamKeluarDisetujui || a.jamKeluar).getTime() - new Date(a.jamMasuk).getTime();
          jamKerja = diffMs > 0 ? diffMs / (1000 * 60 * 60) : 0;
        }
        totalJamKerja += jamKerja;
        
        let rawLembur = a.jamLembur || 0;
        let jamLembur = 0;
        if (rawLembur > 0) {
          let intPart = Math.floor(rawLembur);
          let fracPart = rawLembur - intPart;
          jamLembur = fracPart < 0.5 ? intPart : Math.round(rawLembur * 100) / 100;
        }

        if (a.status === "HADIR" || a.status === "TERLAMBAT") {
          if (jamKerja > minJamKerjaUangMakan) {
            nominalUangMakan += baseTunjanganMakan;
            totalHariHadir += 1;
          }
        }
        if (jamLembur > minJamLemburUangMakan) {
          nominalUangMakanLembur += baseUangMakanLembur;
        }
        totalJamLembur += jamLembur;
      }

      if (karyawanId === "ALL" && totalJamKerja === 0 && totalJamLembur === 0) {
        continue;
      }

      const totalPencairan = nominalUangMakan + nominalUangMakanLembur;

      const created = await prisma.pencairanUangMakan.create({
        data: {
          karyawanId: karyawan.id,
          periodeBulan,
          siklus: s,
          cutOffStart,
          cutOffEnd,
          totalHariHadir,
          totalJamLembur,
          nominalUangMakan,
          nominalUangMakanLembur,
          totalPencairan,
          status: "DRAFT"
        }
      });
      createdList.push(created);
    }

    if (createdList.length === 0 && karyawanId !== "ALL") {
      return res.status(400).json({ message: "Pencairan siklus ini sudah ada" });
    } else if (createdList.length === 0 && karyawanId === "ALL") {
      return res.status(400).json({ message: "Semua karyawan sudah diproses untuk siklus ini" });
    }

    res.status(201).json({ success: true, data: createdList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllDisbursements = async (req, res) => {
  try {
    const { periodeBulan, siklus } = req.query;
    const where = {};
    if (periodeBulan) where.periodeBulan = periodeBulan;
    if (siklus) where.siklus = parseInt(siklus);

    const disbursements = await prisma.pencairanUangMakan.findMany({
      where,
      include: {
        karyawan: { select: { namaLengkap: true, nik: true, jabatan: true } }
      },
      orderBy: [{ periodeBulan: 'desc' }, { siklus: 'desc' }]
    });

    res.json({ success: true, data: disbursements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const postDisbursement = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || "SYSTEM";

    const d = await prisma.pencairanUangMakan.findUnique({
      where: { id },
      include: { karyawan: true }
    });

    if (!d) return res.status(404).json({ success: false, message: "Data tidak ditemukan" });
    if (d.status !== "DRAFT") return res.status(400).json({ success: false, message: "Hanya DRAFT yang bisa di-post" });

    const config = await prisma.payrollConfig.findFirst({ where: { isActive: true } });

    if (!config || !config.coaGajiPokok || !config.coaKasBankDefault) {
      return res.status(400).json({ success: false, message: "Konfigurasi akun (CoA) belum lengkap" });
    }

    const journalDescription = `Pencairan Uang Makan Siklus ${d.siklus} - ${d.periodeBulan} - ${d.karyawan.namaLengkap}`;
    const today = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.pencairanUangMakan.update({
        where: { id },
        data: { status: "POSTED" }
      });

      const debitAccountId = config.coaGajiPokok;
      const creditAccountId = config.coaKasBankDefault;

      const activePeriod = await tx.accountingPeriod.findFirst({ where: { status: "OPEN" } });
      
      const ledger = await tx.generalLedger.create({
        data: {
          transactionDate: today,
          reference: `UM-${d.periodeBulan}-${d.siklus}-${d.karyawan.nik}`,
          description: journalDescription,
          sourceModule: "PAYROLL",
          periodId: activePeriod?.id,
          createdBy: userId,
          lines: {
            create: [
              {
                coaId: debitAccountId,
                debitAmount: d.totalPencairan,
                creditAmount: 0,
                description: `Biaya Uang Makan ${d.karyawan.namaLengkap}`
              },
              {
                coaId: creditAccountId,
                debitAmount: 0,
                creditAmount: d.totalPencairan,
                description: `Pembayaran Uang Makan ${d.karyawan.namaLengkap}`
              }
            ]
          }
        },
        include: { lines: true }
      });

      if (activePeriod) {
        const normalizedDate = new Date(today);
        normalizedDate.setHours(0, 0, 0, 0);

        for (const line of ledger.lines) {
          await tx.generalLedgerSummary.upsert({
            where: {
              coaId_periodId_date: {
                coaId: line.coaId,
                periodId: activePeriod.id,
                date: normalizedDate,
              }
            },
            update: {
              totalDebit: { increment: line.debitAmount },
              totalCredit: { increment: line.creditAmount }
            },
            create: {
              coaId: line.coaId,
              periodId: activePeriod.id,
              date: normalizedDate,
              totalDebit: line.debitAmount,
              totalCredit: line.creditAmount
            }
          });

          const tb = await tx.trialBalance.findUnique({
            where: { periodId_coaId: { periodId: activePeriod.id, coaId: line.coaId } },
          });
          if (tb) {
            await tx.trialBalance.update({
              where: { id: tb.id },
              data: {
                periodDebit: { increment: line.debitAmount },
                periodCredit: { increment: line.creditAmount }
              }
            });
          }
        }
      }

      return updated;
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("postDisbursement error", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteDisbursement = async (req, res) => {
  try {
    const { id } = req.params;
    const d = await prisma.pencairanUangMakan.findUnique({ where: { id } });
    if (!d) return res.status(404).json({ success: false, message: "Data tidak ditemukan" });
    if (d.status === "POSTED") return res.status(400).json({ success: false, message: "Data POSTED tidak bisa dihapus. Harap VOID dulu." });

    await prisma.pencairanUangMakan.delete({ where: { id } });
    res.json({ success: true, message: "Berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const voidDisbursement = async (req, res) => {
  try {
    const { id } = req.params;
    const d = await prisma.pencairanUangMakan.findUnique({ where: { id } });
    if (!d) return res.status(404).json({ success: false, message: "Data tidak ditemukan" });
    if (d.status !== "POSTED") return res.status(400).json({ success: false, message: "Hanya data POSTED yang bisa di-VOID" });

    await prisma.$transaction(async (tx) => {
      await tx.pencairanUangMakan.update({ where: { id }, data: { status: "DRAFT" } });
    });

    await prisma.pencairanUangMakan.update({ where: { id }, data: { status: "DRAFT" } });

    res.json({ success: true, message: "Berhasil dibatalkan" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

async function calculateDisbursementDetail(disbursement) {
  const globalConfig = await prisma.payrollConfig.findFirst({ where: { isActive: true } });
  const config = disbursement.karyawan.payrollConfig || globalConfig;

  const minJamKerjaUangMakan = config?.minJamKerjaUangMakan || 4;
  const minJamLemburUangMakan = config?.minJamLemburUangMakan || 3;
  const baseTunjanganMakan = disbursement.karyawan.tunjanganMakan || config?.tunjanganMakan || 0;
  const baseUangMakanLembur = disbursement.karyawan.uangMakanLembur || config?.uangMakanLembur || 0;

  const absensiList = await prisma.absensi.findMany({
    where: {
      karyawanId: disbursement.karyawanId,
      tanggal: { gte: disbursement.cutOffStart, lte: disbursement.cutOffEnd },
    },
    orderBy: { tanggal: "asc" }
  });

  const detailHarian = [];
  for (const a of absensiList) {
    let jamKerja = 0;
    if (a.jamMasuk && (a.jamKeluar || a.jamKeluarDisetujui)) {
      let diffMs = 0;
      if (a.jamKeluarDisetujui) {
        diffMs = new Date(a.jamKeluarDisetujui).getTime() - new Date(a.jamMasuk).getTime();
      } else {
        diffMs = new Date(a.jamKeluar).getTime() - new Date(a.jamMasuk).getTime();
      }
      jamKerja = diffMs > 0 ? diffMs / (1000 * 60 * 60) : 0;
    }

    let rawLembur = a.jamLembur || 0;
    let jamLembur = 0;
    if (rawLembur > 0) {
      let intPart = Math.floor(rawLembur);
      let fracPart = rawLembur - intPart;
      jamLembur = fracPart < 0.5 ? intPart : Math.round(rawLembur * 100) / 100;
    }

    let umHariIni = 0;
    if (a.status === "HADIR" || a.status === "TERLAMBAT") {
      if (jamKerja > minJamKerjaUangMakan) {
        umHariIni = baseTunjanganMakan;
      }
    }

    let umlHariIni = 0;
    if (jamLembur > minJamLemburUangMakan) {
      umlHariIni = baseUangMakanLembur;
    }

    detailHarian.push({
      id: a.id,
      tanggal: a.tanggal,
      status: a.status,
      jamMasuk: a.jamMasuk,
      jamKeluar: a.jamKeluar,
      jamKerja: Math.round(jamKerja * 100) / 100,
      jamLembur,
      uangMakanHariIni: umHariIni,
      uangMakanLemburHariIni: umlHariIni,
      keterangan: a.keterangan || null
    });
  }

  return {
    ...disbursement,
    kalkulasi: {
      totalHariHadir: disbursement.totalHariHadir,
      totalJamLembur: disbursement.totalJamLembur,
      nominalUangMakan: disbursement.nominalUangMakan,
      nominalUangMakanLembur: disbursement.nominalUangMakanLembur,
      totalPencairan: disbursement.totalPencairan,
      detailHarian
    }
  };
}

/**
 * GET /payroll/meal-allowance/my-allowance
 * Mobile: Mengambil daftar riwayat pencairan uang makan milik karyawan yang login
 */
export const getMyDisbursements = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const karyawan = await prisma.karyawan.findUnique({ where: { userId } });
    if (!karyawan) return res.status(404).json({ success: false, message: "Data karyawan tidak ditemukan" });

    const disbursements = await prisma.pencairanUangMakan.findMany({
      where: {
        karyawanId: karyawan.id,
        status: { in: ["POSTED", "PUBLISHED"] },
      },
      include: {
        karyawan: {
          select: {
            id: true,
            namaLengkap: true,
            nik: true,
            jabatan: true,
            departemen: true,
            namaBank: true,
            nomorRekening: true,
          }
        }
      },
      orderBy: [{ periodeBulan: "desc" }, { siklus: "desc" }],
    });

    res.json({ success: true, data: disbursements });
  } catch (error) {
    console.error("getMyDisbursements error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /payroll/meal-allowance/my-allowance/:id
 * Mobile: Mengambil detail pencairan uang makan beserta rincian absensi harian (dengan cek ownership)
 */
export const getMyDisbursementDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const disbursement = await prisma.pencairanUangMakan.findUnique({
      where: { id },
      include: {
        karyawan: {
          select: {
            id: true,
            namaLengkap: true,
            nik: true,
            jabatan: true,
            departemen: true,
            tunjanganMakan: true,
            uangMakanLembur: true,
            payrollConfig: true,
            namaBank: true,
            nomorRekening: true,
          }
        }
      }
    });

    if (!disbursement) return res.status(404).json({ success: false, message: "Data pencairan uang makan tidak ditemukan" });

    const karyawan = await prisma.karyawan.findUnique({ where: { userId } });
    if (disbursement.karyawanId !== karyawan?.id) {
      return res.status(403).json({ success: false, message: "Anda tidak memiliki akses ke data ini" });
    }

    const result = await calculateDisbursementDetail(disbursement);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("getMyDisbursementDetail error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /payroll/meal-allowance/detail/:id
 * Admin/HR: Mengambil detail pencairan uang makan beserta rincian absensi harian
 */
export const getDisbursementDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const disbursement = await prisma.pencairanUangMakan.findUnique({
      where: { id },
      include: {
        karyawan: {
          select: {
            id: true,
            namaLengkap: true,
            nik: true,
            jabatan: true,
            departemen: true,
            tunjanganMakan: true,
            uangMakanLembur: true,
            payrollConfig: true,
            namaBank: true,
            nomorRekening: true,
          }
        }
      }
    });

    if (!disbursement) return res.status(404).json({ success: false, message: "Data pencairan uang makan tidak ditemukan" });

    const result = await calculateDisbursementDetail(disbursement);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("getDisbursementDetail error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
