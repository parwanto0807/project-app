const fs = require('fs');
const path = 'components/hr/payroll/PayrollConfigPanel.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Replace useState block
content = content.replace(
  `  const [form, setForm] = useState({
    name: "", gajiPerHari: "", lemburPerJam: "",
    jamKerjaPerHari: "8", toleransiTerlambat: "15", potonganTerlambat: "0",
  });`,
  `  const [form, setForm] = useState({
    name: "", lemburPerJam: "",
    jamKerjaPerHari: "8", toleransiTerlambat: "15", potonganTerlambat: "0",
    minJamKerjaUangMakan: "4", minJamLemburUangMakan: "3",
    pengaliLemburJam1: "1.5", pengaliLemburJam2: "2.0", pengaliLemburJam3: "2.0",
    pengaliLemburJam4: "2.0", pengaliLemburJam5: "2.0", pengaliLemburJam6: "2.0"
  });`
);

// 2. Replace openCreate block
content = content.replace(
  `    setForm({ name: "", gajiPerHari: "", lemburPerJam: "", jamKerjaPerHari: "8", toleransiTerlambat: "15", potonganTerlambat: "0" });`,
  `    setForm({ 
      name: "", lemburPerJam: "", jamKerjaPerHari: "8", toleransiTerlambat: "15", potonganTerlambat: "0",
      minJamKerjaUangMakan: "4", minJamLemburUangMakan: "3",
      pengaliLemburJam1: "1.5", pengaliLemburJam2: "2.0", pengaliLemburJam3: "2.0",
      pengaliLemburJam4: "2.0", pengaliLemburJam5: "2.0", pengaliLemburJam6: "2.0"
    });`
);

// 3. Replace openEdit block
content = content.replace(
  `    setForm({
      name: cfg.name,
      gajiPerHari: String(cfg.gajiPerHari),
      lemburPerJam: String(cfg.lemburPerJam),
      jamKerjaPerHari: String(cfg.jamKerjaPerHari ?? 8),
      toleransiTerlambat: String(cfg.toleransiTerlambat ?? 15),
      potonganTerlambat: String(cfg.potonganTerlambat ?? 0),
    });`,
  `    setForm({
      name: cfg.name,
      lemburPerJam: String(cfg.lemburPerJam),
      jamKerjaPerHari: String(cfg.jamKerjaPerHari ?? 8),
      toleransiTerlambat: String(cfg.toleransiTerlambat ?? 15),
      potonganTerlambat: String(cfg.potonganTerlambat ?? 0),
      minJamKerjaUangMakan: String(cfg.minJamKerjaUangMakan ?? 4),
      minJamLemburUangMakan: String(cfg.minJamLemburUangMakan ?? 3),
      pengaliLemburJam1: String(cfg.pengaliLemburJam1 ?? 1.5),
      pengaliLemburJam2: String(cfg.pengaliLemburJam2 ?? 2.0),
      pengaliLemburJam3: String(cfg.pengaliLemburJam3 ?? 2.0),
      pengaliLemburJam4: String(cfg.pengaliLemburJam4 ?? 2.0),
      pengaliLemburJam5: String(cfg.pengaliLemburJam5 ?? 2.0),
      pengaliLemburJam6: String(cfg.pengaliLemburJam6 ?? 2.0),
    });`
);

// 4. Replace validation
content = content.replace(
  `    if (!form.name || !form.gajiPerHari || !form.lemburPerJam) {`,
  `    if (!form.name || !form.lemburPerJam) {`
);

// 5. Replace data block
content = content.replace(
  `      const data = {
        name: form.name,
        gajiPerHari: parseFloat(form.gajiPerHari),
        lemburPerJam: parseFloat(form.lemburPerJam),
        jamKerjaPerHari: parseFloat(form.jamKerjaPerHari || "8"),
        toleransiTerlambat: parseInt(form.toleransiTerlambat || "15"),
        potonganTerlambat: parseFloat(form.potonganTerlambat || "0"),
      };`,
  `      const data = {
        name: form.name,
        gajiPerHari: 0,
        lemburPerJam: parseFloat(form.lemburPerJam),
        jamKerjaPerHari: parseFloat(form.jamKerjaPerHari || "8"),
        toleransiTerlambat: parseInt(form.toleransiTerlambat || "15"),
        potonganTerlambat: parseFloat(form.potonganTerlambat || "0"),
        minJamKerjaUangMakan: parseFloat(form.minJamKerjaUangMakan || "4"),
        minJamLemburUangMakan: parseFloat(form.minJamLemburUangMakan || "3"),
        pengaliLemburJam1: parseFloat(form.pengaliLemburJam1 || "1.5"),
        pengaliLemburJam2: parseFloat(form.pengaliLemburJam2 || "2.0"),
        pengaliLemburJam3: parseFloat(form.pengaliLemburJam3 || "2.0"),
        pengaliLemburJam4: parseFloat(form.pengaliLemburJam4 || "2.0"),
        pengaliLemburJam5: parseFloat(form.pengaliLemburJam5 || "2.0"),
        pengaliLemburJam6: parseFloat(form.pengaliLemburJam6 || "2.0"),
      };`
);

// 6. Replace UI for Cards
content = content.replace(
  `              <div className="flex justify-between items-center bg-gray-50 rounded-xl px-3 py-2">
                <span className="text-xs text-gray-500">Gaji Per Hari</span>
                <span className="font-bold text-gray-800 text-sm">{fmt(cfg.gajiPerHari)}</span>
              </div>`,
  ``
);

