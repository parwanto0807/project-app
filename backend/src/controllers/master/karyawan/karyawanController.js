import { PrismaClient } from "../../../../prisma/generated/prisma/index.js";
import { getNextKaryawanCode } from "../../../utils/generateCode.js";

const prisma = new PrismaClient();

export async function getKaryawanCount(req, res) {
  try {
    const { activeOnly = "true" } = req.query;
    const filter = activeOnly === "false" ? {} : { isActive: true };
    const count = await prisma.karyawan.count({
      where: filter,
    });
    res.json({ count });
  } catch (err) {
    console.error("[getKaryawanCount] error:", err);
    res.status(500).json({ message: "Gagal mengambil jumlah karyawan" });
  }
}

// CREATE karyawan
export const createKaryawan = async (req, res) => {
  try {
    const code = await getNextKaryawanCode();
    const fotoPath = req.file ? `/images/employee/${req.file.filename}` : null;

    const {
      nik,
      namaLengkap,
      tanggalLahir,
      alamat,
      nomorTelepon,
      email,
      jabatan,
      departemen,
      tanggalMasuk,
      tanggalKeluar,
      statusKerja,
      tipeKontrak,
      gajiPokok,
      tunjangan,
      potongan,
      userId,
      teamIds,
      isActive,
    } = req.body;

    // pastikan teamIds array
    const teamIdsArray =
      typeof teamIds === "string" ? JSON.parse(teamIds) : teamIds;

    const karyawan = await prisma.karyawan.create({
      data: {
        nik: nik || code,
        namaLengkap,
        tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : null,
        alamat,
        nomorTelepon,
        email,
        jabatan,
        departemen,
        tanggalMasuk: tanggalMasuk ? new Date(tanggalMasuk) : null,
        tanggalKeluar: tanggalKeluar ? new Date(tanggalKeluar) : null,
        statusKerja,
        tipeKontrak,
        gajiPokok: gajiPokok ? Number(gajiPokok) : 0,
        tunjangan: tunjangan ? Number(tunjangan) : 0,
        potongan: potongan ? Number(potongan) : 0,
        userId,
        foto: fotoPath,
        isActive: true,
        teamKaryawan: {
          create: teamIdsArray?.map((teamId) => ({ teamId })) || [],
        },
      },
      include: {
        teamKaryawan: { include: { team: true } },
        gaji: true,
        user: true,
      },
    });

    res.status(201).json(karyawan);
  } catch (error) {
    console.error("[createKaryawan] error:", error);
    res.status(500).json({ message: "Gagal membuat karyawan" });
  }
};

