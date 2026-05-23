"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Banknote, AlertTriangle, Info } from "lucide-react";
import { createKasbon, fetchAllEmployees } from "@/lib/action/hr/loans";
import { toast } from "sonner";

interface CreateKasbonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const CreateKasbonDialog: React.FC<CreateKasbonDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  const [formData, setFormData] = useState({
    karyawanId: "",
    jumlah: "",
    keperluan: "",
    bulanPotong: "",
    tanggal: new Date().toISOString().split("T")[0],
    catatan: "",
  });

  useEffect(() => {
    if (open) {
      fetchAllEmployees().then(setEmployees);
    }
  }, [open]);

  const handleEmployeeChange = (val: string) => {
    const emp = employees.find((e) => e.id === val);
    setSelectedEmployee(emp || null);
    setFormData((prev) => ({ ...prev, karyawanId: val }));
  };

  const maxKasbon =
    selectedEmployee?.gajiPokok ? selectedEmployee.gajiPokok * 0.5 : null;

  const isOverLimit =
    maxKasbon !== null &&
    parseFloat(formData.jumlah || "0") > maxKasbon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.karyawanId || !formData.jumlah) {
      toast.error("Karyawan dan jumlah kasbon wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const res = await createKasbon(formData);
      if (res.success) {
        if (res.warning) {
          toast.warning(res.warning, { duration: 6000 });
        } else {
          toast.success("Kasbon berhasil diajukan dengan status PENDING");
        }
        onOpenChange(false);
        onSuccess?.();
        setFormData({ karyawanId: "", jumlah: "", keperluan: "", bulanPotong: "", tanggal: new Date().toISOString().split("T")[0], catatan: "" });
        setSelectedEmployee(null);
      } else {
        toast.error(res.error || "Gagal membuat kasbon");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  // Generate 8 months options for bulanPotong (including 1 month back)
  const monthOptions = Array.from({ length: 8 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + i - 1);
    return {
      label: d.toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
      value: d.toISOString().split("T")[0],
    };
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl font-bold">
            <Banknote className="mr-2 h-5 w-5 text-amber-600" />
            Ajukan Kasbon Baru
          </DialogTitle>
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mt-2">
            <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              Kasbon akan disimpan sebagai <strong>PENDING</strong> dan menunggu persetujuan.
              Pelunasan dilakukan via potong gaji bulan berikutnya (0% bunga).
            </p>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Karyawan */}
          <div className="space-y-2">
            <Label className="text-gray-600">Pilih Karyawan *</Label>
            <Select value={formData.karyawanId} onValueChange={handleEmployeeChange}>
              <SelectTrigger className="rounded-xl border-gray-200">
                <SelectValue placeholder="Pilih Karyawan" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.namaLengkap} ({emp.nik})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedEmployee?.gajiPokok && (
              <p className="text-xs text-gray-500">
                Gaji Pokok:{" "}
                <span className="font-semibold text-gray-700">
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    maximumFractionDigits: 0,
                  }).format(selectedEmployee.gajiPokok)}
                </span>{" "}
                — Maks. Kasbon:{" "}
                <span className="font-semibold text-amber-700">
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    maximumFractionDigits: 0,
                  }).format(maxKasbon!)}
                </span>
              </p>
            )}
          </div>

          {/* Jumlah */}
          <div className="space-y-2">
            <Label className="text-gray-600">Jumlah Kasbon (IDR) *</Label>
            <Input
              type="number"
              placeholder="0"
              className={`rounded-xl ${isOverLimit ? "border-red-400 bg-red-50" : "border-gray-200"}`}
              value={formData.jumlah}
              onChange={(e) => setFormData({ ...formData, jumlah: e.target.value })}
            />
            {formData.jumlah && (
              <p className="text-sm font-medium text-gray-700">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  maximumFractionDigits: 0,
                }).format(parseFloat(formData.jumlah))}
              </p>
            )}
            {isOverLimit && (
              <div className="flex items-center gap-1 text-xs text-red-600">
                <AlertTriangle className="h-3 w-3" />
                Melebihi 50% gaji pokok. Pengajuan tetap bisa disimpan namun perlu persetujuan khusus.
              </div>
            )}
          </div>

          {/* Tanggal Input */}
          <div className="space-y-2">
            <Label className="text-gray-600">Tanggal Pengajuan / Input *</Label>
            <Input
              type="date"
              className="rounded-xl border-gray-200"
              value={formData.tanggal}
              onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
            />
          </div>

          {/* Bulan Potong */}
          <div className="space-y-2">
            <Label className="text-gray-600">Bulan Pelunasan (Potong Gaji)</Label>
            <Select
              value={formData.bulanPotong}
              onValueChange={(val) => setFormData({ ...formData, bulanPotong: val })}
            >
              <SelectTrigger className="rounded-xl border-gray-200">
                <SelectValue placeholder="Pilih bulan gajian" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {monthOptions.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Keperluan */}
          <div className="space-y-2">
            <Label className="text-gray-600">Keperluan / Alasan</Label>
            <Textarea
              placeholder="Jelaskan keperluan kasbon..."
              className="rounded-xl border-gray-200 min-h-[80px]"
              value={formData.keperluan}
              onChange={(e) => setFormData({ ...formData, keperluan: e.target.value })}
            />
          </div>

          {/* Catatan Admin */}
          <div className="space-y-2">
            <Label className="text-gray-600">Catatan Admin (opsional)</Label>
            <Input
              type="text"
              placeholder="Catatan tambahan..."
              className="rounded-xl border-gray-200"
              value={formData.catatan}
              onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
            />
          </div>

          <DialogFooter className="mt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl flex-1"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="rounded-xl bg-amber-500 hover:bg-amber-600 flex-1 shadow-md shadow-amber-200 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Ajukan Kasbon"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateKasbonDialog;
