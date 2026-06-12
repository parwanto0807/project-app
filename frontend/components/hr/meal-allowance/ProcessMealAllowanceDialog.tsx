"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Calculator, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { getPreviewMealAllowance, createDisbursement } from "@/lib/action/hr/mealAllowance";
import { fetchAllEmployees } from "@/lib/action/hr/loans";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  defaultPeriode: string;
  defaultSiklus: number;
}

export default function ProcessMealAllowanceDialog({ open, onOpenChange, onSuccess, defaultPeriode, defaultSiklus }: Props) {
  const [periodeBulan, setPeriodeBulan] = useState(defaultPeriode);
  const [siklus, setSiklus] = useState(defaultSiklus.toString());
  const [karyawanId, setKaryawanId] = useState("");
  const [karyawanList, setKaryawanList] = useState<any[]>([]);
  const [previewData, setPreviewData] = useState<any>(null);
  const [isLoadingKaryawan, setIsLoadingKaryawan] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setPeriodeBulan(defaultPeriode);
      setSiklus(defaultSiklus.toString());
      setPreviewData(null);
      setKaryawanId("");
      fetchKaryawan();
    }
  }, [open, defaultPeriode, defaultSiklus]);

  const fetchKaryawan = async () => {
    setIsLoadingKaryawan(true);
    try {
      const res = await fetchAllEmployees();
      if (Array.isArray(res)) {
        setKaryawanList(res);
      } else if (res && res.data) {
        setKaryawanList(res.data);
      }
    } catch (err) {
      toast.error("Gagal memuat daftar karyawan");
    } finally {
      setIsLoadingKaryawan(false);
    }
  };

  const handleCalculate = async () => {
    if (!karyawanId) return toast.error("Pilih karyawan terlebih dahulu");
    setIsCalculating(true);
    try {
      const res = await getPreviewMealAllowance(karyawanId, periodeBulan, parseInt(siklus));
      if (res.error) throw new Error(res.error);
      setPreviewData(res);
    } catch (err: any) {
      toast.error(err.message || "Gagal kalkulasi uang makan");
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await createDisbursement({
        karyawanId,
        periodeBulan,
        siklus: parseInt(siklus),
      });
      if (res.success) {
        toast.success("Draft pencairan uang makan berhasil dibuat");
        onSuccess();
        onOpenChange(false);
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan draft pencairan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fmt = (num: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl sm:max-w-5xl md:max-w-6xl w-[95vw] sm:w-full bg-white border-none shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <DialogTitle className="text-xl flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Kalkulasi Pencairan Uang Makan
          </DialogTitle>
          <DialogDescription className="text-orange-100">
            Pilih karyawan, periode, dan siklus untuk menghitung nominal uang makan yang bisa dicairkan.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Periode</label>
              <Input type="month" value={periodeBulan} onChange={e => setPeriodeBulan(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Siklus</label>
              <Select value={siklus} onValueChange={setSiklus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Siklus 1 (Tgl 21-5)</SelectItem>
                  <SelectItem value="2">Siklus 2 (Tgl 6-20)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Karyawan</label>
              <Select value={karyawanId} onValueChange={setKaryawanId}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingKaryawan ? "Memuat..." : "Pilih Karyawan"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Karyawan (Massal)</SelectItem>
                  {karyawanList.map(k => (
                    <SelectItem key={k.id} value={k.id}>{k.namaLengkap} ({k.nik})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleCalculate} disabled={isCalculating || !karyawanId} className="bg-gray-900 text-white">
              {isCalculating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Hitung Sekarang
            </Button>
          </div>

          {previewData && (
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50/50">
              <div className="p-4 bg-gray-100 border-b border-gray-200 font-medium text-gray-800">
                Hasil Kalkulasi: {previewData.karyawan.namaLengkap}
              </div>
              
              {previewData.sudahDiproses ? (
                <div className="p-8 text-center text-orange-600 bg-orange-50">
                  Data pencairan untuk siklus ini sudah pernah dibuat sebelumnya.
                </div>
              ) : (
                <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm text-center">
                    <div className="text-xs text-gray-500 mb-1">Hari Hadir</div>
                    <div className="text-xl font-bold text-gray-900">{previewData.kalkulasi.totalHariHadir} <span className="text-sm font-normal text-gray-500">hari</span></div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm text-center">
                    <div className="text-xs text-gray-500 mb-1">Jam Lembur</div>
                    <div className="text-xl font-bold text-gray-900">{previewData.kalkulasi.totalJamLembur} <span className="text-sm font-normal text-gray-500">jam</span></div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm text-center">
                    <div className="text-xs text-gray-500 mb-1">UM Harian</div>
                    <div className="text-lg font-bold text-blue-600">{fmt(previewData.kalkulasi.nominalUangMakan)}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm text-center">
                    <div className="text-xs text-gray-500 mb-1">UM Lembur</div>
                    <div className="text-lg font-bold text-purple-600">{fmt(previewData.kalkulasi.nominalUangMakanLembur)}</div>
                  </div>
                  <div className="col-span-2 md:col-span-4 bg-orange-50 p-4 rounded-lg border border-orange-100 text-center">
                    <div className="text-sm font-medium text-orange-800 mb-1">Total Siap Cair</div>
                    <div className="text-3xl font-bold text-orange-600">{fmt(previewData.kalkulasi.totalPencairan)}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="p-6 bg-gray-50 border-t border-gray-100">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Tutup</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!previewData || isSubmitting || previewData.sudahDiproses}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            Simpan Draft Pencairan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
