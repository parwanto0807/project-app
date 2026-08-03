import { prisma } from "../../config/db.js";

const JAM_CUTOFF_AKTIF = 36 * 60 * 60 * 1000;

/**
 * POST /kegiatan-absensi/start
 * Mulai kegiatan survey/dinas/lain. Wajib foto + verifikasi GPS.
 * Menolak fake gps; cek bentrok dengan sesi kegiatan aktif.
 */
export const startKegiatan = async (req, res) => {
  try {
    const { latitude, longitude, isMocked, deviceDetails, deviceType, jenis, keterangan } = req.body;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Authentication required" });

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const isMockedValue = isMocked === 'true' || isMocked === true;

    if (isMockedValue) {
      return res.status(403).json({ success: false, code: "FAKE_GPS_DETECTED", message: "Kecurangan terdeteksi! Penggunaan Fake GPS tidak diperbolehkan." });
    }

    const karyawan = await prisma.karyawan.findUnique({
      where: { userId },
      include: { attendanceLocation: true },
    });
    if (!karyawan) return res.status(404).json({ message: "Data karyawan tidak ditemukan" });

    // Tanpa geofencing — kegiatan bersifat mobile (survey/dinas di luar kantor)
    // GPS tetap terekam sebagai bukti. Radius kantor tidak dipaksakan.

    // Bentrok: masih ada kegiatan BERJALAN
    const cutoff = new Date(Date.now() - JAM_CUTOFF_AKTIF);
    const aktif = await prisma.absensiKegiatan.findFirst({
      where: { karyawanId: karyawan.id, status: "BERJALAN", jamMulai: { gte: cutoff } },
      orderBy: { jamMulai: "desc" },
    });
    if (aktif) {
      return res.status(400).json({ message: "Masih ada kegiatan yang sedang berjalan. Selesaikan dulu sebelum memulai baru." });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fotoPath = req.file ? `/images/attendance/${req.file.filename}` : null;

    const kegiatan = await prisma.absensiKegiatan.create({
      data: {
        karyawanId: karyawan.id,
        jenis: jenis || "SURVEY",
        tanggal: today,
        jamMulai: new Date(),
        fotoMulai: fotoPath,
        latMulai: lat || null,
        longMulai: lon || null,
        isMockedMulai: isMockedValue,
        deviceMulai: deviceType || deviceDetails || null,
        keterangan: keterangan || null,
        status: "BERJALAN",
      },
    });

    res.status(200).json({ success: true, message: "Kegiatan dimulai", data: kegiatan });
  } catch (error) {
    console.error("[startKegiatan ERROR]", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /kegiatan-absensi/:id/end
 * Selesaikan kegiatan — foto hasil + lokasi selesai, hitung durasi otomatis.
 */
export const endKegiatan = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, isMocked, deviceType, keterangan } = req.body;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Authentication required" });

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const isMockedValue = isMocked === 'true' || isMocked === true;

    if (isMockedValue) {
      return res.status(403).json({ success: false, code: "FAKE_GPS_DETECTED", message: "Kecurangan terdeteksi! Penggunaan Fake GPS tidak diperbolehkan." });
    }

    const kegiatan = await prisma.absensiKegiatan.findUnique({ where: { id } });
    if (!kegiatan) return res.status(404).json({ message: "Data kegiatan tidak ditemukan" });

    const karyawan = await prisma.karyawan.findUnique({ where: { userId } });
    if (!karyawan) return res.status(404).json({ message: "Data karyawan tidak ditemukan" });
    if (kegiatan.karyawanId !== karyawan.id) return res.status(403).json({ message: "Bukan kegiatan anda" });
    if (kegiatan.status === "SELESAI") return res.status(400).json({ message: "Kegiatan sudah diselesaikan" });

    const fotoPath = req.file ? `/images/attendance/${req.file.filename}` : null;
    const jamSelesai = new Date();
    const durasiJam = Math.round(((jamSelesai.getTime() - kegiatan.jamMulai.getTime()) / (1000 * 60 * 60)) * 100) / 100;

    const updated = await prisma.absensiKegiatan.update({
      where: { id },
      data: {
        jamSelesai,
        durasiJam: durasiJam > 0 ? durasiJam : 0,
        fotoSelesai: fotoPath,
        latSelesai: lat || null,
        longSelesai: lon || null,
        isMockedSelesai: isMockedValue,
        keterangan: keterangan || kegiatan.keterangan,
        status: "SELESAI",
      },
    });

    res.status(200).json({ success: true, message: "Kegiatan selesai", data: updated });
  } catch (error) {
    console.error("[endKegiatan ERROR]", error);
    res.status(500).json({ message: error.message });
  }
};

/** POST /kegiatan-absensi/:id/detail — simpan laporan (foto hasil + keterangan) saat sesi berjalan */
export const updateKegiatanDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const { keterangan } = req.body;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Authentication required" });

    const kegiatan = await prisma.absensiKegiatan.findUnique({ where: { id } });
    if (!kegiatan) return res.status(404).json({ message: "Data kegiatan tidak ditemukan" });

    const karyawan = await prisma.karyawan.findUnique({ where: { userId } });
    if (!karyawan) return res.status(404).json({ message: "Data karyawan tidak ditemukan" });
    if (kegiatan.karyawanId !== karyawan.id) return res.status(403).json({ message: "Bukan kegiatan anda" });
    if (kegiatan.status === "SELESAI") return res.status(400).json({ message: "Kegiatan sudah diselesaikan" });

    const fotoPath = req.file ? `/images/attendance/${req.file.filename}` : kegiatan.fotoKegiatan;

    const updated = await prisma.absensiKegiatan.update({
      where: { id },
      data: {
        fotoKegiatan: fotoPath,
        keterangan: keterangan || kegiatan.keterangan,
      },
    });

    res.status(200).json({ success: true, message: "Laporan kegiatan disimpan", data: updated });
  } catch (error) {
    console.error("[updateKegiatanDetail ERROR]", error);
    res.status(500).json({ message: error.message });
  }
};

