
import { prisma } from "../../config/db.js";
import { createLedgerEntry } from "../../utils/journalHelper.js";
import { NotificationService } from "../../utils/firebase/notificationService.js";

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Kalkulasi gaji berdasarkan tipe kontrak
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mendapatkan rentang tanggal untuk absensi dan gaji berdasarkan bulan periode
 */
function getPayrollDateRanges(periode) {
  const periodDate = new Date(periode);
  // Rentang untuk record Gaji (misal 1 Juni - 30 Juni)
  const gajiStart = new Date(periodDate.getFullYear(), periodDate.getMonth(), 1);
  const gajiEnd = new Date(periodDate.getFullYear(), periodDate.getMonth() + 1, 0, 23, 59, 59);
  
  // Rentang untuk cut-off Absensi, Pinjaman, Kasbon (21 bulan lalu - 20 bulan ini)
  const cutoffStart = new Date(periodDate.getFullYear(), periodDate.getMonth() - 1, 21);
  const cutoffEnd = new Date(periodDate.getFullYear(), periodDate.getMonth(), 20, 23, 59, 59);

  return { periodDate, gajiStart, gajiEnd, cutoffStart, cutoffEnd };
}

/**
 * Hitung durasi jam kerja dari jamMasuk → jamKeluar (dalam jam, float)
 */
function hitungJamKerja(jamMasuk, jamKeluar) {
  if (!jamMasuk || !jamKeluar) return 0;
  const masuk = new Date(jamMasuk);
  const keluar = new Date(jamKeluar);
  const diffMs = keluar.getTime() - masuk.getTime();
  if (diffMs <= 0) return 0;
  return diffMs / (1000 * 60 * 60); // jam
}

/**
 * Fitur keterlambatan dinonaktifkan karena belum ada jadwal kerja
 */
function hitungMenitTerlambat(jamMasuk, jamStandarMasuk = "07:00") {
  return 0;
}

/**
 * Core kalkulasi gaji — dipakai oleh preview, createGaji, dan bulk
 * Mengembalikan breakdown lengkap
 */
