"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, PlusCircle, Pencil, Settings, CheckCircle2 } from "lucide-react";
import { createPayrollConfig, updatePayrollConfig } from "@/lib/action/hr/payroll";
import { toast } from "sonner";

interface PayrollConfigPanelProps {
  configs: any[];
  onRefresh?: () => void;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);

const PayrollConfigPanel: React.FC<PayrollConfigPanelProps> = ({ configs, onRefresh }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", gajiPerHari: "", lemburPerJam: "",
    jamKerjaPerHari: "8", toleransiTerlambat: "15", potonganTerlambat: "0",
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", gajiPerHari: "", lemburPerJam: "", jamKerjaPerHari: "8", toleransiTerlambat: "15", potonganTerlambat: "0" });
    setDialogOpen(true);
  };

  const openEdit = (cfg: any) => {
    setEditing(cfg);
    setForm({
      name: cfg.name,
      gajiPerHari: String(cfg.gajiPerHari),
      lemburPerJam: String(cfg.lemburPerJam),
      jamKerjaPerHari: String(cfg.jamKerjaPerHari ?? 8),
      toleransiTerlambat: String(cfg.toleransiTerlambat ?? 15),
      potonganTerlambat: String(cfg.potonganTerlambat ?? 0),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.gajiPerHari || !form.lemburPerJam) {
      toast.error("Semua field wajib diisi");
      return;
    }
    setLoading(true);
    try {
      const data = {
        name: form.name,
        gajiPerHari: parseFloat(form.gajiPerHari),
        lemburPerJam: parseFloat(form.lemburPerJam),
        jamKerjaPerHari: parseFloat(form.jamKerjaPerHari || "8"),
        toleransiTerlambat: parseInt(form.toleransiTerlambat || "15"),
        potonganTerlambat: parseFloat(form.potonganTerlambat || "0"),
      };
      const res = editing
        ? await updatePayrollConfig(editing.id, data)
        : await createPayrollConfig(data);

      if (res.success) {
        toast.success(editing ? "Konfigurasi berhasil diperbarui" : "Konfigurasi berhasil dibuat");
        setDialogOpen(false);
        onRefresh?.();
      } else {
        toast.error(res.error || "Gagal menyimpan konfigurasi");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-800 text-lg">Konfigurasi Payroll</h3>
          <p className="text-sm text-gray-500 mt-0.5">Atur tarif gaji harian dan lembur per jam</p>
        </div>
        <Button
          className="rounded-xl bg-gray-800 hover:bg-gray-900 text-white"
          onClick={openCreate}
        >
          <PlusCircle className="h-4 w-4 mr-2" />Tambah Config
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {configs.map((cfg) => (
          <Card key={cfg.id} className="border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Settings className="h-4 w-4 text-gray-600" />
                  </div>
                  <CardTitle className="text-base font-bold text-gray-800">{cfg.name}</CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  {cfg.isActive && (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 border text-[10px]">
                      <CheckCircle2 className="h-2.5 w-2.5 mr-1" />Aktif
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => openEdit(cfg)}>
                    <Pencil className="h-3.5 w-3.5 text-gray-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center bg-gray-50 rounded-xl px-3 py-2">
                <span className="text-xs text-gray-500">Gaji Per Hari</span>
                <span className="font-bold text-gray-800 text-sm">{fmt(cfg.gajiPerHari)}</span>
              </div>
              <div className="flex justify-between items-center bg-amber-50 rounded-xl px-3 py-2">
                <span className="text-xs text-gray-500">Lembur Per Jam</span>
                <span className="font-bold text-amber-700 text-sm">{fmt(cfg.lemburPerJam)}</span>
              </div>
              <div className="flex justify-between items-center bg-blue-50 rounded-xl px-3 py-2">
                <span className="text-xs text-gray-500">Jam Kerja / Hari</span>
                <span className="font-bold text-blue-700 text-sm">{cfg.jamKerjaPerHari ?? 8} jam</span>
              </div>
              <div className="flex justify-between items-center bg-orange-50 rounded-xl px-3 py-2">
                <span className="text-xs text-gray-500">Toleransi Terlambat</span>
                <span className="font-bold text-orange-700 text-sm">{cfg.toleransiTerlambat ?? 15} menit</span>
              </div>
              {(cfg.potonganTerlambat ?? 0) > 0 && (
                <div className="flex justify-between items-center bg-red-50 rounded-xl px-3 py-2">
                  <span className="text-xs text-gray-500">Potongan Terlambat</span>
                  <span className="font-bold text-red-600 text-sm">{fmt(cfg.potonganTerlambat)}/kejadian</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {configs.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-500">
            <Settings className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Belum ada konfigurasi payroll.</p>
            <p className="text-sm mt-1">Tambahkan konfigurasi untuk mulai memproses gaji.</p>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl font-bold">
              <Settings className="mr-2 h-5 w-5 text-gray-700" />
              {editing ? "Edit Konfigurasi" : "Tambah Konfigurasi"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-3">
            <div className="space-y-2">
              <Label className="text-gray-600">Nama Konfigurasi *</Label>
              <Input
                placeholder="Contoh: Staff Lapangan"
                className="rounded-xl border-gray-200"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-600">Gaji Per Hari (IDR) *</Label>
              <Input type="number" placeholder="0" className="rounded-xl border-gray-200"
                value={form.gajiPerHari} onChange={(e) => setForm({ ...form, gajiPerHari: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-600">Lembur Per Jam (IDR) *</Label>
              <Input type="number" placeholder="0" className="rounded-xl border-gray-200"
                value={form.lemburPerJam} onChange={(e) => setForm({ ...form, lemburPerJam: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-gray-600 text-xs">Jam Kerja/Hari</Label>
                <Input type="number" placeholder="8" className="rounded-xl border-gray-200"
                  value={form.jamKerjaPerHari} onChange={(e) => setForm({ ...form, jamKerjaPerHari: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-600 text-xs">Toleransi Terlambat (menit)</Label>
                <Input type="number" placeholder="15" className="rounded-xl border-gray-200"
                  value={form.toleransiTerlambat} onChange={(e) => setForm({ ...form, toleransiTerlambat: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-600 text-xs">Potongan Terlambat (IDR)</Label>
                <Input type="number" placeholder="0" className="rounded-xl border-gray-200"
                  value={form.potonganTerlambat} onChange={(e) => setForm({ ...form, potonganTerlambat: e.target.value })} />
              </div>
            </div>
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
              <Settings className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                Config ini dipakai untuk karyawan <strong>HARIAN</strong>. Karyawan <strong>BULANAN</strong> hanya menggunakan tarif lembur & potongan terlambat.
              </p>
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" className="rounded-xl flex-1" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                className="rounded-xl bg-gray-800 hover:bg-gray-900 flex-1 text-white"
                disabled={loading}
              >
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</> : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayrollConfigPanel;
