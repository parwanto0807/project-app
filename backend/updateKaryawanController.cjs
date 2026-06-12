const fs = require('fs');
let code = fs.readFileSync('src/controllers/master/karyawan/karyawanController.js', 'utf8');

// 1. Destructure payrollConfigId in createKaryawan
code = code.replace(
  /wajibAbsen,/,
  'wajibAbsen,\n      payrollConfigId,'
);

// 2. Add payrollConfigId to create data payload
code = code.replace(
  /wajibAbsen: wajibAbsen !== undefined \? String\(wajibAbsen\) === 'true' : true,/,
  "wajibAbsen: wajibAbsen !== undefined ? String(wajibAbsen) === 'true' : true,\n        payrollConfigId: payrollConfigId || null,"
);

// 3. Destructure payrollConfigId in updateKaryawan
code = code.replace(
  /wajibAbsen\s*=\s*req.body;/,
  'wajibAbsen,\n      payrollConfigId\n    } = req.body;'
);

// 4. Add payrollConfigId to update data payload
code = code.replace(
  /wajibAbsen: wajibAbsen !== undefined \? String\(wajibAbsen\) === 'true' : undefined,/,
  "wajibAbsen: wajibAbsen !== undefined ? String(wajibAbsen) === 'true' : undefined,\n        payrollConfigId: payrollConfigId !== undefined ? payrollConfigId : undefined,"
);

// 5. Add payrollConfig in getKaryawan include block
code = code.replace(
  /user: \{ select: \{ email: true, name: true \} \},/,
  'user: { select: { email: true, name: true } },\n        payrollConfig: true,'
);

fs.writeFileSync('src/controllers/master/karyawan/karyawanController.js', code);
console.log('Update Karyawan Controller Done');
