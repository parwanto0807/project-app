const fs = require('fs');

function applyFixes(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  // 1. Helpers
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
    code = code.replace(
      /const getLocations = async \(\) => {[\s\S]*?getLocations\(\);\n\s*}, \[\]\);/,
      `const getLocations = async () => {
            const res = await fetchLocations();
            if (res.success) setLocations(res.data);
        };
        const getConfigs = async () => {
            const res = await fetchPayrollConfigs();
            if (res.data && !res.error) setPayrollConfigs(res.data);
        };
        getLocations();
        getConfigs();
    }, []);`
    );
  }

  // 5. FormField
  if (!code.includes('name="payrollConfigId"')) {
    code = code.replace(
      /<SelectItem value="HARIAN_BULANAN">2\. Harian di Bayar Bulanan<\/SelectItem>[\s\S]*?<\/SelectContent>\n\s*<\/Select>\n\s*<FormMessage \/><\/FormItem>\n\s*\)} \/>/,
      `<SelectItem value="HARIAN_BULANAN">2. Harian di Bayar Bulanan</SelectItem>
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
                                )} />`
    );
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

applyFixes('components/master/karyawan/createFormData.tsx');
applyFixes('components/master/karyawan/updateFormData.tsx');
console.log('Done!');
