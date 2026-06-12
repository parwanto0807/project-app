"use client";

import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Send, Trash2, Ban, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { postDisbursement, voidDisbursement, deleteDisbursement, getPreviewMealAllowance } from "@/lib/action/hr/mealAllowance";
import { toast } from "sonner";
import { pdf } from "@react-pdf/renderer";
import MealAllowanceSlipPdf from "./MealAllowanceSlipPdf";

interface MealAllowanceTableProps {
  disbursements: any[];
  onRefresh: () => void;
}

export default function MealAllowanceTable({ disbursements, onRefresh }: MealAllowanceTableProps) {
  const fmt = (num: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailHarian, setDetailHarian] = useState<any[]>([]);

  const handleViewDetail = async (d: any) => {
    setSelectedDetail(d);
    setDetailOpen(true);
    setLoadingDetail(true);
    setDetailHarian([]);
    try {
      const res = await getPreviewMealAllowance(d.karyawanId, d.periodeBulan, d.siklus);
      if (res && res.kalkulasi?.detailHarian) {
        setDetailHarian(res.kalkulasi.detailHarian);
      } else if (res && res.results && res.results[0]?.kalkulasi?.detailHarian) {
        setDetailHarian(res.results[0].kalkulasi.detailHarian);
      }
    } catch (error) {
      console.error(error);
    }
    setLoadingDetail(false);
  };

  const handlePost = async (id: string) => {
    if (!confirm("Posting pencairan ini? Jurnal akuntansi akan dibuat.")) return;
    setLoadingId(id);
    const res = await postDisbursement(id);
    setLoadingId(null);
    if (res.success) {
      toast.success("Berhasil di-posting");
      onRefresh();
    } else {
      toast.error(res.error);
    }
  };

  const handleVoid = async (id: string) => {
    if (!confirm("Batal (VOID) pencairan ini? Status akan kembali DRAFT.")) return;
    setLoadingId(id);
    const res = await voidDisbursement(id);
    setLoadingId(null);
    if (res.success) {
      toast.success("Berhasil di-VOID");
      onRefresh();
    } else {
      toast.error(res.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus draft pencairan ini secara permanen?")) return;
    setLoadingId(id);
    const res = await deleteDisbursement(id);
    setLoadingId(null);
    if (res.success) {
      toast.success("Berhasil dihapus");
      onRefresh();
    } else {
      toast.error(res.error);
    }
  };

  const handlePrintSlip = async (d: any) => {
    try {
      const blob = await pdf(<MealAllowanceSlipPdf data={d} />).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (error) {
      toast.error("Gagal mencetak slip");
    }
  };

  if (disbursements.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
        <p className="text-gray-500">Belum ada data pencairan uang makan untuk periode ini.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="w-[200px]">Karyawan</TableHead>
              <TableHead>Periode</TableHead>
              <TableHead>Kehadiran</TableHead>
              <TableHead>Lembur</TableHead>
              <TableHead className="text-right">UM Harian</TableHead>
              <TableHead className="text-right">UM Lembur</TableHead>
              <TableHead className="text-right">Total Pencairan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {disbursements.map((d) => (
              <TableRow key={d.id} className="hover:bg-orange-50/30 transition-colors">
                <TableCell>
                  <div className="font-medium text-gray-900">{d.karyawan.namaLengkap}</div>
                  <div className="text-xs text-gray-500">{d.karyawan.nik}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{d.periodeBulan} (Siklus {d.siklus})</div>
                  <div className="text-[10px] text-gray-500">
                    {format(new Date(d.cutOffStart), "dd MMM", { locale: id })} - {format(new Date(d.cutOffEnd), "dd MMM yyyy", { locale: id })}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium">{d.totalHariHadir} Hari</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium">{d.totalJamLembur} Jam</span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="text-sm font-medium text-gray-700">{fmt(d.nominalUangMakan)}</div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="text-sm font-medium text-gray-700">{fmt(d.nominalUangMakanLembur)}</div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="text-sm font-bold text-orange-600">{fmt(d.totalPencairan)}</div>
                </TableCell>
                <TableCell>
                  {d.status === "DRAFT" && <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">DRAFT</Badge>}
                  {d.status === "POSTED" && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">POSTED</Badge>}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetail(d)}
                      className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      title="Lihat Detail"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePrintSlip(d)}
                      className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      title="Cetak Slip"
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                    
                    {d.status === "DRAFT" && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePost(d.id)}
                          disabled={loadingId === d.id}
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="Posting Jurnal"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(d.id)}
                          disabled={loadingId === d.id}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}

                    {d.status === "POSTED" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVoid(d.id)}
                        disabled={loadingId === d.id}
                        className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        title="Void / Batal"
                      >
                        <Ban className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-5xl sm:max-w-5xl md:max-w-6xl w-[95vw] sm:w-full max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Detail Pencairan Uang Makan</DialogTitle>
          </DialogHeader>
          {selectedDetail && (
            <div className="space-y-4 py-4 flex-1 flex flex-col overflow-hidden">
              <div className="flex justify-between pb-2 border-b">
                <span className="text-gray-500">Nama Karyawan</span>
                <span className="font-medium">{selectedDetail.karyawan?.namaLengkap}</span>
              </div>
              <div className="flex justify-between pb-2 border-b">
                <span className="text-gray-500">Total Hari Hadir</span>
                <span className="font-medium">{selectedDetail.totalHariHadir} Hari</span>
              </div>
              <div className="flex justify-between pb-2 border-b">
                <span className="text-gray-500">Total Jam Lembur</span>
                <span className="font-medium">{selectedDetail.totalJamLembur} Jam</span>
              </div>
              <div className="flex justify-between pb-2 border-b">
                <span className="text-gray-500">Nominal UM Harian ({selectedDetail.totalHariHadir} Kali)</span>
                <span className="font-medium">{fmt(selectedDetail.nominalUangMakan)}</span>
              </div>
              <div className="flex justify-between pb-2 border-b">
                <span className="text-gray-500">Nominal UM Lembur ({selectedDetail.nominalUangMakanLembur > 0 ? Math.round(selectedDetail.nominalUangMakanLembur / (selectedDetail.karyawan?.uangMakanLembur || 30000)) : 0} Kali)</span>
                <span className="font-medium">{fmt(selectedDetail.nominalUangMakanLembur)}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="font-bold text-gray-900">Total Pencairan</span>
                <span className="font-bold text-orange-600 text-lg">{fmt(selectedDetail.totalPencairan)}</span>
              </div>

              <div className="mt-6 pt-4 border-t flex-1 overflow-hidden flex flex-col">
                <h4 className="text-sm font-semibold mb-3">Rincian Per Hari</h4>
                {loadingDetail ? (
                  <div className="flex justify-center p-4">
                    <span className="text-sm text-gray-500 animate-pulse">Memuat rincian absensi...</span>
                  </div>
                ) : detailHarian.length > 0 ? (
                  <div className="flex-1 overflow-y-auto border rounded-md min-h-[300px] mb-4">
                    <Table>
                      <TableHeader className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                        <TableRow>
                          <TableHead className="text-sm font-semibold">Tanggal</TableHead>
                          <TableHead className="text-sm font-semibold">Status</TableHead>
                          <TableHead className="text-sm font-semibold text-center">Masuk</TableHead>
                          <TableHead className="text-sm font-semibold text-center">Keluar</TableHead>
                          <TableHead className="text-sm font-semibold text-right">Jam Kerja</TableHead>
                          <TableHead className="text-sm font-semibold text-right">Lembur</TableHead>
                          <TableHead className="text-sm font-semibold text-right">UM Harian</TableHead>
                          <TableHead className="text-sm font-semibold text-right">UM Lembur</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailHarian.map((dh, i) => (
                          <TableRow key={i} className="hover:bg-gray-50">
                            <TableCell className="text-sm whitespace-nowrap">{format(new Date(dh.tanggal), "dd MMM yyyy", { locale: id })}</TableCell>
                            <TableCell className="text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${dh.status === "HADIR" ? "bg-emerald-50 text-emerald-600" : dh.status === "CUTI" || dh.status === "IZIN" || dh.status === "SAKIT" ? "bg-amber-50 text-amber-600" : dh.status === "TERLAMBAT" ? "bg-orange-50 text-orange-600" : "bg-red-50 text-red-600"}`}>
                                {dh.status}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-center font-medium text-gray-700">{dh.jamMasuk ? format(new Date(dh.jamMasuk), "HH:mm") : "-"}</TableCell>
                            <TableCell className="text-sm text-center font-medium text-gray-700">{dh.jamKeluar ? format(new Date(dh.jamKeluar), "HH:mm") : "-"}</TableCell>
                            <TableCell className="text-sm text-right font-semibold text-gray-800">{dh.jamKerja > 0 ? `${dh.jamKerja}j` : <span className="text-gray-400">-</span>}</TableCell>
                            <TableCell className="text-sm text-right font-semibold text-blue-600">{dh.jamLembur > 0 ? `${dh.jamLembur}j` : <span className="text-gray-400">-</span>}</TableCell>
                            <TableCell className="text-sm text-right font-medium text-gray-900">{dh.uangMakanHariIni > 0 ? fmt(dh.uangMakanHariIni) : <span className="text-gray-400">-</span>}</TableCell>
                            <TableCell className="text-sm text-right font-medium text-orange-600">{dh.uangMakanLemburHariIni > 0 ? fmt(dh.uangMakanLemburHariIni) : <span className="text-gray-400">-</span>}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-sm text-center text-gray-500 py-4 border rounded-md bg-gray-50">Data rincian tidak tersedia</div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
