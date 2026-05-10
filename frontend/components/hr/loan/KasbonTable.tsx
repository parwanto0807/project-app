
"use client";

import React, { useState, useEffect } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2, XCircle, Trash2, Loader2, AlertTriangle,
  Calendar, CheckCheck, SendHorizontal, Info, Pencil,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  approveKasbon, postKasbon, rejectKasbon, settleKasbon,
  deleteKasbon, updateKasbon, fetchAllEmployees,
} from "@/lib/action/hr/loans";
import { toast } from "sonner";

const CASH_ACCOUNT_OPTIONS = [
  { label: "Kas Peti Cash (1-10001)", value: "PETTY_CASH" },
  { label: "Bank BRI KC. Cikarang (1-10002)", value: "BANK_BRI_CIKARANG" },
  { label: "Bank BRI KC. Harapan Indah (1-10003)", value: "BANK_BRI_HARAPAN_INDAH" },
  { label: "Bank BRI KC. Lebak Bulus (1-10004)", value: "BANK_BRI_LEBAK_BULUS" },
  { label: "Bank BRI KC. Tambun (1-10005)", value: "BANK_BRI_TAMBUN" },
  { label: "Bank BRI KC. Karawang (1-10006)", value: "BANK_BRI_KARAWANG" },
];

const MONTH_OPTIONS = Array.from({ length: 6 }, (_, i) => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + i + 1);
  return {
    label: d.toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
    value: d.toISOString().split("T")[0],
  };
});

interface KasbonTableProps {
  kasbon: any[];
  onRefresh?: () => void;
}