// GET all karyawan
export const getAllKaryawan = async (req, res) => {
  try {
    const karyawan = await prisma.karyawan.findMany({
      include: {
        teamKaryawan: { include: { team: true } },
        gaji: true,
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(karyawan);
  } catch (error) {
    console.error("[getAllKaryawan] error:", error);
    res.status(500).json({ message: "Gagal mengambil data karyawan" });
  }
};

// GET karyawan by ID
export const getKaryawanById = async (req, res) => {
  const { id } = req.params;
  try {
    const karyawan = await prisma.karyawan.findUnique({
      where: { id },
      include: {
        teamKaryawan: { include: { team: true } },
        gaji: true,
        user: true,
      },
    });

    if (!karyawan) {
      return res.status(404).json({ message: "Karyawan tidak ditemukan" });
    }

    res.json(karyawan);
  } catch (error) {
    console.error("[getKaryawanById] error:", error);
    res.status(500).json({ message: "Gagal mengambil detail karyawan" });
  }
};

// UPDATE karyawan
export const updateKaryawan = async (req, res) => {
  const { id } = req.params;
  const {
    namaLengkap,
    tanggalLahir,
    alamat,
    nomorTelepon,
    email,
    jabatan,
    departemen,
    tanggalMasuk,
    tanggalKeluar,
    statusKerja,
    tipeKontrak,
    gajiPokok,
    tunjangan,
    potongan,
    userId,
    teamIds, // array of teamId
    foto,
    isActive,
  } = req.body;

  try {
    const karyawan = await prisma.karyawan.update({
      where: { id },
      data: {
        namaLengkap,
        tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : null,
        alamat,
        nomorTelepon,
        email,
        jabatan,
        departemen,
        tanggalMasuk: tanggalMasuk ? new Date(tanggalMasuk) : null,
        tanggalKeluar: tanggalKeluar ? new Date(tanggalKeluar) : null,
        statusKerja,
        tipeKontrak,
        gajiPokok,
        tunjangan,
        potongan,
        userId,
        foto,
        isActive,

        // update relasi TeamKaryawan
        teamKaryawan: teamIds
          ? {
              deleteMany: {}, // hapus semua dulu
              create: teamIds.map((teamId) => ({ teamId })),
            }
          : undefined,
      },
      include: {
        teamKaryawan: { include: { team: true } },
        gaji: true,
        user: true,
      },
    });

    res.json(karyawan);
  } catch (error) {
    console.error("[updateKaryawan] error:", error);
    res.status(500).json({ message: "Gagal update karyawan" });
  }
};

// DELETE karyawan
export const deleteKaryawan = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.karyawan.delete({ where: { id } });
    res.json({ message: "Karyawan berhasil dihapus" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal menghapus karyawan" });
  }
};

// GET semua gaji
export const getAllGaji = async (req, res) => {
  try {
    const gaji = await prisma.gaji.findMany({
      include: {
        karyawan: true,
      },
    });
    res.json(gaji);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil data gaji" });
  }
};

// GET gaji by ID
export const getGajiById = async (req, res) => {
  const { id } = req.params;
  try {
    const gaji = await prisma.gaji.findUnique({
      where: { id },
      include: { karyawan: true },
    });
    if (!gaji) return res.status(404).json({ message: "Gaji tidak ditemukan" });
    res.json(gaji);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil data gaji" });
  }
};

// CREATE gaji
export const createGaji = async (req, res) => {
  const {
    karyawanId,
    periode,
    gajiPokok,
    tunjangan = 0,
    potongan = 0,
  } = req.body;
  try {
    const total = gajiPokok + tunjangan - potongan;
    const gaji = await prisma.gaji.create({
      data: {
        karyawanId,
        periode: new Date(periode),
        gajiPokok,
        tunjangan,
        potongan,
        total,
      },
      include: { karyawan: true },
    });
    res.status(201).json(gaji);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal membuat gaji" });
  }
};

// UPDATE gaji
export const updateGaji = async (req, res) => {
  const { id } = req.params;
  const { periode, gajiPokok, tunjangan = 0, potongan = 0 } = req.body;
  try {
    const total = gajiPokok + tunjangan - potongan;
    const gaji = await prisma.gaji.update({
      where: { id },
      data: {
        periode: periode ? new Date(periode) : undefined,
        gajiPokok,
        tunjangan,
        potongan,
        total,
      },
      include: { karyawan: true },
    });
    res.json(gaji);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal memperbarui gaji" });
  }
};

// DELETE gaji
export const deleteGaji = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.gaji.delete({ where: { id } });
    res.json({ message: "Gaji berhasil dihapus" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal menghapus gaji" });
  }
};

// GET semua team
export const getAllTeam = async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      include: { karyawan: { include: { karyawan: true } } },
    });
    res.json(teams);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil data team" });
  }
};

// GET team by ID
export const getTeamById = async (req, res) => {
  const { id } = req.params;
  try {
    const team = await prisma.team.findUnique({
      where: { id },
      include: { karyawan: { include: { karyawan: true } } },
    });
    if (!team) return res.status(404).json({ message: "Team tidak ditemukan" });
    res.json(team);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil data team" });
  }
};

// CREATE team
export const createTeam = async (req, res) => {
  const { namaTeam, karyawanIds = [] } = req.body;
  try {
    const team = await prisma.team.create({
      data: {
        namaTeam,
        karyawan: { create: karyawanIds.map((karyawanId) => ({ karyawanId })) },
      },
      include: { karyawan: { include: { karyawan: true } } },
    });
    res.status(201).json(team);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal membuat team" });
  }
};

// UPDATE team
export const updateTeam = async (req, res) => {
  const { id } = req.params;
  const { namaTeam, karyawanIds = [] } = req.body;
  try {
    const team = await prisma.team.update({
      where: { id },
      data: {
        namaTeam,
        karyawan: {
          deleteMany: {}, // hapus relasi lama
          create: karyawanIds.map((karyawanId) => ({ karyawanId })),
        },
      },
      include: { karyawan: { include: { karyawan: true } } },
    });
    res.json(team);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal memperbarui team" });
  }
};

// DELETE team
export const deleteTeam = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.team.delete({ where: { id } });
    res.json({ message: "Team berhasil dihapus" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal menghapus team" });
  }
};
