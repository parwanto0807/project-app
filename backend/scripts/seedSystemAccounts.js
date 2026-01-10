import { prisma } from '../src/config/db.js';

async function main() {
  console.log('Seeding System Accounts...');

  const mappings = [
    {
      key: 'ACCOUNTS_PAYABLE',
      description: 'Digunakan untuk mencatat kewajiban/utang perusahaan kepada supplier atas pembelian kredit. Saldo akan bertambah di Kredit saat Anda mencatat tagihan supplier.',
      fallbackCode: '2-10101',
      searchNames: ['Utang Usaha (Supplier)']
    },
    {
      key: 'ACCOUNTS_RECEIVABLE',
      description: 'Digunakan untuk mencatat hak tagih perusahaan kepada pelanggan atas penjualan kredit. Saat membuat Invoice Penjualan, akun ini akan otomatis di-Debit (bertambah).',
      fallbackCode: '1-10101',
      searchNames: ['Piutang Usaha']
    },
    {
      key: 'BANK_BRI_CIKARANG',
      description: 'Digunakan untuk mencatat saldo dan transaksi rekening tabungan/giro di Bank BRI Kantor Cabang Cikarang. Digunakan untuk mutasi besar atau pembayaran vendor via transfer.',
      fallbackCode: '1-10002',
      searchNames: ['Bank BRI KC. CIKARANG']
    },
    {
      key: 'BANK_BRI_HARAPAN_INDAH',
      description: 'Digunakan untuk mencatat saldo dan transaksi rekening tabungan/giro di Bank BRI Kantor Cabang Harapan Indah.',
      fallbackCode: '1-10003',
      searchNames: ['Bank BRI KC. HARAPAN INDAH']
    },
    {
      key: 'BANK_BRI_KARAWANG',
      description: 'Digunakan untuk mencatat saldo dan transaksi rekening tabungan/giro di Bank BRI Kantor Cabang Karawang',
      fallbackCode: '1-10006',
      searchNames: ['Bank BRI KC. BRI KARAWANG']
    },
    {
      key: 'BANK_BRI_LEBAK_BULUS',
      description: 'Digunakan untuk mencatat saldo dan transaksi rekening tabungan/giro di Bank BRI Kantor Cabang Lebak Bulus',
      fallbackCode: '1-10004',
      searchNames: ['Bank BRI KC. LEBAK BULUS']
    },
    {
      key: 'BANK_BRI_TAMBUN',
      description: 'Digunakan untuk mencatat saldo dan transaksi rekening tabungan/giro di Bank BRI Kantor Cabang Tambun',
      fallbackCode: '1-10005',
      searchNames: ['Bank BRI KC. TAMBUN']
    },
    {
      key: 'OFFICE_SALARY',
      description: 'Digunakan untuk mencatat beban gaji, tunjangan, dan upah tetap bagi staf administrasi atau kantor pusat (overhead)',
      fallbackCode: '6-10101',
      searchNames: ['Beban Gaji Karyawan']
    },
    {
      key: 'PETTY_CASH',
      description: 'Digunakan sebagai sumber dana tunai untuk operasional harian di kantor atau lapangan. Saldo akan berkurang di Kredit saat dana diserahkan kepada staf atau digunakan untuk belanja langsung',
      fallbackCode: '1-10001',
      searchNames: ['Kas Peti Cash']
    },
    {
      key: 'PROJECT_MOBILIZATION',
      description: 'Digunakan untuk mencatat biaya logistik, transportasi alat, bensin, tol, dan akomodasi tim yang terkait langsung dengan pengerjaan proyek di lapangan.',
      fallbackCode: '5-10102',
      searchNames: ['Beban Mobilisasi']
    },
    {
      key: 'PROJECT_WIP',
      description: 'Digunakan untuk mencatat nilai material atau barang yang sudah berada di lokasi proyek dan sedang dalam proses pengerjaan/pemasangan sebelum diserahterimakan',
      fallbackCode: '1-10205',
      searchNames: ['Persediaan On WIP']
    },
    {
      key: 'PURCHASE_EXPENSE',
      description: 'Digunakan untuk mencatat beban biaya langsung seperti material atau jasa subkon. Saldo akan bertambah di Debit saat terjadi pembelian atau terjadi pengeluaran operasional.',
      fallbackCode: '5-10101',
      searchNames: ['Biaya Material Proyek']
    },
    {
      key: 'SALES_REVENUE',
      description: 'Digunakan untuk mencatat nilai penjualan jasa atau barang. Akun ini akan otomatis di-Kredit (bertambah) saat Anda mencatat penjualan final.',
      fallbackCode: '4-10101',
      searchNames: ['Pendapatan Jasa Konstruksi']
    },
    {
      key: 'STAFF_ADVANCE',
      description: 'Digunakan untuk mencatat piutang kepada staf atas pemberian dana tunai (uang muka kerja) yang belum dipertanggungjawabkan. Akun ini akan berkurang (Kredit) saat staf menyerahkan bukti nota/realisasi',
      fallbackCode: '1-10302',
      searchNames: ['Uang Muka Kerja (Staff)']
    },
    {
      key: 'VAT_IN',
      description: 'Digunakan untuk menampung PPN yang kita bayar ke supplier (PPN Masukan). Saldo ini dapat digunakan untuk mengurangi PPN Keluaran. Bertambah di Debit saat pembelian.',
      fallbackCode: '1-10401',
      searchNames: ['PPN Masukan']
    },
    {
      key: 'VAT_OUT',
      description: 'Digunakan untuk menampung PPN yang kita pungut dari pelanggan (PPN Keluaran). Ini adalah utang pajak kita ke negara. Saldo akun ini bertambah di Kredit saat Penjualan.',
      fallbackCode: '2-10301',
      searchNames: ['PPN Pengeluaran']
    }
  ];

  for (const map of mappings) {
    console.log(`Processing ${map.key}...`);
    
    // 1. Find COA
    let coa = null;
    
    // Try by code
    if (map.fallbackCode) {
      coa = await prisma.chartOfAccounts.findUnique({
        where: { code: map.fallbackCode }
      });
    }

    // Try by name if not found
    if (!coa && map.searchNames) {
      coa = await prisma.chartOfAccounts.findFirst({
        where: {
          OR: map.searchNames.map(n => ({ name: { contains: n, mode: 'insensitive' } }))
        }
      });
    }

    if (coa) {
      // 2. Upsert SystemAccount
      await prisma.systemAccount.upsert({
        where: { key: map.key },
        update: {
          coaId: coa.id,
          description: map.description
        },
        create: {
          key: map.key,
          coaId: coa.id,
          description: map.description
        }
      });
      console.log(`✓ Linked ${map.key} to COA: ${coa.code} - ${coa.name}`);
    } else {
      console.warn(`! Could not find COA for ${map.key} (Code: ${map.fallbackCode}, Names: ${map.searchNames.join(', ')})`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
