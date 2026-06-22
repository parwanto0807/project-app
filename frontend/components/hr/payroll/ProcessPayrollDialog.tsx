"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2, Calculator, CheckCircle2, AlertTriangle, User,
  CreditCard, Banknote, Clock, ChevronDown, ChevronUp, Printer,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { fetchPayrollPreview, createGaji, updateGaji } from "@/lib/action/hr/payroll";
import { fetchAllEmployees } from "@/lib/action/hr/loans";
import { toast } from "sonner";

interface ProcessPayrollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (id?: string) => void;
  defaultPeriode?: string;
  gajiToEdit?: any;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);

const ProcessPayrollDialog: React.FC<ProcessPayrollDialogProps> = ({
  open, onOpenChange, onSuccess, defaultPeriode, gajiToEdit
}) => {
  const [step, setStep] = useState<"form" | "preview">("form");
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [preview, setPreview] = useState<any | null>(null);
  const [showDetailHarian, setShowDetailHarian] = useState(false);
  const [showLoanDetails, setShowLoanDetails] = useState(false);
  const [showKasbonDetails, setShowKasbonDetails] = useState(false);

  const [form, setForm] = useState({
    karyawanId: "",
    periode: defaultPeriode || new Date().toISOString().slice(0, 7),
    pajak: "0",
    potonganDpGaji: "0",
    potonganLain: "0",
    manualPinjaman: "",
    manualKasbon: "",
    hitungLembur: true,
    hitungUangMakan: false,
    hitungUangMakanLembur: false,
  });

  useEffect(() => {
    if (open) {
      if (gajiToEdit) {
        setForm({
          karyawanId: gajiToEdit.karyawanId,
          periode: gajiToEdit.periode.slice(0, 7),
          pajak: gajiToEdit.pajak?.toString() || "0",
          potonganDpGaji: gajiToEdit.potonganDpGaji?.toString() || "0",
          potonganLain: (gajiToEdit.potongan || 0).toString(),
          manualPinjaman: gajiToEdit.potonganPinjaman?.toString() || "",
          manualKasbon: gajiToEdit.potonganKasbon?.toString() || "",
          hitungLembur: true,
          hitungUangMakan: false,
          hitungUangMakanLembur: false,
        });
      } else {
        setForm({
          karyawanId: "",
          periode: defaultPeriode || new Date().toISOString().slice(0, 7),
          pajak: "0",
          potonganDpGaji: "0",
          potonganLain: "0",
          manualPinjaman: "",
          manualKasbon: "",
          hitungLembur: true,
          hitungUangMakan: false,
          hitungUangMakanLembur: false,
        });
      }
      fetchAllEmployees().then(setEmployees);
      setStep("form");
      setPreview(null);
      setShowDetailHarian(false);
      setShowLoanDetails(false);
      setShowKasbonDetails(false);
    }
  }, [open, gajiToEdit, defaultPeriode]);

  useEffect(() => {
    if (defaultPeriode) setForm((f) => ({ ...f, periode: defaultPeriode }));
  }, [defaultPeriode]);

  const handlePreview = async () => {
    if (!form.karyawanId || !form.periode) {
      toast.error("Pilih karyawan dan periode terlebih dahulu");
      return;
    }
    setPreviewLoading(true);
    try {
      const res = await fetchPayrollPreview(form.karyawanId, form.periode + "-01", {
        pajak: parseFloat(form.pajak || "0"),
        potonganDpGaji: parseFloat(form.potonganDpGaji || "0"),
        potonganLain: parseFloat(form.potonganLain || "0"),
        manualPinjaman: (form.manualPinjaman !== "" && form.manualPinjaman !== undefined) ? parseFloat(form.manualPinjaman) : undefined,
        manualKasbon: (form.manualKasbon !== "" && form.manualKasbon !== undefined) ? parseFloat(form.manualKasbon) : undefined,
        hitungLembur: form.hitungLembur,
        hitungUangMakan: form.hitungUangMakan,
        hitungUangMakanLembur: form.hitungUangMakanLembur,
      });
      if (res.error) { toast.error(res.error); return; }
      setPreview(res.data);
      setStep("preview");
    } catch {
      toast.error("Gagal memuat preview payroll");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!preview || (preview.sudahDiproses && !gajiToEdit)) return;
    setLoading(true);
    try {
      const data = {
        karyawanId: form.karyawanId,
        periode: new Date(form.periode + "-01").toISOString(),
        pajak: parseFloat(form.pajak || "0"),
        potonganDpGaji: parseFloat(form.potonganDpGaji || "0"),
        potonganLain: parseFloat(form.potonganLain || "0"),
        manualPinjaman: (form.manualPinjaman !== "" && form.manualPinjaman !== undefined) ? parseFloat(form.manualPinjaman) : undefined,
        manualKasbon: (form.manualKasbon !== "" && form.manualKasbon !== undefined) ? parseFloat(form.manualKasbon) : undefined,
        hitungLembur: form.hitungLembur,
        hitungUangMakan: form.hitungUangMakan,
        hitungUangMakanLembur: form.hitungUangMakanLembur,
      };

      const res = gajiToEdit 
        ? await updateGaji(gajiToEdit.id, data)
        : await createGaji(data);

      if (res.success) {
        toast.success(gajiToEdit ? "Data gaji berhasil diperbarui" : "Slip gaji berhasil dibuat", { duration: 5000 });
        onOpenChange(false);
        onSuccess?.(gajiToEdit ? gajiToEdit.id : (res as any).data?.id);
        setStep("form");
        setPreview(null);
      } else {
        toast.error(res.error || "Terjadi kesalahan");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  const k = preview?.kalkulasi;
  const isHarian = preview?.karyawan?.tipeKontrak === "HARIAN";
  const isLemburDinamis = k?.tipePenggajian === "HARIAN" || k?.tipePenggajian === "HARIAN_BULANAN";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1200px] rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between w-full pr-8">
            <DialogTitle className="flex items-center text-xl font-bold">
              <Calculator className="mr-2 h-5 w-5 text-blue-600" />
              {step === "form" 
                ? (gajiToEdit ? "Edit & Hitung Ulang Draft Gaji" : "Proses Gaji Karyawan") 
                : "Preview Slip Gaji"}
            </DialogTitle>
            {step === "preview" && preview && (
              <Button 
                size="sm"
                variant="outline" 
                className="rounded-xl border-cyan-200 text-cyan-700 hover:bg-cyan-50 shadow-sm"
                onClick={() => {
                  import("@/lib/pdf/slipGajiPdf").then((m) => m.generateSlipGajiPdf(preview, fmt));
                }}
              >
                <Printer className="w-4 h-4 mr-2" />
                Cetak PDF
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* ── STEP 1: Form ── */}
        {step === "form" && (
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label className="text-gray-600">Pilih Karyawan *</Label>
              <Select 
                value={form.karyawanId} 
                onValueChange={(v) => setForm({ ...form, karyawanId: v })}
                disabled={!!gajiToEdit}
              >
                <SelectTrigger className="rounded-xl border-gray-200">
                  <SelectValue placeholder="Pilih Karyawan" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.namaLengkap} ({e.nik})
                      {e.tipeKontrak && (
                        <span className={`ml-2 text-[10px] font-bold ${e.tipeKontrak === "HARIAN" ? "text-amber-600" : "text-blue-600"}`}>
                          [{e.tipeKontrak}]
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-600">Periode Gaji *</Label>
              <Input 
                type="month" 
                className="rounded-xl border-gray-200" 
                value={form.periode}
                disabled={!!gajiToEdit}
                onChange={(e) => setForm({ ...form, periode: e.target.value })} 
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-gray-600 text-xs">Pajak PPh21 (IDR)</Label>
                <Input type="number" placeholder="0" className="rounded-xl border-gray-200"
                  value={form.pajak} onChange={(e) => setForm({ ...form, pajak: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-600 text-xs">DP Gaji (IDR)</Label>
                <Input type="number" placeholder="0" className="rounded-xl border-gray-200"
                  value={form.potonganDpGaji} onChange={(e) => setForm({ ...form, potonganDpGaji: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-600 text-xs">Potongan Lain (IDR)</Label>
                <Input type="number" placeholder="0" className="rounded-xl border-gray-200"
                  value={form.potonganLain} onChange={(e) => setForm({ ...form, potonganLain: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-gray-600 text-xs">Potongan Pinjaman Manual (IDR)</Label>
                <Input type="number" placeholder="Otomatis" className="rounded-xl border-gray-200"
                  value={form.manualPinjaman} onChange={(e) => setForm({ ...form, manualPinjaman: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-600 text-xs">Potongan Kasbon Manual (IDR)</Label>
                <Input type="number" placeholder="Otomatis" className="rounded-xl border-gray-200"
                  value={form.manualKasbon} onChange={(e) => setForm({ ...form, manualKasbon: e.target.value })} />
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-gray-50 border border-gray-100 rounded-xl p-3">
              <Checkbox 
                id="hitungLembur" 
                checked={form.hitungLembur}
                onCheckedChange={(checked) => setForm({ ...form, hitungLembur: !!checked })}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="hitungLembur"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Hitung Upah Lembur
                </label>
                <p className="text-xs text-muted-foreground">
                  Jika dinonaktifkan, jam lembur tidak akan diakumulasi ke dalam total gaji bersih.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-gray-50 border border-gray-100 rounded-xl p-3">
              <Checkbox 
                id="hitungUangMakan" 
                checked={form.hitungUangMakan}
                onCheckedChange={(checked) => setForm({ ...form, hitungUangMakan: !!checked })}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="hitungUangMakan"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Hitung Uang Makan
                </label>
                <p className="text-xs text-muted-foreground">
                  Jika dinonaktifkan, tunjangan makan harian tidak akan dihitung.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-gray-50 border border-gray-100 rounded-xl p-3">
              <Checkbox 
                id="hitungUangMakanLembur" 
                checked={form.hitungUangMakanLembur}
                onCheckedChange={(checked) => setForm({ ...form, hitungUangMakanLembur: !!checked })}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="hitungUangMakanLembur"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Hitung Uang Makan Lembur
                </label>
                <p className="text-xs text-muted-foreground">
                  Jika dinonaktifkan, uang makan lembur tidak akan dihitung walaupun ada jam lembur.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
              <AlertTriangle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                Sistem otomatis menghitung berdasarkan <strong>tipe kontrak</strong> karyawan.
                Karyawan <strong>HARIAN</strong>: gaji = hari hadir × tarif harian.
                Karyawan <strong>BULANAN</strong>: gaji pokok tetap + lembur.
              </p>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button variant="outline" className="rounded-xl flex-1" onClick={() => onOpenChange(false)}>Batal</Button>
              <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 flex-1 text-white"
                disabled={previewLoading || !form.karyawanId} onClick={handlePreview}>
                {previewLoading
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menghitung...</>
                  : <><Calculator className="mr-2 h-4 w-4" />Hitung & Preview</>}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ── STEP 2: Preview ── */}
        {step === "preview" && preview && k && (
          <div className="space-y-4 py-2">
            {/* Header karyawan */}
            <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-800">{preview.karyawan.namaLengkap}</p>
                <p className="text-xs text-gray-500">{preview.karyawan.nik} · {preview.karyawan.jabatan}</p>
              </div>
              <div className="text-right">
                <Badge className={`${isHarian ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-blue-100 text-blue-700 border-blue-200"} border text-xs`}>
                  {k.tipeKontrak}
                </Badge>
                <p className="text-xs text-gray-500 mt-1">
                  {format(new Date(form.periode + "-01"), "MMMM yyyy", { locale: id })}
                </p>
              </div>
            </div>

            {preview.sudahDiproses && !gajiToEdit && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-700 font-semibold">Slip gaji periode ini sudah pernah dibuat.</p>
              </div>
            )}

            {/* Rekap Absensi */}
            <div className="bg-cyan-50 rounded-2xl p-4">
              <p className="text-xs font-black text-cyan-700 uppercase tracking-wider mb-3 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />Rekap Absensi & Jam Kerja
              </p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: "Hari Hadir", value: k.hariHadir, color: "text-emerald-600", sub: isHarian ? `× ${fmt(k.configUsed?.gajiPerHari || 0)}` : "" },
                  { label: "Terlambat", value: k.hariTerlambat, color: "text-orange-500", sub: k.potonganTerlambat > 0 ? `-${fmt(k.potonganTerlambat)}` : "" },
                  { label: "Alfa", value: k.hariAlfa, color: "text-red-500", sub: "" },
                  { label: "Izin/Sakit", value: k.hariIzin, color: "text-purple-600", sub: "" },
                  { label: "Total Jam Kerja", value: `${k.totalJamKerja}j`, color: "text-blue-600", sub: "" },
                  { label: "Jam Lembur", value: `${k.totalJamLembur}j`, color: "text-amber-600", sub: k.upahLembur > 0 ? `+${fmt(k.upahLembur)}` : "" },
                ].map((item) => (
                  <div key={item.label} className="bg-white rounded-xl p-2.5 text-center">
                    <p className={`text-base font-black ${item.color}`}>{item.value}</p>
                    <p className="text-[10px] text-gray-500 leading-tight">{item.label}</p>
                    {item.sub && <p className="text-[10px] font-semibold text-gray-600 mt-0.5">{item.sub}</p>}
                  </div>
                ))}
              </div>

              {/* Detail harian collapsible */}
              {k.detailHarian?.length > 0 && (
                <button
                  className="w-full flex items-center justify-between text-xs text-cyan-700 font-semibold bg-cyan-100 rounded-xl px-3 py-2 hover:bg-cyan-200 transition-colors"
                  onClick={() => setShowDetailHarian(!showDetailHarian)}
                >
                  <span>Lihat Detail Per Hari ({k.detailHarian.length} hari)</span>
                  {showDetailHarian ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              )}
              {showDetailHarian && (
                <div className="mt-2 max-h-[200px] overflow-y-auto rounded-xl border border-cyan-100 bg-white">
                  <table className="w-full text-xs">
                    <thead className="bg-cyan-50 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 text-cyan-700 font-bold">Tanggal</th>
                        <th className="text-center px-2 py-2 text-cyan-700 font-bold">Status</th>
                        <th className="text-center px-2 py-2 text-cyan-700 font-bold">Masuk</th>
                        <th className="text-center px-2 py-2 text-cyan-700 font-bold">Keluar</th>
                        <th className="text-center px-2 py-2 text-cyan-700 font-bold">Jam Kerja</th>
                        <th className="text-center px-2 py-2 text-cyan-700 font-bold">Lembur Aktual</th>
                        <th className="text-center px-2 py-2 text-cyan-700 font-bold">Fix Lembur</th>
                        <th className="text-center px-2 py-2 text-cyan-700 font-bold">Terlambat</th>
                        <th className="text-right px-2 py-2 text-cyan-700 font-bold">Gaji Harian</th>
                        <th className="text-right px-2 py-2 text-cyan-700 font-bold">Uang Makan</th>
                        <th className="text-right px-2 py-2 text-cyan-700 font-bold">UM Lembur</th>
                        <th className="text-right px-2 py-2 text-cyan-700 font-bold">Upah Lembur</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {k.detailHarian.map((d: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-1.5 text-gray-700">
                            {format(new Date(d.tanggal), "dd MMM", { locale: id })}
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <span className={`font-bold text-[10px] ${
                              d.status === "HADIR" ? "text-emerald-600" :
                              d.status === "TERLAMBAT" ? "text-orange-500" :
                              d.status === "ALFA" ? "text-red-500" : "text-purple-600"
                            }`}>{d.status}</span>
                          </td>
                          <td className="px-2 py-1.5 text-center text-gray-600">
                            {d.jamMasuk ? format(new Date(d.jamMasuk), "HH:mm") : "—"}
                          </td>
                          <td className="px-2 py-1.5 text-center text-gray-600">
                            {d.jamKeluar ? format(new Date(d.jamKeluar), "HH:mm") : "—"}
                          </td>
                          <td className="px-2 py-1.5 text-center font-semibold text-blue-600">
                            {d.jamKerja > 0 ? `${d.jamKerja}j` : "—"}
                          </td>
                          <td className="px-2 py-1.5 text-center text-gray-500">
                            {d.jamLemburRaw > 0 ? `${d.jamLemburRaw}j` : "—"}
                          </td>
                          <td className="px-2 py-1.5 text-center text-amber-600 font-bold">
                            {d.jamLembur > 0 ? `${d.jamLembur}j` : "—"}
                          </td>
                          <td className="px-2 py-1.5 text-center text-orange-500">
                            {d.menitTerlambat > 0 ? `${d.menitTerlambat}m` : "—"}
                          </td>
                          <td className="px-2 py-1.5 text-right font-semibold text-emerald-600">
                            {d.gajiKerjaHariIni > 0 ? fmt(d.gajiKerjaHariIni) : "—"}
                          </td>
                          <td className="px-2 py-1.5 text-right font-semibold text-emerald-600">
                            {d.uangMakanHariIni > 0 ? fmt(d.uangMakanHariIni) : "—"}
                          </td>
                          <td className="px-2 py-1.5 text-right font-semibold text-emerald-600">
                            {d.uangMakanLemburHariIni > 0 ? fmt(d.uangMakanLemburHariIni) : "—"}
                          </td>
                          <td className="px-2 py-1.5 text-right font-semibold text-emerald-600">
                            {d.upahLemburHariIni > 0 ? fmt(d.upahLemburHariIni) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pendapatan */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-1.5">
              <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Pendapatan</p>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {k.tipePenggajian === "HARIAN_BULANAN" || k.tipePenggajian === "HARIAN" || isHarian 
                    ? `Gaji Harian (Pro-rate Jam Kerja)` 
                    : "Gaji Pokok"}
                </span>
                <span className="font-semibold">{fmt(k.gajiKerja)}</span>
              </div>
              {k.tunjanganJabatan > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tunjangan Jabatan</span>
                  <span className="font-semibold text-emerald-600">{fmt(k.tunjanganJabatan)}</span>
                </div>
              )}
              {k.tunjanganKeluarga > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tunjangan Keluarga</span>
                  <span className="font-semibold text-emerald-600">{fmt(k.tunjanganKeluarga)}</span>
                </div>
              )}
              {k.tunjanganMakan > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tunjangan Makan</span>
                  <span className="font-semibold text-emerald-600">{fmt(k.tunjanganMakan)}</span>
                </div>
              )}
              {k.uangMakanLembur > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Uang Makan Lembur</span>
                  <span className="font-semibold text-emerald-600">{fmt(k.uangMakanLembur)}</span>
                </div>
              )}
              {k.tunjanganTransport > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tunjangan Transport</span>
                  <span className="font-semibold text-emerald-600">{fmt(k.tunjanganTransport)}</span>
                </div>
              )}
              {k.tunjanganKehadiran > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Premi Hadir ({k.hariHadir} hari)</span>
                  <span className="font-semibold text-emerald-600">{fmt(k.tunjanganKehadiran)}</span>
                </div>
              )}
              {k.tunjanganShift > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tunjangan Shift</span>
                  <span className="font-semibold text-emerald-600">{fmt(k.tunjanganShift)}</span>
                </div>
              )}
              {k.tunjangan > ((k.tunjanganJabatan||0) + (k.tunjanganKeluarga||0) + (k.tunjanganMakan||0) + (k.tunjanganTransport||0) + (k.tunjanganKehadiran||0) + (k.tunjanganShift||0) + (k.uangMakanLembur||0)) && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tunjangan Lainnya</span>
                  <span className="font-semibold text-emerald-600">{fmt(k.tunjangan - ((k.tunjanganJabatan||0) + (k.tunjanganKeluarga||0) + (k.tunjanganMakan||0) + (k.tunjanganTransport||0) + (k.tunjanganKehadiran||0) + (k.tunjanganShift||0) + (k.uangMakanLembur||0)))}</span>
                </div>
              )}
              {k.upahLembur > 0 && (
                <div className="flex flex-col">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Upah Lembur ({k.totalJamLembur}j)
                      {isLemburDinamis && <span className="text-[10px] text-amber-600 ml-1">(Skema Dinamis)</span>}
                    </span>
                    <span className="font-semibold text-emerald-600">{fmt(k.upahLembur)}</span>
                  </div>
                  {isLemburDinamis && (
                    <div className="mt-1 pl-2 border-l-2 border-blue-200 text-[10px] text-gray-500 space-y-0.5">
                      <p>• Basis per jam (UU): {fmt((preview?.karyawan?.gajiPokok * 25) / 173)}</p>
                      <p>• Tarif efektif per jam: {fmt(k.upahLembur / k.totalJamLembur)} (akumulasi pengali)</p>
                    </div>
                  )}
                </div>
              )}
              <Separator className="my-1" />
              <div className="flex justify-between text-sm font-bold">
                <span>Total Pendapatan</span>
                <span>{fmt(k.totalPendapatan)}</span>
              </div>
            </div>

            {/* Potongan */}
            <div className="bg-red-50/60 rounded-2xl p-4 space-y-1.5">
              <p className="text-xs font-black text-red-500 uppercase tracking-wider mb-2">Potongan</p>
              {k.potonganTerlambat > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Keterlambatan ({k.hariTerlambat}× @ {fmt(k.configUsed?.potonganTerlambat || 0)})</span>
                  <span className="font-semibold text-orange-500">-{fmt(k.potonganTerlambat)}</span>
                </div>
              )}
              {k.potonganPinjaman > 0 && (
                <div className="flex justify-between text-sm items-center">
                  <span className="text-gray-600 flex items-center gap-2">
                    <CreditCard className="h-3 w-3" />
                    Cicilan Pinjaman ({preview.pinjaman.details.length} angsuran)
                    <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 py-0 ml-1" onClick={() => setShowLoanDetails(true)}>View Detail</Button>
                  </span>
                  <span className="font-semibold text-red-600">-{fmt(k.potonganPinjaman)}</span>
                </div>
              )}
              {k.potonganKasbon > 0 && (
                <div className="flex justify-between text-sm items-center">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Banknote className="h-3 w-3" />
                    Pelunasan Kasbon ({preview.kasbon.list.length} kasbon)
                    <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 py-0 ml-1" onClick={() => setShowKasbonDetails(true)}>View Detail</Button>
                  </span>
                  <span className="font-semibold text-red-600">-{fmt(k.potonganKasbon)}</span>
                </div>
              )}
              {parseFloat(form.pajak) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pajak PPh21</span>
                  <span className="font-semibold text-red-600">-{fmt(parseFloat(form.pajak))}</span>
                </div>
              )}
              {parseFloat(form.potonganDpGaji) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">DP Gaji</span>
                  <span className="font-semibold text-red-600">-{fmt(parseFloat(form.potonganDpGaji))}</span>
                </div>
              )}
              {parseFloat(form.potonganLain) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Potongan Lain</span>
                  <span className="font-semibold text-red-600">-{fmt(parseFloat(form.potonganLain))}</span>
                </div>
              )}
              {k.totalPotongan === 0 && <p className="text-sm text-gray-400 italic">Tidak ada potongan</p>}
              <Separator className="my-1" />
              <div className="flex justify-between text-sm font-bold text-red-600">
                <span>Total Potongan</span>
                <span>-{fmt(k.totalPotongan)}</span>
              </div>
            </div>

            {/* Gaji Bersih */}
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 flex justify-between items-center">
              <div>
                <p className="text-xs font-black text-emerald-600 uppercase tracking-wider">Gaji Bersih Diterima</p>
                <p className="text-2xl font-black text-emerald-700 mt-1">{fmt(k.total)}</p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 border text-xs px-3 py-1">
                Siap Diproses
              </Badge>
            </div>

            <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
              <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                <strong>Informasi:</strong> Gaji akan disimpan sebagai <strong>DRAFT</strong>.
                Data jurnal dan pelunasan pinjaman baru akan diproses setelah Anda menekan tombol <strong>Posting</strong> di daftar gaji.
              </p>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button variant="outline" className="rounded-xl flex-1" onClick={() => setStep("form")}>← Kembali</Button>
              <Button
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 flex-1 text-white shadow-md shadow-emerald-200"
                disabled={loading || (preview.sudahDiproses && !gajiToEdit)}
                onClick={handleSubmit}
              >
                {loading
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Memproses...</>
                  : (gajiToEdit ? "✓ Simpan Perubahan" : "✓ Proses & Simpan Gaji")}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>

      {/* Dialog Detail Pinjaman */}
      {preview?.pinjaman?.details && (
        <Dialog open={showLoanDetails} onOpenChange={setShowLoanDetails}>
          <DialogContent className="sm:max-w-[700px] rounded-3xl bg-gray-50/50 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center text-xl font-bold">
                <CreditCard className="mr-2 h-5 w-5 text-blue-600" />
                Potongan Pinjaman: {preview.karyawan.namaLengkap}
              </DialogTitle>
            </DialogHeader>
            <div className="py-2 space-y-6">
              {preview.pinjaman.details.map((activeDetail: any, i: number) => {
                const fullSchedule = activeDetail.pinjaman?.details || [activeDetail];
                return (
                  <div key={i} className="space-y-4">
                    {/* Info Header */}
                    <div className="bg-white border rounded-2xl p-4 flex justify-between items-center shadow-sm">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Pinjaman #{activeDetail.pinjamanId.substring(0,8)}</p>
                        <p className="text-lg font-black text-blue-600">{fmt(activeDetail.pinjaman?.jumlahPinjaman || 0)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Sisa Saldo (Sblm Potong)</p>
                        <p className="text-lg font-black text-amber-600">{fmt(activeDetail.pinjaman?.sisaPinjaman || 0)}</p>
                      </div>
                    </div>

                    <div className="border rounded-2xl bg-white overflow-hidden shadow-sm">
                      <div className="bg-blue-50/50 px-4 py-3 border-b flex items-center justify-between">
                        <p className="text-sm font-bold text-blue-800 flex items-center">
                          <CreditCard className="h-4 w-4 mr-2" />
                          Detail Angsuran ({fullSchedule.length} Bulan)
                        </p>
                        <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-200 bg-blue-50">
                          Jadwal Lengkap
                        </Badge>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto">
                        <table className="w-full text-sm relative">
                          <thead className="bg-gray-50 border-b text-gray-500 sticky top-0 z-10 shadow-sm">
                            <tr>
                              <th className="py-2 px-4 text-left font-semibold text-xs">Bulan</th>
                              <th className="py-2 px-4 text-left font-semibold text-xs">Jatuh Tempo</th>
                              <th className="py-2 px-4 text-right font-semibold text-xs">Jumlah</th>
                              <th className="py-2 px-4 text-center font-semibold text-xs">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {fullSchedule.map((d: any, idx: number) => {
                              const isCurrentDeduction = d.id === activeDetail.id;
                              return (
                                <tr key={idx} className={`hover:bg-gray-50 ${isCurrentDeduction ? 'bg-amber-50/50' : ''}`}>
                                  <td className="py-2.5 px-4 font-semibold text-gray-700">#{d.bulanKe || '-'}</td>
                                  <td className="py-2.5 px-4 text-gray-600">{format(new Date(d.tanggalJatuhTempo), "MMMM yyyy", { locale: id })}</td>
                                  <td className="py-2.5 px-4 text-right font-medium">{fmt(d.jumlahBayar)}</td>
                                  <td className="py-2.5 px-4 text-center">
                                    {isCurrentDeduction ? (
                                      <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200 bg-amber-50">Dipotong di Slip</Badge>
                                    ) : d.status === "PAID" ? (
                                      <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200 bg-emerald-50">Lunas</Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-[10px] text-gray-500 border-gray-200 bg-gray-50">Menunggu</Badge>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-between font-black text-gray-800 border-t-2 border-gray-200 pt-3 mt-4 text-lg px-2">
                <span>Total Potongan Pinjaman (Slip Ini)</span>
                <span className="text-red-600">-{fmt(k?.potonganPinjaman || 0)}</span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog Detail Kasbon */}
      {preview?.kasbon?.list && (
        <Dialog open={showKasbonDetails} onOpenChange={setShowKasbonDetails}>
          <DialogContent className="sm:max-w-[600px] rounded-3xl bg-gray-50/50">
            <DialogHeader>
              <DialogTitle className="flex items-center text-xl font-bold">
                <Banknote className="mr-2 h-5 w-5 text-blue-600" />
                Pelunasan Kasbon: {preview.karyawan.namaLengkap}
              </DialogTitle>
            </DialogHeader>
            <div className="py-2 space-y-3">
              {preview.kasbon.list.map((kItem: any, idx: number) => (
                <div key={idx} className="flex border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                  <div className="w-12 bg-blue-50 flex items-center justify-center border-r border-blue-100">
                    <CheckCircle2 className="text-blue-400 h-5 w-5" />
                  </div>
                  <div className="p-4 flex-1 flex justify-between items-center">
                    <div>
                      <p className="font-black text-lg text-gray-800">{fmt(kItem.jumlah)}</p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                        <span>{format(new Date(kItem.tanggal || kItem.createdAt), "dd MMM yyyy", { locale: id })}</span>
                        <span className="text-gray-300">•</span> 
                        <span>Pelunasan: <span className="font-semibold">{kItem.bulanPotong ? format(new Date(kItem.bulanPotong), "MMM yyyy", { locale: id }) : '-'}</span></span>
                      </p>
                      <p className="text-xs text-gray-600 mt-2 bg-gray-50 inline-block px-2 py-1 rounded-md border border-gray-100">
                        {kItem.keterangan || "Tanpa Keterangan"}
                      </p>
                    </div>
                    <div className="text-right">
                       <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200 bg-emerald-50">Dipotong di Slip</Badge>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-between font-black text-gray-800 border-t-2 border-gray-200 pt-3 mt-4 text-lg px-2">
                <span>Total Potongan Kasbon</span>
                <span className="text-red-600">-{fmt(k?.potonganKasbon || 0)}</span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
};

export default ProcessPayrollDialog;
