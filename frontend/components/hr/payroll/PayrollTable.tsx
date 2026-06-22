"use client";

import React, { useState } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Eye, Trash2, Loader2, AlertTriangle, Calendar, Send, RotateCcw, Printer, Edit } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { deleteGaji, postGaji, voidGaji, publishGaji } from "@/lib/action/hr/payroll";
import { toast } from "sonner";
import PayrollSlipDialog from "./PayrollSlipDialog";
import { pdf } from "@react-pdf/renderer";
import PayrollSlipPdf from "./PayrollSlipPdf";
import ProcessPayrollDialog from "./ProcessPayrollDialog";

interface PayrollTableProps {
  gaji: any[];
  onRefresh?: () => void;
  periode?: string;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);

const PayrollTable: React.FC<PayrollTableProps> = ({ gaji, onRefresh, periode }) => {
  const [selectedSlip, setSelectedSlip] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPosting, setIsPosting] = useState<string | null>(null);
  const [isVoiding, setIsVoiding] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedGaji, setSelectedGaji] = useState<any>(null);
  const [isPublishing, setIsPublishing] = useState<string | null>(null);
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [voidingName, setVoidingName] = useState("");
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);

  const handlePost = async (id: string) => {
    setIsPosting(id);
    try {
      const res = await postGaji(id);
      if (res.success) {
        toast.success("Gaji berhasil di-posting");
        onRefresh?.();
      } else {
        toast.error(res.error || "Gagal posting gaji");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsPosting(null);
    }
  };

  const handleVoid = async () => {
    if (!voidingId) return;
    setIsVoiding(voidingId);
    try {
      const res = await voidGaji(voidingId, "Pembatalan oleh User");
      if (res.success) {
        toast.success("Posting gaji berhasil dibatalkan");
        onRefresh?.();
      } else {
        toast.error(res.error || "Gagal membatalkan posting");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsVoiding(null);
      setVoidingId(null);
    }
  };

  const handlePrint = async (g: any) => {
    setIsPrinting(g.id);
    try {
      const blob = await pdf(<PayrollSlipPdf gaji={g} />).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Gagal membuat PDF Slip Gaji");
    } finally {
      setIsPrinting(null);
    }
  };

  const handlePublish = async (id: string) => {
    setIsPublishing(id);
    try {
      const res = await publishGaji(id);
      if (res.success) {
        toast.success("Gaji berhasil dipublikasikan ke mobile");
        onRefresh?.();
      } else {
        toast.error(res.error || "Gagal publikasi gaji");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsPublishing(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const res = await deleteGaji(deletingId);
      if (res.success) {
        toast.success("Slip gaji berhasil dihapus");
        onRefresh?.();
      } else {
        toast.error(res.error || "Gagal menghapus slip gaji");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
      setDeletingName("");
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50/50">
          <TableRow>
            <TableHead className="font-bold text-gray-700">Karyawan</TableHead>
            <TableHead className="font-bold text-gray-700">Periode</TableHead>
            <TableHead className="font-bold text-gray-700">Gaji Pokok</TableHead>
            <TableHead className="font-bold text-gray-700">Tunjangan</TableHead>
            <TableHead className="font-bold text-gray-700">Potongan</TableHead>
            <TableHead className="font-bold text-gray-700">Lembur</TableHead>
            <TableHead className="font-bold text-gray-700 text-right">Gaji Bersih</TableHead>
            <TableHead className="font-bold text-gray-700">Status</TableHead>
            <TableHead className="text-right font-bold text-gray-700">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {gaji.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                Belum ada data penggajian untuk periode ini.
              </TableCell>
            </TableRow>
          ) : (
            gaji.map((g) => {
              const totalPotongan =
                (g.potongan || 0) + 
                (g.pajak || 0) + 
                (g.potonganPinjaman || 0) + 
                (g.potonganKasbon || 0) + 
                (g.potonganDpGaji || 0);
              return (
                <TableRow 
                  key={g.id} 
                  className={`transition-all duration-1000 ${
                    highlightedRowId === g.id 
                      ? "bg-amber-100/80 border-l-4 border-amber-500 shadow-inner" 
                      : "hover:bg-gray-50/50"
                  }`}
                >
                  <TableCell>
                    <p className="font-bold text-gray-800">{g.karyawan?.namaLengkap}</p>
                    <p className="text-xs text-gray-500">{g.karyawan?.nik} · {g.karyawan?.jabatan}</p>
                  </TableCell>
                  <TableCell className="text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      {format(new Date(g.periode), "MMMM yyyy", { locale: id })}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-700 font-medium">{fmt(g.gajiPokok)}</TableCell>
                  <TableCell>
                    <div className="text-emerald-600 font-medium">{fmt(g.tunjangan || 0)}</div>
                    <div className="flex flex-col gap-0.5 mt-1">
                      {(g.tunjanganJabatan > 0) && <div className="text-[10px] text-gray-400">Jabatan: {fmt(g.tunjanganJabatan)}</div>}
                      {(g.tunjanganKeluarga > 0) && <div className="text-[10px] text-gray-400">Keluarga: {fmt(g.tunjanganKeluarga)}</div>}
                      {(g.tunjanganMakan > 0) && <div className="text-[10px] text-gray-400">Makan: {fmt(g.tunjanganMakan)}</div>}
                      {(g.uangMakanLembur > 0) && <div className="text-[10px] text-gray-400">Makan Lembur: {fmt(g.uangMakanLembur)}</div>}
                      {(g.tunjanganTransport > 0) && <div className="text-[10px] text-gray-400">Transport: {fmt(g.tunjanganTransport)}</div>}
                      {(g.tunjanganKehadiran > 0) && <div className="text-[10px] text-gray-400">Kehadiran: {fmt(g.tunjanganKehadiran)}</div>}
                      {(g.tunjanganShift > 0) && <div className="text-[10px] text-gray-400">Shift: {fmt(g.tunjanganShift)}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-red-500 font-medium text-sm">{fmt(totalPotongan)}</div>
                    <div className="flex flex-col gap-0.5 mt-1">
                      {g.potongan > 0 && (
                        <div className="text-[10px] text-gray-400">Pot. Lain: {fmt(g.potongan)}</div>
                      )}
                      {g.potonganDpGaji > 0 && (
                        <div className="text-[10px] text-gray-400">DP Gaji: {fmt(g.potonganDpGaji)}</div>
                      )}
                      {g.potonganPinjaman > 0 && (
                        <div className="text-[10px] text-gray-400">Pinjaman: {fmt(g.potonganPinjaman)}</div>
                      )}
                      {g.potonganKasbon > 0 && (
                        <div className="text-[10px] text-gray-400">Kasbon: {fmt(g.potonganKasbon)}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {g.totalJamLembur > 0 ? (
                      <>
                        <div className="text-blue-600 font-medium">{fmt(g.upahLembur || 0)}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{g.totalJamLembur} jam</div>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-bold text-gray-900 text-base">
                    {fmt(g.total)}
                  </TableCell>
                  <TableCell>
                    {g.status === "PUBLISHED" ? (
                      <Badge className="bg-blue-100 text-blue-700 border-none rounded-md px-2 py-0.5 font-bold">
                        PUBLISHED
                      </Badge>
                    ) : g.status === "POSTED" ? (
                      <Badge className="bg-emerald-100 text-emerald-700 border-none rounded-md px-2 py-0.5 font-bold">
                        POSTED
                      </Badge>
                    ) : (
                      <Badge className="bg-orange-100 text-orange-700 border-none rounded-md px-2 py-0.5 font-bold">
                        DRAFT
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost" size="sm"
                        className="text-blue-600 hover:bg-blue-50 rounded-lg text-xs"
                        onClick={() => setSelectedSlip(g)}
                      >
                        <Eye className="h-3 w-3 mr-1" />Slip
                      </Button>
                      {g.status === "DRAFT" && (
                        <Button
                          variant="ghost" size="sm"
                          className="text-emerald-600 hover:bg-emerald-50 rounded-lg text-xs"
                          onClick={() => handlePost(g.id)}
                          disabled={isPosting === g.id}
                        >
                          {isPosting === g.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <><Send className="h-3 w-3 mr-1" />Posting</>
                          )}
                        </Button>
                      )}
                      {(g.status === "POSTED" || g.status === "DRAFT") && (
                        <Button
                          variant="ghost" size="sm"
                          className="text-blue-600 hover:bg-blue-50 rounded-lg text-xs"
                          onClick={() => handlePublish(g.id)}
                          disabled={isPublishing === g.id}
                          title="Publikasikan ke Mobile"
                        >
                          {isPublishing === g.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <><Send className="h-3 w-3 mr-1" />Publish</>
                          )}
                        </Button>
                      )}
                      {g.status === "POSTED" && (
                        <Button
                          variant="ghost" size="sm"
                          className="text-amber-600 hover:bg-amber-50 rounded-lg text-xs"
                          onClick={() => { setVoidingId(g.id); setVoidingName(g.karyawan?.namaLengkap || ""); }}
                          disabled={isVoiding === g.id}
                        >
                          {isVoiding === g.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <><RotateCcw className="h-3 w-3 mr-1" />Batal Post</>
                          )}
                        </Button>
                      )}
                      {g.status === "DRAFT" && (
                        <Button
                          variant="ghost" size="sm"
                          className="text-amber-600 hover:bg-amber-50 rounded-lg text-xs"
                          onClick={() => { setSelectedGaji(g); setEditDialogOpen(true); }}
                        >
                          <Edit className="h-3 w-3 mr-1" />Edit
                        </Button>
                      )}
                      <Button
                        variant="ghost" size="sm"
                        className="text-blue-600 hover:bg-blue-50 rounded-lg text-xs"
                        onClick={() => handlePrint(g)}
                        disabled={isPrinting === g.id}
                      >
                        {isPrinting === g.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <><Printer className="h-3 w-3 mr-1" />Cetak</>
                        )}
                      </Button>
                      <Button
                        variant="ghost" size="sm"
                        className="text-red-500 hover:bg-red-50 rounded-lg text-xs"
                        onClick={() => { setDeletingId(g.id); setDeletingName(g.karyawan?.namaLengkap || ""); }}
                        disabled={g.status === "POSTED"}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />Hapus
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* Slip Dialog */}
      {selectedSlip && (
        <PayrollSlipDialog
          gaji={selectedSlip}
          open={!!selectedSlip}
          onClose={() => setSelectedSlip(null)}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <AlertDialogTitle className="text-xl font-black text-gray-900">Hapus Slip Gaji?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-gray-600">
              Slip gaji atas nama <strong>{deletingName}</strong> akan dihapus permanen.
              Jurnal akuntansi yang sudah dibuat tidak akan ikut terhapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-gray-200">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menghapus...</> : "Ya, Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Void Confirmation */}
      <AlertDialog open={!!voidingId} onOpenChange={(open) => !open && setVoidingId(null)}>
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                <RotateCcw className="h-6 w-6 text-amber-600" />
              </div>
              <AlertDialogTitle className="text-xl font-black text-gray-900">Batalkan Posting Gaji?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-gray-600">
              Posting gaji atas nama <strong>{voidingName}</strong> akan dibatalkan.
              Jurnal akuntansi terkait akan di-VOID, dan status pinjaman/kasbon akan dikembalikan.
              Data gaji akan kembali menjadi status <strong>DRAFT</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-gray-200">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleVoid}
              disabled={!!isVoiding}
              className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isVoiding ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Memproses...</> : "Ya, Batalkan Posting"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
      <ProcessPayrollDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        gajiToEdit={selectedGaji}
        onSuccess={(id) => {
          if (id) {
            setHighlightedRowId(id);
            setTimeout(() => setHighlightedRowId(null), 10000);
          }
          onRefresh?.();
        }}
      />
    </>
  );
};

export default PayrollTable;
