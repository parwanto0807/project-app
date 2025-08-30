// /backend/controllers/spkReportController.js
import { PrismaClient } from "../../../prisma/generated/prisma/index.js";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// 💡 Membuat laporan lapangan (Progress atau Final)
export const createSpkFieldReport = async (req, res) => {
  try {
    const {
      spkId,
      karyawanId,
      type,
      note,
      soDetailId,
      progress: progressStr, // ← ambil sebagai string dulu
    } = req.body;

    // ✅ Konversi progress ke number
    const progress = progressStr ? parseInt(progressStr, 10) : 0;

    // Validasi wajib
    if (!spkId || !karyawanId || !type) {
      return res
        .status(400)
        .json({ error: "spkId, karyawanId, dan type wajib diisi." });
    }

    if (!["PROGRESS", "FINAL"].includes(type)) {
      return res
        .status(400)
        .json({ error: 'Type harus "PROGRESS" atau "FINAL".' });
    }

    if (isNaN(progress) || progress < 0 || progress > 100) {
      return res
        .status(400)
        .json({ error: "Progress harus angka antara 0-100" });
    }

    // Cek apakah SPK dan Karyawan ada
    const spk = await prisma.sPK.findUnique({ where: { id: spkId } });
    if (!spk) return res.status(404).json({ error: "SPK tidak ditemukan." });

    const karyawan = await prisma.karyawan.findUnique({
      where: { id: karyawanId },
    });
    if (!karyawan)
      return res.status(404).json({ error: "Karyawan tidak ditemukan." });

    // Cek akses
    const hasAccess = await prisma.sPKDetail.findFirst({
      where: {
        spkId,
        karyawanId,
      },
    });
    if (!hasAccess) {
      return res
        .status(403)
        .json({ error: "Anda tidak berwenang membuat laporan untuk SPK ini." });
    }

    // ✅ Simpan laporan
    const report = await prisma.sPKFieldReport.create({
      data: {
        spkId,
        karyawanId,
        type,
        progress,
        note: note || null,
        status: "PENDING",
        soDetailId: soDetailId || null,
      },
    });

    // Handle upload foto
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const photoPromises = req.files.map((photo) => {
        const imageUrl = `/images/spk/${photo.filename}`;
        return prisma.sPKFieldReportPhoto.create({
          data: {
            reportId: report.id,
            imageUrl,
            caption: photo.originalname,
            uploadedBy: karyawanId,
          },
        });
      });

      await Promise.all(photoPromises);
    }

    // ✅ HITUNG ULANG PROGRESS SPK - APPROACH BARU
    const totalItems = await prisma.salesOrderItem.count({
      where: {
        salesOrderId: (
          await prisma.sPK.findUnique({
            where: { id: spkId },
            select: { salesOrderId: true },
          })
        )?.salesOrderId,
      },
    });

    const reportsWithSoDetail = await prisma.sPKFieldReport.findMany({
      where: {
        spkId,
        soDetailId: { not: null }, // Hanya ambil yang punya soDetailId
      },
      orderBy: { reportedAt: "desc" },
      select: {
        id: true,
        soDetailId: true,
        progress: true,
        reportedAt: true,
      },
    });

    // Kelompokkan progress terbaru per soDetailId
    const latestProgressMap = new Map();

    for (const report of reportsWithSoDetail) {
      if (!latestProgressMap.has(report.soDetailId)) {
        latestProgressMap.set(report.soDetailId, report.progress);
      }
    }

    // Hitung rata-rata progress
    let totalProgress = 0;
    let count = totalItems;

    for (const [soDetailId, progressValue] of latestProgressMap) {
      totalProgress += progressValue;
    }

    console.log(`[DEBUG] Total progress: ${totalProgress}, Count: ${count}`);
    const averageProgress = count > 0 ? Math.round(totalProgress / count) : 0;

    // ✅ Update SPK - Pastikan tipe data match
    // Cek tipe data field progress di model SPK
    const spkData = await prisma.sPK.findUnique({
      where: { id: spkId },
      select: { progress: true },
    });

    // Update progress SPK
    await prisma.sPK.update({
      where: { id: spkId },
      data: {
        progress: averageProgress,
      },
    });

    console.log(
      `[SPK ${spkId}] Updated progress: ${averageProgress}% (from ${count} items)`
    );

    // Ambil report lengkap dengan relasi
    const populatedReport = await prisma.sPKFieldReport.findUnique({
      where: { id: report.id },
      include: {
        karyawan: {
          select: {
            id: true,
            namaLengkap: true,
            jabatan: true,
          },
        },
        photos: true,
        soDetail: {
          select: {
            id: true,
            product: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Laporan berhasil dibuat",
      data: populatedReport,
      progressUpdate: {
        averageProgress,
        itemsCount: count,
        totalProgress,
      },
    });
  } catch (error) {
    console.error("Error creating SPK field report:", error);
    res
      .status(500)
      .json({ error: "Gagal membuat laporan", details: error.message });
  }
};

export const addPhotosToReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { karyawanId } = req.body; // pastikan yang upload adalah karyawan yang berwenang

    const report = await prisma.sPKFieldReport.findUnique({
      where: { id },
      include: { photos: true },
    });

    if (!report) {
      return res.status(404).json({ error: "Laporan tidak ditemukan" });
    }

    if (!req.files || !req.files.photos || req.files.photos.length === 0) {
      return res
        .status(400)
        .json({ error: "Tidak ada file foto yang diunggah" });
    }

    const photoPromises = req.files.photos.map((photo) => {
      const imageUrl = `/images/spk/${photo.filename}`;
      return prisma.sPKFieldReportPhoto.create({
        data: {
          reportId: id,
          imageUrl,
          caption: photo.originalname,
          uploadedBy: karyawanId,
        },
      });
    });

    const newPhotos = await Promise.all(photoPromises);

    res.status(201).json({
      success: true,
      message: "Foto berhasil ditambahkan",
      data: newPhotos,
    });
  } catch (error) {
    console.error("Error adding photos to report:", error);
    res
      .status(500)
      .json({ error: "Gagal menambahkan foto", details: error.message });
  }
};