// 7. Add advanced data to Cards
const extraInfo = `{(cfg.potonganTerlambat ?? 0) > 0 && (
                <div className="flex justify-between items-center bg-red-50 rounded-xl px-3 py-2">
                  <span className="text-xs text-gray-500">Potongan Terlambat</span>
                  <span className="font-bold text-red-600 text-sm">{fmt(cfg.potonganTerlambat)}/kejadian</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-100">
                <div className="flex justify-between items-center bg-gray-50 rounded-lg px-2 py-1">
                  <span className="text-[10px] text-gray-500">Min. Jam Makan</span>
                  <span className="font-bold text-gray-700 text-xs">{cfg.minJamKerjaUangMakan ?? 4} jam</span>
                </div>
                <div className="flex justify-between items-center bg-gray-50 rounded-lg px-2 py-1">
                  <span className="text-[10px] text-gray-500">Min. Lembur Makan</span>
                  <span className="font-bold text-gray-700 text-xs">{cfg.minJamLemburUangMakan ?? 3} jam</span>
                </div>
              </div>
              <div className="flex justify-between items-center bg-gray-50 rounded-lg px-2 py-1 mt-1">
                <span className="text-[10px] text-gray-500">Pengali Lembur (J1-J6)</span>
                <span className="font-medium text-gray-700 text-[10px] flex gap-1">
                  <span>{cfg.pengaliLemburJam1 ?? 1.5}x</span>
                  <span>{cfg.pengaliLemburJam2 ?? 2}x</span>
                  <span>{cfg.pengaliLemburJam3 ?? 2}x</span>
                  <span>{cfg.pengaliLemburJam4 ?? 2}x</span>
                </span>
              </div>`;
content = content.replace(
  /\{\(cfg\.potonganTerlambat \?\? 0\) > 0 && \([\s\S]*?<\/div>\s*\)\}/,
  extraInfo
);

// 8. Replace Form Fields
content = content.replace(
  `            <div className="space-y-2">
              <Label className="text-gray-600">Gaji Per Hari (IDR) *</Label>
              <Input type="number" placeholder="0" className="rounded-xl border-gray-200"
                value={form.gajiPerHari} onChange={(e) => setForm({ ...form, gajiPerHari: e.target.value })} />
            </div>`,
  ``
);

// 9. Replace DialogContent max-w to be larger
content = content.replace(
  `className="sm:max-w-[400px] rounded-3xl"`,
  `className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-3xl"`
);

// 10. Add extra fields to the end of the form
const formGridEnd = `              <div className="space-y-2">
                <Label className="text-gray-600 text-xs">Potongan Terlambat (IDR)</Label>
                <Input type="number" placeholder="0" className="rounded-xl border-gray-200"
                  value={form.potonganTerlambat} onChange={(e) => setForm({ ...form, potonganTerlambat: e.target.value })} />
              </div>
            </div>`;

const advancedSettings = `${formGridEnd}

            {/* Uang Makan Requirements */}
            <div className="pt-2 border-t border-gray-100">
              <h4 className="text-sm font-bold text-gray-700 mb-2">Syarat Uang Makan</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-gray-600 text-xs">Min. Jam Kerja (U. Makan Harian)</Label>
                  <Input type="number" placeholder="4" className="rounded-xl border-gray-200"
                    value={form.minJamKerjaUangMakan} onChange={(e) => setForm({ ...form, minJamKerjaUangMakan: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-600 text-xs">Min. Jam Lembur (U. Makan Lembur)</Label>
                  <Input type="number" placeholder="3" className="rounded-xl border-gray-200"
                    value={form.minJamLemburUangMakan} onChange={(e) => setForm({ ...form, minJamLemburUangMakan: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Overtime Multipliers */}
            <div className="pt-2 border-t border-gray-100">
              <h4 className="text-sm font-bold text-gray-700 mb-2">Pengali Lembur (Per Jam)</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-gray-600 text-xs">Jam ke-1</Label>
                  <Input type="number" step="0.1" placeholder="1.5" className="rounded-xl border-gray-200"
                    value={form.pengaliLemburJam1} onChange={(e) => setForm({ ...form, pengaliLemburJam1: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-600 text-xs">Jam ke-2</Label>
                  <Input type="number" step="0.1" placeholder="2.0" className="rounded-xl border-gray-200"
                    value={form.pengaliLemburJam2} onChange={(e) => setForm({ ...form, pengaliLemburJam2: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-600 text-xs">Jam ke-3</Label>
                  <Input type="number" step="0.1" placeholder="2.0" className="rounded-xl border-gray-200"
                    value={form.pengaliLemburJam3} onChange={(e) => setForm({ ...form, pengaliLemburJam3: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-600 text-xs">Jam ke-4</Label>
                  <Input type="number" step="0.1" placeholder="2.0" className="rounded-xl border-gray-200"
                    value={form.pengaliLemburJam4} onChange={(e) => setForm({ ...form, pengaliLemburJam4: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-600 text-xs">Jam ke-5</Label>
                  <Input type="number" step="0.1" placeholder="2.0" className="rounded-xl border-gray-200"
                    value={form.pengaliLemburJam5} onChange={(e) => setForm({ ...form, pengaliLemburJam5: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-600 text-xs">Jam ke-6+</Label>
                  <Input type="number" step="0.1" placeholder="2.0" className="rounded-xl border-gray-200"
                    value={form.pengaliLemburJam6} onChange={(e) => setForm({ ...form, pengaliLemburJam6: e.target.value })} />
                </div>
              </div>
            </div>`;
content = content.replace(formGridEnd, advancedSettings);

// Convert CRLF to LF just in case
content = content.replace(/\r\n/g, '\n');

fs.writeFileSync(path, content);
console.log('Done successfully modifying PayrollConfigPanel.tsx');