const KasbonTable: React.FC<KasbonTableProps> = ({ kasbon, onRefresh }) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Reject
  const [rejectTarget, setRejectTarget] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState("");

  // Settle
  const [settlingId, setSettlingId] = useState<string | null>(null);

  // Post GL
  const [postingKasbon, setPostingKasbon] = useState<any | null>(null);
  const [selectedCashKey, setSelectedCashKey] = useState("PETTY_CASH");

  // Edit
  const [editingKasbon, setEditingKasbon] = useState<any | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [editForm, setEditForm] = useState({
    jumlah: "",
    keperluan: "",
    bulanPotong: "",
    catatan: "",
  });

  useEffect(() => {
    if (editingKasbon) {
      setEditForm({
        jumlah: String(editingKasbon.jumlah || ""),
        keperluan: editingKasbon.keperluan || "",
        bulanPotong: editingKasbon.bulanPotong
          ? new Date(editingKasbon.bulanPotong).toISOString().split("T")[0]
          : "",
        catatan: editingKasbon.catatan || "",
      });
      fetchAllEmployees().then(setEmployees);
    }
  }, [editingKasbon]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  const getSelectedEmployee = () =>
    employees.find((e) => e.id === editingKasbon?.karyawanId);

  const maxKasbon = () => {
    const emp = getSelectedEmployee();
    return emp?.gajiPokok ? emp.gajiPokok * 0.5 : null;
  };

  const isOverLimit = () => {
    const max = maxKasbon();
    return max !== null && parseFloat(editForm.jumlah || "0") > max;
  };

  const getStatusBadge = (status: string, isPosted?: boolean) => {
    switch (status) {
      case "PENDING":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200 border hover:bg-amber-50">Menunggu</Badge>;
      case "APPROVED":
        return (
          <div className="flex flex-col gap-0.5">
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 border hover:bg-blue-50">Disetujui</Badge>
            {isPosted
              ? <span className="text-[10px] text-emerald-600 font-medium">✓ Terposting GL</span>
              : <span className="text-[10px] text-amber-500 font-medium">⚠ Belum Posting</span>}
          </div>
        );
      case "REJECTED":
        return <Badge className="bg-red-50 text-red-700 border-red-200 border hover:bg-red-50">Ditolak</Badge>;
      case "SETTLED":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 border hover:bg-emerald-50">Lunas</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleApprove = async (kasbonId: string) => {
    setLoadingId(kasbonId);
    try {
      const res = await approveKasbon(kasbonId);
      if (res.success) {
        toast.success("Kasbon disetujui. Lakukan Posting GL untuk mencatat ke jurnal.");
        onRefresh?.();
      } else {
        toast.error(res.error || "Gagal menyetujui kasbon");
      }
    } catch { toast.error("Terjadi kesalahan sistem"); }
    finally { setLoadingId(null); }
  };

  const handlePost = async () => {
    if (!postingKasbon) return;
    setLoadingId(postingKasbon.id);
    try {
      const res = await postKasbon(postingKasbon.id, selectedCashKey);
      if (res.success) {
        toast.success("Kasbon berhasil di-posting ke Jurnal Umum.", { duration: 5000 });
        onRefresh?.();
      } else {
        toast.error(res.error || "Gagal posting kasbon");
      }
    } catch { toast.error("Terjadi kesalahan sistem"); }
    finally {
      setLoadingId(null);
      setPostingKasbon(null);
      setSelectedCashKey("PETTY_CASH");
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) { toast.error("Alasan penolakan wajib diisi"); return; }
    setLoadingId(rejectTarget.id);
    try {
      const res = await rejectKasbon(rejectTarget.id, rejectReason);
      if (res.success) {
        toast.success(
          rejectTarget.status === "APPROVED"
            ? "Persetujuan dibatalkan. Kasbon kembali ke status Ditolak."
            : "Kasbon berhasil ditolak."
        );
        onRefresh?.();
      } else {
        toast.error(res.error || "Gagal menolak kasbon");
      }
    } catch { toast.error("Terjadi kesalahan sistem"); }
    finally {
      setLoadingId(null);
      setRejectTarget(null);
      setRejectReason("");
    }
  };

  const handleSettle = async () => {
    if (!settlingId) return;
    setLoadingId(settlingId);
    try {
      const res = await settleKasbon(settlingId);
      if (res.success) {
        toast.success("Kasbon ditandai Lunas. Jurnal pelunasan otomatis dibuat.");
        onRefresh?.();
      } else {
        toast.error(res.error || "Gagal menyelesaikan kasbon");
      }
    } catch { toast.error("Terjadi kesalahan sistem"); }
    finally { setLoadingId(null); setSettlingId(null); }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setLoadingId(deletingId);
    try {
      const res = await deleteKasbon(deletingId);
      if (res.success) {
        toast.success("Kasbon berhasil dihapus");
        onRefresh?.();
      } else {
        toast.error(res.error || "Gagal menghapus kasbon");
      }
    } catch { toast.error("Terjadi kesalahan sistem"); }
    finally { setLoadingId(null); setDeletingId(null); setDeletingName(""); }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKasbon) return;
    setLoadingId(editingKasbon.id);
    try {
      const res = await updateKasbon(editingKasbon.id, editForm);
      if (res.success) {
        if (res.warning) toast.warning(res.warning, { duration: 6000 });
        else toast.success("Kasbon berhasil diperbarui");
        setEditingKasbon(null);
        onRefresh?.();
      } else {
        toast.error(res.error || "Gagal memperbarui kasbon");
      }
    } catch { toast.error("Terjadi kesalahan sistem"); }
    finally { setLoadingId(null); }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50/50">
          <TableRow>
            <TableHead className="font-bold text-gray-700">Karyawan</TableHead>
            <TableHead className="font-bold text-gray-700">Tgl Pengajuan</TableHead>
            <TableHead className="font-bold text-gray-700">Jumlah</TableHead>
            <TableHead className="font-bold text-gray-700">Bulan Potong</TableHead>
            <TableHead className="font-bold text-gray-700">Keperluan</TableHead>
            <TableHead className="font-bold text-gray-700">Status</TableHead>
            <TableHead className="text-right font-bold text-gray-700">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {kasbon.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                Belum ada data kasbon.
              </TableCell>
            </TableRow>
          ) : (
            kasbon.map((k) => (
              <TableRow key={k.id} className="hover:bg-gray-50/50 transition-colors">
                <TableCell>
                  <p className="font-bold text-gray-800">{k.karyawan?.namaLengkap}</p>
                  <p className="text-xs text-gray-500">{k.karyawan?.nik}</p>
                </TableCell>
                <TableCell className="text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    {format(new Date(k.tanggal), "dd MMM yyyy", { locale: id })}
                  </div>
                </TableCell>
                <TableCell className="font-semibold text-gray-800">
                  {formatCurrency(Number(k.jumlah))}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {k.bulanPotong
                    ? format(new Date(k.bulanPotong), "MMMM yyyy", { locale: id })
                    : <span className="text-gray-400 italic text-xs">—</span>}
                </TableCell>
                <TableCell className="text-sm text-gray-600 max-w-[160px] truncate">
                  {k.keperluan || <span className="text-gray-400 italic text-xs">—</span>}
                </TableCell>
                <TableCell>
                  <div className="space-y-0.5">
                    {getStatusBadge(k.status, k.isPosted)}
                    {k.status === "REJECTED" && k.rejectedReason && (
                      <p className="text-[10px] text-red-500 max-w-[130px] truncate" title={k.rejectedReason}>
                        {k.rejectedReason}
                      </p>
                    )}
                    {k.status === "APPROVED" && k.approvedBy && (
                      <p className="text-[10px] text-blue-500">oleh {k.approvedBy}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1 flex-wrap">

                    {/* ── PENDING: Setujui | Edit | Tolak | Hapus ── */}
                    {k.status === "PENDING" && (
                      <>
                        <Button variant="ghost" size="sm"
                          className="text-emerald-600 hover:bg-emerald-50 rounded-lg text-xs"
                          disabled={loadingId === k.id}
                          onClick={() => handleApprove(k.id)}>
                          {loadingId === k.id
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <><CheckCircle2 className="h-3 w-3 mr-1" />Setujui</>}
                        </Button>
                        <Button variant="ghost" size="sm"
                          className="text-blue-600 hover:bg-blue-50 rounded-lg text-xs"
                          disabled={loadingId === k.id}
                          onClick={() => setEditingKasbon(k)}>
                          <Pencil className="h-3 w-3 mr-1" />Edit
                        </Button>
                        <Button variant="ghost" size="sm"
                          className="text-red-500 hover:bg-red-50 rounded-lg text-xs"
                          disabled={loadingId === k.id}
                          onClick={() => { setRejectTarget(k); setRejectReason(""); }}>
                          <XCircle className="h-3 w-3 mr-1" />Tolak
                        </Button>
                        <Button variant="ghost" size="sm"
                          className="text-gray-400 hover:bg-gray-100 rounded-lg text-xs"
                          disabled={loadingId === k.id}
                          onClick={() => { setDeletingId(k.id); setDeletingName(k.karyawan?.namaLengkap || ""); }}>
                          <Trash2 className="h-3 w-3 mr-1" />Hapus
                        </Button>
                      </>
                    )}

                    {/* ── APPROVED: Posting GL (jika belum) | Batalkan (jika belum posting) | Settled ── */}
                    {k.status === "APPROVED" && (
                      <>
                        {!k.isPosted && (
                          <>
                            <Button variant="ghost" size="sm"
                              className="text-emerald-600 hover:bg-emerald-50 rounded-lg text-xs font-semibold"
                              disabled={loadingId === k.id}
                              onClick={() => { setPostingKasbon(k); setSelectedCashKey("PETTY_CASH"); }}>
                              {loadingId === k.id
                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                : <><SendHorizontal className="h-3 w-3 mr-1" />Posting GL</>}
                            </Button>
                            <Button variant="ghost" size="sm"
                              className="text-orange-500 hover:bg-orange-50 rounded-lg text-xs"
                              disabled={loadingId === k.id}
                              onClick={() => { setRejectTarget(k); setRejectReason(""); }}>
                              <XCircle className="h-3 w-3 mr-1" />Batalkan
                            </Button>
                          </>
                        )}
                        {k.isPosted && (
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 mr-1">
                            ✓ GL Tercatat
                          </span>
                        )}
                        <Button variant="ghost" size="sm"
                          className="text-blue-600 hover:bg-blue-50 rounded-lg text-xs"
                          disabled={loadingId === k.id}
                          onClick={() => setSettlingId(k.id)}>
                          {loadingId === k.id
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <><CheckCheck className="h-3 w-3 mr-1" />Settled</>}
                        </Button>
                      </>
                    )}

                    {/* ── REJECTED / SETTLED: read-only ── */}
                    {(k.status === "REJECTED" || k.status === "SETTLED") && (
                      <span className="text-xs text-gray-400 italic pr-2">
                        {k.status === "SETTLED"
                          ? k.tanggalPenyelesaian
                            ? format(new Date(k.tanggalPenyelesaian), "dd/MM/yy")
                            : "Selesai"
                          : "Ditolak"}
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* ══ Edit Dialog (PENDING only) ══ */}
      <Dialog open={!!editingKasbon} onOpenChange={(open) => !open && setEditingKasbon(null)}>
        <DialogContent className="sm:max-w-[460px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl font-bold">
              <Pencil className="mr-2 h-5 w-5 text-blue-600" />
              Edit Kasbon
            </DialogTitle>
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3 mt-1">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                Karyawan: <strong>{editingKasbon?.karyawan?.namaLengkap}</strong>
                {maxKasbon() && (
                  <> — Maks. Kasbon:{" "}
                    <strong>{formatCurrency(maxKasbon()!)}</strong>
                  </>
                )}
              </p>
            </div>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-3">
            <div className="space-y-2">
              <Label className="text-gray-600">Jumlah Kasbon (IDR) *</Label>
              <Input
                type="number"
                placeholder="0"
                className={`rounded-xl ${isOverLimit() ? "border-red-400 bg-red-50" : "border-gray-200"}`}
                value={editForm.jumlah}
                onChange={(e) => setEditForm({ ...editForm, jumlah: e.target.value })}
              />
              {isOverLimit() && (
                <div className="flex items-center gap-1 text-xs text-red-600">
                  <AlertTriangle className="h-3 w-3" />
                  Melebihi 50% gaji pokok. Tetap bisa disimpan namun perlu persetujuan khusus.
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-gray-600">Bulan Pelunasan (Potong Gaji)</Label>
              <Select
                value={editForm.bulanPotong}
                onValueChange={(val) => setEditForm({ ...editForm, bulanPotong: val })}>
                <SelectTrigger className="rounded-xl border-gray-200">
                  <SelectValue placeholder="Pilih bulan gajian" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {MONTH_OPTIONS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-600">Keperluan / Alasan</Label>
              <Textarea
                placeholder="Jelaskan keperluan kasbon..."
                className="rounded-xl border-gray-200 min-h-[70px]"
                value={editForm.keperluan}
                onChange={(e) => setEditForm({ ...editForm, keperluan: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-600">Catatan Admin</Label>
              <Input
                type="text"
                placeholder="Catatan tambahan..."
                className="rounded-xl border-gray-200"
                value={editForm.catatan}
                onChange={(e) => setEditForm({ ...editForm, catatan: e.target.value })}
              />
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" className="rounded-xl flex-1"
                onClick={() => setEditingKasbon(null)}>Batal</Button>
              <Button type="submit"
                className="rounded-xl bg-blue-600 hover:bg-blue-700 flex-1 text-white shadow-md shadow-blue-200"
                disabled={loadingId === editingKasbon?.id}>
                {loadingId === editingKasbon?.id
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</>
                  : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ══ Posting GL Dialog ══ */}
      <AlertDialog open={!!postingKasbon} onOpenChange={(open) => !open && setPostingKasbon(null)}>
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl sm:max-w-[460px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-gray-900 flex items-center gap-2">
              <SendHorizontal className="h-5 w-5 text-emerald-600" />
              Posting Kasbon ke Jurnal Umum
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 mt-2">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-sm text-emerald-800">
                  <p className="font-semibold mb-1">Jurnal yang akan dibuat:</p>
                  <div className="font-mono text-xs space-y-1 text-emerald-700">
                    <p>Dr. Piutang Karyawan Lainnya (1-10303)</p>
                    <p className="pl-6">Cr. Kas/Bank yang dipilih</p>
                  </div>
                  <p className="mt-2 font-bold text-base">
                    {postingKasbon ? formatCurrency(Number(postingKasbon.jumlah)) : "—"}
                  </p>
                </div>
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700">
                    Pilih akun sumber dana yang digunakan untuk mencairkan kasbon ini.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700 font-semibold text-sm">Sumber Dana (Kas/Bank)</Label>
                  <Select value={selectedCashKey} onValueChange={setSelectedCashKey}>
                    <SelectTrigger className="rounded-xl border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {CASH_ACCOUNT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel className="rounded-xl border-gray-200">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handlePost} disabled={!!loadingId}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-100">
              {loadingId ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Memproses...</> : "Ya, Posting Sekarang"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ══ Reject / Batalkan Dialog ══ */}
      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent className="sm:max-w-[420px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-lg font-bold text-red-700">
              <XCircle className="mr-2 h-5 w-5" />
              {rejectTarget?.status === "APPROVED" ? "Batalkan Persetujuan Kasbon" : "Tolak Kasbon"}
            </DialogTitle>
          </DialogHeader>
          {rejectTarget?.status === "APPROVED" && (
            <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-xl p-3">
              <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-orange-700">
                Kasbon ini sudah <strong>Disetujui</strong> namun belum di-posting ke GL.
                Membatalkan akan mengubah status menjadi <strong>Ditolak</strong>.
              </p>
            </div>
          )}
          <div className="py-3 space-y-2">
            <Label className="text-gray-600">
              {rejectTarget?.status === "APPROVED" ? "Alasan Pembatalan *" : "Alasan Penolakan *"}
            </Label>
            <Input
              placeholder="Masukkan alasan..."
              className="rounded-xl border-gray-200"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl flex-1"
              onClick={() => { setRejectTarget(null); setRejectReason(""); }}>Batal</Button>
            <Button
              className={`rounded-xl flex-1 text-white ${rejectTarget?.status === "APPROVED" ? "bg-orange-500 hover:bg-orange-600" : "bg-red-600 hover:bg-red-700"}`}
              disabled={!!loadingId}
              onClick={handleReject}>
              {loadingId
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : rejectTarget?.status === "APPROVED" ? "Batalkan Persetujuan" : "Tolak Kasbon"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ Settle Confirmation ══ */}
      <AlertDialog open={!!settlingId} onOpenChange={(open) => !open && setSettlingId(null)}>
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-gray-900">Konfirmasi Pelunasan Kasbon</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Tandai kasbon ini sebagai <strong>Settled</strong>? Kasbon dinyatakan lunas via potong gaji.
              Jurnal pelunasan otomatis dibuat jika kasbon sudah di-posting sebelumnya.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-gray-200">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleSettle} disabled={!!loadingId}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100">
              {loadingId ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Memproses...</> : "Ya, Tandai Lunas"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ══ Delete Confirmation ══ */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <AlertDialogTitle className="text-xl font-black text-gray-900">Hapus Kasbon?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-gray-600">
              Kasbon atas nama <strong>{deletingName}</strong> akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-gray-200">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={!!loadingId}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-100">
              {loadingId ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menghapus...</> : "Ya, Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default KasbonTable;