// 💡 Mendapatkan semua laporan berdasarkan SPK
export const getReportsBySpkId = async (req, res) => {
  try {
    const { spkId } = req.params;
    const { type } = req.query; // optional: PROGRESS / FINAL

    if (!spkId) {
      return res.status(400).json({ error: "spkId diperlukan" });
    }

    const whereClause = { spkId };

    if (type && ["PROGRESS", "FINAL"].includes(type)) {
      whereClause.type = type;
    }

    const reports = await prisma.sPKFieldReport.findMany({
      where: whereClause,
      include: {
        karyawan: true,
        photos: true,
      },
      orderBy: { reportedAt: "desc" },
    });

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res
      .status(500)
      .json({ error: "Gagal mengambil laporan", details: error.message });
  }
};

// 💡 Mendapatkan satu laporan berdasarkan ID
export const getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await prisma.sPKFieldReport.findUnique({
      where: { id },
      include: {
        karyawan: true,
        photos: true,
      },
    });

    if (!report) {
      return res.status(404).json({ error: "Laporan tidak ditemukan" });
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Error fetching report by ID:", error);
    res
      .status(500)
      .json({ error: "Gagal mengambil laporan", details: error.message });
  }
};

// 💡 Update status laporan (approve/reject)
export const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) {
      return res
        .status(400)
        .json({ error: "Status harus APPROVED, REJECTED, atau PENDING" });
    }

    const report = await prisma.sPKFieldReport.update({
      where: { id },
      data: { status },
    });

    if (!report) {
      return res.status(404).json({ error: "Laporan tidak ditemukan" });
    }

    res.json({
      success: true,
      message: "Status laporan diperbarui",
      data: report,
    });
  } catch (error) {
    console.error("Error updating report status:", error);
    res
      .status(500)
      .json({ error: "Gagal memperbarui status", details: error.message });
  }
};

// 💡 Hapus laporan (soft delete opsional, tapi kami hapus langsung)

