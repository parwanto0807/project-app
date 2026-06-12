const fs = require('fs');

const fixFile = (path) => {
  let code = fs.readFileSync(path, 'utf8');

  if (!code.includes('const parseCurrency')) {
    const utils = `\nconst formatCurrency = (val: string | number) => {
    if (!val) return '0';
    const num = typeof val === 'string' ? val.replace(/[^0-9]/g, '') : val.toString();
    return new Intl.NumberFormat('id-ID').format(Number(num));
};

const parseCurrency = (val: string) => {
    if (!val) return 0;
    return Number(val.replace(/[^0-9]/g, ''));
};\n`;
    
    code = code.replace(/function getBasePath/, utils + '\nfunction getBasePath');
  }

  fs.writeFileSync(path, code);
}

fixFile('components/master/karyawan/createFormData.tsx');
fixFile('components/master/karyawan/updateFormData.tsx');
console.log('Fixed');
