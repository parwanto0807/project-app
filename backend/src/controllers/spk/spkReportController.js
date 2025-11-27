// /backend/controllers/spkReportController.js
// import { PrismaClient } from "../../../prisma/generated/prisma/index.js";
import { prisma } from "../../config/db.js";
import fs from "fs";
import path from "path";
import { io } from "../../server.js";

// const prisma = new PrismaClient();

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

    // console.log(`[DEBUG] Total progress: ${totalProgress}, Count: ${count}`);
    const averageProgress = count > 0 ? Math.round(totalProgress / count) : 0;

    // ✅ Update SPK - Pastikan tipe data match
    // Cek tipe data field progress di model SPK
    const spkData = await prisma.sPK.findUnique({
      where: { id: spkId },
      select: { progress: true, salesOrderId: true },
    });

    // Update progress SPK
    const updatedSpk = await prisma.sPK.update({
      where: { id: spkId },
      data: {
        progress: averageProgress,
        spkStatus: averageProgress === 100 ? true : false,
      },
    });

    if (averageProgress === 100 && spk.salesOrderId) {
      await prisma.salesOrder.update({
        where: { id: spk.salesOrderId },
        data: { status: "FULFILLED" },
      });
    }

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

    // ✅ TAMBAHKAN: BROADCAST NOTIFICATION HANYA KE ADMIN & PIC SAJA
    // ✅ TAMBAHKAN: BROADCAST NOTIFICATION HANYA KE ADMIN & PIC SAJA
    try {
      // Dapatkan semua user dengan role admin dan pic
      const adminUsers = await prisma.user.findMany({
        where: {
          role: { in: ["admin", "pic"] },
          active: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      console.log(
        `📢 Sending SPK Field Report notification to ${adminUsers.length} admin/pic users`
      );

      // CARA LEBIH EFISIEN: Ambil product name dari soDetail yang sudah ada di report
      let productName = "Unknown Product";

      // Jika ada soDetailId, ambil product name dari soDetail
      if (soDetailId) {
        const soDetail = await prisma.salesOrderItem.findUnique({
          where: { id: soDetailId },
          select: {
            product: { select: { name: true } },
            name: true,
          },
        });
        productName =
          soDetail?.product?.name || soDetail?.name || "Unknown Product";
      }
      // Jika tidak ada soDetailId, ambil dari SPK (cara sebelumnya)
      else {
        const spkInfo = await prisma.sPK.findUnique({
          where: { id: spkId },
          include: {
            salesOrder: {
              select: {
                soNumber: true,
                customer: { select: { name: true } },
                items: {
                  take: 1,
                  select: {
                    product: { select: { name: true } },
                    name: true,
                  },
                },
              },
            },
          },
        });

        const firstItem = spkInfo?.salesOrder?.items?.[0];
        productName =
          firstItem?.product?.name || firstItem?.name || "Unknown Product";
      }

      // Dapatkan informasi dasar SPK
      const spkInfo = await prisma.sPK.findUnique({
        where: { id: spkId },
        select: {
          spkNumber: true,
          salesOrder: {
            select: {
              soNumber: true,
              customer: { select: { name: true } },
            },
          },
        },
      });

      const spkNumber = spkInfo?.spkNumber || "Unknown SPK";
      const soNumber = spkInfo?.salesOrder?.soNumber || "Unknown SO";
      const customerName =
        spkInfo?.salesOrder?.customer?.name || "Unknown Customer";

      // Import NotificationService
      const { NotificationService } = await import(
        "../../utils/firebase/notificationService.js"
      );

      // Kirim notifikasi ke setiap admin dan pic
      for (const admin of adminUsers) {
        await NotificationService.sendToUser(admin.id, {
          title:
            type === "FINAL"
              ? "Laporan Final SPK Selesai 🎯"
              : "Progress SPK Diperbarui 📊",
          body:
            type === "FINAL"
              ? `Laporan final SPK ${spkNumber} (${productName}) - SO: ${soNumber} telah diselesaikan oleh ${karyawan.namaLengkap}`
              : `Progress SPK ${spkNumber} (${productName}) - SO: ${soNumber} diperbarui menjadi ${progress}% oleh ${karyawan.namaLengkap}`,
          data: {
            type: "spk_field_report",
            reportId: report.id,
            spkId: spkId,
            spkNumber: spkNumber,
            soNumber: soNumber,
            customerName: customerName,
            productName: productName,
            karyawanName: karyawan.namaLengkap,
            progress: progress,
            reportType: type,
            action: `/spk/${spkId}/reports`,
            timestamp: new Date().toISOString(),
          },
        });

        console.log(
          `✅ SPK Field Report notification sent to ${admin.role}: ${admin.email}`
        );
      }
    } catch (notificationError) {
      // Jangan gagalkan create report jika notifikasi gagal
      console.error(
        "❌ Error sending SPK Field Report notification:",
        notificationError
      );
    }

    // ✅ Broadcast ke semua client bahwa ada report baru & SPK berubah
    // req.io.emit("spk_updated");

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

    const reports = await prisma.sPKFieldReport.findUnique({
      where: whereClause,
      include: {
        karyawan: true,
        photos: true, // ✅ ambil semua foto terkait
      },
      // orderBy: { reportedAt: "desc" },
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

    if (status && status !== "all") {
      where.status = status;
    }

    if (spkId) where.spkId = spkId;
    if (karyawanId) where.karyawanId = karyawanId;

    const reports = await prisma.sPKFieldReport.findMany({
      where: {
        ...where,
        spk: {
          spkStatusClose: false,
          ...(spkId ? { id: spkId } : {}),
          ...(req.query.spkNumber ? { spkNumber: req.query.spkNumber } : {}),
        },
      },
      include: {
        spk: {
          select: {
            spkNumber: true,
            salesOrder: {
              include: {
                customer: {
                  select: { name: true, address: true, branch: true },
                },
                project: { select: { id: true, name: true } },
                items: true, // ambil semua items dulu
              },
            },
          },
        },
        karyawan: { select: { namaLengkap: true, email: true } },
        soDetail: { select: { name: true } },
        photos: { select: { imageUrl: true } },
      },
      orderBy: { reportedAt: "asc" },
    });

    // ✅ Sort salesOrder.items per report berdasarkan lineNo ascending
    const reportsSortedItems = reports.map((report) => {
      if (report.spk?.salesOrder?.items) {
        report.spk.salesOrder.items = report.spk.salesOrder.items
          .slice()
          .sort((a, b) => (a.lineNo || 0) - (b.lineNo || 0));
      }
      return report;
    });

    // Mapping ke format frontend
    const formatted = reportsSortedItems.map((report) => ({
      id: report.id,
      spkNumber: report.spk.spkNumber,
      clientName: report.spk.salesOrder.customer.name,
      projectName: report.spk.salesOrder.project?.name,
      type: report.type,
      note: report.note,
      photos: report.photos.map((photo) => photo.imageUrl),
      reportedAt: report.reportedAt,
      soDetailId: report.soDetailId,
      itemName: report.soDetail?.name || "Item tidak dikenal",
      karyawanName: report.karyawan.namaLengkap,
      email: report.karyawan.email,
      progress: report.progress || 0,
      status: report.status,
      items: report.spk.salesOrder.items, // items sudah terurut berdasarkan lineNo
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

export const getReportsBySpkIdBap = async (req, res) => {
  try {
    const { spkId } = req.params;

    if (!spkId) {
      return res.status(400).json({ error: "spkId diperlukan" });
    }

    const reports = await prisma.sPKFieldReport.findMany({
      where: { spkId },
      include: {
        karyawan: true,
        photos: true, // ✅ ambil semua foto terkait
      },
      orderBy: { reportedAt: "desc" }, // opsional: urutkan terbaru
    });

    // console.log("Data:", reports);

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({
      error: "Gagal mengambil laporan",
      details: error.message,
    });
  }
};

// Export default object jika diperlukan
export default {
  createSpkFieldReport,
  getReportsBySpkId,
  getReportById,
  updateReportStatus,
  deleteReport,
  addPhotosToReport,
  getReportsBySpkIdBap,
  getSPKFieldReports,
};
