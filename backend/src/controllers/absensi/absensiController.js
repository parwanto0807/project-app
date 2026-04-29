import { prisma } from "../../config/db.js";

export const getAllAbsensi = async (req, res) => {
  try {
    const { startDate, endDate, karyawanId } = req.query;
    const absensi = await prisma.absensi.findMany({
      where: {
        ...(karyawanId && { karyawanId }),
        ...(startDate && endDate && {
          tanggal: {
            gte: new Date(startDate),
            lte: new Date(endDate),
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
      orderBy: { tanggal: "desc" },
    });
    res.json(absensi);
  } catch (error) {
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
