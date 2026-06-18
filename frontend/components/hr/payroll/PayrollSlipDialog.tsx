"use client";

import React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { pdf } from "@react-pdf/renderer";
import PayrollSlipPdf from "./PayrollSlipPdf";
import { toast } from "sonner";
import { Building2, User, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PayrollSlipDialogProps {
  gaji: any;
  open: boolean;
  onClose: () => void;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);

const Row = ({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color?: string }) => (
  <div className="flex justify-between items-center py-1.5">
    <span className={`text-sm ${bold ? "font-bold text-gray-800" : "text-gray-600"}`}>{label}</span>
    <span className={`text-sm font-semibold ${color || (bold ? "text-gray-900" : "text-gray-700")}`}>{value}</span>
  </div>
);

const countWorkingDays = (start: Date, end: Date): number => {
    let count = 0;
    const d = new Date(start);
    d.setHours(0, 0, 0, 0);
    const e = new Date(end);
    e.setHours(0, 0, 0, 0);
    while (d <= e) {
        const day = d.getDay();
        if (day !== 0 && day !== 6) count++;
        d.setDate(d.getDate() + 1);
    }
    return count;
};

const PayrollSlipDialog: React.FC<PayrollSlipDialogProps> = ({ gaji, open, onClose }) => {
  const [isPrinting, setIsPrinting] = React.useState(false);

  if (!gaji) return null;

  const totalPotongan =
    (gaji.potongan || 0) + gaji.pajak + gaji.potonganPinjaman + gaji.potonganKasbon + gaji.potonganDpGaji;
  const totalPendapatan = gaji.gajiPokok + (gaji.tunjangan || 0) + (gaji.upahLembur || 0);

  const handlePrint = () => window.print();

  const handleDownloadPdf = async () => {
    setIsPrinting(true);
    try {
      const blob = await pdf(<PayrollSlipPdf gaji={gaji} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Slip_Gaji_${gaji.karyawan?.namaLengkap}_${gaji.periode}.pdf`;
      link.click();
      toast.success("Slip gaji berhasil didownload");
    } catch (error) {
      toast.error("Gagal mendownload slip gaji");
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[520px] rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xl font-black">
              <Building2 className="h-5 w-5 text-blue-600" />
              Slip Gaji Karyawan
            </span>
            <Button variant="outline" size="sm" className="rounded-xl" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1" />Cetak
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2" id="slip-print">
          {/* Header Info */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-blue-200 text-xs font-bold uppercase tracking-wider">Karyawan</p>
                <p className="text-xl font-black mt-1">{gaji.karyawan?.namaLengkap}</p>
                <p className="text-blue-200 text-sm mt-0.5">{gaji.karyawan?.nik} · {gaji.karyawan?.jabatan}</p>
              </div>
              <div className="text-right">
                <p className="text-blue-200 text-xs font-bold uppercase tracking-wider">Periode</p>
                <p className="text-lg font-black mt-1">
                  {format(new Date(gaji.periode), "MMMM yyyy", { locale: id })}
                </p>
                <p className="text-blue-200 text-xs mt-0.5">
                  {format(new Date(gaji.periodeMulai), "dd MMM", { locale: id })} –{" "}
                  {format(new Date(gaji.periodeSelesai), "dd MMM yyyy", { locale: id })}
                </p>
                <p className="text-blue-100 text-xs mt-1 font-semibold">
                  Hari Kerja: {countWorkingDays(new Date(gaji.periodeMulai), new Date(gaji.periodeSelesai))} hari
                </p>
              </div>
            </div>
          </div>

          {/* Pendapatan */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-1">
            <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Pendapatan</p>
            <Row label={`Gaji Pokok (${countWorkingDays(new Date(gaji.periodeMulai), new Date(gaji.periodeSelesai))} hari)`} value={fmt(gaji.gajiPokok)} />
            {gaji.tunjanganJabatan > 0 && <Row label="Tunjangan Jabatan" value={fmt(gaji.tunjanganJabatan)} />}
            {gaji.tunjanganKeluarga > 0 && <Row label="Tunjangan Keluarga" value={fmt(gaji.tunjanganKeluarga)} />}
            {gaji.tunjanganMakan > 0 && <Row label="Tunjangan Makan" value={fmt(gaji.tunjanganMakan)} />}
            {gaji.tunjanganTransport > 0 && <Row label="Tunjangan Transport" value={fmt(gaji.tunjanganTransport)} />}
            {gaji.tunjanganKehadiran > 0 && <Row label="Premi Hadir" value={fmt(gaji.tunjanganKehadiran)} />}
            {gaji.tunjanganShift > 0 && <Row label="Tunjangan Shift" value={fmt(gaji.tunjanganShift)} />}
            {gaji.tunjangan > (gaji.tunjanganJabatan||0) + (gaji.tunjanganKeluarga||0) + (gaji.tunjanganMakan||0) + (gaji.tunjanganTransport||0) + (gaji.tunjanganKehadiran||0) + (gaji.tunjanganShift||0) && 
              <Row label="Tunjangan Lainnya" value={fmt(gaji.tunjangan - ((gaji.tunjanganJabatan||0) + (gaji.tunjanganKeluarga||0) + (gaji.tunjanganMakan||0) + (gaji.tunjanganTransport||0) + (gaji.tunjanganKehadiran||0) + (gaji.tunjanganShift||0)))} />
            }
            {gaji.totalJamLembur > 0 && (
              <Row label={`Lembur (${gaji.totalJamLembur} jam)`} value={fmt(gaji.upahLembur || 0)} />
            )}
            <Separator className="my-2" />
            <Row label="Total Pendapatan" value={fmt(totalPendapatan)} bold />
          </div>

          {/* Potongan */}
          <div className="bg-red-50/50 rounded-2xl p-4 space-y-1">
            <p className="text-xs font-black text-red-500 uppercase tracking-wider mb-2">Potongan</p>
            {(gaji.potongan || 0) > 0 && <Row label="Potongan Lain" value={fmt(gaji.potongan)} color="text-red-600" />}
            {gaji.pajak > 0 && <Row label="Pajak PPh21" value={fmt(gaji.pajak)} color="text-red-600" />}
            {gaji.potonganPinjaman > 0 && <Row label="Cicilan Pinjaman" value={fmt(gaji.potonganPinjaman)} color="text-red-600" />}
            {gaji.potonganKasbon > 0 && <Row label="Pelunasan Kasbon" value={fmt(gaji.potonganKasbon)} color="text-red-600" />}
            {gaji.potonganDpGaji > 0 && <Row label="DP Gaji" value={fmt(gaji.potonganDpGaji)} color="text-red-600" />}
            {totalPotongan === 0 && <p className="text-sm text-gray-400 italic">Tidak ada potongan</p>}
            <Separator className="my-2" />
            <Row label="Total Potongan" value={fmt(totalPotongan)} bold color="text-red-600" />
          </div>

          {/* Gaji Bersih */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-black text-emerald-600 uppercase tracking-wider">Gaji Bersih Diterima</p>
                <p className="text-2xl font-black text-emerald-700 mt-1">{fmt(gaji.total)}</p>
              </div>
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center">
                <User className="h-7 w-7 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Sisa Pinjaman Info */}
          {(() => {
            const activeLoans = gaji.karyawan?.pinjaman?.filter((p: any) => p.status === "ACTIVE") || [];
            if (activeLoans.length === 0 || !(gaji.potonganPinjaman > 0)) return null;
            const totalSisa = activeLoans.reduce((sum: number, p: any) => sum + Number(p.sisaPinjaman || 0), 0);
            const sisaAfter = gaji.status === "DRAFT"
              ? totalSisa - (gaji.potonganPinjaman || 0)
              : totalSisa;
            return (
              <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5 flex justify-between items-center">
                <p className="text-xs text-orange-700 italic">Sisa Pinjaman setelah potongan bulan ini</p>
                <p className="text-sm font-bold text-orange-700">{fmt(Math.max(0, sisaAfter))}</p>
              </div>
            );
          })()}

          <p className="text-center text-xs text-gray-400">
            Digenerate pada {format(new Date(gaji.createdAt), "dd MMMM yyyy HH:mm", { locale: id })}
          </p>
          <DialogFooter>
            <Button onClick={handleDownloadPdf} disabled={isPrinting} className="w-full">
              {isPrinting ? "Menyiapkan PDF..." : "Cetak Slip PDF"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PayrollSlipDialog;
