const fs = require('fs');
const path = 'src/controllers/payroll/payrollController.js';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `  const totalJamKerja  = detailHarian.reduce((s, d) => s + d.jamKerja, 0);\r\n  const totalJamLembur = detailHarian.reduce((s, d) => s + d.jamLembur, 0);`;

const newStr = `  const totalJamKerja  = detailHarian.reduce((s, d) => s + d.jamKerja, 0);\r\n  const totalJamLembur = detailHarian.reduce((s, d) => s + d.jamLembur, 0);\r\n\r\n  // ── Hitung Upah Lembur Dinamis (Per Jam/Hari) ──\r\n  let baseHourlyLembur = 0;\r\n  if (tipePenggajian === "HARIAN_BULANAN" || tipePenggajian === "HARIAN") {\r\n    baseHourlyLembur = (karyawan.gajiPokok * 25) / 173;\r\n  } else {\r\n    baseHourlyLembur = karyawan.gajiPokok / 173;\r\n  }\r\n\r\n  let upahLemburDinamis = 0;\r\n  const p1 = config?.pengaliLemburJam1 || 1.5;\r\n  const p2 = config?.pengaliLemburJam2 || 2.0;\r\n  const p3 = config?.pengaliLemburJam3 || 2.0;\r\n  const p4 = config?.pengaliLemburJam4 || 2.0;\r\n  const p5 = config?.pengaliLemburJam5 || 2.0;\r\n  const p6 = config?.pengaliLemburJam6 || 2.0;\r\n\r\n  detailHarian.forEach((d) => {\r\n    let jl = d.jamLembur;\r\n    let upahHariIni = 0;\r\n    if (jl > 0) {\r\n      if (jl >= 1) { upahHariIni += baseHourlyLembur * p1; jl -= 1; }\r\n      else { upahHariIni += baseHourlyLembur * p1 * jl; jl = 0; }\r\n    }\r\n    if (jl > 0) {\r\n      if (jl >= 1) { upahHariIni += baseHourlyLembur * p2; jl -= 1; }\r\n      else { upahHariIni += baseHourlyLembur * p2 * jl; jl = 0; }\r\n    }\r\n    if (jl > 0) {\r\n      if (jl >= 1) { upahHariIni += baseHourlyLembur * p3; jl -= 1; }\r\n      else { upahHariIni += baseHourlyLembur * p3 * jl; jl = 0; }\r\n    }\r\n    if (jl > 0) {\r\n      if (jl >= 1) { upahHariIni += baseHourlyLembur * p4; jl -= 1; }\r\n      else { upahHariIni += baseHourlyLembur * p4 * jl; jl = 0; }\r\n    }\r\n    if (jl > 0) {\r\n      if (jl >= 1) { upahHariIni += baseHourlyLembur * p5; jl -= 1; }\r\n      else { upahHariIni += baseHourlyLembur * p5 * jl; jl = 0; }\r\n    }\r\n    if (jl > 0) {\r\n      upahHariIni += baseHourlyLembur * p6 * jl;\r\n    }\r\n    upahLemburDinamis += upahHariIni;\r\n  });`;

if (!content.includes(targetStr)) {
  // try LF instead
  const targetStrLF = `  const totalJamKerja  = detailHarian.reduce((s, d) => s + d.jamKerja, 0);\n  const totalJamLembur = detailHarian.reduce((s, d) => s + d.jamLembur, 0);`;
  if (!content.includes(targetStrLF)) {
    console.error("Target string not found in file!");
    process.exit(1);
  }
  content = content.replace(targetStrLF, newStr.replace(/\\r\\n/g, '\\n'));
} else {
  content = content.replace(targetStr, newStr);
}

fs.writeFileSync(path, content);
console.log('Successfully updated payrollController.js');
