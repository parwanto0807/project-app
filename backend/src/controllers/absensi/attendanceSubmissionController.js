import { prisma } from "../../config/db.js";
import fs from "fs";
import path from "path";
import { NotificationService } from "../../utils/firebase/notificationService.js";

/**
 * Menghitung jarak antara dua koordinat (Haversine Formula) dalam meter
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // radius bumi dalam meter
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // dalam meter
};

export const submitClockIn = async (req, res) => {
  try {
    const { latitude, longitude, deviceDetails, isMocked } = req.body;
    const userId = req.user?.id; // Use ID from token

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const isMockedValue = isMocked === 'true' || isMocked === true;

    // 0. Proteksi Fake GPS (Tolak Absen)
    if (isMockedValue) {
      console.warn(`[SECURITY] Fake GPS detected for user ${userId}`);
      return res.status(403).json({ 
        success: false,
        message: "Kecurangan terdeteksi! Penggunaan Fake GPS tidak diperbolehkan.",
        code: "FAKE_GPS_DETECTED"
      });
    }

    // 1. Cari data karyawan & lokasi absensinya
    const karyawan = await prisma.karyawan.findUnique({
      where: { userId },
      include: { attendanceLocation: true },
    });

    if (!karyawan) {
      return res.status(404).json({ message: "Data karyawan tidak ditemukan" });
    }

    if (!karyawan.attendanceLocation) {
      return res.status(400).json({ message: "Lokasi absensi belum diatur untuk karyawan ini. Hubungi Admin." });
    }

    // 2. Verifikasi Geofencing
    const distance = calculateDistance(
      lat,
      lon,
      karyawan.attendanceLocation.latitude,
      karyawan.attendanceLocation.longitude
    );

    if (distance > karyawan.attendanceLocation.radius) {
      return res.status(403).json({
        message: `Anda berada di luar radius absensi (${Math.round(distance)}m dari lokasi).`,
        distance: Math.round(distance),
        requiredRadius: karyawan.attendanceLocation.radius
      });
    }

    // 3. Cek apakah ada sesi absen yang masih aktif (masuk tapi belum keluar)
    // Batasi 36 jam ke belakang untuk menghindari ambil record lama
    const cutoff = new Date(Date.now() - 36 * 60 * 60 * 1000);
    const activeSession = await prisma.absensi.findFirst({
      where: {
        karyawanId: karyawan.id,
        jamMasuk: { not: null, gte: cutoff },
        jamKeluar: null,
        jamKeluarDisetujui: null,
      },
      orderBy: { jamMasuk: "desc" },
    });

    if (activeSession) {
      return res.status(400).json({
        message: "Anda masih memiliki sesi absen aktif yang belum clock-out. Lakukan absen keluar terlebih dahulu.",
        activeAbsensi: activeSession,
      });
    }

    // 4. Cek apakah sudah absen masuk hari ini (tanggal sama)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let absensi = await prisma.absensi.findFirst({
      where: {
        karyawanId: karyawan.id,
        tanggal: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    if (absensi && absensi.jamMasuk) {
      return res.status(400).json({ message: "Anda sudah melakukan absen masuk hari ini." });
    }

    const fotoPath = req.file ? `/images/attendance/${req.file.filename}` : null;

    if (absensi) {
      // Update jika record sudah ada (misal status ALFA di awal hari)
      absensi = await prisma.absensi.update({
        where: { id: absensi.id },
        data: {
          jamMasuk: new Date(),
          fotoMasuk: fotoPath,
          latMasuk: lat,
          longMasuk: lon,
          isMockedMasuk: isMockedValue,
          deviceMasuk: deviceDetails,
          status: "HADIR",
        },
      });
    } else {
      // Buat baru
      absensi = await prisma.absensi.create({
        data: {
          karyawanId: karyawan.id,
          tanggal: today,
          jamMasuk: new Date(),
          fotoMasuk: fotoPath,
          latMasuk: lat,
          longMasuk: lon,
          isMockedMasuk: isMockedValue,
          deviceMasuk: deviceDetails,
          status: "HADIR",
        },
      });
    }

    // Send Real-time Notification to Admins
    try {
      await NotificationService.broadcastToAdmins({
        title: "📌 Absen Masuk (Clock In)",
        body: `${karyawan.namaLengkap} telah melakukan Absen Masuk pada pukul ${new Date(absensi.jamMasuk).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}.`,
        type: "attendance_clock_in",
        data: {
          id: absensi.id,
          karyawanId: karyawan.id,
          karyawanName: karyawan.namaLengkap,
          time: new Date(absensi.jamMasuk).toISOString(),
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
      });
    } catch (notifError) {
      console.error("[Notification] Failed to send admin notification for Clock In:", notifError.message);
    }

    res.status(200).json({ message: "Absen masuk berhasil", data: absensi });
  } catch (error) {
    console.error("Clock In Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const submitClockOut = async (req, res) => {
  try {
    const { latitude, longitude, deviceDetails, isMocked, first_seen_at_office } = req.body;
    const userId = req.user?.id; // Use ID from token

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const isMockedValue = isMocked === 'true' || isMocked === true;

    // 0. Proteksi Fake GPS (Tolak Absen)
    if (isMockedValue) {
      console.warn(`[SECURITY] Fake GPS detected for user ${userId}`);
      return res.status(403).json({ 
        success: false,
        message: "Kecurangan terdeteksi! Penggunaan Fake GPS tidak diperbolehkan.",
        code: "FAKE_GPS_DETECTED"
      });
    }

    const karyawan = await prisma.karyawan.findUnique({
      where: { userId },
      include: { attendanceLocation: true },
    });

    if (!karyawan) return res.status(404).json({ message: "Data karyawan tidak ditemukan" });

    if (!karyawan.attendanceLocation) {
      return res.status(400).json({ message: "Lokasi absensi belum diatur. Hubungi Admin." });
    }

    // Verifikasi Geofencing
    const distance = calculateDistance(
      lat, lon,
      karyawan.attendanceLocation.latitude,
      karyawan.attendanceLocation.longitude
    );

    if (distance > karyawan.attendanceLocation.radius) {
      return res.status(403).json({
        message: `Anda berada di luar radius absensi (${Math.round(distance)}m).`,
      });
    }

    // ── Cari record absensi yang sudah clock-in tapi belum clock-out ──
    // Tidak dibatasi tanggal hari ini — karyawan bisa masuk tgl 1 dan keluar tgl 2
    // Batasi maksimal 36 jam ke belakang untuk menghindari ambil record lama
    const cutoff = new Date(Date.now() - 36 * 60 * 60 * 1000);

    const absensi = await prisma.absensi.findFirst({
      where: {
        karyawanId: karyawan.id,
        jamMasuk: { not: null, gte: cutoff },
        jamKeluar: null,
        jamKeluarDisetujui: null,
      },
      orderBy: { jamMasuk: "desc" }, // ambil yang paling baru
    });

    if (!absensi) {
      return res.status(400).json({
        message: "Tidak ditemukan absen masuk yang aktif. Pastikan Anda sudah melakukan absen masuk.",
      });
    }

    const fotoPath = req.file ? `/images/attendance/${req.file.filename}` : null;

    // Hitung jam lembur jika clock-out melewati jam standar (17:00)
    const jamMasuk = new Date(absensi.jamMasuk);
    const jamKeluar = new Date();
    const standarKeluar = new Date(jamMasuk);
    standarKeluar.setHours(17, 0, 0, 0);
    // Jika clock-out setelah jam standar, hitung lembur
    let jamLembur = 0;
    if (jamKeluar > standarKeluar) {
      jamLembur = Math.round(((jamKeluar - standarKeluar) / (1000 * 60 * 60)) * 100) / 100;
    }

    const updatedAbsensi = await prisma.absensi.update({
      where: { id: absensi.id },
      data: {
        jamKeluar,
        fotoKeluar: fotoPath,
        latKeluar: lat,
        longKeluar: lon,
        isMockedKeluar: isMockedValue,
        deviceKeluar: deviceDetails,
        jamLembur,
        first_seen_at: first_seen_at_office ? new Date(first_seen_at_office) : null,
      },
    });

    // Send Real-time Notification to Admins
    try {
      await NotificationService.broadcastToAdmins({
        title: "📌 Absen Keluar (Clock Out)",
        body: `${karyawan.namaLengkap} telah melakukan Absen Keluar pada pukul ${new Date(updatedAbsensi.jamKeluar).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}.`,
        type: "attendance_clock_out",
        data: {
          id: updatedAbsensi.id,
          karyawanId: karyawan.id,
          karyawanName: karyawan.namaLengkap,
          time: new Date(updatedAbsensi.jamKeluar).toISOString(),
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
      });
    } catch (notifError) {
      console.error("[Notification] Failed to send admin notification for Clock Out:", notifError.message);
    }

    res.status(200).json({ message: "Absen keluar berhasil", data: updatedAbsensi });
  } catch (error) {
    console.error("Clock Out Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getTodayStatus = async (req, res) => {
  try {
    // Prefer user ID from token, fallback to param for backward compatibility
    const userId = req.user?.id || req.params.userId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const karyawan = await prisma.karyawan.findUnique({
      where: { userId },
      include: { attendanceLocation: true },
    });

    if (!karyawan) return res.status(404).json({ message: "Employee not found" });

    // Cari record aktif: sudah clock-in, belum clock-out, dalam 36 jam terakhir
    const cutoff = new Date(Date.now() - 36 * 60 * 60 * 1000);

    const activeAbsensi = await prisma.absensi.findFirst({
      where: {
        karyawanId: karyawan.id,
        jamMasuk: { not: null, gte: cutoff },
        jamKeluar: null,
        jamKeluarDisetujui: null,
      },
      orderBy: { jamMasuk: "desc" },
    });

    // Juga cek apakah sudah clock-out hari ini (untuk tampilan UI)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAbsensi = await prisma.absensi.findFirst({
      where: {
        karyawanId: karyawan.id,
        tanggal: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    // hasClockedIn = ada record aktif yang belum clock-out
    // hasClockedOut = record hari ini sudah punya jamKeluar
    const hasClockedIn = !!activeAbsensi;
    const hasClockedOut = !!todayAbsensi?.jamKeluar;

    res.json({
      hasClockedIn,
      hasClockedOut,
      absensi: activeAbsensi || todayAbsensi,
      activeAbsensi,   // record yang sedang aktif (belum clock-out)
      todayAbsensi,    // record hari ini (jika ada)
      location: karyawan.attendanceLocation,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getMyHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { startDate, endDate, limit = 30 } = req.query;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const karyawan = await prisma.karyawan.findUnique({
      where: { userId },
    });

    if (!karyawan) {
      return res.status(404).json({ message: "Data karyawan tidak ditemukan" });
    }

    const absensi = await prisma.absensi.findMany({
      where: {
        karyawanId: karyawan.id,
        ...(startDate && endDate && {
          tanggal: {
            gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
            lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
          },
        }),
      },
      orderBy: { tanggal: "desc" },
      take: parseInt(limit),
    });

    res.json({
      success: true,
      data: absensi,
    });
  } catch (error) {
    console.error("Get My History Error:", error);
    res.status(500).json({ message: error.message });
  }
};
export const getTodayAttendance = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const karyawan = await prisma.karyawan.findUnique({
      where: { userId }
    });

    if (!karyawan) return res.status(404).json({ success: false, message: "Employee not found" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const absensi = await prisma.absensi.findFirst({
      where: {
        karyawanId: karyawan.id,
        tanggal: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    // Cari apakah ada sesi yang belum selesai (masuk tapi belum keluar) 
    // dalam 48 jam terakhir
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const unfinishedSession = await prisma.absensi.findFirst({
      where: {
        karyawanId: karyawan.id,
        jamMasuk: { not: null, gte: cutoff },
        jamKeluar: null,
        jamKeluarDisetujui: null,
      },
      orderBy: { jamMasuk: "desc" }
    });

    res.json({
      success: true,
      data: {
        hasClockedIn: !!absensi?.jamMasuk,
        hasClockedOut: !!absensi?.jamKeluar,
        jamMasuk: absensi?.jamMasuk || null,
        jamKeluar: absensi?.jamKeluar || null,
        unfinishedSession: unfinishedSession || null, // Untuk banner "Lupa Absen Keluar"
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
