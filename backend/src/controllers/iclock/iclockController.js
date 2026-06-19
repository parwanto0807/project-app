import { prisma } from "../../config/db.js";
import { NotificationService } from "../../utils/firebase/notificationService.js";

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

          // 1. Cari sesi aktif dari shift sebelumnya (maksimal 36 jam ke belakang) yang belum clock out
          // Diperpanjang dari 24 jam ke 36 jam untuk handle overtime panjang
          const cutoff = new Date(checkTime.getTime() - 36 * 60 * 60 * 1000);
          
          let activeSession = await prisma.absensi.findFirst({
            where: {
              karyawanId: karyawan.id,
              jamMasuk: { gte: cutoff, lte: checkTime },
              jamKeluar: null
            },
            orderBy: { jamMasuk: "desc" }
          });

          console.log(`[ADMS DEBUG] checkTime=${checkTime}, cutoff=${cutoff}, activeSession=${activeSession?.id || 'none'}`);
          if (activeSession) {
            console.log(`[ADMS DEBUG] activeSession.jamMasuk=${activeSession.jamMasuk}, hoursDiff=${getHoursDiff(checkTime, activeSession.jamMasuk)}`);
            
            // AUTO-CLOSE: Jika ada sesi aktif, tutup dengan waktu saat ini
            await prisma.absensi.update({
              where: { id: activeSession.id },
              data: {
                jamKeluar: checkTime,
                deviceKeluar: `Fingerprint (${SN || "Unknown Device"})`
              }
            });
            successCount++;
            console.log(`[ADMS] Closed active session ${activeSession.id} at ${checkTime}`);

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
            
            continue; // Session closed, skip to next log
          }

          // 2. Jika tidak ada sesi aktif dalam 36 jam, cek apakah ada unclosed attendance dari hari sebelumnya
          // (Fallback untuk case yang lebih lama dari 36 jam)
          {
            // First, try to find ANY unclosed attendance (wider search)
            const anyUnclosed = await prisma.absensi.findFirst({
              where: {
                karyawanId: karyawan.id,
                jamMasuk: { not: null },
                jamKeluar: null
              },
              orderBy: { jamMasuk: 'desc' }
            });

            if (anyUnclosed && getHoursDiff(checkTime, anyUnclosed.jamMasuk) > (1 / 60)) {
              // Found unclosed attendance from any day, close it
              console.log(`[ADMS] Found unclosed attendance from ${anyUnclosed.jamMasuk}, closing it at ${checkTime}`);
              await prisma.absensi.update({
                where: { id: anyUnclosed.id },
                data: {
                  jamKeluar: checkTime,
                  deviceKeluar: `Fingerprint (${SN || "Unknown Device"})`
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
              
              continue; // Skip the rest of the logic
            }

            const startOfDay = new Date(checkTime);
            startOfDay.setHours(0, 0, 0, 0);
            
            const endOfDay = new Date(checkTime);
            endOfDay.setHours(23, 59, 59, 999);

            console.log(`[ADMS DEBUG] No active session found. Checking attendance for ${startOfDay} to ${endOfDay}`);

            let absensiHariIni = await prisma.absensi.findFirst({
              where: {
                karyawanId: karyawan.id,
                tanggal: {
                  gte: startOfDay,
                  lte: endOfDay
                }
              },
              orderBy: { jamMasuk: 'desc' }
            });

            console.log(`[ADMS DEBUG] absensiHariIni=${absensiHariIni?.id || 'none'}, tanggal=${absensiHariIni?.tanggal}`);

            if (!absensiHariIni) {
               // Belum ada absen sama sekali hari ini -> Buat Clock In baru
               console.log(`[ADMS] Creating new Clock-In for ${karyawan.namaLengkap} at ${checkTime}`);
               await prisma.absensi.create({
                 data: {
                   karyawanId: karyawan.id,
                   tanggal: startOfDay,
                   jamMasuk: checkTime,
                   deviceMasuk: `Fingerprint (${SN || "Unknown Device"})`,
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
               // Sudah ada absen hari ini (mungkin activeSession terlewat atau jamKeluar sudah terisi)
               // Fallback: Jika ada absen hari ini yg belum keluar, jadikan keluar
               if (absensiHariIni.jamMasuk && !absensiHariIni.jamKeluar && getHoursDiff(checkTime, absensiHariIni.jamMasuk) > (1 / 60)) {
                  await prisma.absensi.update({
                    where: { id: absensiHariIni.id },
                    data: {
                      jamKeluar: checkTime,
                      deviceKeluar: `Fingerprint (${SN || "Unknown Device"})`
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
      } // End of fallback block
      
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
