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

          // 1. Cari sesi aktif dari shift sebelumnya (maksimal 24 jam ke belakang)
          // Kita ambil data maksimal 24 jam, lalu filter dengan logika cerdas di bawah
          const cutoff = new Date(checkTime.getTime() - 24 * 60 * 60 * 1000);
          
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
            const hoursDiff = getHoursDiff(checkTime, activeSession.jamMasuk);
            console.log(`[ADMS DEBUG] activeSession.jamMasuk=${activeSession.jamMasuk}, hoursDiff=${hoursDiff}`);
            
            // CEGAH DOUBLE TAP DALAM WAKTU SINGKAT (misal 5 menit)
            if (hoursDiff < (5 / 60)) {
               console.log(`[ADMS] Mengabaikan tap OUT karena jarak dengan tap IN terlalu dekat (${Math.round(hoursDiff * 60)} menit) - dianggap double tap.`);
               continue;
            }
            
            let isClockOut = true;

            if (hoursDiff > 20) {
              // Lebih dari 20 jam pasti absen masuk untuk shift baru keesokan harinya
              isClockOut = false;
            } else if (hoursDiff > 12) {
              // Jika jaraknya 12-20 jam, ada kebingungan apakah ini pulang kerja (long shift) atau masuk kerja hari baru.
              // Karena pola perusahaan: IN jam 10:00-18:00, OUT jam 23:00-05:00.
              // Jika jam scan saat ini antara jam 08:00 pagi - 18:00 sore, ini PASTI absen masuk hari baru.
              const currentHour = checkTime.getHours();
              if (currentHour >= 8 && currentHour <= 18) {
                isClockOut = false;
              }
            }

            if (!isClockOut) {
              console.log(`[ADMS] Batal menutup sesi karena diidentifikasi sebagai Absen Masuk baru (hoursDiff: ${hoursDiff}, hour: ${checkTime.getHours()})`);
              activeSession = null; // Biarkan jatuh ke logika pembuatan Absen Masuk baru di bawah
            }
          }

          if (activeSession) {
            // AUTO-CLOSE: Jika terkonfirmasi sebagai sesi pulang, tutup dengan waktu saat ini
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

          // 2. Jika tidak ada sesi aktif dalam 16 jam, anggap sebagai hari baru.
          // Sesi lama yang tidak di-clock out akan dibiarkan (ditangani sebagai Lupa Absen Keluar).
          {

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
