const fs = require('fs');

let code = fs.readFileSync('src/controllers/payroll/payrollController.js', 'utf8');

// 1. Update fetchPayrollData
const oldFetch = `async function fetchPayrollData(karyawanId, startOfMonth, endOfMonth) {
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
}`;

const newFetch = `async function fetchPayrollData(karyawanId, startOfMonth, endOfMonth) {
  const karyawanInfo = await prisma.karyawan.findUnique({ where: { id: karyawanId }, select: { payrollConfigId: true } });
  
  const configPromise = karyawanInfo?.payrollConfigId 
    ? prisma.payrollConfig.findUnique({ where: { id: karyawanInfo.payrollConfigId } })
    : prisma.payrollConfig.findFirst({ where: { isActive: true } });

  const [absensiList, loanDetails, kasbonList, configRes] = await Promise.all([
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
    configPromise,
  ]);
  
  const config = configRes || await prisma.payrollConfig.findFirst({ where: { isActive: true } });
  return { absensiList, loanDetails, kasbonList, config };
}`;

code = code.replace(oldFetch, newFetch);

// 2. Fix getBulkPayrollPreview
code = code.replace(
  /const \{ absensiList, loanDetails, kasbonList \} = await fetchPayrollData\(karyawan\.id, cutoffStart, cutoffEnd\);\n\s*const k = await kalkulasiGaji\(karyawan, absensiList, loanDetails, kasbonList, config\);/g,
  "const { absensiList, loanDetails, kasbonList, config: empConfig } = await fetchPayrollData(karyawan.id, cutoffStart, cutoffEnd);\n        const k = await kalkulasiGaji(karyawan, absensiList, loanDetails, kasbonList, empConfig);"
);

// 3. Fix processBulkPayroll (already captured by regex above because it's identical text)

fs.writeFileSync('src/controllers/payroll/payrollController.js', code);
console.log('Done modifying payrollController');
