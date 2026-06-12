"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Globe } from "lucide-react";
import { fetchGlobalPayrollConfig, updateGlobalPayrollConfig } from "@/lib/action/hr/payroll";
import { toast } from "sonner";

export default function GlobalPayrollConfigPanel() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({
    cutOffAbsensi: "20",
    cutOffUangMakan1: "5",
    cutOffUangMakan2: "20",
  });

  const loadGlobalConfig = useCallback(async () => {
    setFetching(true);
    const res = await fetchGlobalPayrollConfig();
    if (res.data) {
      setForm({
        cutOffAbsensi: String(res.data.cutOffAbsensi ?? 20),
        cutOffUangMakan1: String(res.data.cutOffUangMakan1 ?? 5),
        cutOffUangMakan2: String(res.data.cutOffUangMakan2 ?? 20),
      });
    }
    setFetching(false);
  }, []);

  useEffect(() => {
    loadGlobalConfig();
  }, [loadGlobalConfig]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        cutOffAbsensi: parseInt(form.cutOffAbsensi),
        cutOffUangMakan1: parseInt(form.cutOffUangMakan1),
        cutOffUangMakan2: parseInt(form.cutOffUangMakan2),
      };
      const res = await updateGlobalPayrollConfig(data);
      if (res.success) {
        toast.success("Konfigurasi global berhasil disimpan");
        loadGlobalConfig();
      } else {
        toast.error(res.error || "Gagal menyimpan konfigurasi global");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <Card className="border border-gray-100 shadow-sm animate-pulse mb-6">
        <CardContent className="py-10 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-100 shadow-sm mb-6 bg-gradient-to-br from-white to-gray-50/50">
      <CardHeader className="pb-3 border-b border-gray-100/50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Globe className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-gray-800">Global Cut-off</CardTitle>
            <CardDescription>Atur tanggal cut-off yang berlaku untuk semua karyawan</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-gray-600 font-medium">Tanggal Cut-off Absensi</Label>
              <div className="relative">
                <Input
                  type="number"
                  min="1"
                  max="28"
                  className="rounded-xl border-gray-200 pl-4"
                  value={form.cutOffAbsensi}
                  onChange={(e) => setForm({ ...form, cutOffAbsensi: e.target.value })}
                />
              </div>
              <p className="text-[11px] text-gray-500">Tanggal terakhir periode absensi (ex: 20)</p>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-600 font-medium">Cut-off Uang Makan (1)</Label>
              <Input
                type="number"
                min="1"
                max="31"
                className="rounded-xl border-gray-200"
                value={form.cutOffUangMakan1}
                onChange={(e) => setForm({ ...form, cutOffUangMakan1: e.target.value })}
              />
              <p className="text-[11px] text-gray-500">Tanggal pembayaran uang makan termin 1</p>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-600 font-medium">Cut-off Uang Makan (2)</Label>
              <Input
                type="number"
                min="1"
                max="31"
                className="rounded-xl border-gray-200"
                value={form.cutOffUangMakan2}
                onChange={(e) => setForm({ ...form, cutOffUangMakan2: e.target.value })}
              />
              <p className="text-[11px] text-gray-500">Tanggal pembayaran uang makan termin 2</p>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button
              type="submit"
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]"
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {loading ? "Menyimpan..." : "Simpan Global"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
