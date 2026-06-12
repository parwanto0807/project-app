const fs = require('fs');
let code = fs.readFileSync('src/controllers/master/karyawan/karyawanController.js', 'utf8');

// fix createKaryawan req.body extraction
code = code.replace(
  '      namaRekening,\n      wajibAbsen,\n    } = req.body;',
  '      namaRekening,\n      wajibAbsen,\n      payrollConfigId,\n    } = req.body;'
);

// fix createKaryawan req.body extraction (carriage return)
code = code.replace(
  '      namaRekening,\r\n      wajibAbsen,\r\n    } = req.body;',
  '      namaRekening,\r\n      wajibAbsen,\r\n      payrollConfigId,\r\n    } = req.body;'
);

// wait, let's just use regex to insert payrollConfigId into both destructurings
code = code.replace(/namaRekening,\s*wajibAbsen,\s*\} = req\.body;/g, 'namaRekening,\n      wajibAbsen,\n      payrollConfigId,\n    } = req.body;');

// Now insert into the data object for updateKaryawan
if (!code.includes('if (payrollConfigId !== undefined) {')) {
  code = code.replace(
    /if \(attendanceLocationId !== undefined\) \{\s*data\.attendanceLocationId = \(attendanceLocationId === "none" \|\| !attendanceLocationId\) \? null : attendanceLocationId;\s*\}/g,
    'if (attendanceLocationId !== undefined) {\n      data.attendanceLocationId = (attendanceLocationId === "none" || !attendanceLocationId) ? null : attendanceLocationId;\n    }\n\n    if (payrollConfigId !== undefined) {\n      data.payrollConfigId = (payrollConfigId === "none" || !payrollConfigId) ? null : payrollConfigId;\n    }'
  );
}

fs.writeFileSync('src/controllers/master/karyawan/karyawanController.js', code);
console.log('Fixed using robust Regex!');
