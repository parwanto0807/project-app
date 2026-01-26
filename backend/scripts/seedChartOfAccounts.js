import { prisma } from '../src/config/db.js';

const coaData = [
  // --- ASSETS (1-xxxx) ---
  {
    code: '1-10000',
    name: 'Kas & Bank',
    description: 'Akun Induk untuk semua Kas dan Rekening Bank.',
    type: 'ASET',
    normalBalance: 'DEBIT',
    postingType: 'HEADER',
    cashflowType: 'NONE',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '1-10001',
    name: 'Kas Peti Cash',
    description: 'Saldo uang tunai yang tersedia untuk pengeluaran kecil sehari-hari.',
    type: 'ASET',
    normalBalance: 'DEBIT',
    postingType: 'POSTING',
    cashflowType: 'OPERATING',
    isReconcilable: true,
    status: 'ACTIVE'
  },
  {
    code: '1-10002',
    name: 'Bank BRI KC. CIKARANG',
    description: 'Saldo rekening tabungan/giro di Bank BRI KC. CIKARANG.',
    type: 'ASET',
    normalBalance: 'DEBIT',
    postingType: 'POSTING',
    cashflowType: 'OPERATING',
    isReconcilable: true,
    status: 'ACTIVE'
  },
  {
    code: '1-10003',
    name: 'Bank BRI KC. HARAPAN INDAH',
    description: 'Saldo rekening tabungan/giro di Bank BRI KC. HARAPAN INDAH',
    type: 'ASET',
    normalBalance: 'DEBIT',
    postingType: 'POSTING',
    cashflowType: 'OPERATING',
    isReconcilable: true,
    status: 'ACTIVE'
  },
  {
    code: '1-10004',
    name: 'Bank BRI KC. LEBAK BULUS',
    description: 'Saldo rekening tabungan/giro di Bank BRI KC. LEBAK BULUS',
    type: 'ASET',
    normalBalance: 'DEBIT',
    postingType: 'POSTING',
    cashflowType: 'OPERATING',
    isReconcilable: true,
    status: 'ACTIVE'
  },
  {
    code: '1-10005',
    name: 'Bank BRI KC. TAMBUN',
    description: 'Saldo rekening tabungan/giro di Bank BRI KC. TAMBUN',
    type: 'ASET',
    normalBalance: 'DEBIT',
    postingType: 'POSTING',
    cashflowType: 'OPERATING',
    isReconcilable: true,
    status: 'ACTIVE'
  },
  {
    code: '1-10006',
    name: 'Bank BRI KC. BRI KARAWANG',
    description: 'Saldo rekening tabungan/giro di Bank BRI KC. BRI KARAWANG',
    type: 'ASET',
    normalBalance: 'DEBIT',
    postingType: 'POSTING',
    cashflowType: 'OPERATING',
    isReconcilable: true,
    status: 'ACTIVE'
  },
  {
    code: '1-10100',
    name: 'Piutang',
    description: 'Akun Induk untuk semua Piutang yang dimiliki perusahaan.',
    type: 'ASET',
    normalBalance: 'DEBIT',
    postingType: 'HEADER',
    cashflowType: 'NONE',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '1-10101',
    name: 'Piutang Usaha',
    description: 'Tagihan kepada pelanggan atas penjualan barang atau jasa secara kredit.',
    type: 'ASET',
    normalBalance: 'DEBIT',
    postingType: 'POSTING',
    cashflowType: 'OPERATING',
    isReconcilable: true,
    status: 'ACTIVE'
  },
  {
    code: '1-10102',
    name: 'Piutang Belum Ditagih',
    description: 'Pendapatan yang sudah diakui namun faktur belum diterbitkan.',
    type: 'ASET',
    normalBalance: 'DEBIT',
    postingType: 'POSTING',
    cashflowType: 'OPERATING',
    isReconcilable: true,
    status: 'ACTIVE'
  },
  {
    code: '1-10200',
    name: 'Persediaan',
    description: 'Akun Induk untuk semua jenis Persediaan.',
    type: 'ASET',
    normalBalance: 'DEBIT',
    postingType: 'HEADER',
    cashflowType: 'NONE',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '1-10201',
    name: 'Persediaan Barang Dagang',
    description: 'Nilai barang yang dibeli/diproduksi untuk dijual kembali.',
    type: 'ASET',
    normalBalance: 'DEBIT',
    postingType: 'POSTING',
    cashflowType: 'OPERATING',
    isReconcilable: true,
    status: 'ACTIVE'
  },
  {
    code: '1-10202',
    name: 'Persediaan - Gudang Pusat (BENGKEL)',
    description: 'Stok fisik material/barang yang berada di lokasi pusat (BENGKEL)',
    type: 'ASET',
    normalBalance: 'DEBIT',
    postingType: 'POSTING',
    cashflowType: 'OPERATING',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '1-10203',
    name: 'Persediaan - Gudang Cabang KEBON',
    description: 'Stok fisik material/barang yang berada di lokasi cabang KEBON',
    type: 'ASET',
    normalBalance: 'DEBIT',
    postingType: 'POSTING',
    cashflowType: 'OPERATING',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '1-10204',
    name: 'Persediaan - Gudang Cabang B Zenal',
    description: 'Stok fisik material/barang yang berada di lokasi cabang B Zaenal',
    type: 'ASET',
    normalBalance: 'DEBIT',
    postingType: 'POSTING',
    cashflowType: 'OPERATING',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '1-10205',
    name: 'Persediaan On WIP',
    description: 'Nilai material yang sedang terikat dalam proses pengerjaan proyek di lokasi (Work in Progress)',
    type: 'ASET',
    normalBalance: 'DEBIT',
    postingType: 'POSTING',
    cashflowType: 'OPERATING',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '1-10300',
    name: 'Piutang Lain-lain',
    description: 'Akun Induk untuk tagihan non-operasional utama.',
    type: 'ASET',
    normalBalance: 'DEBIT',
    postingType: 'HEADER',
    cashflowType: 'NONE',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '1-10301',
    name: 'Pinjaman Karyawan',
    description: 'Piutang internal berupa pinjaman atau kasbon karyawan.',
    type: 'ASET',
    normalBalance: 'DEBIT',
    postingType: 'POSTING',
    cashflowType: 'OPERATING',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '1-10302',
    name: 'Uang Muka Kerja (Staff)',
    description: 'Dana PR/Petty Cash untuk belanja operasional/proyek.',
    type: 'ASET',
    normalBalance: 'DEBIT',
    postingType: 'POSTING',
    cashflowType: 'OPERATING',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '1-10400',
    name: 'Pajak Dibayar di Muka',
    description: 'Akun Induk untuk semua pajak yang telah dibayar di muka (prepaid tax).',
    type: 'ASET',
    normalBalance: 'DEBIT',
    postingType: 'HEADER',
    cashflowType: 'NONE',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '1-10401',
    name: 'PPN Masukan',
    description: 'Pajak Pertambahan Nilai yang dibayar atas pembelian barang/jasa.',
    type: 'ASET',
    normalBalance: 'DEBIT',
    postingType: 'POSTING',
    cashflowType: 'OPERATING',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '1-20000',
    name: 'Aset Tetap',
    description: 'Akun Induk untuk semua Aset Jangka Panjang.',
    type: 'ASET',
    normalBalance: 'DEBIT',
    postingType: 'HEADER',
    cashflowType: 'NONE',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '1-20100',
    name: 'Kendaraan',
    description: 'Akun induk untuk semua jenis kendaraan operasional.',
    type: 'ASET',
    normalBalance: 'DEBIT',
    postingType: 'HEADER',
    cashflowType: 'NONE',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '1-20101',
    name: 'Kendaraan Operasional',
    description: 'Mencatat perolehan Mobil, Motor, dan armada proyek.',
    type: 'ASET',
    normalBalance: 'DEBIT',
    postingType: 'POSTING',
    cashflowType: 'INVESTING',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '1-20102',
    name: 'Akumulasi Penyusutan Kendaraan',
    description: 'Akun pengurang nilai kendaraan akibat pemakaian/umur ekonomis.',
    type: 'ASET',
    normalBalance: 'CREDIT',
    postingType: 'POSTING',
    cashflowType: 'NONE',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '1-20200',
    name: 'Tanah dan Bangunan',
    description: 'Akun induk untuk tanah dan bangunan.',
    type: 'ASET',
    normalBalance: 'DEBIT',
    postingType: 'HEADER',
    cashflowType: 'NONE',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '1-20201',
    name: 'Tanah',
    description: 'Nilai perolehan atas tanah yang dimiliki perusahaan.',
    type: 'ASET',
    normalBalance: 'DEBIT',
    postingType: 'POSTING',
    cashflowType: 'INVESTING',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '1-20202',
    name: 'Bangunan',
    description: 'Nilai perolehan atas gedung, kantor, pabrik, gudang.',
    type: 'ASET',
    normalBalance: 'DEBIT',
    postingType: 'POSTING',
    cashflowType: 'INVESTING',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '1-20203',
    name: 'Akumulasi Penyusutan Bangunan',
    description: 'Akun pengurang nilai bangunan.',
    type: 'ASET',
    normalBalance: 'CREDIT',
    postingType: 'POSTING',
    cashflowType: 'NONE',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '1-20300',
    name: 'Peralatan Kantor',
    description: 'Akun induk untuk peralatan kantor.',
    type: 'ASET',
    normalBalance: 'DEBIT',
    postingType: 'HEADER',
    cashflowType: 'NONE',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '1-20301',
    name: 'Peralatan Kantor - Elektronik',
    description: 'Komputer, printer, scanner, proyektor, AC.',
    type: 'ASET',
    normalBalance: 'DEBIT',
    postingType: 'POSTING',
    cashflowType: 'INVESTING',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '1-20302',
    name: 'Peralatan Kantor - Furniture',
    description: 'Meja, kursi, lemari, rak, partisi.',
    type: 'ASET',
    normalBalance: 'DEBIT',
    postingType: 'POSTING',
    cashflowType: 'INVESTING',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '1-20303',
    name: 'Akumulasi Penyusutan Peralatan Kantor',
    description: 'Akun pengurang nilai peralatan kantor.',
    type: 'ASET',
    normalBalance: 'CREDIT',
    postingType: 'POSTING',
    cashflowType: 'NONE',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '1-20400',
    name: 'Peralatan Teknis/Proyek',
    description: 'Akun induk untuk peralatan teknis konstruksi.',
    type: 'ASET',
    normalBalance: 'DEBIT',
    postingType: 'HEADER',
    cashflowType: 'NONE',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '1-20401',
    name: 'Peralatan Konstruksi',
    description: 'Mesin-mesin konstruksi, alat berat, generator.',
    type: 'ASET',
    normalBalance: 'DEBIT',
    postingType: 'POSTING',
    cashflowType: 'INVESTING',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '1-20402',
    name: 'Peralatan Teknis',
    description: 'Alat ukur, alat testing, peralatan survey.',
    type: 'ASET',
    normalBalance: 'DEBIT',
    postingType: 'POSTING',
    cashflowType: 'INVESTING',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '1-20403',
    name: 'Akumulasi Penyusutan Peralatan Teknis',
    description: 'Akun pengurang nilai peralatan teknis.',
    type: 'ASET',
    normalBalance: 'CREDIT',
    postingType: 'POSTING',
    cashflowType: 'NONE',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '1-20500',
    name: 'Aset Tidak Berwujud',
    description: 'Akun induk untuk aset tidak berwujud.',
    type: 'ASET',
    normalBalance: 'DEBIT',
    postingType: 'HEADER',
    cashflowType: 'NONE',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '1-20501',
    name: 'Hak Cipta/Merek Dagang',
    description: 'Nilai perolehan hak kekayaan intelektual.',
    type: 'ASET',
    normalBalance: 'DEBIT',
    postingType: 'POSTING',
    cashflowType: 'INVESTING',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '1-20502',
    name: 'Goodwill',
    description: 'Goodwill dari akuisisi bisnis.',
    type: 'ASET',
    normalBalance: 'DEBIT',
    postingType: 'POSTING',
    cashflowType: 'INVESTING',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '1-20503',
    name: 'Amortisasi Aset Tidak Berwujud',
    description: 'Akun pengurang nilai aset tidak berwujud.',
    type: 'ASET',
    normalBalance: 'CREDIT',
    postingType: 'POSTING',
    cashflowType: 'NONE',
    isReconcilable: false,
    status: 'ACTIVE'
  },

  // --- LIABILITIES (2-xxxx) ---
  {
    code: '2-00000',
    name: 'KEWAJIBAN',
    description: 'Akun Induk Tertinggi untuk seluruh kewajiban perusahaan.',
    type: 'LIABILITAS',
    normalBalance: 'CREDIT',
    postingType: 'HEADER',
    cashflowType: 'NONE',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '2-10000',
    name: 'Kewajiban Jangka Pendek',
    description: 'Akun Induk untuk semua Kewajiban yang jatuh tempo < 1 tahun.',
    type: 'LIABILITAS',
    normalBalance: 'CREDIT',
    postingType: 'HEADER',
    cashflowType: 'NONE',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '2-10101',
    name: 'Utang Usaha (Supplier)',
    description: 'Kewajiban kepada pemasok atas pembelian barang/jasa secara kredit.',
    type: 'LIABILITAS',
    normalBalance: 'CREDIT',
    postingType: 'POSTING',
    cashflowType: 'OPERATING',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '2-10102',
    name: 'Penerimaan Barang Belum Ditagih',
    description: 'Akun temporary untuk mencatat barang masuk yang belum ada invoice final.',
    type: 'LIABILITAS',
    normalBalance: 'CREDIT',
    postingType: 'POSTING',
    cashflowType: 'NONE',
    isReconcilable: true,
    status: 'ACTIVE'
  },
  {
    code: '2-10103',
    name: 'Utang Gaji',
    description: 'Kewajiban atas gaji karyawan yang belum dibayarkan.',
    type: 'LIABILITAS',
    normalBalance: 'CREDIT',
    postingType: 'POSTING',
    cashflowType: 'OPERATING',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '2-10300',
    name: 'Utang Pajak',
    description: 'Akun Induk untuk kewajiban pajak perusahaan.',
    type: 'LIABILITAS',
    normalBalance: 'CREDIT',
    postingType: 'HEADER',
    cashflowType: 'NONE',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '2-10301',
    name: 'PPN Pengeluaran',
    description: 'Pajak Pertambahan Nilai yang dipungut atas penjualan barang/jasa.',
    type: 'LIABILITAS',
    normalBalance: 'CREDIT',
    postingType: 'POSTING',
    cashflowType: 'OPERATING',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '2-20000',
    name: 'Kewajiban Jangka Panjang',
    description: 'Akun Induk untuk semua Kewajiban yang jatuh tempo > 1 tahun.',
    type: 'LIABILITAS',
    normalBalance: 'CREDIT',
    postingType: 'HEADER',
    cashflowType: 'NONE',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '2-20101',
    name: 'Utang Bank Jangka Panjang',
    description: 'Saldo pinjaman bank yang jatuh tempo lebih dari satu tahun.',
    type: 'LIABILITAS',
    normalBalance: 'CREDIT',
    postingType: 'POSTING',
    cashflowType: 'FINANCING',
    isReconcilable: false,
    status: 'ACTIVE'
  },

  // --- EQUITY (3-xxxx) ---
  {
    code: '3-10000',
    name: 'Ekuitas',
    description: 'Akun Induk untuk Kepemilikan (Modal) perusahaan.',
    type: 'EKUITAS',
    normalBalance: 'CREDIT',
    postingType: 'HEADER',
    cashflowType: 'NONE',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '3-10001',
    name: 'Modal Disetor',
    description: 'Jumlah modal yang disetor oleh pemilik/pemegang saham.',
    type: 'EKUITAS',
    normalBalance: 'CREDIT',
    postingType: 'POSTING',
    cashflowType: 'FINANCING',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '3-10002',
    name: 'Laba Ditahan',
    description: 'Akumulasi laba bersih perusahaan dari periode sebelumnya.',
    type: 'EKUITAS',
    normalBalance: 'CREDIT',
    postingType: 'POSTING',
    cashflowType: 'NONE',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '3-10003',
    name: 'Laba Tahun Berjalan',
    description: 'Laba bersih yang diperoleh perusahaan pada tahun fiskal berjalan.',
    type: 'EKUITAS',
    normalBalance: 'CREDIT',
    postingType: 'POSTING',
    cashflowType: 'NONE',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '3-10101',
    name: 'Saldo Awal Ekuitas',
    description: 'Saldo Awal System Go-Live, Ini adalah jurnal penyeimbang administratif.',
    type: 'EKUITAS',
    normalBalance: 'CREDIT',
    postingType: 'POSTING',
    cashflowType: 'NONE',
    isReconcilable: false,
    status: 'ACTIVE'
  },

  // --- INCOME (4-xxxx) ---
  {
    code: '4-10000',
    name: 'Pendapatan',
    description: 'Akun Induk untuk semua Penghasilan Utama perusahaan.',
    type: 'PENDAPATAN',
    normalBalance: 'CREDIT',
    postingType: 'HEADER',
    cashflowType: 'NONE',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '4-10101',
    name: 'Pendapatan Jasa Konstruksi',
    description: 'Penghasilan yang diperoleh dari pelaksanaan proyek konstruksi.',
    type: 'PENDAPATAN',
    normalBalance: 'CREDIT',
    postingType: 'POSTING',
    cashflowType: 'OPERATING',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '4-10201',
    name: 'Pendapatan Jasa Maintenance',
    description: 'Penghasilan yang diperoleh dari layanan pemeliharaan/perawatan.',
    type: 'PENDAPATAN',
    normalBalance: 'CREDIT',
    postingType: 'POSTING',
    cashflowType: 'OPERATING',
    isReconcilable: false,
    status: 'ACTIVE'
  },

  // --- COGS/HPP (5-xxxx) ---
  {
    code: '5-10000',
    name: 'BEBAN POKOK PENDAPATAN',
    description: 'Akun Induk untuk Biaya Langsung terkait perolehan pendapatan.',
    type: 'HPP',
    normalBalance: 'DEBIT',
    postingType: 'HEADER',
    cashflowType: 'NONE',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '5-10101',
    name: 'Biaya Material Proyek',
    description: 'Biaya bahan baku/material yang digunakan langsung untuk proyek.',
    type: 'HPP',
    normalBalance: 'DEBIT',
    postingType: 'POSTING',
    cashflowType: 'OPERATING',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '5-10102',
    name: 'Beban Mobilisasi',
    description: 'Biaya logistik, armada proyek, tol, bensin yang terkait langsung dengan proyek.',
    type: 'HPP',
    normalBalance: 'DEBIT',
    postingType: 'POSTING',
    cashflowType: 'OPERATING',
    isReconcilable: false,
    status: 'ACTIVE'
  },

  // --- EXPENSE (6-xxxx) ---
  {
    code: '6-10000',
    name: 'Beban Operasional & Admin',
    description: 'Akun Induk untuk Beban Umum, Administrasi, dan Penjualan.',
    type: 'BEBAN',
    normalBalance: 'DEBIT',
    postingType: 'HEADER',
    cashflowType: 'NONE',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '6-10101',
    name: 'Beban Gaji Karyawan',
    description: 'Biaya yang dikeluarkan untuk pembayaran gaji dan tunjangan karyawan.',
    type: 'BEBAN',
    normalBalance: 'DEBIT',
    postingType: 'POSTING',
    cashflowType: 'OPERATING',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '6-10102',
    name: 'Beban Admin Bank',
    description: 'Biaya administrasi bank atas layanan perbankan.',
    type: 'BEBAN',
    normalBalance: 'DEBIT',
    postingType: 'POSTING',
    cashflowType: 'OPERATING',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '6-10500',
    name: 'Beban Penyusutan',
    description: 'Akun induk untuk beban penyusutan.',
    type: 'BEBAN',
    normalBalance: 'DEBIT',
    postingType: 'HEADER',
    cashflowType: 'NONE',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '6-10501',
    name: 'Beban Penyusutan Kendaraan',
    description: 'Beban penyusutan kendaraan operasional.',
    type: 'BEBAN',
    normalBalance: 'DEBIT',
    postingType: 'POSTING',
    cashflowType: 'OPERATING',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '6-10502',
    name: 'Beban Penyusutan Bangunan',
    description: 'Beban penyusutan gedung dan bangunan.',
    type: 'BEBAN',
    normalBalance: 'DEBIT',
    postingType: 'POSTING',
    cashflowType: 'OPERATING',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '6-10503',
    name: 'Beban Penyusutan Peralatan Kantor',
    description: 'Beban penyusutan peralatan kantor.',
    type: 'BEBAN',
    normalBalance: 'DEBIT',
    postingType: 'POSTING',
    cashflowType: 'OPERATING',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '6-10504',
    name: 'Beban Penyusutan Peralatan Teknis',
    description: 'Beban penyusutan alat konstruksi dan teknis.',
    type: 'BEBAN',
    normalBalance: 'DEBIT',
    postingType: 'POSTING',
    cashflowType: 'OPERATING',
    isReconcilable: false,
    status: 'ACTIVE'
  },
  {
    code: '6-10505',
    name: 'Beban Amortisasi',
    description: 'Beban amortisasi aset tidak berwujud.',
    type: 'BEBAN',
    normalBalance: 'DEBIT',
    postingType: 'POSTING',
    cashflowType: 'OPERATING',
    isReconcilable: false,
    status: 'ACTIVE'
  }
];