async function kalkulasiGaji(karyawan, absensiList, loanDetails, kasbonList, config, overrides = {}) {
  const tipePenggajian = (karyawan.tipePenggajian || "BULANAN").toUpperCase();
  const gajiPokok = karyawan.gajiPokok || 0;
  const tunjanganLama = karyawan.tunjangan || 0;
  const potonganDefault = karyawan.potongan || 0;

  const tunjanganJabatan = karyawan.tunjanganJabatan || 0;
  const tunjanganKeluarga = karyawan.tunjanganKeluarga || 0;
  const baseTunjanganMakan = karyawan.tunjanganMakan || 0;
  const baseTunjanganTransport = karyawan.tunjanganTransport || 0;
  const baseTunjanganKehadiran = karyawan.tunjanganKehadiran || 0;
  const tunjanganShift = karyawan.tunjanganShift || 0;

  // ── Rekap absensi ──
  const hariHadir = absensiList.filter((a) => a.status === "HADIR" || a.status === "TERLAMBAT").length;
  const hariAlfa  = absensiList.filter((a) => a.status === "ALFA").length;
  const hariIzin  = absensiList.filter((a) => ["IZIN", "SAKIT", "CUTI"].includes(a.status)).length;
  const hariTerlambat = 0; // Fitur keterlambatan dinonaktifkan

  // Hitung Tunjangan Tidak Tetap
  const tunjanganMakan = baseTunjanganMakan * hariHadir;
  const tunjanganTransport = baseTunjanganTransport * hariHadir;
  // Premi Hadir cair utuh jika karyawan tidak ada Alfa
  const tunjanganKehadiran = hariAlfa === 0 ? baseTunjanganKehadiran : 0;

  const totalTunjanganTetap = tunjanganJabatan + tunjanganKeluarga;
  const totalTunjanganTidakTetap = tunjanganMakan + tunjanganTransport + tunjanganKehadiran + tunjanganShift;
  const tunjangan = tunjanganLama + totalTunjanganTetap + totalTunjanganTidakTetap;

  // ── Jam kerja detail per hari ──
  // Prioritas: jamKerjaDisetujui (admin validated) > hitung dari jamKeluarDisetujui > hitung dari jamKeluar asli
  const detailHarian = absensiList.map((a) => {
    let jamKerja;
    if (a.jamKerjaDisetujui !== null && a.jamKerjaDisetujui !== undefined) {
      // Admin sudah validasi — pakai nilai yang disetujui
      jamKerja = a.jamKerjaDisetujui;
    } else {
      // Belum divalidasi — hitung dari jam keluar asli
      jamKerja = hitungJamKerja(a.jamMasuk, a.jamKeluar);
    }
    const menitTerlambat = 0; // Keterlambatan dinonaktifkan
    const threshold = config?.jamKerjaPerHari || 9;
    let jamLembur = a.jamLembur || 0;
    
    // Auto calculate lembur jika jam kerja melebihi threshold (walaupun belum divalidasi)
    if (jamKerja > threshold) {
      jamLembur = Math.round((jamKerja - threshold) * 100) / 100;
    }

    return {
      tanggal: a.tanggal,
      status: a.status,
      jamMasuk: a.jamMasuk,
      jamKeluar: a.jamKeluar,
      jamKeluarDisetujui: a.jamKeluarDisetujui,
      jamKerja: Math.round(jamKerja * 100) / 100,
      jamLembur: jamLembur,
      menitTerlambat,
      isValidated: a.isValidated || false,
    };
  });

  const totalJamKerja  = detailHarian.reduce((s, d) => s + d.jamKerja, 0);
  const totalJamLembur = detailHarian.reduce((s, d) => s + d.jamLembur, 0);

  // ── Hitung Upah Lembur Dinamis (Per Jam/Hari) ──
  let baseHourlyLembur = 0;
  if (tipePenggajian === "HARIAN_BULANAN" || tipePenggajian === "HARIAN") {
    baseHourlyLembur = (karyawan.gajiPokok * 25) / 173;
  } else {
    baseHourlyLembur = karyawan.gajiPokok / 173;
  }

  let upahLemburDinamis = 0;
  const p1 = config?.pengaliLemburJam1 || 1.5;
  const p2 = config?.pengaliLemburJam2 || 2.0;
  const p3 = config?.pengaliLemburJam3 || 2.0;
  const p4 = config?.pengaliLemburJam4 || 2.0;
  const p5 = config?.pengaliLemburJam5 || 2.0;
  const p6 = config?.pengaliLemburJam6 || 2.0;

  detailHarian.forEach((d) => {
    let jl = d.jamLembur;
    let upahHariIni = 0;
    if (jl > 0) {
      if (jl >= 1) { upahHariIni += baseHourlyLembur * p1; jl -= 1; }
      else { upahHariIni += baseHourlyLembur * p1 * jl; jl = 0; }
    }
    if (jl > 0) {
      if (jl >= 1) { upahHariIni += baseHourlyLembur * p2; jl -= 1; }
      else { upahHariIni += baseHourlyLembur * p2 * jl; jl = 0; }
    }
    if (jl > 0) {
      if (jl >= 1) { upahHariIni += baseHourlyLembur * p3; jl -= 1; }
      else { upahHariIni += baseHourlyLembur * p3 * jl; jl = 0; }
    }
    if (jl > 0) {
      if (jl >= 1) { upahHariIni += baseHourlyLembur * p4; jl -= 1; }
      else { upahHariIni += baseHourlyLembur * p4 * jl; jl = 0; }
    }
    if (jl > 0) {
      if (jl >= 1) { upahHariIni += baseHourlyLembur * p5; jl -= 1; }
      else { upahHariIni += baseHourlyLembur * p5 * jl; jl = 0; }
    }
    if (jl > 0) {
      upahHariIni += baseHourlyLembur * p6 * jl;
    }
    upahLemburDinamis += upahHariIni;
  });

  // ── Kalkulasi pendapatan ──
  let gajiKerja = 0;
  let upahLembur = 0;
  let potonganTerlambat = 0;

  if (tipePenggajian === "HARIAN_BULANAN" || tipePenggajian === "HARIAN") {
    // Gaji harian: Kalkulasi berdasarkan durasi jam kerja (pro-rate)
    const dailyRate = karyawan.gajiPokok > 0 ? karyawan.gajiPokok : (config?.gajiPerHari || 0);
    const jamStandar = config?.jamKerjaPerHari || 9;
    const hourlyRate = dailyRate / jamStandar;
    
    const lemburPerJam = config?.lemburPerJam || 0;
    const potonganPerTerlambat = config?.potonganTerlambat || 0;

    // Hitung jam kerja normal (Total Durasi - Lembur)
    const normalHours = Math.max(0, totalJamKerja - totalJamLembur);
    
    gajiKerja = Math.round(normalHours * hourlyRate);
    const useLembur = overrides.hitungLembur !== false;
    upahLembur = useLembur ? Math.round(totalJamLembur * lemburPerJam) : 0;
    potonganTerlambat = 0; // Keterlambatan dinonaktifkan
  } else {
    // Gaji bulanan: Ambil data gaji pokok dari master karyawan (tetap)
    const lemburPerJam = config?.lemburPerJam || 0;
    const potonganPerTerlambat = config?.potonganTerlambat || 0;

    gajiKerja = gajiPokok;
    const useLembur = overrides.hitungLembur !== false;
    upahLembur = useLembur ? Math.round(totalJamLembur * lemburPerJam) : 0;
    potonganTerlambat = 0; // Keterlambatan dinonaktifkan
  }

  // ── Potongan ──
  const potonganPinjamanCalculated = loanDetails.reduce((s, d) => s + Number(d.jumlahBayar), 0);
  const potonganKasbonCalculated   = kasbonList.reduce((s, k) => s + Number(k.jumlah), 0);
  
  const potonganPinjaman = Math.round(overrides.potonganPinjaman !== undefined ? overrides.potonganPinjaman : potonganPinjamanCalculated);
  const potonganKasbon   = Math.round(overrides.potonganKasbon !== undefined ? overrides.potonganKasbon : potonganKasbonCalculated);
  const pajak            = Math.round(overrides.pajak || 0);
  const potonganDpGaji   = Math.round(overrides.potonganDpGaji || 0);
  const potonganLain     = Math.round(overrides.potonganLain !== undefined ? overrides.potonganLain : potonganDefault);

  const totalPendapatan = Math.round(gajiKerja + tunjangan + upahLembur);
  const totalPotongan   = Math.round(potonganLain + pajak + potonganPinjaman + potonganKasbon + potonganTerlambat + potonganDpGaji);
  const total           = totalPendapatan - totalPotongan;

  return {
    tipePenggajian,
    // Pendapatan
    gajiKerja,       // gajiPokok (bulanan) atau hariHadir×gajiPerHari (harian)
    tunjangan,
    tunjanganJabatan,
    tunjanganKeluarga,
    tunjanganMakan,
    tunjanganTransport,
    tunjanganKehadiran,
    tunjanganShift,
    upahLembur,
    totalPendapatan,
    // Potongan
    potonganLain,
    pajak,
    potonganPinjaman,
    potonganKasbon,
    potonganTerlambat,
    potonganDpGaji,
    totalPotongan,
    // Bersih
    total,
    // Absensi
    hariHadir,
    hariAlfa,
    hariIzin,
    hariTerlambat,
    totalJamKerja: Math.round(totalJamKerja * 100) / 100,
    totalJamLembur: Math.round(totalJamLembur * 100) / 100,
    detailHarian,
    // Config yang dipakai
    configUsed: config ? {
      gajiPerHari: config.gajiPerHari,
      lemburPerJam: config.lemburPerJam,
      jamKerjaPerHari: config.jamKerjaPerHari,
      toleransiTerlambat: config.toleransiTerlambat,
      potonganTerlambat: config.potonganTerlambat,
    } : null,
  };
}

/**
 * Ambil data yang dibutuhkan untuk kalkulasi satu karyawan
 */
