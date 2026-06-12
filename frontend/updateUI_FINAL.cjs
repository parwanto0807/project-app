const fs = require('fs');

function fixFile(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  // 1. Currency formatters
  if (!code.includes('const parseCurrency')) {
    code = code.replace(
      'function getBasePath',
      `const formatCurrency = (val: string | number) => {
    if (!val) return '0';
    const num = typeof val === 'string' ? val.replace(/[^0-9]/g, '') : val.toString();
    return new Intl.NumberFormat('id-ID').format(Number(num));
};

const parseCurrency = (val: string) => {
    if (!val) return 0;
    return Number(val.replace(/[^0-9]/g, ''));
};

function getBasePath`
    );
  }

  // 2. Import
  if (!code.includes('fetchPayrollConfigs')) {
    code = code.replace(
      "import { fetchLocations } from '@/lib/action/master/location';",
      "import { fetchLocations } from '@/lib/action/master/location';\nimport { fetchPayrollConfigs } from '@/lib/action/hr/payroll';"
    );
  }

  // 3. state
  if (!code.includes('payrollConfigs')) {
    code = code.replace(
      'const [locations, setLocations] = useState<{ id: string, name: string }[]>([]);',
      'const [locations, setLocations] = useState<{ id: string, name: string }[]>([]);\n    const [payrollConfigs, setPayrollConfigs] = useState<any[]>([]);'
    );
  }

  // 4. useEffect
  if (!code.includes('getConfigs();')) {
    const searchEffect = `    useEffect(() => {
        const getLocations = async () => {
            const res = await fetchLocations();
            if (res.success) setLocations(res.data);
        };
        getLocations();
    }, []);`;

    const replaceEffect = `    useEffect(() => {
        const getLocations = async () => {
            const res = await fetchLocations();
            if (res.success) setLocations(res.data);
        };
        const getConfigs = async () => {
            const res = await fetchPayrollConfigs();
            if (res.data && !res.error) setPayrollConfigs(res.data);
        };
        getLocations();
        getConfigs();
    }, []);`;

    code = code.replace(searchEffect, replaceEffect);
  }

  // 5. FormField
  if (!code.includes('name="payrollConfigId"')) {
    const searchField = `                                                <SelectItem value="HARIAN_BULANAN">2. Harian di Bayar Bulanan</SelectItem>\r
                                            </SelectContent>\r
                                        </Select>\r
                                        <FormMessage /></FormItem>\r
                                )} />`;
    
    // Sometimes it might not have \r, let's just do a generic replace using lines
    const lines = code.split('\\n'.includes('\\n') ? '\n' : '\n'); // safe split
    // wait I'll just use code.replace on the exact string:
    // Actually the easiest way to match across \r\n is to replace \r\n with \n first
    code = code.replace(/\r\n/g, '\n');

    const searchFieldClean = `                                                <SelectItem value="HARIAN_BULANAN">2. Harian di Bayar Bulanan</SelectItem>\n                                            </SelectContent>\n                                        </Select>\n                                        <FormMessage /></FormItem>\n                                )} />`;
    
    const replaceField = `                                                <SelectItem value="HARIAN_BULANAN">2. Harian di Bayar Bulanan</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage /></FormItem>
                                )} />
                                <FormField name="payrollConfigId" control={form.control} render={({ field }) => (
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
                                )} />`;

    code = code.replace(searchFieldClean, replaceField);
  }

  // 6. defaultValues in create
  if (filePath.includes('createFormData') && !code.includes('payrollConfigId: undefined')) {
    code = code.replace(
      'wajibAbsen: true,',
      'wajibAbsen: true,\n            payrollConfigId: undefined,'
    );
  }

  // 7. parse submission
  if (filePath.includes('updateFormData')) {
    code = code.replace(
      'Object.entries(values).forEach(([key, value]) => {',
      `Object.entries(values).forEach(([key, value]) => {
            if (key === 'payrollConfigId' && value === 'none') value = null;`
    );
  } else {
    code = code.replace(
      'Object.entries(values).forEach(([key, value]) => {',
      `Object.entries(values).forEach(([key, value]) => {
            if (key === 'payrollConfigId' && value === 'none') value = undefined;`
    );
  }

  fs.writeFileSync(filePath, code);
}

fixFile('components/master/karyawan/createFormData.tsx');
fixFile('components/master/karyawan/updateFormData.tsx');
console.log('Fixed correctly and cleanly!');