async function seedCOA() {
  console.log('🌱 Updating Chart of Accounts for Go-Live...');

  // Pass 1: Upsert basic account data (without parentId first to avoid order issues)
  for (const item of coaData) {
    await prisma.chartOfAccounts.upsert({
      where: { code: item.code },
      update: {
        name: item.name,
        description: item.description,
        type: item.type,
        normalBalance: item.normalBalance,
        postingType: item.postingType,
        cashflowType: item.cashflowType,
        isReconcilable: item.isReconcilable,
        status: item.status,
      },
      create: {
        code: item.code,
        name: item.name,
        description: item.description,
        type: item.type,
        normalBalance: item.normalBalance,
        postingType: item.postingType,
        cashflowType: item.cashflowType,
        isReconcilable: item.isReconcilable,
        status: item.status,
      }
    });
  }

  // Pass 2: Setup Parent-Child Relations automatically based on code pattern
  for (const item of coaData) {
    let parentCode = null;
    const parts = item.code.split('-');
    const num = parts[1];

    if (item.postingType === 'POSTING') {
      // Rule: POSTING 1-10001 -> Parent HEADER 1-10000
      const headerNum = num.substring(0, 3) + '00';
      parentCode = `${parts[0]}-${headerNum}`;
    } else if (item.postingType === 'HEADER') {
      // Rule: Header 2-10000 -> Parent Root HEADER 2-00000
      if (num.endsWith('000') && !num.endsWith('0000')) {
        const rootNum = num.substring(0, 1) + '0000';
        parentCode = `${parts[0]}-${rootNum}`;
      }
    }

    if (parentCode && parentCode !== item.code) {
      const parent = await prisma.chartOfAccounts.findUnique({
        where: { code: parentCode }
      });
      
      if (parent) {
        await prisma.chartOfAccounts.update({
          where: { code: item.code },
          data: { parentId: parent.id }
        });
      }
    }
  }

  console.log('✅ Chart of Accounts is up to date!');
}

seedCOA()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
