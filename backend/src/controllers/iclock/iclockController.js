import { PrismaClient } from "@prisma/client";
import { NotificationService } from "../../utils/firebase/notificationService.js";
const prisma = new PrismaClient();

// Fungsi bantuan untuk menghitung selisih jam
const getHoursDiff = (date1, date2) => {
  return Math.abs(date1 - date2) / 36e5;
};

export const cdataGet = async (req, res) => {
  try {
    const { SN, options, pushver } = req.query;
    console.log(`[ADMS] Mesin terhubung: SN=${SN}, Options=${options}, PushVer=${pushver}`);
    
    res.type('text/plain');
    res.send(
      `GET OPTION FROM: ${SN}\n` +
      `Stamp=9999\n` +
      `OpStamp=9999\n` +
      `ErrorDelay=60\n` +
      `Delay=30\n` +
      `ResLogDay=18250\n` +
      `ResLogDelCount=10000\n` +
      `ResLogCount=10000\n` +
      `TransTimes=00:00;14:00\n` +
      `TransInterval=1\n` +
      `TransFlag=1111000000\n` +
      `TimeZone=7\n` +
      `Realtime=1\n` +
      `Encrypt=0`
    );
  } catch (error) {
    console.error("[ADMS] Error at cdataGet:", error);
    res.status(500).send("ERROR");
  }
};

export const cdataPost = async (req, res) => {
  try {
    const { SN, table } = req.query;
    const rawData = req.body; 
    
    console.log(`[ADMS POST] SN=${SN}, Table=${table}`);
    
    if (table === "ATTLOG") {
      const lines = rawData.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      let successCount = 0;

      for (const line of lines) {
        const parts = line.split('\t');
        if (parts.length >= 2) {
          let userIdPin = parts[0]; 
          
          // Jika PIN dari mesin berupa angka (misal "25"), format otomatis jadi "NIK-00025"
          if (/^\d+$/.test(userIdPin)) {
             const paddedNumber = userIdPin.padStart(5, '0');
             userIdPin = `NIK-${paddedNumber}`;
          }

          const checkTimeStr = parts[1]; 
          // Memaksa timezone ke +07:00 (WIB) agar tidak dianggap UTC oleh Node.js
          const checkTime = new Date(checkTimeStr.replace(" ", "T") + "+07:00");
          
          if (isNaN(checkTime.getTime())) continue;

          const karyawan = await prisma.karyawan.findUnique({
            where: { nik: userIdPin }
          });

          if (!karyawan) {
            console.warn(`[ADMS] Karyawan dengan NIK/PIN ${userIdPin} tidak ditemukan di database.`);
            continue;
          }

          const startOfDay = new Date(checkTime);
          startOfDay.setHours(0, 0, 0, 0);
          
          const endOfDay = new Date(checkTime);
          endOfDay.setHours(23, 59, 59, 999);

          let absensiHariIni = await prisma.absensi.findFirst({
            where: {
              karyawanId: karyawan.id,
              tanggal: {
                gte: startOfDay,
                lte: endOfDay
              }
            }
          });

          if (!absensiHariIni) {
            await prisma.absensi.create({
              data: {
                karyawanId: karyawan.id,
                tanggal: startOfDay,
                jamMasuk: checkTime,
                catatanValidasi: "Auto-generated via Mesin Fingerprint (ADMS)"
              }
            });
            successCount++;

            // Send notification for Clock In
            try {
              await NotificationService.broadcastToAdmins({
                title: "👋 Absen Masuk (Clock In) via Fingerprint",
                body: `${karyawan.namaLengkap} telah melakukan Absen Masuk pada pukul ${checkTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })}.`,
                type: "attendance_clock_in",
                data: {
                  karyawanId: karyawan.id,
                  karyawanName: karyawan.namaLengkap,
                  time: checkTime.toISOString(),
                  click_action: "FLUTTER_NOTIFICATION_CLICK",
                },
              });
            } catch (err) {}

          } else {
            // Kita ubah jeda minimal menjadi 1 menit (1/60 jam) agar mudah ditest
            if (absensiHariIni.jamMasuk && getHoursDiff(checkTime, absensiHariIni.jamMasuk) > (1 / 60)) {
               await prisma.absensi.update({
                 where: { id: absensiHariIni.id },
                 data: {
                   jamKeluar: checkTime
                 }
               });
               successCount++;

               // Send notification for Clock Out
               try {
                 await NotificationService.broadcastToAdmins({
                   title: "👋 Absen Keluar (Clock Out) via Fingerprint",
                   body: `${karyawan.namaLengkap} telah melakukan Absen Keluar pada pukul ${checkTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })}.`,
                   type: "attendance_clock_out",
                   data: {
                     karyawanId: karyawan.id,
                     karyawanName: karyawan.namaLengkap,
                     time: checkTime.toISOString(),
                     click_action: "FLUTTER_NOTIFICATION_CLICK",
                   },
                 });
               } catch (err) {}
            }
          }
        }
      }
      
      console.log(`[ADMS] Berhasil memproses ${successCount} log kehadiran dari mesin ${SN}.`);
      res.type('text/plain');
      return res.send(`OK\n`);
    }

    res.type('text/plain');
    res.send(`OK\n`);

  } catch (error) {
    console.error("[ADMS] Error processing POST cdata:", error);
    res.type('text/plain');
    res.send("ERROR\n");
  }
};

export const getRequest = async (req, res) => {
  try {
    res.type('text/plain');
    res.send("OK\n"); 
  } catch (error) {
    res.type('text/plain');
    res.send("ERROR\n");
  }
};

export const deviceCmd = async (req, res) => {
  try {
    res.type('text/plain');
    res.send("OK\n");
  } catch (error) {
    res.type('text/plain');
    res.send("ERROR\n");
  }
};
