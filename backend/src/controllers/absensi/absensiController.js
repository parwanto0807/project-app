import { prisma } from "../../config/db.js";

// Jam standar kerja (bisa dikonfigurasi dari PayrollConfig)
const JAM_STANDAR_MASUK  = "07:00";
const JAM_STANDAR_KELUAR = "17:00"; // 8 jam kerja

export const getAllAbsensi = async (req, res) => {
  try {
    const { startDate, endDate, karyawanId, employeeName, needsValidation } = req.query;
    console.log("[DEBUG] Fetching Absensi with params:", { startDate, endDate, karyawanId, employeeName, needsValidation });

    const where = {
      ...(karyawanId && { karyawanId }),
      ...(employeeName && {
        karyawan: {
          namaLengkap: { contains: employeeName, mode: "insensitive" },
        },
      }),
    };

    // Filter tanggal yang lebih fleksibel
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Jika tanggal sama (filter hari ini), pastikan mencakup 00:00 sampai 23:59
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      
      where.tanggal = {
        gte: start,
        lte: end,
      };
      console.log("[DEBUG] Date Filter applied:", { gte: start, lte: end });
    }

    if (needsValidation === "true") {
      where.isValidated = false;
      where.jamKeluar = { not: null };
    }

    const absensi = await prisma.absensi.findMany({
      where,
      include: {
        karyawan: true,
      },
      orderBy: { tanggal: "desc" },
    });

    console.log(`[DEBUG] Found ${absensi.length} records`);
    res.json(absensi);
  } catch (error) {
    console.error("[getAllAbsensi ERROR]", error);
    res.status(500).json({ message: error.message });
  }
};

export const createAbsensi = async (req, res) => {
  try {
    const { karyawanId, tanggal, jamMasuk, jamKeluar, jamLembur, status, keterangan } = req.body;
    const absensi = await prisma.absensi.create({
      data: {
        karyawanId,
        tanggal: new Date(tanggal),
        jamMasuk: jamMasuk ? new Date(jamMasuk) : null,
        jamKeluar: jamKeluar ? new Date(jamKeluar) : null,
        jamLembur: jamLembur ? parseFloat(jamLembur) : 0,
        status,
        keterangan,
      },
    });
    res.status(201).json(absensi);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAbsensi = async (req, res) => {
  try {
    const { id } = req.params;
    const { jamMasuk, jamKeluar, jamLembur, status, keterangan } = req.body;
    const absensi = await prisma.absensi.update({
      where: { id },
      data: {
        jamMasuk: jamMasuk ? new Date(jamMasuk) : undefined,
        jamKeluar: jamKeluar ? new Date(jamKeluar) : undefined,
        jamLembur: jamLembur !== undefined ? parseFloat(jamLembur) : undefined,
        status,
        keterangan,
      },
    });
    res.json(absensi);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAbsensi = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.absensi.delete({ where: { id } });
    res.json({ message: "Data absensi berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * PATCH /absensi/:id/validate
 * Admin memvalidasi jam keluar karyawan
 * Body: { jamKeluarDisetujui, catatanValidasi, jamLembur }
 */
export const validateAbsensi = async (req, res) => {
  try {
    const { id } = req.params;
    const { jamKeluarDisetujui, catatanValidasi, jamLembur } = req.body;

    const record = await prisma.absensi.findUnique({ where: { id } });
    if (!record) return res.status(404).json({ message: "Data absensi tidak ditemukan" });

    // Ambil config payroll untuk threshold jam kerja normal
    const config = await prisma.payrollConfig.findFirst({ where: { isActive: true } });
    const threshold = config?.jamKerjaPerHari || 9;

    // Hitung jam kerja efektif berdasarkan jam keluar yang disetujui
    let jamKerjaDisetujui = null;
    if (record.jamMasuk && jamKeluarDisetujui) {
      const masuk = new Date(record.jamMasuk);
      const keluar = new Date(jamKeluarDisetujui);
      const diffMs = keluar.getTime() - masuk.getTime();
      jamKerjaDisetujui = diffMs > 0 ? Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100 : 0;
    }

    // Hitung lembur otomatis jika tidak disediakan di body
    let finalJamLembur = jamLembur !== undefined ? parseFloat(jamLembur) : 0;
    if (jamLembur === undefined && jamKerjaDisetujui > threshold) {
      finalJamLembur = Math.round((jamKerjaDisetujui - threshold) * 100) / 100;
    }

    const updated = await prisma.absensi.update({
      where: { id },
      data: {
        jamKeluarDisetujui: jamKeluarDisetujui ? new Date(jamKeluarDisetujui) : null,
        jamKerjaDisetujui,
        isValidated: true,
        validatedBy: req.user?.id || "Admin",
        validatedAt: new Date(),
        catatanValidasi: catatanValidasi || null,
        jamLembur: finalJamLembur,
      },
      include: {
        karyawan: { select: { namaLengkap: true, nik: true } },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Error validateAbsensi:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * PATCH /absensi/:id/approve
 * Admin menyetujui jam keluar apa adanya (tanpa koreksi)
 */
export const approveAbsensi = async (req, res) => {
  try {
    const { id } = req.params;
    const { catatanValidasi } = req.body;

    const record = await prisma.absensi.findUnique({ where: { id } });
    if (!record) return res.status(404).json({ message: "Data absensi tidak ditemukan" });

    // Ambil config payroll untuk threshold jam kerja normal
    const config = await prisma.payrollConfig.findFirst({ where: { isActive: true } });
    const threshold = config?.jamKerjaPerHari || 9;

    // Hitung jam kerja dari jam keluar asli
    let jamKerjaDisetujui = null;
    if (record.jamMasuk && record.jamKeluar) {
      const masuk = new Date(record.jamMasuk);
      const keluar = new Date(record.jamKeluar);
      const diffMs = keluar.getTime() - masuk.getTime();
      jamKerjaDisetujui = diffMs > 0 ? Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100 : 0;
    }

    // Hitung lembur otomatis
    let jamLembur = 0;
    if (jamKerjaDisetujui > threshold) {
      jamLembur = Math.round((jamKerjaDisetujui - threshold) * 100) / 100;
    }

    const updated = await prisma.absensi.update({
      where: { id },
      data: {
        jamKeluarDisetujui: record.jamKeluar, // pakai jam keluar asli
        jamKerjaDisetujui,
        isValidated: true,
        validatedBy: req.user?.id || "Admin",
        validatedAt: new Date(),
        catatanValidasi: catatanValidasi || "Disetujui",
        jamLembur,
      },
      include: {
        karyawan: { select: { namaLengkap: true, nik: true } },
      },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
