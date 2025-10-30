// import { PrismaClient } from "../../../../prisma/generated/prisma/index.js";
import { prisma } from "../../../config/db.js";
import { getNextKaryawanCode } from "../../../utils/generateCode.js";

// const prisma = new PrismaClient();

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
        nik: code,
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
      orderBy: { nik: "asc" },
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
  try {
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
      teamIds,
      isActive,
    } = req.body;

    const data = {
      namaLengkap,
      alamat,
      nomorTelepon,
      email,
      jabatan,
      departemen,
      statusKerja,
      tipeKontrak,
      isActive: isActive ?? true,
    };

    // 🖼️ handle file foto
    if (req.file) {
      // simpan path atau filename ke DB
      data.foto = `/images/employee/${req.file.filename}`;
    }

    // normalisasi tanggal
    if (tanggalLahir !== undefined) {
      data.tanggalLahir = tanggalLahir ? new Date(tanggalLahir) : null;
    }
    if (tanggalMasuk !== undefined) {
      data.tanggalMasuk = tanggalMasuk ? new Date(tanggalMasuk) : null;
    }
    if (tanggalKeluar !== undefined) {
      data.tanggalKeluar = tanggalKeluar ? new Date(tanggalKeluar) : null;
    }

    if (isActive !== undefined) {
      data.isActive = isActive === true || isActive === "true";
    }

    // normalisasi angka
    if (gajiPokok !== undefined)
      data.gajiPokok = gajiPokok ? Number(gajiPokok) : null;
    if (tunjangan !== undefined)
      data.tunjangan = tunjangan ? Number(tunjangan) : null;
    if (potongan !== undefined)
      data.potongan = potongan ? Number(potongan) : null;

    // normalisasi userId
    if (userId !== undefined) data.userId = userId || null;

    // relasi team
    if (teamIds) {
      data.teamKaryawan = {
        deleteMany: {},
        create: teamIds.map((teamId) => ({ teamId })),
      };
    }

    const karyawan = await prisma.karyawan.update({
      where: { id },
      data,
      include: {
        teamKaryawan: { include: { team: true } },
        gaji: true,
        user: true,
      },
    });

    res.json(karyawan);
  } catch (error) {
    console.error("[updateKaryawan] error:", error);
    res
      .status(500)
      .json({ message: "Gagal update karyawan", detail: error.message });
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
    // console.log(teams);
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
      include: {
        karyawan: {
          include: {
            karyawan: true,
          },
        },
      },
    });

    if (!team) return res.status(404).json({ message: "Team tidak ditemukan" });

    // Transform data to flatten structure
    const transformedTeam = {
      ...team,
      karyawan: team.karyawan.map((k) => k.karyawan),
    };

    res.json(transformedTeam);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil data team" });
  }
};

// CREATE team
// routes/teamRoutes.js (atau file route Anda)

export const createTeam = async (req, res) => {
  try {
    // ✅ Ambil data dari req.body (bukan formData)
    const { namaTeam, deskripsi = "", karyawanIds = [] } = req.body;

    // console.log("Data yang diterima:", { namaTeam, deskripsi, karyawanIds });

    // Validasi
    if (!namaTeam?.trim()) {
      return res.status(400).json({
        success: false,
        error: "Nama team wajib diisi",
      });
    }

    // 1. Buat record Team baru
    const newTeam = await prisma.team.create({
      data: {
        namaTeam: namaTeam.trim(),
        deskripsi: deskripsi.trim(),
      },
    });

    // 2. Jika ada karyawanIds, buat record TeamKaryawan
    if (Array.isArray(karyawanIds) && karyawanIds.length > 0) {
      // Validasi apakah semua karyawanId ada di database
      const existingKaryawans = await prisma.karyawan.findMany({
        where: {
          id: {
            in: karyawanIds,
          },
        },
        select: {
          id: true,
        },
      });

      const validKaryawanIds = existingKaryawans.map((k) => k.id);

      if (validKaryawanIds.length > 0) {
        // Buat relasi TeamKaryawan
        await prisma.teamKaryawan.createMany({
          data: validKaryawanIds.map((karyawanId) => ({
            teamId: newTeam.id,
            karyawanId: karyawanId,
          })),
        });
      }
    }

    // ✅ Kirim respons HTTP yang benar
    res.status(201).json({
      success: true,
      newTeam,
    });
  } catch (error) {
    console.error("Error creating team:", error);

    // ✅ Kirim error sebagai respons HTTP
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
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
    // Hapus semua relasi TeamKaryawan terlebih dahulu
    await prisma.teamKaryawan.deleteMany({
      where: { teamId: id },
    });

    // Baru hapus team
    await prisma.team.delete({
      where: { id },
    });

    res.json({ message: "Team berhasil dihapus" });
  } catch (error) {
    console.error(error);

    if (error.code === "P2025") {
      return res.status(404).json({ message: "Team tidak ditemukan" });
    }

    res
      .status(500)
      .json({ message: "Gagal menghapus team", error: error.message });
  }
};

export const fetchUserByEmail = async (req, res) => {
  try {
    const { email } = req.body; // ✅ ambil dari body form
    if (!email) {
      return res.status(400).json({ message: "Email wajib diisi." });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return res
        .status(404)
        .json({ message: `User dengan email ${email} tidak ditemukan.` });
    }

    res.status(200).json({
      message: "Data user berhasil diambil.",
      user,
    });
  } catch (error) {
    console.error("Error saat mengambil data user:", error);
    res
      .status(500)
      .json({ error: "Terjadi kesalahan server saat mengambil data user." });
  }
};

export const checkAccountEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      message: "Email wajib diisi.",
    });
  }

  try {
    const existingEmail = await prisma.accountEmail.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return res.status(200).json({ exists: true });
    } else {
      return res.status(200).json({ exists: false });
    }
  } catch (error) {
    console.error("Error saat memproses email:", error);
    res.status(500).json({
      error: "Terjadi kesalahan server.",
    });
  }
};

export const createAccountEmail = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email wajib diisi." });
  }

  try {
    const newAccountEmail = await prisma.accountEmail.create({
      data: { email },
    });

    return res.status(201).json({
      message: "Email berhasil didaftarkan.",
      data: newAccountEmail,
    });
  } catch (error) {
    console.error("Error saat membuat email:", error);
    res.status(500).json({ error: "Terjadi kesalahan server." });
  }
};

export const fetchKaryawanByEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email wajib diisi." });
    }

    const user = await prisma.karyawan.findUnique({
      where: { email },
      select: { id: true, email: true, namaLengkap: true },
    });

    if (!user) {
      return res
        .status(404)
        .json({ message: `Karyawan dengan email ${email} tidak ditemukan.` });
    }

    res.status(200).json({ message: "Data Karyawan berhasil diambil.", user });
  } catch (error) {
    console.error("Error saat mengambil data Karyawan:", error);
    res.status(500).json({ error: "Terjadi kesalahan server." });
  }
};
