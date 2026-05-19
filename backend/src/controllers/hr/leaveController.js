import { prisma } from "../../config/db.js";
import { NotificationService } from "../../utils/firebase/notificationService.js";

/**
 * Apply for a new Leave or Permit (Cuti atau Izin)
 * POST /api/hr/leaves/apply
 */
export const applyLeave = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const karyawan = await prisma.karyawan.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!karyawan) {
      return res.status(404).json({ message: "Data karyawan tidak ditemukan" });
    }

    const { jenis, tanggalMulai, tanggalSelesai, keterangan } = req.body;

    if (!jenis || !tanggalMulai || !tanggalSelesai || !keterangan) {
      return res.status(400).json({ message: "Semua field (jenis, tanggalMulai, tanggalSelesai, keterangan) wajib diisi" });
    }

    // Validate enum LeaveType
    const validTypes = ["CUTI", "IZIN", "SAKIT", "PENTING", "LAINNYA"];
    if (!validTypes.includes(jenis)) {
      return res.status(400).json({ message: `Jenis pengajuan tidak valid. Harus salah satu dari: ${validTypes.join(", ")}` });
    }

    const start = new Date(tanggalMulai);
    const end = new Date(tanggalSelesai);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Format tanggal tidak valid" });
    }

    if (start > end) {
      return res.status(400).json({ message: "Tanggal mulai tidak boleh lebih besar dari tanggal selesai" });
    }

    // Calculate duration in days (inclusive of start and end date)
    const diffTime = Math.abs(end - start);
    const jumlahHari = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Handle uploaded file (bukti) if exists
    let buktiPath = null;
    if (req.file) {
      // Save relative path for easy frontend retrieval
      buktiPath = `/uploads/leaves/${req.file.filename}`;
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        karyawanId: karyawan.id,
        jenis,
        tanggalMulai: start,
        tanggalSelesai: end,
        jumlahHari,
        keterangan,
        bukti: buktiPath,
        status: "PENDING",
      },
      include: {
        karyawan: {
          select: {
            namaLengkap: true,
            nik: true,
            jabatan: true,
          },
        },
      },
    });

    // Send Real-time Notification to Admins
    try {
      await NotificationService.broadcastToAdmins({
        title: "📅 Pengajuan Ijin/Cuti Baru",
        body: `${leaveRequest.karyawan.namaLengkap} mengajukan ${jenis} selama ${jumlahHari} hari.`,
        type: "leave_request",
        data: {
          id: leaveRequest.id,
          karyawanId: karyawan.id,
          karyawanName: leaveRequest.karyawan.namaLengkap,
          jenis: jenis,
          jumlahHari: String(jumlahHari),
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
      });
    } catch (notifError) {
      console.error("[Notification] Failed to send admin notification for leave request:", notifError.message);
    }

    res.status(201).json({
      message: "Pengajuan ijin/cuti berhasil diajukan",
      data: leaveRequest,
    });
  } catch (error) {
    console.error("Error in applyLeave:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get leave history of currently logged-in employee
 * GET /api/hr/leaves/my-history
 */
export const getMyLeaves = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const karyawan = await prisma.karyawan.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!karyawan) {
      return res.status(404).json({ message: "Data karyawan tidak ditemukan" });
    }

    const leaves = await prisma.leaveRequest.findMany({
      where: { karyawanId: karyawan.id },
      orderBy: { createdAt: "desc" },
    });

    res.json(leaves);
  } catch (error) {
    console.error("Error in getMyLeaves:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all leave requests (for Administrative use)
 * GET /api/hr/leaves
 */
export const getAllLeaves = async (req, res) => {
  try {
    const { status, jenis, karyawanId } = req.query;

    const leaves = await prisma.leaveRequest.findMany({
      where: {
        ...(status && { status }),
        ...(jenis && { jenis }),
        ...(karyawanId && { karyawanId }),
      },
      include: {
        karyawan: {
          select: {
            id: true,
            namaLengkap: true,
            nik: true,
            jabatan: true,
            departemen: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(leaves);
  } catch (error) {
    console.error("Error in getAllLeaves:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Approve a leave request (Admin only)
 * PATCH /api/hr/leaves/:id/approve
 */
export const approveLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const adminUser = req.user;

    if (adminUser.role !== "admin" && adminUser.role !== "super") {
      return res.status(403).json({ message: "Forbidden. Hanya admin yang diperbolehkan menyetujui pengajuan." });
    }

    const leave = await prisma.leaveRequest.findUnique({ where: { id } });

    if (!leave) {
      return res.status(404).json({ message: "Pengajuan ijin/cuti tidak ditemukan" });
    }

    if (leave.status !== "PENDING") {
      return res.status(400).json({ message: `Pengajuan ini sudah berstatus ${leave.status}` });
    }

    const updatedLeave = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedBy: adminUser.name || adminUser.email || "Admin",
        approvedAt: new Date(),
      },
      include: {
        karyawan: {
          select: {
            namaLengkap: true,
            nik: true,
          },
        },
      },
    });

    res.json({
      message: "Pengajuan ijin/cuti berhasil disetujui",
      data: updatedLeave,
    });
  } catch (error) {
    console.error("Error in approveLeave:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Reject a leave request (Admin only)
 * PATCH /api/hr/leaves/:id/reject
 */
export const rejectLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectedReason } = req.body;
    const adminUser = req.user;

    if (adminUser.role !== "admin" && adminUser.role !== "super") {
      return res.status(403).json({ message: "Forbidden. Hanya admin yang diperbolehkan menolak pengajuan." });
    }

    if (!rejectedReason) {
      return res.status(400).json({ message: "Alasan penolakan (rejectedReason) wajib diisi" });
    }

    const leave = await prisma.leaveRequest.findUnique({ where: { id } });

    if (!leave) {
      return res.status(404).json({ message: "Pengajuan ijin/cuti tidak ditemukan" });
    }

    if (leave.status !== "PENDING") {
      return res.status(400).json({ message: `Pengajuan ini sudah berstatus ${leave.status}` });
    }

    const updatedLeave = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectedReason,
        approvedBy: adminUser.name || adminUser.email || "Admin",
        approvedAt: new Date(),
      },
      include: {
        karyawan: {
          select: {
            namaLengkap: true,
            nik: true,
          },
        },
      },
    });

    res.json({
      message: "Pengajuan ijin/cuti berhasil ditolak",
      data: updatedLeave,
    });
  } catch (error) {
    console.error("Error in rejectLeave:", error);
    res.status(500).json({ message: error.message });
  }
};
