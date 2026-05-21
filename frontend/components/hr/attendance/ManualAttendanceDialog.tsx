"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ManualAttendanceDialogProps {
  record: any;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ManualAttendanceDialog({ record, open, onClose, onSuccess }: ManualAttendanceDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [jamMasuk, setJamMasuk] = useState("08:00");
  const [jamKeluar, setJamKeluar] = useState("");
  const [status, setStatus] = useState("HADIR");
  const [keterangan, setKeterangan] = useState("Input manual lupa absen");

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      
      // Construct date objects
      const tgl = new Date(record.tanggal).toISOString().split('T')[0];
      const masukISO = jamMasuk ? new Date(`${tgl}T${jamMasuk}:00+07:00`).toISOString() : null;
      const keluarISO = jamKeluar ? new Date(`${tgl}T${jamKeluar}:00+07:00`).toISOString() : null;

      // Import dynamic action here to avoid circular dependency
      const { createManualAbsensi } = await import("@/lib/action/hr/absensi");
      
      const res = await createManualAbsensi({
        karyawanId: record.karyawanId,
        tanggal: new Date(record.tanggal).toISOString(),
        jamMasuk: masukISO,
        jamKeluar: keluarISO,
        status,
        keterangan
      });

      if (res.success) {
        toast.success("Absensi manual berhasil disimpan");
        onSuccess();
      } else {
        toast.error(res.error || "Gagal menyimpan absensi manual");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsLoading(false);
    }
  };

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Input Absensi Manual</DialogTitle>
          <DialogDescription>
            Masukkan jam kehadiran untuk <b>{record.karyawan?.namaLengkap}</b> pada tanggal <b>{new Date(record.tanggal).toLocaleDateString('id-ID')}</b>.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Jam Masuk</Label>
            <Input type="time" value={jamMasuk} onChange={e => setJamMasuk(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Jam Keluar</Label>
            <Input type="time" value={jamKeluar} onChange={e => setJamKeluar(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HADIR">Hadir</SelectItem>
                <SelectItem value="TERLAMBAT">Terlambat</SelectItem>
                <SelectItem value="IZIN">Izin</SelectItem>
                <SelectItem value="SAKIT">Sakit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right mt-2">Keterangan</Label>
            <Textarea 
              value={keterangan} 
              onChange={e => setKeterangan(e.target.value)} 
              className="col-span-3" 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Batal</Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Absensi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
