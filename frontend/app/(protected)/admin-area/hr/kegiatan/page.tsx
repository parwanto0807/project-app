"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { LayoutProps } from "@/types/layout";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Trash2, Eye, MapPin, ClipboardList } from "lucide-react";
import { fetchAllKegiatan, deleteKegiatan } from "@/lib/action/hr/kegiatan";

const JENIS_LABEL: Record<string, string> = {
  SURVEY: "Survey / Tinjauan Lokasi",
  DINAS: "Dinas / Kunjungan",
  RAPAT_LUAR: "Rapat di Luar Kantor",
  KEGIATAN_LAIN: "Kegiatan Lain",
};

const formatWib = (d: string | null) =>
  d ? new Date(d).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "-";

export default function KegiatanAdminPage() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [filters, setFilters] = useState({ startDate: "", endDate: "", status: "" });

  const todayStr = () => new Date().toISOString().split("T")[0];
  const startStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  };

  const loadData = useCallback(async (f: any = filters) => {
    try {
      setIsLoading(true);
      const result = await fetchAllKegiatan({
        startDate: f.startDate || startStr(),
        endDate: f.endDate || todayStr(),
        ...(f.status ? { status: f.status } : {}),
      });
      setData(result.kegiatan || []);
      if (result.error) toast.error(result.error);
    } catch (e) {
      console.error(e);
      toast.error("Gagal memuat data kegiatan");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData({ startDate: startStr(), endDate: todayStr() }); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus data kegiatan ini?")) return;
    const res = await deleteKegiatan(id);
    if (res.success) {
      toast.success("Kegiatan dihapus");
      loadData();
    } else {
      toast.error(res.error);
    }
  };

  const totalJam = data.filter((k) => k.status === "SELESAI").reduce((s, k) => s + (k.durasiJam || 0), 0);

  const layoutProps: LayoutProps = {
    title: "Monitoring Kegiatan Lapangan",
    role: "admin",
    children: (
      <div className="flex-1 space-y-8 p-4 pt-6 md:p-8 min-h-screen bg-gray-50/50">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Badge variant="outline" className="hover:bg-cyan-50 text-cyan-700 border-cyan-200">
                  <Link href="/admin-area">Dashboard</Link>
                </Badge>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <Badge variant="outline" className="text-gray-500 border-gray-200">
                <BreadcrumbPage>HR Management</BreadcrumbPage>
              </Badge>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <Badge variant="secondary" className="bg-violet-500 text-white border-none">
                <BreadcrumbPage>Monitoring Kegiatan Lapangan</BreadcrumbPage>
              </Badge>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight text-gray-900 uppercase">Monitoring Kegiatan Lapangan</h1>
            <p className="text-muted-foreground font-medium">
              Absensi survey / dinas / kegiatan lapangan. Jam kegiatan otomatis terakumulasi ke penggajian.
            </p>
          </div>

          {/* Stat */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="p-4">
              <p className="text-[10px] font-bold uppercase text-slate-400">Total Kegiatan</p>
              <p className="text-2xl font-black">{data.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-[10px] font-bold uppercase text-slate-400">Sedang Berjalan</p>
              <p className="text-2xl font-black text-violet-600">{data.filter((k) => k.status === "BERJALAN").length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-[10px] font-bold uppercase text-slate-400">Total Jam Terakumulasi</p>
              <p className="text-2xl font-black text-emerald-600">{totalJam.toFixed(1)} jam</p>
            </Card>
          </div>

          {/* Filter */}
          <div className="flex flex-wrap gap-2 items-center">
            <input
              type="date"
              value={filters.startDate || startStr()}
              onChange={(e) => setFilters((p) => ({ ...p, startDate: e.target.value }))}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900" 
            />
            <input
              type="date"
              value={filters.endDate || todayStr()}
              onChange={(e) => setFilters((p) => ({ ...p, endDate: e.target.value }))}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900" 
            />
            <select
              value={filters.status}
              onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900" 
            >
              <option value="">Semua Status</option>
              <option value="BERJALAN">Berjalan</option>
              <option value="SELESAI">Selesai</option>
            </select>
            <Button onClick={() => loadData(filters)} className="h-10">Terapkan</Button>
            <Button
              variant="outline"
              onClick={() => { setFilters({ startDate: "", endDate: "", status: "" }); loadData({ startDate: startStr(), endDate: todayStr() }); }}
              className="h-10"
            >
              Reset
            </Button>
          </div>

          {/* Table */}
          <Card className="overflow-x-auto bg-white text-slate-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="p-3">Karyawan</th>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Jenis</th>
                  <th className="p-3">Jam Mulai</th>
                  <th className="p-3">Jam Selesai</th>
                  <th className="p-3">Durasi</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={8} className="p-6 text-center"><Loader2 className="mx-auto animate-spin text-violet-600" /></td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={8} className="p-6 text-center text-slate-400">Tidak ada data</td></tr>
                ) : data.map((k) => (
                  <tr key={k.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-900">{k.karyawan?.namaLengkap || "-"}</td>
                    <td className="p-3">{new Date(k.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    <td className="p-3">{JENIS_LABEL[k.jenis] || k.jenis}</td>
                    <td className="p-3">{formatWib(k.jamMulai)}</td>
                    <td className="p-3">{formatWib(k.jamSelesai)}</td>
                    <td className="p-3 font-bold text-slate-900">{k.status === "SELESAI" ? `${k.durasiJam} jam` : "-"}</td>
                    <td className="p-3">
                      <Badge variant={k.status === "SELESAI" ? "secondary" : "default"} className="text-[10px]">
                        {k.status === "SELESAI" ? "Selesai" : "Berjalan"}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => { setSelected(k); setIsDetailOpen(true); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-rose-500" onClick={() => handleDelete(k.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        {/* Detail dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-violet-600" />
                Detail Kegiatan
              </DialogTitle>
            </DialogHeader>
            {selected && (
              <div className="space-y-3 text-sm">
                <p><b>Karyawan:</b> {selected.karyawan?.namaLengkap}</p>
                <p><b>Jenis:</b> {JENIS_LABEL[selected.jenis] || selected.jenis}</p>
                <p><b>Mulai:</b> {formatWib(selected.jamMulai)}</p>
                <p><b>Selesai:</b> {formatWib(selected.jamSelesai)}</p>
                <p><b>Durasi:</b> {selected.durasiJam} jam</p>
                {selected.keterangan && <p><b>Keterangan:</b> {selected.keterangan}</p>}
                {selected.latMulai && (
                  <p className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="h-3 w-3" />
                    {selected.latMulai.toFixed(5)}, {selected.longMulai?.toFixed(5)}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {selected.fotoKegiatan && (
                    <div className="col-span-2">
                      <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Foto Laporan Kegiatan</p>
                      <div className="relative h-40 rounded-xl overflow-hidden border">
                        <Image src={selected.fotoKegiatan} alt="kegiatan" fill className="object-cover" />
                      </div>
                    </div>
                  )}
                  {selected.fotoMulai && (
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Foto Mulai</p>
                      <div className="relative h-36 rounded-xl overflow-hidden border">
                        <Image src={selected.fotoMulai} alt="mulai" fill className="object-cover" />
                      </div>
                    </div>
                  )}
                  {selected.fotoSelesai && (
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Foto Selesai</p>
                      <div className="relative h-36 rounded-xl overflow-hidden border">
                        <Image src={selected.fotoSelesai} alt="selesai" fill className="object-cover" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    ),
  };

  return <AdminLayout {...layoutProps} />;
}