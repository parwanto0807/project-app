"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface EditAttendanceDialogProps {
  record: any;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditAttendanceDialog({ record, open, onClose, onSuccess }: EditAttendanceDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [tanggal, setTanggal] = useState("");
  const [jamMasuk, setJamMasuk] = useState("");
  const [jamKeluar, setJamKeluar] = useState("");
  const [status, setStatus] = useState("HADIR");
  const [keterangan, setKeterangan] = useState("");

  useEffect(() => {
    if (record && open) {
      if (record.tanggal) {
        setTanggal(new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Jakarta' }).format(new Date(record.tanggal)));
      } else {
        setTanggal("");
      }
      if (record.jamMasuk) {
        setJamMasuk(format(new Date(record.jamMasuk), "HH:mm"));
      } else {
        setJamMasuk("");
      }
      if (record.jamKeluar) {
        setJamKeluar(format(new Date(record.jamKeluar), "HH:mm"));
      } else {
        setJamKeluar("");
      }
      setStatus(record.status || "HADIR");
      setKeterangan(record.keterangan || "");
    }
  }, [record, open]);

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      
      // Construct date objects
      const tgl = tanggal || new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Jakarta' }).format(new Date(record.tanggal));
      const tanggalISO = new Date(`${tgl}T00:00:00+07:00`).toISOString();
      const masukISO = jamMasuk ? new Date(`${tgl}T${jamMasuk}:00+07:00`).toISOString() : null;
      const keluarISO = jamKeluar ? new Date(`${tgl}T${jamKeluar}:00+07:00`).toISOString() : null;

      const { updateAbsensiAction } = await import("@/lib/action/hr/absensi");
      
      const res = await updateAbsensiAction(record.id, {
        tanggal: tanggalISO,
        jamMasuk: masukISO,
        jamKeluar: keluarISO,
        status,
        keterangan
      });

      if (res.success) {
        toast.success("Absensi berhasil diubah");
        onSuccess();
      } else {
        toast.error(res.error || "Gagal mengubah absensi");
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
          <DialogTitle>Edit Data Absensi</DialogTitle>
          <DialogDescription>
            Ubah jam kehadiran atau status untuk <b>{record.karyawan?.namaLengkap}</b> pada tanggal <b>{new Date(record.tanggal).toLocaleDateString('id-ID')}</b>.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Tanggal</Label>
            <Input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} className="col-span-3" />
          </div>
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
                <SelectItem value="ALFA">Alfa</SelectItem>
                <SelectItem value="MANGKIR">Mangkir</SelectItem>
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
            Simpan Perubahan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
