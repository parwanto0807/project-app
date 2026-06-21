"use client";

import React, { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2, Clock, AlertTriangle, Loader2, ShieldCheck, Pencil,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { validateAbsensi, approveAbsensi } from "@/lib/action/hr/absensi";
import { fetchPayrollConfigs } from "@/lib/action/hr/payroll";
import { toast } from "sonner";
import { useEffect } from "react";

interface ValidateAttendanceDialogProps {
  record: any;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const JAM_STANDAR_KELUAR = "17:00";
const DEFAULT_THRESHOLD = 9;

function formatTime(dt: string | null) {
  if (!dt) return "--:--";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(dt));
}

function hitungDurasi(masuk: string | null, keluar: string | null): string {
  if (!masuk || !keluar) return "--";
  const diffMs = new Date(keluar).getTime() - new Date(masuk).getTime();
  if (diffMs <= 0) return "--";
  const h = Math.floor(diffMs / 3600000);
  const m = Math.floor((diffMs % 3600000) / 60000);
  return `${h}j ${m}m`;
}

function isSuspicious(masuk: string | null, keluar: string | null, standarKeluar = JAM_STANDAR_KELUAR): boolean {
  if (!masuk || !keluar) return false;
  const keluarDate = new Date(keluar);
  const standar = new Date(keluarDate);
  const [h, m] = standarKeluar.split(":").map(Number);
  standar.setHours(h, m, 0, 0);
  // Lebih dari 30 menit setelah jam standar keluar = mencurigakan
  return keluarDate.getTime() - standar.getTime() > 30 * 60 * 1000;
}

const ValidateAttendanceDialog: React.FC<ValidateAttendanceDialogProps> = ({
  record, open, onClose, onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"approve" | "correct">("approve");
  const [jamKeluarKoreksi, setJamKeluarKoreksi] = useState(JAM_STANDAR_KELUAR);
  const [tanggalKeluarKoreksi, setTanggalKeluarKoreksi] = useState("");
  const [jamLembur, setJamLembur] = useState("0");
  const [catatan, setCatatan] = useState("");
  const [config, setConfig] = useState<any>(null);

  // Fetch config for threshold
  useEffect(() => {
    const loadConfig = async () => {
      const res = await fetchPayrollConfigs();
      if (res.data && res.data.length > 0) {
        // Cari yang active
        const active = res.data.find((c: any) => c.isActive);
        setConfig(active || res.data[0]);
      }
    };
    if (open) loadConfig();
  }, [open]);

  // Set default values when record changes or dialog opens
  useEffect(() => {
    if (record && open) {
      const tglStr = record.tanggal ? format(new Date(record.tanggal), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");
      setTanggalKeluarKoreksi(tglStr);
      
      if (record.isValidated && record.jamKeluarDisetujui) {
        // Jika sudah divalidasi, gunakan jam yang sudah disetujui sebagai default koreksi
        const jam = format(new Date(record.jamKeluarDisetujui), "HH:mm");
        setJamKeluarKoreksi(jam);
        setMode("correct");
      } else if (record.jamKeluar) {
        const jam = format(new Date(record.jamKeluar), "HH:mm");
        setJamKeluarKoreksi(jam);
        setMode("approve");
      } else {
        setJamKeluarKoreksi(JAM_STANDAR_KELUAR);
        setMode("correct");
      }
    }
  }, [record, open]);

  if (!record) return null;

  const suspicious = isSuspicious(record.jamMasuk, record.jamKeluar);
  const sudahValidasi = record.isValidated;
  const threshold = config?.jamKerjaPerHari || DEFAULT_THRESHOLD;

  // Auto-calculate overtime in frontend
  useEffect(() => {
    if (mode === "correct" && record.jamMasuk && tanggalKeluarKoreksi && jamKeluarKoreksi) {
      try {
        const diffMs = new Date(`${tanggalKeluarKoreksi}T${jamKeluarKoreksi}:00`).getTime() - new Date(record.jamMasuk).getTime();
        const durasiJam = diffMs / 3600000;
        if (durasiJam > threshold) {
          const autoLembur = Math.round((durasiJam - threshold) * 100) / 100;
          setJamLembur(autoLembur.toString());
        } else {
          setJamLembur("0");
        }
      } catch {
        setJamLembur("0");
      }
    }
  }, [mode, record.jamMasuk, tanggalKeluarKoreksi, jamKeluarKoreksi, threshold]);

  const handleApprove = async () => {
    setLoading(true);
    try {
      const res = await approveAbsensi(record.id, catatan || "Disetujui oleh Admin");
      if (res.success) {
        toast.success("Jam keluar disetujui");
        onSuccess();
        onClose();
      } else {
        toast.error(res.error || "Gagal approve");
      }
    } catch { toast.error("Terjadi kesalahan"); }
    finally { setLoading(false); }
  };

  const handleCorrect = async () => {
    let jamKeluarFull: string | null = null;
    if (tanggalKeluarKoreksi || jamKeluarKoreksi) {
      if (!tanggalKeluarKoreksi || !jamKeluarKoreksi) {
        toast.error("Tanggal dan jam keluar harus diisi keduanya, atau dikosongkan keduanya untuk set null");
        return;
      }
      jamKeluarFull = `${tanggalKeluarKoreksi}T${jamKeluarKoreksi}:00+07:00`;
    }

    setLoading(true);
    try {
      const res = await validateAbsensi(record.id, {
        jamKeluarDisetujui: jamKeluarFull as any,
        catatanValidasi: catatan || (jamKeluarFull ? `Dikoreksi ke ${tanggalKeluarKoreksi} ${jamKeluarKoreksi}` : "Jam keluar dikosongkan"),
        jamLembur: parseFloat(jamLembur || "0"),
      });
      if (res.success) {
        toast.success(jamKeluarFull ? `Jam keluar dikoreksi ke ${jamKeluarKoreksi}` : "Jam keluar berhasil dikosongkan");
        onSuccess();
        onClose();
      } else {
        toast.error(res.error || "Gagal koreksi");
      }
    } catch { toast.error("Terjadi kesalahan"); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl font-bold">
            <ShieldCheck className="mr-2 h-5 w-5 text-blue-600" />
            Validasi Jam Kerja
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Karyawan info */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="font-bold text-gray-800">{record.karyawan?.namaLengkap}</p>
            <p className="text-xs text-gray-500">{record.karyawan?.nik} · {record.karyawan?.jabatan}</p>
            <p className="text-xs text-gray-500 mt-1">
              {record.tanggal ? format(new Date(record.tanggal), "EEEE, dd MMMM yyyy", { locale: id }) : "—"}
            </p>
          </div>

          {/* Jam kerja summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-cyan-50 rounded-xl p-3 text-center">
              <p className="text-xs text-cyan-600 font-bold uppercase tracking-wider">Masuk</p>
              <p className="text-lg font-black text-cyan-700 mt-1">{formatTime(record.jamMasuk)}</p>
            </div>
            <div className={`rounded-xl p-3 text-center ${suspicious ? "bg-red-50" : "bg-blue-50"}`}>
              <p className={`text-xs font-bold uppercase tracking-wider ${suspicious ? "text-red-600" : "text-blue-600"}`}>
                Keluar (Karyawan)
              </p>
              <p className={`text-lg font-black mt-1 ${suspicious ? "text-red-700" : "text-blue-700"}`}>
                {formatTime(record.jamKeluar)}
              </p>
              {suspicious && <p className="text-[10px] text-red-500 font-bold mt-0.5">⚠ Mencurigakan</p>}
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Durasi</p>
              <p className="text-lg font-black text-gray-700 mt-1">
                {hitungDurasi(record.jamMasuk, record.jamKeluar)}
              </p>
            </div>
          </div>

          {/* Suspicious warning */}
          {suspicious && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-red-700">Durasi Mencurigakan</p>
                <p className="text-xs text-red-600 mt-0.5">
                  Karyawan clock-out lebih dari 30 menit setelah jam standar ({JAM_STANDAR_KELUAR}).
                  Silakan verifikasi apakah ini lembur resmi atau perlu dikoreksi.
                </p>
              </div>
            </div>
          )}

          {/* Already validated info */}
          {sudahValidasi && (
            <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-700">Sudah Divalidasi</p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  Jam keluar disetujui: <strong>{formatTime(record.jamKeluarDisetujui)}</strong>
                  {record.catatanValidasi && ` — ${record.catatanValidasi}`}
                </p>
              </div>
            </div>
          )}

          {/* First seen at / detected office discrepancy warning */}
          {record.first_seen_at && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="w-full">
                <p className="text-xs font-bold text-amber-700">Kecurangan Deteksi Kehadiran Kantor ("Mata-mata")</p>
                <div className="text-xs text-amber-600 mt-1 space-y-1 w-full">
                  <div className="flex justify-between gap-4">
                    <span>Jam Keluar (Klik Manual):</span>
                    <span className="font-bold">{record.jamKeluar ? formatTime(record.jamKeluar) : "--:--"}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Terdeteksi Sampai Kantor:</span>
                    <span className="font-bold">{formatTime(record.first_seen_at)}</span>
                  </div>
                  {(() => {
                    const outTime = new Date(record.jamKeluar).getTime();
                    const seenTime = new Date(record.first_seen_at).getTime();
                    const diffMs = outTime - seenTime;
                    if (diffMs > 15 * 60 * 1000) {
                      const h = Math.floor(diffMs / 3600000);
                      const m = Math.floor((diffMs % 3600000) / 60000);
                      const durationStr = h > 0 ? `${h} jam ${m} menit` : `${m} menit`;
                      return (
                        <div className="text-rose-600 font-bold mt-1.5 pt-1.5 border-t border-amber-200/50 flex justify-between">
                          <span>Selisih Mengulur Waktu:</span>
                          <span className="bg-rose-50 px-2 py-0.5 rounded border border-rose-100 animate-pulse text-[10px]">{durationStr}</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Mode selector */}
          <div className="flex gap-2">
            <Button
              variant={mode === "approve" ? "default" : "outline"}
              size="sm"
              disabled={!record.jamKeluar}
              className={`rounded-xl flex-1 ${mode === "approve" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
              onClick={() => setMode("approve")}
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              Setujui Apa Adanya
            </Button>
            <Button
              variant={mode === "correct" ? "default" : "outline"}
              size="sm"
              className={`rounded-xl flex-1 ${mode === "correct" ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}`}
              onClick={() => setMode("correct")}
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Koreksi Jam Keluar
            </Button>
          </div>

          {/* Correction form */}
          {mode === "correct" && (
            <div className="space-y-3 bg-orange-50 border border-orange-100 rounded-2xl p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600 font-semibold">Tanggal Keluar</Label>
                  <Input
                    type="date"
                    className="rounded-xl border-orange-200 bg-white"
                    value={tanggalKeluarKoreksi}
                    onChange={(e) => setTanggalKeluarKoreksi(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600 font-semibold">Jam Keluar</Label>
                  <Input
                    type="time"
                    className="rounded-xl border-orange-200 bg-white"
                    value={jamKeluarKoreksi}
                    onChange={(e) => setJamKeluarKoreksi(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">* Kosongkan kedua kolom di atas untuk menghapus (set null) jam keluar.</p>

              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600 font-semibold">Jam Lembur (jam)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="0"
                    className="rounded-xl border-orange-200 bg-white"
                    value={jamLembur}
                    onChange={(e) => setJamLembur(e.target.value)}
                  />
                  <p className="text-[10px] text-gray-500">Threshold: {threshold} jam</p>
                </div>
                <div className="flex flex-col justify-center">
                  <p className="text-[10px] text-orange-600 font-bold">
                    Durasi: {hitungDurasi(record.jamMasuk, `${tanggalKeluarKoreksi}T${jamKeluarKoreksi}:00`)}
                  </p>
                  {record.jamMasuk && tanggalKeluarKoreksi && jamKeluarKoreksi && (() => {
                    const diffMs = new Date(`${tanggalKeluarKoreksi}T${jamKeluarKoreksi}:00`).getTime() - new Date(record.jamMasuk).getTime();
                    const durasiJam = diffMs / 3600000;
                    if (durasiJam > threshold) {
                      const autoLembur = Math.round((durasiJam - threshold) * 100) / 100;
                      return <p className="text-[10px] text-emerald-600 font-bold">Lembur: {autoLembur} jam (Auto)</p>;
                    }
                    return <p className="text-[10px] text-gray-400">Tanpa Lembur</p>;
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Catatan */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600 font-semibold">Catatan Admin</Label>
            <Textarea
              placeholder="Alasan validasi / koreksi..."
              className="rounded-xl border-gray-200 min-h-[60px] text-sm"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" className="rounded-xl flex-1" onClick={onClose}>Batal</Button>
          <Button
            className={`rounded-xl flex-1 text-white ${mode === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-orange-500 hover:bg-orange-600"}`}
            disabled={loading}
            onClick={mode === "approve" ? handleApprove : handleCorrect}
          >
            {loading
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyimpan...</>
              : mode === "approve" ? "✓ Setujui" : "✓ Simpan Koreksi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ValidateAttendanceDialog;
