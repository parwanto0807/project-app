import { prisma } from "../../config/db.js";
import fs from "fs";
import path from "path";

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
    const { userId, latitude, longitude, deviceDetails, isMocked } = req.body;
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

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

    // 3. Cek apakah sudah absen hari ini
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
          isMockedMasuk: isMocked === 'true' || isMocked === true,
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
          isMockedMasuk: isMocked === 'true' || isMocked === true,
          deviceMasuk: deviceDetails,
          status: "HADIR",
        },
      });
    }

    res.status(200).json({ message: "Absen masuk berhasil", data: absensi });
  } catch (error) {
    console.error("Clock In Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const submitClockOut = async (req, res) => {
  try {
    const { userId, latitude, longitude, deviceDetails, isMocked } = req.body;
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    const karyawan = await prisma.karyawan.findUnique({
      where: { userId },
      include: { attendanceLocation: true },
    });

    if (!karyawan) return res.status(404).json({ message: "Data karyawan tidak ditemukan" });

    // Verifikasi Geofencing
    const distance = calculateDistance(
      lat,
      lon,
      karyawan.attendanceLocation.latitude,
      karyawan.attendanceLocation.longitude
    );

    if (distance > karyawan.attendanceLocation.radius) {
      return res.status(403).json({
        message: `Anda berada di luar radius absensi (${Math.round(distance)}m).`,
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const absensi = await prisma.absensi.findFirst({
      where: {
        karyawanId: karyawan.id,
        tanggal: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    if (!absensi || !absensi.jamMasuk) {
      return res.status(400).json({ message: "Anda belum melakukan absen masuk hari ini." });
    }

    if (absensi.jamKeluar) {
      return res.status(400).json({ message: "Anda sudah melakukan absen keluar hari ini." });
    }

    const fotoPath = req.file ? `/images/attendance/${req.file.filename}` : null;

    const updatedAbsensi = await prisma.absensi.update({
      where: { id: absensi.id },
      data: {
        jamKeluar: new Date(),
        fotoKeluar: fotoPath,
        latKeluar: lat,
        longKeluar: lon,
        isMockedKeluar: isMocked === 'true' || isMocked === true,
        deviceKeluar: deviceDetails,
      },
    });

    res.status(200).json({ message: "Absen keluar berhasil", data: updatedAbsensi });
  } catch (error) {
    console.error("Clock Out Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getTodayStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const karyawan = await prisma.karyawan.findUnique({
            where: { userId },
            include: { attendanceLocation: true }
        });

        if (!karyawan) return res.status(404).json({ message: "Employee not found" });

        const absensi = await prisma.absensi.findFirst({
            where: {
                karyawanId: karyawan.id,
                tanggal: {
                    gte: today,
                    lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
                },
            },
        });

        res.json({
            hasClockedIn: !!absensi?.jamMasuk,
            hasClockedOut: !!absensi?.jamKeluar,
            absensi,
            location: karyawan.attendanceLocation
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
