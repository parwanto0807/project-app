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
import { Loader2, PlusCircle, AlertCircle, Info } from "lucide-react";
import { createLoan, fetchAllEmployees, fetchBankAccounts } from "@/lib/action/hr/loans";
import { toast } from "sonner";

interface CreateLoanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const CreateLoanDialog: React.FC<CreateLoanDialogProps> = ({ open, onOpenChange, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    karyawanId: "",
    tanggalPinjam: new Date().toISOString().split("T")[0],
    jumlahPinjaman: "",
    tenor: "12",
    bunga: "0",
    keterangan: "",
    bankAccountId: "",
  });

  useEffect(() => {
    if (open) {
      const loadData = async () => {
        const [empData, bankData] = await Promise.all([
          fetchAllEmployees(),
          fetchBankAccounts(),
        ]);
        setEmployees(empData);
        setBankAccounts(bankData);
      };
      loadData();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.karyawanId || !formData.jumlahPinjaman) {
      toast.error("Harap isi semua bidang wajib (Karyawan & Jumlah Pinjaman)");
      return;
    }

    setLoading(true);
    try {
      const res = await createLoan(formData);
      if (res.success) {
        toast.success("Pinjaman berhasil disimpan sebagai Draft. Lakukan Posting untuk sinkron ke laporan keuangan.", {
          duration: 5000,
        });
        onOpenChange(false);
        if (onSuccess) onSuccess();
        setFormData({
          karyawanId: "",
          tanggalPinjam: new Date().toISOString().split("T")[0],
          jumlahPinjaman: "",
          tenor: "12",
          bunga: "0",
          keterangan: "",
          bankAccountId: "",
        });
      } else {
        toast.error(res.error || "Gagal membuat pinjaman");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthly = () => {
    const amount = parseFloat(formData.jumlahPinjaman || "0");
    const tenor = parseInt(formData.tenor || "1");
    const bunga = parseFloat(formData.bunga || "0");
    if (!amount || !tenor) return 0;
    return Math.ceil((amount + (amount * bunga / 100)) / tenor);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl font-bold">
            <PlusCircle className="mr-2 h-5 w-5 text-blue-600" />
            Buat Pinjaman Baru
          </DialogTitle>
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mt-2">
            <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              Pinjaman akan disimpan sebagai <strong>Draft</strong>. Gunakan tombol <strong>Posting</strong> di tabel untuk menyinkronkan ke jurnal akuntansi.
            </p>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label className="text-gray-600">Pilih Karyawan *</Label>
              <Select
                value={formData.karyawanId}
                onValueChange={(val) => setFormData({ ...formData, karyawanId: val })}
              >
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
            </div>

            <div className="space-y-2">
              <Label className="text-gray-600">Tanggal Pencairan</Label>
              <Input
                type="date"
                className="rounded-xl border-gray-200"
                value={formData.tanggalPinjam}
                onChange={(e) => setFormData({ ...formData, tanggalPinjam: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-600">Tenor (Bulan)</Label>
              <Select
                value={formData.tenor}
                onValueChange={(val) => setFormData({ ...formData, tenor: val })}
              >
                <SelectTrigger className="rounded-xl border-gray-200">
                  <SelectValue placeholder="Pilih Tenor" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {[3, 6, 12, 18, 24, 36].map((m) => (
                    <SelectItem key={m} value={m.toString()}>
                      {m} Bulan
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-600">Jumlah Pinjaman (IDR) *</Label>
              <Input
                type="number"
                placeholder="0"
                className="rounded-xl border-gray-200"
                value={formData.jumlahPinjaman}
                onChange={(e) => setFormData({ ...formData, jumlahPinjaman: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-600">Bunga (%)</Label>
              <Input
                type="number"
                placeholder="0"
                className="rounded-xl border-gray-200"
                value={formData.bunga}
                onChange={(e) => setFormData({ ...formData, bunga: e.target.value })}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label className="text-gray-600 font-bold text-blue-700">
                Sumber Dana (Akun Kas/Bank)
                <span className="ml-1 text-xs font-normal text-amber-600">(Wajib diisi untuk Posting)</span>
              </Label>
              <Select
                value={formData.bankAccountId}
                onValueChange={(val) => setFormData({ ...formData, bankAccountId: val })}
              >
                <SelectTrigger className="rounded-xl border-blue-200 bg-blue-50/30">
                  <SelectValue placeholder="Pilih Akun Pembayaran" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {bankAccounts.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id}>
                      {bank.bankName} - {bank.accountNumber} ({bank.coa?.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-2">
              <Label className="text-gray-600">Keterangan</Label>
              <Textarea
                placeholder="Tujuan pinjaman..."
                className="rounded-xl border-gray-200 min-h-[80px]"
                value={formData.keterangan}
                onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-700 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                Estimasi Angsuran:
              </span>
              <span className="text-lg font-bold text-blue-800">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  maximumFractionDigits: 0,
                }).format(calculateMonthly())}
                <span className="text-xs font-normal text-blue-600"> /bulan</span>
              </span>
            </div>
            <p className="text-[10px] text-blue-500 mt-1">* Angsuran akan otomatis dipotong saat Payroll bulanan.</p>
            <p className="text-[10px] text-amber-600 mt-1">⚠ Pinjaman tersimpan sebagai Draft — belum tercatat di laporan keuangan.</p>
          </div>

          <DialogFooter className="mt-6 gap-2">
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
              className="rounded-xl bg-blue-600 hover:bg-blue-700 flex-1 shadow-md shadow-blue-200"
              disabled={loading}
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</>
              ) : (
                "Simpan sebagai Draft"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateLoanDialog;
