const fs = require('fs');

const updateUI = (filePath) => {
  let code = fs.readFileSync(filePath, 'utf8');

  // 1. Import fetchPayrollConfigs
  if (!code.includes('fetchPayrollConfigs')) {
    code = code.replace(
      "import { fetchLocations } from '@/lib/action/master/location';",
      "import { fetchLocations } from '@/lib/action/master/location';\nimport { fetchPayrollConfigs } from '@/lib/action/hr/payroll';"
    );
  }

  // 2. Add payrollConfigs state
  if (!code.includes('const [payrollConfigs, setPayrollConfigs]')) {
    code = code.replace(
      'const [locations, setLocations] = useState<{ id: string, name: string }[]>([]);',
      'const [locations, setLocations] = useState<{ id: string, name: string }[]>([]);\n    const [payrollConfigs, setPayrollConfigs] = useState<any[]>([]);'
    );
  }

  // 3. Update useEffect to fetch payrollConfigs
  if (!code.includes('getConfigs();')) {
    const oldEffect = `const getLocations = async () => {
            const res = await fetchLocations();
            if (res.success) setLocations(res.data);
        };
        getLocations();`;
    const newEffect = `const getLocations = async () => {
            const res = await fetchLocations();
            if (res.success) setLocations(res.data);
        };
        const getConfigs = async () => {
            const res = await fetchPayrollConfigs();
            if (res.success) setPayrollConfigs(res.data);
        };
        getLocations();
        getConfigs();`;
    code = code.replace(oldEffect, newEffect);
  }

  // 4. Add the FormField for payrollConfigId next to tipePenggajian
  if (!code.includes('name="payrollConfigId"')) {
    const oldField = `<FormField name="tipePenggajian" control={form.control} render={({ field }) => (
                                    <FormItem><FormLabel className="text-blue-600 font-bold">Tipe Penggajian</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value || "BULANAN"}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Pilih tipe penggajian" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="BULANAN">1. Bulanan</SelectItem>
                                                <SelectItem value="HARIAN_BULANAN">2. Harian di Bayar Bulanan</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage /></FormItem>
                                )} />`;
    const newField = `<FormField name="tipePenggajian" control={form.control} render={({ field }) => (
                                    <FormItem><FormLabel className="text-blue-600 font-bold">Tipe Penggajian</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value || "BULANAN"}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Pilih tipe penggajian" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="BULANAN">1. Bulanan</SelectItem>
                                                <SelectItem value="HARIAN_BULANAN">2. Harian di Bayar Bulanan</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage /></FormItem>
                                )} />
                                <FormField name="payrollConfigId" control={form.control} render={({ field }) => (
                                    <FormItem><FormLabel className="text-green-600 font-bold">Acuan Config Payroll</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value || "none"}>
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
    code = code.replace(oldField, newField);
  }

  // 5. In createFormData.tsx defaultValues
  if (filePath.includes('createFormData') && !code.includes('payrollConfigId: undefined')) {
    code = code.replace(
      'wajibAbsen: true,',
      'wajibAbsen: true,\n            payrollConfigId: undefined,'
    );
  }

  // 6. In updateFormData.tsx
  if (filePath.includes('updateFormData')) {
    // For update, the API fetch sets form.reset(), we need to parse payrollConfigId.
    // Actually form.reset already maps whatever is in the data, but we can make sure the payload sends "none" as null or undefined.
    // On form submit, we map "none" to null
    code = code.replace(
      'Object.entries(values).forEach(([key, value]) => {',
      `Object.entries(values).forEach(([key, value]) => {
            if (key === 'payrollConfigId' && value === 'none') value = null;`
    );
  } else {
    // Also map "none" to null in createFormData.tsx
    code = code.replace(
      'Object.entries(values).forEach(([key, value]) => {',
      `Object.entries(values).forEach(([key, value]) => {
            if (key === 'payrollConfigId' && value === 'none') value = undefined;`
    );
  }

  fs.writeFileSync(filePath, code);
};

updateUI('components/master/karyawan/createFormData.tsx');
updateUI('components/master/karyawan/updateFormData.tsx');
console.log('UI updated');
