"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Loader2, Users, CheckCircle2, AlertTriangle, XCircle,
  Zap, ChevronDown, ChevronUp, FileText,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { fetchBulkPayrollPreview, processBulkPayroll } from "@/lib/action/hr/payroll";
import { toast } from "sonner";

interface BulkPayrollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  periode: string; // "YYYY-MM"
}

const fmt = (v: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);

const BulkPayrollDialog: React.FC<BulkPayrollDialogProps> = ({
  open, onOpenChange, onSuccess, periode,
}) => {
  const [step, setStep] = useState<"preview" | "result">("preview");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview] = useState<any | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [showSkipped, setShowSkipped] = useState(false);

  // Load preview whenever dialog opens
  useEffect(() => {
    if (open) {
      setStep("preview");
      setResult(null);
      loadPreview();
    }
  }, [open, periode]);

  const loadPreview = async () => {
    setPreviewLoading(true);
    try {
      const res = await fetchBulkPayrollPreview(periode + "-01");
      if (res.error) { toast.error(res.error); return; }
      setPreview(res.data);
    } catch {
      toast.error("Gagal memuat preview");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleProcess = async () => {
    setProcessing(true);
    try {
      const res = await processBulkPayroll(periode + "-01");
      if (res.success) {
        setResult(res.data);
        setStep("result");
        if (res.data.totalFailed === 0) {
          toast.success(`${res.data.totalSuccess} slip gaji berhasil dibuat!`, { duration: 5000 });
        } else {
          toast.warning(`${res.data.totalSuccess} berhasil, ${res.data.totalFailed} gagal.`, { duration: 6000 });
        }
        onSuccess?.();
      } else {
        toast.error(res.error || "Gagal memproses gaji massal");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setProcessing(false);
    }
  };

  const periodeLabel = format(new Date(periode + "-01"), "MMMM yyyy", { locale: id });
  const toBeProcesed = preview?.previews?.filter((p: any) => !p.sudahDiproses) || [];
  const alreadyDone = preview?.previews?.filter((p: any) => p.sudahDiproses) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px] rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl font-bold">
            <Zap className="mr-2 h-5 w-5 text-emerald-600" />
            Proses Gaji Massal — {periodeLabel}
          </DialogTitle>
        </DialogHeader>

        {/* ── LOADING ── */}
        {previewLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
            <p className="text-gray-500 font-medium">Menghitung kalkulasi semua karyawan...</p>
          </div>
        )}

        {/* ── STEP: PREVIEW ── */}
        {!previewLoading && step === "preview" && preview && (
          <div className="space-y-4 py-2">
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-blue-700">{preview.totalKaryawan}</p>
                <p className="text-xs text-blue-500 font-medium mt-0.5">Total Karyawan Aktif</p>
              </div>
              <div className="bg-emerald-50 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-emerald-700">{preview.totalBelumDiproses}</p>
                <p className="text-xs text-emerald-500 font-medium mt-0.5">Akan Diproses</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-gray-600">{preview.totalSudahDiproses}</p>
                <p className="text-xs text-gray-400 font-medium mt-0.5">Sudah Diproses</p>
              </div>
            </div>

            {/* Total gaji bersih */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-4 flex justify-between items-center text-white">
              <div>
                <p className="text-emerald-200 text-xs font-bold uppercase tracking-wider">Total Gaji Bersih yang Akan Dibayar</p>
                <p className="text-2xl font-black mt-1">{fmt(preview.totalGajiBersih)}</p>
              </div>
              <Users className="h-10 w-10 text-emerald-300 opacity-60" />
            </div>

            {/* Warning jika semua sudah diproses */}
            {preview.totalBelumDiproses === 0 && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-700 font-semibold">
                  Semua karyawan sudah diproses untuk periode {periodeLabel}.
                </p>
              </div>
            )}

            {/* Daftar karyawan yang akan diproses */}
            {toBeProcesed.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    {toBeProcesed.length} Karyawan Akan Diproses
                  </p>
                </div>
                <div className="max-h-[280px] overflow-y-auto">
                  <Table>
                    <TableHeader className="bg-gray-50/50 sticky top-0">
                      <TableRow>
                        <TableHead className="text-xs font-bold text-gray-600">Karyawan</TableHead>
                        <TableHead className="text-xs font-bold text-gray-600">Gaji Pokok</TableHead>
                        <TableHead className="text-xs font-bold text-gray-600">Potongan</TableHead>
                        <TableHead className="text-xs font-bold text-gray-600 text-right">Gaji Bersih</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {toBeProcesed.map((p: any) => {
                        const totalPotongan =
                          p.kalkulasi.potonganLain +
                          p.kalkulasi.potonganPinjaman +
                          p.kalkulasi.potonganKasbon;
                        return (
                          <TableRow key={p.karyawan.id} className="hover:bg-gray-50/50">
                            <TableCell>
                              <p className="font-semibold text-gray-800 text-sm">{p.karyawan.namaLengkap}</p>
                              <p className="text-xs text-gray-400">{p.karyawan.nik}</p>
                            </TableCell>
                            <TableCell className="text-sm text-gray-700">
                              {fmt(p.kalkulasi.gajiPokok)}
                            </TableCell>
                            <TableCell>
                              {totalPotongan > 0 ? (
                                <span className="text-sm text-red-500 font-medium">
                                  -{fmt(totalPotongan)}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-bold text-gray-900 text-sm">
                              {fmt(p.kalkulasi.total)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Karyawan yang sudah diproses (collapsible) */}
            {alreadyDone.length > 0 && (
              <div className="border border-gray-100 rounded-2xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                  onClick={() => setShowSkipped(!showSkipped)}
                >
                  <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-gray-400" />
                    {alreadyDone.length} karyawan dilewati (sudah diproses)
                  </p>
                  {showSkipped ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </button>
                {showSkipped && (
                  <div className="divide-y divide-gray-50">
                    {alreadyDone.map((p: any) => (
                      <div key={p.karyawan.id} className="flex items-center justify-between px-4 py-2.5">
                        <p className="text-sm text-gray-500">{p.karyawan.namaLengkap}</p>
                        <Badge className="bg-gray-100 text-gray-500 border-none text-[10px]">Sudah Diproses</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
              <FileText className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                <strong>Informasi:</strong> Proses ini akan membuat <strong>Draft Slip Gaji</strong>. 
                Data pinjaman & jurnal akuntansi <strong>belum</strong> akan berubah sampai Anda melakukan 
                <strong> Posting</strong> pada daftar gaji.
              </p>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button variant="outline" className="rounded-xl flex-1" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 flex-1 text-white shadow-md shadow-emerald-200"
                disabled={processing || preview.totalBelumDiproses === 0}
                onClick={handleProcess}
              >
                {processing ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Memproses {toBeProcesed.length} karyawan...</>
                ) : (
                  <><Zap className="mr-2 h-4 w-4" />Proses {toBeProcesed.length} Karyawan Sekarang</>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ── STEP: RESULT ── */}
        {step === "result" && result && (
          <div className="space-y-4 py-2">
            {/* Result summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-3xl font-black text-emerald-700">{result.totalSuccess}</p>
                <p className="text-xs text-emerald-600 font-medium mt-0.5">Berhasil Diproses</p>
              </div>
              <div className={`${result.totalFailed > 0 ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-100"} border rounded-2xl p-4 text-center`}>
                {result.totalFailed > 0
                  ? <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  : <CheckCircle2 className="h-8 w-8 text-gray-300 mx-auto mb-2" />}
                <p className={`text-3xl font-black ${result.totalFailed > 0 ? "text-red-600" : "text-gray-400"}`}>
                  {result.totalFailed}
                </p>
                <p className={`text-xs font-medium mt-0.5 ${result.totalFailed > 0 ? "text-red-500" : "text-gray-400"}`}>
                  Gagal
                </p>
              </div>
            </div>

            {/* Success list */}
            {result.success.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100">
                  <p className="text-sm font-bold text-emerald-700">✓ Slip Gaji Berhasil Dibuat</p>
                </div>
                <div className="max-h-[200px] overflow-y-auto divide-y divide-gray-50">
                  {result.success.map((s: any) => (
                    <div key={s.karyawanId} className="flex items-center justify-between px-4 py-2.5">
                      <p className="text-sm font-medium text-gray-700">{s.namaLengkap}</p>
                      <span className="text-sm font-bold text-emerald-700">{fmt(s.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Failed list */}
            {result.failed.length > 0 && (
              <div className="bg-white border border-red-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-red-50 border-b border-red-100">
                  <p className="text-sm font-bold text-red-700">✗ Gagal Diproses</p>
                </div>
                <div className="divide-y divide-gray-50">
                  {result.failed.map((f: any) => (
                    <div key={f.karyawanId} className="px-4 py-2.5">
                      <p className="text-sm font-medium text-gray-700">{f.namaLengkap}</p>
                      <p className="text-xs text-red-500 mt-0.5">{f.error}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                className="rounded-xl bg-gray-800 hover:bg-gray-900 w-full text-white"
                onClick={() => onOpenChange(false)}
              >
                Tutup
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BulkPayrollDialog;
