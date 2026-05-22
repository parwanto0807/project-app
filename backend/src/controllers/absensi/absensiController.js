import { prisma } from "../../config/db.js";

// Jam standar kerja (bisa dikonfigurasi dari PayrollConfig)
const JAM_STANDAR_MASUK  = "07:00";
const JAM_STANDAR_KELUAR = "17:00"; // 8 jam kerja

export const getAllAbsensi = async (req, res) => {
  try {
    const { startDate, endDate, karyawanId, employeeName, needsValidation } = req.query;
    ;(() => {})("[DEBUG] Fetching Absensi with params:", { startDate, endDate, karyawanId, employeeName, needsValidation });

    const where = {
      ...(karyawanId && { karyawanId }),
      karyawan: {
        isActive: true,
        statusKerja: { not: "non-aktif" },
        ...(employeeName && {
          namaLengkap: { contains: employeeName, mode: "insensitive" },
        }),
      },
    };

    // Filter tanggal yang lebih fleksibel (Gunakan UTC+7/WIB untuk Production)
    if (startDate && endDate) {
      // Set start: 00:00:00 WIB -> UTC
      const start = new Date(`${startDate}T00:00:00+07:00`);
      // Set end: 23:59:59 WIB -> UTC
      const end = new Date(`${endDate}T23:59:59.999+07:00`);
      
      where.tanggal = {
        gte: start,
        lte: end,
      };
      ;(() => {})("[DEBUG] Date Filter applied:", { gte: start, lte: end });
    }

    if (needsValidation === "true") {
      where.isValidated = false;
      where.jamKeluar = { not: null };
    }

    let absensi = await prisma.absensi.findMany({
      where,
      include: {
        karyawan: {
          include: {
            teamKaryawan: {
              include: {
                team: true
              }
            },
            attendanceLocation: true
          }
        },
      },
      orderBy: [
        { tanggal: "desc" },
        { jamMasuk: "desc" }
      ],
    });

    if (startDate && endDate && needsValidation !== "true") {
      const start = new Date(`${startDate}T00:00:00+07:00`);
      const end = new Date(`${endDate}T23:59:59.999+07:00`);
      
      // Hitung yesterday dalam WIB
      const nowWIB = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
      const yesterdayWIB = new Date(nowWIB.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayStr = yesterdayWIB.toISOString().split('T')[0];
      const yesterday = new Date(`${yesterdayStr}T23:59:59.999+07:00`);

      // Jangan tampilkan mangkir untuk hari ini atau di masa depan
      const loopEnd = end > yesterday ? yesterday : end;

      const wajibKaryawanWhere = {
        isActive: true,
        statusKerja: { not: "non-aktif" },
        wajibAbsen: true,
      };
      if (karyawanId) wajibKaryawanWhere.id = karyawanId;
      if (employeeName) wajibKaryawanWhere.namaLengkap = { contains: employeeName, mode: "insensitive" };

      const wajibKaryawan = await prisma.karyawan.findMany({
        where: wajibKaryawanWhere,
        include: {
          attendanceLocation: true
        }
      });

      const virtualRecords = [];
      const getLocalDateStr = (dateObj) => {
        // Asumsikan dateObj adalah waktu UTC, konversi ke WIB (+7)
        const d = new Date(dateObj.getTime() + 7 * 60 * 60 * 1000);
        return d.toISOString().split('T')[0];
      };

      const absensiMap = new Set(absensi.map(a => `${a.karyawanId}_${getLocalDateStr(a.tanggal)}`));

      // Iterasi tiap tanggal dalam rentang (menggunakan local WIB logic)
      // d kita set jam 12 siang WIB agar aman dari pergeseran hari
      const d = new Date(`${startDate}T12:00:00+07:00`);

      while (d <= loopEnd || getLocalDateStr(d) === getLocalDateStr(loopEnd)) {
        const dateStr = getLocalDateStr(d);
        
        for (const k of wajibKaryawan) {
          const key = `${k.id}_${dateStr}`;
          if (!absensiMap.has(key)) {
            // Abaikan jika karyawan bergabung setelah tanggal ini
            if (k.tanggalMasuk && getLocalDateStr(k.tanggalMasuk) > dateStr) continue;
            // Abaikan jika karyawan keluar sebelum tanggal ini
            if (k.tanggalKeluar && getLocalDateStr(k.tanggalKeluar) < dateStr) continue;

            const virtualDate = new Date(`${dateStr}T08:00:00+07:00`);

            virtualRecords.push({
              id: `virtual-${k.id}-${dateStr}`,
              karyawanId: k.id,
              tanggal: virtualDate,
              jamMasuk: null,
              jamKeluar: null,
              status: "MANGKIR",
              keterangan: "Tidak ada catatan absensi",
              isMissing: true,
              karyawan: k
            });
          }
        }
        d.setDate(d.getDate() + 1);
        // Pastikan tidak kebablasan dari loopEnd
        if (getLocalDateStr(d) > getLocalDateStr(loopEnd)) break;
      }

      absensi = [...absensi, ...virtualRecords].sort((a, b) => {
        const dateA = new Date(a.tanggal).getTime();
        const dateB = new Date(b.tanggal).getTime();
        if (dateA !== dateB) return dateB - dateA;
        if (a.jamMasuk && b.jamMasuk) return new Date(b.jamMasuk).getTime() - new Date(a.jamMasuk).getTime();
        return 0;
      });
    }

    ;(() => {})(`[DEBUG] Found ${absensi.length} records`);
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
