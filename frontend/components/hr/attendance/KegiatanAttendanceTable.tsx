"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Trash2, Loader2, MapPinned, CheckCircle2, MapPin } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { deleteKegiatan } from "@/lib/action/hr/kegiatan";

const JENIS_LABEL: Record<string, string> = {
  SURVEY: "Survey",
  DINAS: "Dinas",
  RAPAT_LUAR: "Rapat Luar",
  KEGIATAN_LAIN: "Kegiatan Lain",
};

interface Props {
  data: any[];
  isLoading: boolean;
  onRefresh?: () => void;
}

export function KegiatanAttendanceTable({ data, isLoading, onRefresh }: Props) {
  const [selected, setSelected] = useState<any | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const formatJam = (d: string | null) => {
    if (!d) return "--:--";
    try {
      return new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false,
      }).format(new Date(d));
    } catch { return "--:--"; }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus data kegiatan ini?")) return;
    setIsDeleting(id);
    try {
      const res = await deleteKegiatan(id);
      if (res.success) { toast.success("Data kegiatan dihapus"); onRefresh?.(); }
      else toast.error(res.error || "Gagal menghapus");
    } finally {
      setIsDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
      </div>
    );
  }

  return (
    <>
      <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-white/20 shadow-sm overflow-hidden">
        <Table wrapperClassName="max-h-[calc(100vh-250px)] overflow-auto">
          <TableHeader className="bg-gray-50 sticky top-0 z-20 shadow-sm border-b-2 border-gray-200">
            <TableRow>
              <TableHead className="font-bold uppercase text-[10px] tracking-[0.1em]">Karyawan</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-[0.1em]">Jenis</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-[0.1em]">Mulai</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-[0.1em]">Selesai</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-[0.1em]">Durasi</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-[0.1em]">Status</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-[0.1em]">Laporan</TableHead>
              <TableHead className="text-right font-bold uppercase text-[10px] tracking-[0.1em]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground font-medium">
                  Tidak ada data kegiatan.
                </TableCell>
              </TableRow>
            ) : data.map((k) => (
              <TableRow key={k.id} className="hover:bg-white/60 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 border border-white shadow-sm">
                      <AvatarImage src={k.karyawan?.foto ? `${process.env.NEXT_PUBLIC_API_URL}${k.karyawan.foto}` : undefined} />
                      <AvatarFallback className="bg-sky-100 text-sky-700 font-black text-[10px]">
                        {k.karyawan?.namaLengkap?.substring(0, 2)?.toUpperCase() || "NA"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-xs text-gray-800 uppercase leading-none">{k.karyawan?.namaLengkap}</span>
                      <span className="text-[10px] font-medium text-muted-foreground uppercase leading-none">{k.karyawan?.nik}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs font-semibold text-sky-700 flex items-center gap-1.5 whitespace-nowrap">
                    <MapPinned className="h-3.5 w-3.5" /> {JENIS_LABEL[k.jenis] || k.jenis}
                  </span>
                </TableCell>
                <TableCell><span className="font-bold text-cyan-600 text-xs whitespace-nowrap">{formatJam(k.jamMulai)}</span></TableCell>
                <TableCell><span className="font-bold text-blue-600 text-xs whitespace-nowrap">{formatJam(k.jamSelesai)}</span></TableCell>
                <TableCell>
                  {k.status === "SELESAI" ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 border px-2 py-0.5 rounded-full font-bold text-[10px] whitespace-nowrap">
                      {k.durasiJam} JAM
                    </Badge>
                  ) : <span className="text-gray-300 text-xs">—</span>}
                </TableCell>
                <TableCell>
                  <Badge variant={k.status === "SELESAI" ? "secondary" : "default"} className="text-[10px]">
                    {k.status === "SELESAI" ? "Selesai" : "Berjalan"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {k.fotoKegiatan ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 whitespace-nowrap">
                      <CheckCircle2 className="h-3 w-3" /> Ada
                    </span>
                  ) : <span className="text-gray-300 text-xs">—</span>}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg h-7 px-2"
                      onClick={() => handleDelete(k.id)} disabled={isDeleting === k.id}>
                      {isDeleting === k.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="sm" className="hover:bg-cyan-500 hover:text-white rounded-lg h-7 px-2"
                      onClick={() => { setSelected(k); setDetailOpen(true); }}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPinned className="h-5 w-5 text-sky-600" /> Detail Kegiatan
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <p><b>Karyawan:</b> {selected.karyawan?.namaLengkap}</p>
              <p><b>Jenis:</b> {JENIS_LABEL[selected.jenis] || selected.jenis}</p>
              <p><b>Mulai:</b> {formatJam(selected.jamMulai)}</p>
              <p><b>Selesai:</b> {formatJam(selected.jamSelesai)}</p>
              <p><b>Durasi:</b> {selected.durasiJam} jam</p>
              {selected.keterangan && <p><b>Keterangan:</b> {selected.keterangan}</p>}
              {selected.latMulai && (
                <p className="flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="h-3 w-3" /> {selected.latMulai.toFixed(5)}, {selected.longMulai?.toFixed(5)}
                </p>
              )}
              <div className="grid grid-cols-2 gap-2">
                {selected.fotoKegiatan && (
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Foto Laporan</p>
                    <div className="relative h-40 rounded-xl overflow-hidden border">
                      <Image src={selected.fotoKegiatan} alt="laporan" fill className="object-cover" />
                    </div>
                  </div>
                )}
                {selected.fotoMulai && (
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Foto Mulai</p>
                    <div className="relative h-32 rounded-xl overflow-hidden border">
                      <Image src={selected.fotoMulai} alt="mulai" fill className="object-cover" />
                    </div>
                  </div>
                )}
                {selected.fotoSelesai && (
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Foto Selesai</p>
                    <div className="relative h-32 rounded-xl overflow-hidden border">
                      <Image src={selected.fotoSelesai} alt="selesai" fill className="object-cover" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
