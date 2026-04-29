import { prisma } from "../../config/db.js";

// --- PINJAMAN ---
export const getAllPinjaman = async (req, res) => {
  try {
    const { karyawanId, status } = req.query;
    const pinjaman = await prisma.pinjaman.findMany({
      where: {
        ...(karyawanId && { karyawanId }),
        ...(status && { status }),
      },
      include: {
        karyawan: { select: { namaLengkap: true, nik: true } },
        details: true,
      },
      orderBy: { tanggalPinjam: "desc" },
    });
    res.json(pinjaman);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createPinjaman = async (req, res) => {
  try {
    const { karyawanId, jumlahPinjaman, tenor, bunga = 0 } = req.body;
    
    const jumlah = parseFloat(jumlahPinjaman);
    const angsuran = jumlah / tenor; // Simple logic, can be enhanced with bunga

    const pinjaman = await prisma.pinjaman.create({
      data: {
        karyawanId,
        jumlahPinjaman: jumlah,
        tenor: parseInt(tenor),
        bunga: parseFloat(bunga),
        angsuranBulanan: angsuran,
        sisaPinjaman: jumlah,
        status: "ACTIVE",
        details: {
          create: Array.from({ length: tenor }).map((_, i) => ({
            bulanKe: i + 1,
            tanggalJatuhTempo: new Date(new Date().setMonth(new Date().getMonth() + i + 1)),
            jumlahBayar: angsuran,
            status: "PENDING",
          })),
        },
      },
      include: { details: true },
    });
    res.status(201).json(pinjaman);
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