/** GET /kegiatan-absensi/my — riwayat milik user */
export const getMyKegiatan = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { startDate, endDate, limit = 50 } = req.query;
    if (!userId) return res.status(401).json({ message: "Authentication required" });

    const karyawan = await prisma.karyawan.findUnique({ where: { userId } });
    if (!karyawan) return res.status(404).json({ message: "Data karyawan tidak ditemukan" });

    const kegiatan = await prisma.absensiKegiatan.findMany({
      where: {
        karyawanId: karyawan.id,
        ...(startDate && endDate && {
          tanggal: { gte: new Date(`${startDate}T00:00:00+07:00`), lte: new Date(`${endDate}T23:59:59.999+07:00`) },
        }),
      },
      orderBy: { jamMulai: "desc" },
      take: parseInt(limit),
    });

    res.json({ success: true, data: kegiatan });
  } catch (error) {
    console.error("[getMyKegiatan ERROR]", error);
    res.status(500).json({ message: error.message });
  }
};

/** GET /api/kegiatan-absensi — admin, dengan filter */
export const getAllKegiatan = async (req, res) => {
  try {
    const { startDate, endDate, karyawanId, status } = req.query;

    const where = {
      ...(karyawanId && { karyawanId }),
      ...(status && { status }),
      ...(startDate && endDate && {
        tanggal: { gte: new Date(`${startDate}T00:00:00+07:00`), lte: new Date(`${endDate}T23:59:59.999+07:00`) },
      }),
    };

    const kegiatan = await prisma.absensiKegiatan.findMany({
      where,
      include: { karyawan: { select: { id: true, nik: true, namaLengkap: true } } },
      orderBy: [{ tanggal: "desc" }, { jamMulai: "desc" }],
    });

    res.json(kegiatan);
  } catch (error) {
    console.error("[getAllKegiatan ERROR]", error);
    res.status(500).json({ message: error.message });
  }
};

/** DELETE /api/kegiatan-absensi/:id — admin */
export const deleteKegiatan = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.absensiKegiatan.delete({ where: { id } });
    res.json({ message: "Data kegiatan berhasil dihapus" });
  } catch (error) {
    console.error("[deleteKegiatan ERROR]", error);
    res.status(500).json({ message: error.message });
  }
};