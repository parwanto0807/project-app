const fs = require('fs');

const updateUI = (filePath) => {
  let code = fs.readFileSync(filePath, 'utf8');

  // 1. Currency formatters
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

  // 2. Import fetchPayrollConfigs
  if (!code.includes('fetchPayrollConfigs')) {
    code = code.replace(
      "import { fetchLocations } from '@/lib/action/master/location';",
      "import { fetchLocations } from '@/lib/action/master/location';\nimport { fetchPayrollConfigs } from '@/lib/action/hr/payroll';"
    );
  }

  // 3. Add payrollConfigs state
  if (!code.includes('const [payrollConfigs, setPayrollConfigs]')) {
    code = code.replace(
      'const [locations, setLocations] = useState<{ id: string, name: string }[]>([]);',
      'const [locations, setLocations] = useState<{ id: string, name: string }[]>([]);\n    const [payrollConfigs, setPayrollConfigs] = useState<any[]>([]);'
    );
  }

  // 4. Update useEffect to fetch payrollConfigs
  if (!code.includes('getConfigs();')) {
    code = code.replace(
      'getLocations();\n    }, []);',
      `const getConfigs = async () => {
            const res = await fetchPayrollConfigs();
            if (res.data && !res.error) setPayrollConfigs(res.data);
        };
        getLocations();
        getConfigs();
    }, []);`
    );
  }

  // 5. Add the FormField for payrollConfigId next to tipePenggajian
  // Need regex to safely find the end of tipePenggajian
  if (!code.includes('name="payrollConfigId"')) {
    const fieldRegex = /(<FormField\s+name="tipePenggajian"[\s\S]*?<\/SelectContent>\s*<\/Select>\s*<FormMessage\s*\/><\/FormItem>\s*)}\s*\/>)/;
    code = code.replace(fieldRegex, `$1\n                                <FormField name="payrollConfigId" control={form.control} render={({ field }) => (
                                    <FormItem><FormLabel className="text-green-600 font-bold">Acuan Config Payroll</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || "none"}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Pilih config acuan" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">-- Default Global --</SelectItem>
                                                {payrollConfigs.map(c => (
                                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription className="text-xs">Profil uang makan dan lembur karyawan.</FormDescription>
                                        <FormMessage /></FormItem>
                                )} />`);
  }

  // 6. Fix res.success logic if it was already injected incorrectly
  if (code.includes('if (res.success) setPayrollConfigs(res.data);')) {
    code = code.replace('if (res.success) setPayrollConfigs(res.data);', 'if (res.data && !res.error) setPayrollConfigs(res.data);');
  }

  // 7. In createFormData.tsx defaultValues
  if (filePath.includes('createFormData') && !code.includes('payrollConfigId: undefined')) {
    code = code.replace(
      'wajibAbsen: true,',
      'wajibAbsen: true,\n            payrollConfigId: undefined,'
    );
  }

  // 8. Payload parsing
  if (filePath.includes('updateFormData')) {
    if (!code.includes("if (key === 'payrollConfigId' && value === 'none') value = null;")) {
      code = code.replace(
        'Object.entries(values).forEach(([key, value]) => {',
        `Object.entries(values).forEach(([key, value]) => {
            if (key === 'payrollConfigId' && value === 'none') value = null;`
      );
    }
  } else {
    if (!code.includes("if (key === 'payrollConfigId' && value === 'none') value = undefined;")) {
      code = code.replace(
        'Object.entries(values).forEach(([key, value]) => {',
        `Object.entries(values).forEach(([key, value]) => {
            if (key === 'payrollConfigId' && value === 'none') value = undefined;`
      );
    }
  }

  fs.writeFileSync(filePath, code);
};

updateUI('components/master/karyawan/createFormData.tsx');
updateUI('components/master/karyawan/updateFormData.tsx');
console.log('UI updated correctly!');