export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Ambil semua foto terkait laporan
    const photos = await prisma.sPKFieldReportPhoto.findMany({
      where: { reportId: id },
      select: { imageUrl: true },
    });

    for (const photo of photos) {
      if (!photo.imageUrl || typeof photo.imageUrl !== "string") continue;
      const filePath = path.join(process.cwd(), "public", photo.imageUrl);

      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`✅ File deleted: ${filePath}`);
        } catch (err) {
          console.error(`❌ Gagal hapus file: ${filePath}`, err.message);
        }
      } else {
        console.warn(`⚠️ File not found: ${filePath}`);
      }
    }

    // 2. Hapus dari database
    await prisma.sPKFieldReportPhoto.deleteMany({ where: { reportId: id } });

    const deleted = await prisma.sPKFieldReport.delete({
      where: { id },
      select: { spkId: true }, // ambil spkId untuk update progress
    });

    if (!deleted) {
      return res.status(404).json({ error: "Laporan tidak ditemukan" });
    }

    const spkId = deleted.spkId;

    const reportsWithSoDetail = await prisma.sPKFieldReport.findMany({
      where: {
        spkId,
        soDetailId: { not: null }, // Hanya ambil yang punya soDetailId
      },
      orderBy: { reportedAt: "desc" },
      select: {
        id: true,
        soDetailId: true,
        progress: true,
        reportedAt: true,
      },
    });

    const totalItems = await prisma.salesOrderItem.count({
      where: {
        salesOrderId: (
          await prisma.sPK.findUnique({
            where: { id: spkId },
            select: { salesOrderId: true },
          })
        )?.salesOrderId,
      },
    });

    const latestProgressMap = new Map();

    for (const report of reportsWithSoDetail) {
      if (!latestProgressMap.has(report.soDetailId)) {
        latestProgressMap.set(report.soDetailId, report.progress);
      }
    }

    let totalProgress = 0;
    let count = totalItems;
    for (const progressValue of latestProgressMap.values()) {
      totalProgress += progressValue;
    }
    const averageProgress = count > 0 ? Math.round(totalProgress / count) : 0;

    // 4. Update progress di SPK
    await prisma.sPK.update({
      where: { id: spkId },
      data: { progress: averageProgress },
    });

    res.json({
      success: true,
      message: "Laporan dan foto-fotonya berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting report:", error);
    res
      .status(500)
      .json({ error: "Gagal menghapus laporan", details: error.message });
  }
};

/**
 * Mengambil daftar laporan SPK berdasarkan filter
 * @param {Object} req - Request Express
 * @param {Object} res - Response Express
 */
export const getSPKFieldReports = async (req, res) => {
  try {
    const { date, status, spkId, karyawanId } = req.query;

    // Validasi input
    if (status && !["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({
        error:
          "Parameter status harus salah satu: PENDING, APPROVED, atau REJECTED",
      });
    }

    // Bangun where clause dinamis
    const where = {};

    // Filter tanggal
    if (date === "today") {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      where.reportedAt = { gte: startOfDay };
    } else if (date === "thisWeek") {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      where.reportedAt = { gte: startOfWeek };
    } else if (date === "thisMonth") {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      where.reportedAt = { gte: startOfMonth };
    }

    // Filter status
    if (status && status !== "all") {
      where.status = status;
    }

    // Filter SPK ID
    if (spkId) {
      where.spkId = spkId;
    }

    // Filter karyawan ID
    if (karyawanId) {
      where.karyawanId = karyawanId;
    }

    // Query database dengan relasi
    const reports = await prisma.sPKFieldReport.findMany({
      where,
      include: {
        spk: {
          select: {
            spkNumber: true,
          },
        },
        karyawan: {
          select: {
            namaLengkap: true,
          },
        },
        soDetail: {
          select: {
            name: true,
          },
        },
        photos: {
          select: {
            imageUrl: true,
          },
        },
      },
      orderBy: {
        reportedAt: "desc",
      },
    });

    // Mapping ke format frontend: ReportHistory[]
    const formatted = reports.map((report) => ({
      id: report.id,
      spkNumber: report.spk.spkNumber,
      clientName: report.spk.clientName,
      projectName: report.spk.projectName,
      type: report.type,
      note: report.note,
      photos: report.photos.map((photo) => photo.imageUrl),
      reportedAt: report.reportedAt,
      soDetailId: report.soDetailId,
      itemName: report.soDetail?.name || "Item tidak dikenal",
      karyawanName: report.karyawan.namaLengkap,
      progress: report.progress || 0,
      status: report.status, // PENDING, APPROVED, REJECTED
    }));

    res.json(formatted);
  } catch (error) {
    console.error("[getSPKFieldReports]", error);
    res.status(500).json({
      error: "Gagal mengambil laporan",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

// 💡 Tambah foto baru ke laporan yang sudah ada

// Export default object jika diperlukan
export default {
  createSpkFieldReport,
  getReportsBySpkId,
  getReportById,
  updateReportStatus,
  deleteReport,
  addPhotosToReport,
  getSPKFieldReports,
};
