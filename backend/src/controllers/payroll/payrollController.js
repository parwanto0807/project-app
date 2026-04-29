import { prisma } from "../../config/db.js";

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

    const total = gajiPokok + tunjangan - potongan - pajak - potonganPinjaman - potonganKasbon - potonganDpGaji;

    const gaji = await prisma.gaji.create({
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
        potonganPinjaman: parseFloat(potonganPinjaman),
        potonganKasbon: parseFloat(potonganKasbon),
        potonganDpGaji: parseFloat(potonganDpGaji),
        total: parseFloat(total),
      },
    });
    res.status(201).json(gaji);
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