async function fetchPayrollData(karyawanId, startOfMonth, endOfMonth) {
  const [absensiList, loanDetails, kasbonList, config] = await Promise.all([
    prisma.absensi.findMany({
      where: { karyawanId, tanggal: { gte: startOfMonth, lte: endOfMonth } },
      orderBy: { tanggal: "asc" },
    }),
    prisma.pinjamanDetail.findMany({
      where: {
        status: "PENDING",
        tanggalJatuhTempo: { gte: startOfMonth, lte: endOfMonth },
        pinjaman: {
          is: {
            karyawanId,
            status: "ACTIVE",
          },
        },
      },
      include: {
        pinjaman: { select: { id: true, jumlahPinjaman: true, sisaPinjaman: true, karyawanId: true } },
      },
    }),
    prisma.kasbonSementara.findMany({
      where: { 
        karyawanId, 
        status: "APPROVED", 
        isPosted: true, // Hanya yang sudah di-posting (pencairan dana tercatat)
        bulanPotong: { gte: startOfMonth, lte: endOfMonth } 
      },
    }),
    prisma.payrollConfig.findFirst({ where: { isActive: true } }),
  ]);
  return { absensiList, loanDetails, kasbonList, config };
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

export const getAllGaji = async (req, res) => {
  try {
    const { periode, karyawanId } = req.query;
    const gaji = await prisma.gaji.findMany({
      where: {
        ...(karyawanId && { karyawanId }),
        ...(periode && {
          periode: {
            gte: new Date(periode),
            lt: new Date(new Date(periode).setMonth(new Date(periode).getMonth() + 1)),
          },
        }),
      },
      include: {
        karyawan: {
          select: { 
            id: true, 
            namaLengkap: true, 
            nik: true, 
            jabatan: true, 
            departemen: true, 
            gajiPokok: true, 
            tunjangan: true, 
            tipeKontrak: true,
            namaBank: true,
            nomorRekening: true,
            namaRekening: true
          },
        },
      },
      orderBy: { periode: "desc" },
    });
    res.json(gaji);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPayrollSummary = async (req, res) => {
  try {
    const { periode } = req.query;
    if (!periode) return res.status(400).json({ message: "periode wajib diisi" });

    const { gajiStart, gajiEnd } = getPayrollDateRanges(periode);

    const gaji = await prisma.gaji.findMany({
      where: { periode: { gte: gajiStart, lte: gajiEnd } },
      include: { 
        karyawan: { 
          select: { 
            namaLengkap: true, 
            nik: true, 
            jabatan: true, 
            tipeKontrak: true,
            namaBank: true,
            nomorRekening: true,
            namaRekening: true
          } 
        } 
      },
    });

    const drafts = gaji.filter(g => g.status === "DRAFT");
    const posted = gaji.filter(g => g.status === "POSTED");
    const published = gaji.filter(g => g.status === "PUBLISHED");

    res.json({
      periode,
      totalKaryawan:  gaji.length,
      totalDrafts:    drafts.length,
      totalPosted:    posted.length,
      totalPublished: published.length,
      totalGajiPokok: gaji.reduce((s, g) => s + g.gajiPokok, 0),
      totalTunjangan: gaji.reduce((s, g) => s + (g.tunjangan || 0), 0),
      totalPotongan:  gaji.reduce((s, g) => s + (g.potongan || 0) + g.pajak + g.potonganPinjaman + g.potonganKasbon + g.potonganDpGaji, 0),
      totalBersih:    gaji.reduce((s, g) => s + g.total, 0),
      totalLembur:    gaji.reduce((s, g) => s + (g.totalJamLembur || 0), 0),
      draftTotalAmount: drafts.reduce((s, g) => s + g.total, 0),
      detail: gaji,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /payroll/preview/:karyawanId?periode=YYYY-MM-DD
 * Preview kalkulasi lengkap — mendukung BULANAN & HARIAN
 */
export const getPayrollPreview = async (req, res) => {
  try {
    const { karyawanId } = req.params;
    const { periode, pajak, potonganDpGaji, potonganLain, manualPinjaman, manualKasbon, hitungLembur } = req.query;
    if (!periode) return res.status(400).json({ message: "periode wajib diisi" });

    const { gajiStart, gajiEnd, cutoffStart, cutoffEnd } = getPayrollDateRanges(periode);

    const karyawan = await prisma.karyawan.findUnique({
      where: { id: karyawanId },
      select: { id: true, namaLengkap: true, nik: true, jabatan: true, departemen: true, gajiPokok: true, tunjangan: true, potongan: true, tipeKontrak: true, tipePenggajian: true },
    });
    if (!karyawan) return res.status(404).json({ message: "Karyawan tidak ditemukan" });

    const { absensiList, loanDetails, kasbonList, config } = await fetchPayrollData(karyawanId, cutoffStart, cutoffEnd);

    const overrides = {
      pajak: parseFloat(pajak || 0),
      potonganDpGaji: parseFloat(potonganDpGaji || 0),
      potonganLain: parseFloat(potonganLain || 0),
      potonganPinjaman: manualPinjaman !== undefined ? parseFloat(manualPinjaman) : undefined,
      potonganKasbon: manualKasbon !== undefined ? parseFloat(manualKasbon) : undefined,
      hitungLembur: hitungLembur === "false" ? false : true,
    };

    const kalkulasi = await kalkulasiGaji(karyawan, absensiList, loanDetails, kasbonList, config, overrides);

    const existingGaji = await prisma.gaji.findFirst({
      where: { karyawanId, periode: { gte: gajiStart, lte: gajiEnd } },
    });

    res.json({
      karyawan,
      periode,
      kalkulasi,
      pinjaman: { potonganPinjaman: kalkulasi.potonganPinjaman, details: loanDetails },
      kasbon:   { potonganKasbon: kalkulasi.potonganKasbon, list: kasbonList },
      sudahDiproses: !!existingGaji,
      existingGajiId: existingGaji?.id || null,
    });
  } catch (error) {
    console.error("Error getPayrollPreview:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /payroll/gaji — Buat slip gaji (BULANAN atau HARIAN)
 */
export const createGaji = async (req, res) => {
  try {
    const { karyawanId, periode, pajak = 0, potonganDpGaji = 0, potonganLain = 0, manualPinjaman, manualKasbon, hitungLembur } = req.body;
    if (!karyawanId || !periode) return res.status(400).json({ message: "karyawanId dan periode wajib diisi" });

    const { periodDate, gajiStart, gajiEnd, cutoffStart, cutoffEnd } = getPayrollDateRanges(periode);

    // Cek duplikat
    const existing = await prisma.gaji.findFirst({
      where: { karyawanId, periode: { gte: gajiStart, lte: gajiEnd } },
    });
    if (existing) return res.status(400).json({ message: "Slip gaji untuk karyawan ini di periode tersebut sudah ada" });

    const karyawan = await prisma.karyawan.findUnique({
      where: { id: karyawanId },
      select: { id: true, namaLengkap: true, gajiPokok: true, tunjangan: true, potongan: true, tipeKontrak: true },
    });
    if (!karyawan) return res.status(404).json({ message: "Karyawan tidak ditemukan" });

    const { absensiList, loanDetails, kasbonList, config } = await fetchPayrollData(karyawanId, cutoffStart, cutoffEnd);

    const k = await kalkulasiGaji(karyawan, absensiList, loanDetails, kasbonList, config, {
      pajak: parseFloat(pajak),
      potonganDpGaji: parseFloat(potonganDpGaji),
      potonganLain: parseFloat(potonganLain),
      potonganPinjaman: manualPinjaman !== undefined ? parseFloat(manualPinjaman) : undefined,
      potonganKasbon: manualKasbon !== undefined ? parseFloat(manualKasbon) : undefined,
      hitungLembur: hitungLembur !== false,
    });

    const result = await prisma.$transaction(async (tx) => {
      const gaji = await tx.gaji.create({
        data: {
          karyawanId,
          periode: periodDate,
          periodeMulai: cutoffStart,
          periodeSelesai: cutoffEnd,
          gajiPokok: k.gajiKerja,
          tunjangan: k.tunjangan,
          tunjanganJabatan: k.tunjanganJabatan,
          tunjanganKeluarga: k.tunjanganKeluarga,
          tunjanganMakan: k.tunjanganMakan,
          tunjanganTransport: k.tunjanganTransport,
          tunjanganKehadiran: k.tunjanganKehadiran,
          tunjanganShift: k.tunjanganShift,
          potongan: k.potonganLain + k.potonganTerlambat,
          totalJamLembur: k.totalJamLembur,
          upahLembur: k.upahLembur,
          pajak: k.pajak,
          potonganPinjaman: k.potonganPinjaman,
          potonganKasbon: k.potonganKasbon,
          potonganDpGaji: k.potonganDpGaji,
          total: k.total,
          status: "DRAFT", // Selalu simpan sebagai DRAFT dulu
        },
      });

      return gaji;
    }, { timeout: 30000 });

    res.status(201).json(result);
  } catch (error) {
    console.error("Error createGaji:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * DELETE /payroll/gaji/:id
 */
export const deleteGaji = async (req, res) => {
  try {
    const { id } = req.params;
    const gaji = await prisma.gaji.findUnique({ where: { id } });
    if (!gaji) return res.status(404).json({ message: "Data gaji tidak ditemukan" });
    await prisma.gaji.delete({ where: { id } });
    res.json({ message: "Data gaji berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * PATCH /payroll/gaji/:id — Update slip gaji DRAFT (Hitung ulang)
 */
export const updateGaji = async (req, res) => {
  try {
    const { id } = req.params;
    const { pajak, potonganDpGaji, potonganLain, manualPinjaman, manualKasbon, hitungLembur } = req.body;

    const existing = await prisma.gaji.findUnique({
      where: { id },
      include: { karyawan: true },
    });

    if (!existing) return res.status(404).json({ message: "Data gaji tidak ditemukan" });
    if (existing.status !== "DRAFT") {
      return res.status(400).json({ message: "Hanya gaji berstatus DRAFT yang dapat diedit/dihitung ulang" });
    }

    const { gajiStart, gajiEnd, cutoffStart, cutoffEnd } = getPayrollDateRanges(existing.periode);

    const { absensiList, loanDetails, kasbonList, config } = await fetchPayrollData(existing.karyawanId, cutoffStart, cutoffEnd);

    const overrides = {
      pajak: parseFloat(pajak || 0),
      potonganDpGaji: parseFloat(potonganDpGaji || 0),
      potonganLain: parseFloat(potonganLain || 0),
      potonganPinjaman: manualPinjaman !== undefined ? parseFloat(manualPinjaman) : undefined,
      potonganKasbon: manualKasbon !== undefined ? parseFloat(manualKasbon) : undefined,
      hitungLembur: hitungLembur !== false,
    };

    const k = await kalkulasiGaji(existing.karyawan, absensiList, loanDetails, kasbonList, config, overrides);

    const updated = await prisma.gaji.update({
      where: { id },
      data: {
        gajiPokok: k.gajiKerja,
        tunjangan: k.tunjangan,
        tunjanganJabatan: k.tunjanganJabatan,
        tunjanganKeluarga: k.tunjanganKeluarga,
        tunjanganMakan: k.tunjanganMakan,
        tunjanganTransport: k.tunjanganTransport,
        tunjanganKehadiran: k.tunjanganKehadiran,
        tunjanganShift: k.tunjanganShift,
        potongan: k.potonganLain + k.potonganTerlambat,
        upahLembur: k.upahLembur,
        totalJamLembur: k.totalJamLembur,
        pajak: k.pajak,
        potonganPinjaman: k.potonganPinjaman,
        potonganKasbon: k.potonganKasbon,
        potonganDpGaji: k.potonganDpGaji,
        total: k.total,
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updateGaji:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /payroll/bulk-preview?periode=YYYY-MM-DD
 */
export const getBulkPayrollPreview = async (req, res) => {
  try {
    const { periode } = req.query;
    if (!periode) return res.status(400).json({ message: "periode wajib diisi" });

    const { gajiStart, gajiEnd, cutoffStart, cutoffEnd } = getPayrollDateRanges(periode);

    const karyawanList = await prisma.karyawan.findMany({
      where: { isActive: true, gajiPokok: { not: null } },
      select: { id: true, namaLengkap: true, nik: true, jabatan: true, departemen: true, gajiPokok: true, tunjangan: true, potongan: true, tipeKontrak: true },
      orderBy: { namaLengkap: "asc" },
    });

    const sudahDiprosesRows = await prisma.gaji.findMany({
      where: { periode: { gte: gajiStart, lte: gajiEnd } },
      select: { karyawanId: true },
    });
    const sudahDiprosesSet = new Set(sudahDiprosesRows.map((g) => g.karyawanId));

    const config = await prisma.payrollConfig.findFirst({ where: { isActive: true } });

    const previews = await Promise.all(
      karyawanList.map(async (karyawan) => {
        const sudah = sudahDiprosesSet.has(karyawan.id);
        const { absensiList, loanDetails, kasbonList } = await fetchPayrollData(karyawan.id, cutoffStart, cutoffEnd);
        const k = await kalkulasiGaji(karyawan, absensiList, loanDetails, kasbonList, config);
        return { karyawan, sudahDiproses: sudah, kalkulasi: k };
      })
    );

    const belumDiproses = previews.filter((p) => !p.sudahDiproses);

    res.json({
      periode,
      totalKaryawan: karyawanList.length,
      totalBelumDiproses: belumDiproses.length,
      totalSudahDiproses: sudahDiprosesRows.length,
      totalGajiBersih: belumDiproses.reduce((s, p) => s + p.kalkulasi.total, 0),
      previews,
    });
  } catch (error) {
    console.error("Error getBulkPayrollPreview:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /payroll/bulk-process
 */
export const processBulkPayroll = async (req, res) => {
  try {
    const { periode } = req.body;
    if (!periode) return res.status(400).json({ message: "periode wajib diisi" });

    const { periodDate, gajiStart, gajiEnd, cutoffStart, cutoffEnd } = getPayrollDateRanges(periode);

    const karyawanList = await prisma.karyawan.findMany({
      where: { isActive: true, gajiPokok: { not: null } },
      select: { id: true, namaLengkap: true, nik: true, gajiPokok: true, tunjangan: true, potongan: true, tipeKontrak: true },
    });

    const sudahDiprosesRows = await prisma.gaji.findMany({
      where: { periode: { gte: gajiStart, lte: gajiEnd } },
      select: { karyawanId: true },
    });
    const sudahDiprosesSet = new Set(sudahDiprosesRows.map((g) => g.karyawanId));
    const toBeProcesed = karyawanList.filter((k) => !sudahDiprosesSet.has(k.id));

    if (toBeProcesed.length === 0) {
      return res.status(400).json({ message: "Semua karyawan sudah diproses untuk periode ini" });
    }

    const config = await prisma.payrollConfig.findFirst({ where: { isActive: true } });
    const results = { success: [], failed: [] };

    for (const karyawan of toBeProcesed) {
      try {
        const { absensiList, loanDetails, kasbonList } = await fetchPayrollData(karyawan.id, cutoffStart, cutoffEnd);
        const k = await kalkulasiGaji(karyawan, absensiList, loanDetails, kasbonList, config);

        await prisma.$transaction(async (tx) => {
          const gaji = await tx.gaji.create({
            data: {
              karyawanId: karyawan.id,
              periode: periodDate,
              periodeMulai: cutoffStart,
              periodeSelesai: cutoffEnd,
              gajiPokok: k.gajiKerja,
              tunjangan: k.tunjangan,
              tunjanganJabatan: k.tunjanganJabatan,
              tunjanganKeluarga: k.tunjanganKeluarga,
              tunjanganMakan: k.tunjanganMakan,
              tunjanganTransport: k.tunjanganTransport,
              tunjanganKehadiran: k.tunjanganKehadiran,
              tunjanganShift: k.tunjanganShift,
              potongan: k.potonganLain + k.potonganTerlambat,
              totalJamLembur: k.totalJamLembur,
              upahLembur: k.upahLembur,
              pajak: k.pajak,
              potonganPinjaman: k.potonganPinjaman,
              potonganKasbon: k.potonganKasbon,
              potonganDpGaji: k.potonganDpGaji,
              total: k.total,
              status: "DRAFT",
            },
          });

          results.success.push({ karyawanId: karyawan.id, namaLengkap: karyawan.namaLengkap, gajiId: gaji.id });
        }, { timeout: 30000 });
      } catch (err) {
        results.failed.push({ karyawanId: karyawan.id, namaLengkap: karyawan.namaLengkap, error: err.message });
      }
    }

    res.json({
      message: `Berhasil memproses ${results.success.length} karyawan, ${results.failed.length} gagal`,
      totalSuccess: results.success.length,
      totalFailed: results.failed.length,
      success: results.success,
      failed: results.failed,
    });
  } catch (error) {
    console.error("Error processBulkPayroll:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /payroll/gaji/:id/post
 * Finalisasi draft gaji ke General Ledger dan update status pinjaman/kasbon
 */
export const postGaji = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Ambil data draft gaji
    const gaji = await prisma.gaji.findUnique({
      where: { id },
      include: { karyawan: true },
    });

    if (!gaji) return res.status(404).json({ message: "Data gaji tidak ditemukan" });
    if (gaji.status === "POSTED") return res.status(400).json({ message: "Gaji ini sudah di-posting sebelumnya" });

    // 2. Ambil data pendukung (pinjaman & kasbon) untuk periode tersebut
    // Kita harus ambil ulang data ini karena saat DRAFT kita belum mengubah status mereka
    const { loanDetails, kasbonList } = await fetchPayrollData(gaji.karyawanId, gaji.periodeMulai, gaji.periodeSelesai);

    const result = await prisma.$transaction(async (tx) => {
      // A. Update status detail pinjaman (sesuai potonganPinjaman di record Gaji)
      let remainingPinjamanToDeduct = Number(gaji.potonganPinjaman || 0);
      for (const detail of loanDetails) {
        // Ambil porsi yang sesuai untuk installment ini (jika manual lebih kecil, kurangi saldo seadanya)
        // Jika manual lebih besar, sisanya akan dikurangi dari loan pertama
        const toDeduct = Math.min(remainingPinjamanToDeduct, Number(detail.jumlahBayar));
        
        await tx.pinjamanDetail.update({ where: { id: detail.id }, data: { status: "PAID", tanggalBayar: new Date() } });
        await tx.pinjaman.update({ where: { id: detail.pinjamanId }, data: { sisaPinjaman: { decrement: toDeduct } } });
        
        remainingPinjamanToDeduct -= toDeduct;

        const updatedLoan = await tx.pinjaman.findUnique({ where: { id: detail.pinjamanId } });
        if (updatedLoan && Number(updatedLoan.sisaPinjaman) <= 0) {
          await tx.pinjaman.update({ where: { id: detail.pinjamanId }, data: { status: "COMPLETED" } });
        }
      }

      // B. Settle kasbon
      let remainingKasbonToDeduct = Number(gaji.potonganKasbon || 0);
      for (const kasbon of kasbonList) {
        // Mirip pinjaman, jika ada keringanan maka saldo Piutang Karyawan hanya berkurang sesuai yang dibayar
        const toDeduct = Math.min(remainingKasbonToDeduct, Number(kasbon.jumlah));
        
        await tx.kasbonSementara.update({ where: { id: kasbon.id }, data: { status: "SETTLED", tanggalPenyelesaian: new Date() } });
        // Catatan: Kasbon biasanya satu-satu, tapi kita handle loop untuk jaga-jaga
        remainingKasbonToDeduct -= toDeduct;
      }

      // C. GL Journal
      // Gross Salary (Total Pendapatan sebelum potongan)
      const totalPendapatan = gaji.gajiPokok + (gaji.tunjangan || 0) + gaji.upahLembur;
      
      const ledgerEntries = [
        // DEBIT: Beban Gaji (Gross)
        { systemAccountKey: "EXPENSE_SALARY", debit: totalPendapatan, karyawanId: gaji.karyawanId },
      ];

      // KREDIT: Potongan-potongan
      if (gaji.potonganPinjaman > 0) {
        ledgerEntries.push({ systemAccountKey: "EMPLOYEE_LOAN_ACCOUNT", credit: gaji.potonganPinjaman, karyawanId: gaji.karyawanId });
      }
      if (gaji.potonganKasbon > 0) {
        ledgerEntries.push({ systemAccountKey: "EMPLOYEE_CASH_ADVANCE", credit: gaji.potonganKasbon, karyawanId: gaji.karyawanId });
      }
      if (gaji.potonganDpGaji > 0) {
        // DP Gaji biasanya mengurangi Piutang Karyawan/Staff Advance
        ledgerEntries.push({ systemAccountKey: "STAFF_ADVANCE", credit: gaji.potonganDpGaji, karyawanId: gaji.karyawanId });
      }
      if (gaji.pajak > 0) {
        // Hutang Pajak
        ledgerEntries.push({ systemAccountKey: "ACCOUNTS_PAYABLE", credit: gaji.pajak, keterangan: "Potongan Pajak PPh21" });
      }
      
      // Potongan Lain & Terlambat (Bisa dianggap sebagai pengurang beban atau pendapatan lain)
      const totalPotonganLain = (gaji.potongan || 0); // Di database 'potongan' menyimpan (potonganLain + potonganTerlambat)
      if (totalPotonganLain > 0) {
        ledgerEntries.push({ systemAccountKey: "ACCOUNTS_PAYABLE", credit: totalPotonganLain, keterangan: "Potongan Lain-lain & Terlambat" });
      }

      // KREDIT: Net Salary (Hutang Gaji ke Karyawan)
      ledgerEntries.push({ systemAccountKey: "ACCOUNTS_PAYABLE", credit: gaji.total, keterangan: `Hutang Gaji - ${gaji.karyawan.namaLengkap}` });

      await createLedgerEntry({
        referenceType: "JOURNAL",
        referenceId: gaji.id,
        referenceNumber: `PAYROLL-${gaji.id.substring(0, 8).toUpperCase()}`,
        tanggal: gaji.periode,
        keterangan: `Payroll POSTING ${gaji.periode.toLocaleDateString("id-ID", { month: "long", year: "numeric" })} - ${gaji.karyawan.namaLengkap}`,
        entries: ledgerEntries,
        createdById: req.user?.id || "SYSTEM",
        tx,
      });

      // D. Update status Gaji ke POSTED
      const updatedGaji = await tx.gaji.update({
        where: { id: gaji.id },
        data: { status: "POSTED" },
      });

      return updatedGaji;
    }, { timeout: 30000 });

    res.json({ message: "Gaji berhasil di-posting ke General Ledger", data: result });
  } catch (error) {
    console.error("Error postGaji:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /payroll/bulk-post
 * Posting massal semua draft gaji untuk periode tertentu
 */
export const postBulkPayroll = async (req, res) => {
  try {
    const { periode } = req.body;
    if (!periode) return res.status(400).json({ message: "periode wajib diisi" });

    const { gajiStart, gajiEnd } = getPayrollDateRanges(periode);

    // Ambil semua draft gaji untuk periode tersebut
    const drafts = await prisma.gaji.findMany({
      where: {
        status: "DRAFT",
        periode: { gte: gajiStart, lte: gajiEnd },
      },
      include: { karyawan: true },
    });

    if (drafts.length === 0) {
      return res.status(400).json({ message: "Tidak ada draft gaji yang perlu di-posting untuk periode ini" });
    }

    const results = { success: [], failed: [] };

    for (const gaji of drafts) {
      try {
        const { loanDetails, kasbonList } = await fetchPayrollData(gaji.karyawanId, gaji.periodeMulai, gaji.periodeSelesai);

        await prisma.$transaction(async (tx) => {
          // A. Loans
          for (const detail of loanDetails) {
            await tx.pinjamanDetail.update({ where: { id: detail.id }, data: { status: "PAID", tanggalBayar: new Date() } });
            await tx.pinjaman.update({ where: { id: detail.pinjamanId }, data: { sisaPinjaman: { decrement: detail.jumlahBayar } } });
            const updatedLoan = await tx.pinjaman.findUnique({ where: { id: detail.pinjamanId } });
            if (updatedLoan && Number(updatedLoan.sisaPinjaman) <= 0) {
              await tx.pinjaman.update({ where: { id: detail.pinjamanId }, data: { status: "COMPLETED" } });
            }
          }

          // B. Kasbon
          for (const kasbon of kasbonList) {
            await tx.kasbonSementara.update({ where: { id: kasbon.id }, data: { status: "SETTLED", tanggalPenyelesaian: new Date() } });
          }

          // C. Journal
          const totalPendapatan = gaji.gajiPokok + (gaji.tunjangan || 0) + gaji.upahLembur;
          const ledgerEntries = [
            { systemAccountKey: "EXPENSE_SALARY", debit: totalPendapatan, karyawanId: gaji.karyawanId },
          ];
          if (gaji.potonganPinjaman > 0) ledgerEntries.push({ systemAccountKey: "EMPLOYEE_LOAN_ACCOUNT", credit: gaji.potonganPinjaman, karyawanId: gaji.karyawanId });
          if (gaji.potonganKasbon > 0)   ledgerEntries.push({ systemAccountKey: "EMPLOYEE_CASH_ADVANCE", credit: gaji.potonganKasbon, karyawanId: gaji.karyawanId });
          ledgerEntries.push({ systemAccountKey: "ACCOUNTS_PAYABLE", credit: gaji.total });
          if (gaji.pajak > 0) ledgerEntries.push({ systemAccountKey: "ACCOUNTS_PAYABLE", credit: gaji.pajak, keterangan: "Potongan Pajak PPh21" });

          await createLedgerEntry({
            referenceType: "JOURNAL",
            referenceId: gaji.id,
            referenceNumber: `PAYROLL-${gaji.id.substring(0, 8).toUpperCase()}`,
            tanggal: gaji.periode,
            keterangan: `Payroll Bulk POSTING ${gaji.periode.toLocaleDateString("id-ID", { month: "long", year: "numeric" })} - ${gaji.karyawan.namaLengkap}`,
            entries: ledgerEntries,
            createdById: req.user?.id || "SYSTEM",
            tx,
          });

          // D. Status
          await tx.gaji.update({
            where: { id: gaji.id },
            data: { status: "POSTED" },
          });
        }, { timeout: 30000 });

        results.success.push({ gajiId: gaji.id, namaLengkap: gaji.karyawan.namaLengkap });
      } catch (err) {
        console.error(`Gagal posting gaji ${gaji.id}:`, err);
        results.failed.push({ gajiId: gaji.id, namaLengkap: gaji.karyawan.namaLengkap, error: err.message });
      }
    }

    res.json({
      message: `Berhasil mem-posting ${results.success.length} gaji, ${results.failed.length} gagal`,
      totalSuccess: results.success.length,
      totalFailed: results.failed.length,
      results,
    });
  } catch (error) {
    console.error("Error postBulkPayroll:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /payroll/gaji/:id/void
 * Batalkan posting gaji: hapus jurnal, kembalikan status pinjaman/kasbon, set kembali ke DRAFT
 */
export const voidGaji = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = "Pembatalan Payroll" } = req.body;
    const userId = req.user?.id || "SYSTEM";

    // 1. Ambil data gaji
    const gaji = await prisma.gaji.findUnique({
      where: { id },
      include: { karyawan: true },
    });

    if (!gaji) return res.status(404).json({ message: "Data gaji tidak ditemukan" });
    if (gaji.status === "DRAFT") return res.status(400).json({ message: "Gaji ini masih berstatus DRAFT" });

    // 2. Cari jurnal terkait
    const ledger = await prisma.ledger.findFirst({
      where: { referenceId: gaji.id, referenceType: "JOURNAL" },
      include: { ledgerLines: true },
    });

    const result = await prisma.$transaction(async (tx) => {
      // A. Jika ada jurnal, lakukan VOID (mirip ledgerController.voidLedger)
      if (ledger && ledger.status !== "VOID") {
        for (const line of ledger.ledgerLines) {
          const normalizedDate = new Date(ledger.transactionDate);
          normalizedDate.setHours(0, 0, 0, 0);

          // Update Summary
          const summary = await tx.generalLedgerSummary.findUnique({
            where: {
              coaId_periodId_date: {
                coaId: line.coaId,
                periodId: ledger.periodId,
                date: normalizedDate,
              },
            },
          });
          if (summary) {
            const newDebit = Math.max(0, Number(summary.debitTotal) - line.debitAmount);
            const newCredit = Math.max(0, Number(summary.creditTotal) - line.creditAmount);
            await tx.generalLedgerSummary.update({
              where: { id: summary.id },
              data: {
                debitTotal: newDebit,
                creditTotal: newCredit,
                closingBalance: Number(summary.openingBalance) + newDebit - newCredit,
                transactionCount: { decrement: 1 },
              },
            });
          }

          // Update Trial Balance
          const tb = await tx.trialBalance.findUnique({
            where: { periodId_coaId: { periodId: ledger.periodId, coaId: line.coaId } },
          });
          if (tb) {
            const newPD = Math.max(0, Number(tb.periodDebit) - line.debitAmount);
            const newPC = Math.max(0, Number(tb.periodCredit) - line.creditAmount);
            await tx.trialBalance.update({
              where: { id: tb.id },
              data: {
                periodDebit: newPD,
                periodCredit: newPC,
                endingDebit: Number(tb.openingDebit) + newPD,
                endingCredit: Number(tb.openingCredit) + newPC,
                ytdDebit: Number(tb.openingDebit) + newPD,
                ytdCredit: Number(tb.openingCredit) + newPC,
              },
            });
          }
        }

        // Mark Ledger as VOID
        await tx.ledger.update({
          where: { id: ledger.id },
          data: {
            status: "VOID",
            voidBy: userId,
            voidAt: new Date(),
            voidReason: reason,
          },
        });
      }

      // B. Kembalikan status Pinjaman & Kasbon
      // Cari detail pinjaman yang statusnya PAID di periode ini untuk karyawan ini
      const loanDetailsToRevert = await tx.pinjamanDetail.findMany({
        where: {
          status: "PAID",
          tanggalJatuhTempo: { gte: gaji.periodeMulai, lte: gaji.periodeSelesai },
          pinjaman: { is: { karyawanId: gaji.karyawanId } }
        }
      });
      
      for (const detail of loanDetailsToRevert) {
        await tx.pinjamanDetail.update({ where: { id: detail.id }, data: { status: "PENDING", tanggalBayar: null } });
        await tx.pinjaman.update({ where: { id: detail.pinjamanId }, data: { sisaPinjaman: { increment: detail.jumlahBayar }, status: "ACTIVE" } });
      }

      // Cari kasbon yang statusnya SETTLED di periode ini untuk karyawan ini
      const kasbonToRevert = await tx.kasbonSementara.findMany({
        where: {
          status: "SETTLED",
          karyawanId: gaji.karyawanId,
          bulanPotong: { gte: gaji.periodeMulai, lte: gaji.periodeSelesai }
        }
      });

      for (const kasbon of kasbonToRevert) {
        await tx.kasbonSementara.update({ where: { id: kasbon.id }, data: { status: "APPROVED", tanggalPenyelesaian: null } });
      }

      // D. Update status Gaji kembali ke DRAFT
      const updatedGaji = await tx.gaji.update({
        where: { id: gaji.id },
        data: { status: "DRAFT" },
      });

      return updatedGaji;
    }, { timeout: 30000 });

    res.json({ message: "Posting gaji berhasil dibatalkan dan dikembalikan ke DRAFT", data: result });
  } catch (error) {
    console.error("Error voidGaji:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PAYROLL CONFIG
// ─────────────────────────────────────────────────────────────────────────────

export const getPayrollConfigs = async (req, res) => {
  try {
    const configs = await prisma.payrollConfig.findMany();
    res.json(configs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createPayrollConfig = async (req, res) => {
  try {
    const { name, gajiPerHari, lemburPerJam, jamKerjaPerHari = 8, toleransiTerlambat = 15, potonganTerlambat = 0, isActive } = req.body;
    const config = await prisma.payrollConfig.create({
      data: {
        name,
        gajiPerHari: parseFloat(gajiPerHari),
        lemburPerJam: parseFloat(lemburPerJam),
        jamKerjaPerHari: parseFloat(jamKerjaPerHari),
        toleransiTerlambat: parseInt(toleransiTerlambat),
        potonganTerlambat: parseFloat(potonganTerlambat),
        isActive: isActive !== undefined ? isActive : true,
      },
    });
    res.status(201).json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePayrollConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, gajiPerHari, lemburPerJam, jamKerjaPerHari, toleransiTerlambat, potonganTerlambat, isActive } = req.body;
    const config = await prisma.payrollConfig.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(gajiPerHari !== undefined && { gajiPerHari: parseFloat(gajiPerHari) }),
        ...(lemburPerJam !== undefined && { lemburPerJam: parseFloat(lemburPerJam) }),
        ...(jamKerjaPerHari !== undefined && { jamKerjaPerHari: parseFloat(jamKerjaPerHari) }),
        ...(toleransiTerlambat !== undefined && { toleransiTerlambat: parseInt(toleransiTerlambat) }),
        ...(potonganTerlambat !== undefined && { potonganTerlambat: parseFloat(potonganTerlambat) }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * PATCH /payroll/gaji/:id/publish
 * Publikasikan slip gaji agar bisa dilihat karyawan di mobile
 */
export const publishGaji = async (req, res) => {
  try {
    const { id } = req.params;
    const gaji = await prisma.gaji.findUnique({ 
      where: { id },
      include: { karyawan: true }
    });

    if (!gaji) return res.status(404).json({ message: "Data gaji tidak ditemukan" });
    if (gaji.status === "PUBLISHED") return res.status(400).json({ message: "Gaji ini sudah dipublikasikan" });
    // DRAFT allowed for trial as requested
    
    const updated = await prisma.gaji.update({
      where: { id },
      data: { status: "PUBLISHED" },
    });

    // Send push notification to the Employee
    try {
      if (gaji.karyawan?.userId) {
        const periodStr = new Date(gaji.periode).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
        await NotificationService.sendToUser(gaji.karyawan.userId, {
          title: "💸 Slip Gaji Dirilis!",
          body: `Halo ${gaji.karyawan.namaLengkap}, slip gaji Anda untuk periode ${periodStr} telah dirilis oleh Admin. Silakan periksa di aplikasi.`,
          type: "payroll_published",
          data: {
            id: gaji.id,
            periode: gaji.periode.toISOString(),
            click_action: "FLUTTER_NOTIFICATION_CLICK"
          }
        });
      }
    } catch (notifError) {
      console.error("[Notification] Failed to send payroll publication notification:", notifError.message);
    }

    res.json({ success: true, message: "Gaji berhasil dipublikasikan", data: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /payroll/bulk-publish
 * Publikasikan massal semua gaji yang sudah di-POSTED untuk periode tertentu
 */
export const publishBulkPayroll = async (req, res) => {
  try {
    const { periode } = req.body;
    if (!periode) return res.status(400).json({ message: "periode wajib diisi" });

    const periodDate   = new Date(periode);
    const startOfMonth = new Date(periodDate.getFullYear(), periodDate.getMonth(), 1);
    const endOfMonth   = new Date(periodDate.getFullYear(), periodDate.getMonth() + 1, 0, 23, 59, 59);

    // Fetch affected payrolls to notify employees
    const publishedGaji = await prisma.gaji.findMany({
      where: {
        status: { in: ["POSTED", "DRAFT"] },
        periode: { gte: startOfMonth, lte: endOfMonth },
      },
      include: { karyawan: true },
    });

    const result = await prisma.gaji.updateMany({
      where: {
        status: { in: ["POSTED", "DRAFT"] }, // Allow both for trial
        periode: { gte: startOfMonth, lte: endOfMonth },
      },
      data: { status: "PUBLISHED" },
    });

    // Notify each employee in parallel
    const periodStr = periodDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    for (const gaji of publishedGaji) {
      try {
        if (gaji.karyawan?.userId) {
          await NotificationService.sendToUser(gaji.karyawan.userId, {
            title: "💸 Slip Gaji Dirilis!",
            body: `Halo ${gaji.karyawan.namaLengkap}, slip gaji Anda untuk periode ${periodStr} telah dirilis oleh Admin. Silakan periksa di aplikasi.`,
            type: "payroll_published",
            data: {
              id: gaji.id,
              periode: gaji.periode.toISOString(),
              click_action: "FLUTTER_NOTIFICATION_CLICK"
            }
          });
        }
      } catch (notifError) {
        console.error(`[Notification] Failed to send bulk payroll notification to user ${gaji.karyawanId}:`, notifError.message);
      }
    }

    res.json({ 
      success: true, 
      message: `Berhasil mempublikasikan ${result.count} slip gaji`,
      count: result.count 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /payroll/my-salary
 * Mobile: Mengambil daftar slip gaji milik karyawan yang login
 */
export const getMyGaji = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const karyawan = await prisma.karyawan.findUnique({ where: { userId } });
    if (!karyawan) return res.status(404).json({ message: "Data karyawan tidak ditemukan" });

    const gaji = await prisma.gaji.findMany({
      where: {
        karyawanId: karyawan.id,
        status: "PUBLISHED", // Hanya yang sudah dipublish oleh Admin
      },
      orderBy: { periode: "desc" },
    });

    res.json({ success: true, data: gaji });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /payroll/my-salary/:id
 * Mobile: Mengambil detail slip gaji
 */
export const getMyGajiDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const gaji = await prisma.gaji.findUnique({
      where: { id },
      include: { 
        karyawan: {
          select: { namaLengkap: true, nik: true, jabatan: true, departemen: true }
        } 
      },
    });

    if (!gaji) return res.status(404).json({ message: "Slip gaji tidak ditemukan" });
    
    // Pastikan user hanya bisa melihat gajinya sendiri
    const karyawan = await prisma.karyawan.findUnique({ where: { userId } });
    if (gaji.karyawanId !== karyawan?.id) {
      return res.status(403).json({ message: "Anda tidak memiliki akses ke data ini" });
    }

    res.json({ success: true, data: gaji });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



export const getGlobalPayrollConfig = async (req, res) => {
  try {
    let config = await prisma.globalPayrollConfig.findFirst();
    if (!config) {
      config = await prisma.globalPayrollConfig.create({
        data: {}
      });
    }
    res.json({ data: config });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateGlobalPayrollConfig = async (req, res) => {
  try {
    let config = await prisma.globalPayrollConfig.findFirst();
    if (config) {
      config = await prisma.globalPayrollConfig.update({
        where: { id: config.id },
        data: req.body
      });
    } else {
      config = await prisma.globalPayrollConfig.create({
        data: req.body
      });
    }
    res.json({ data: config, message: "Global config updated" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

