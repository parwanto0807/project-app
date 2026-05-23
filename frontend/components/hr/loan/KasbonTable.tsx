
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

const MONTH_OPTIONS = Array.from({ length: 8 }, (_, i) => {
  const d = new Date();
  d.setDate(1);
  // Mulai dari 1 bulan ke belakang (i = 0 berarti bulan lalu, i = 1 berarti bulan ini, dst)
  d.setMonth(d.getMonth() + i - 1);
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
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);

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

  // ── Grouping Logic ────────────────────────────────────────────────────────
  const groupedKasbon = kasbon.reduce((acc, item) => {
    const empId = item.karyawan?.id;
    if (!empId) return acc;
    if (!acc[empId]) {
      acc[empId] = {
        employee: item.karyawan,
        total: 0,
        pending: 0,
        approved: 0,
        settled: 0,
        items: [],
      };
    }
    acc[empId].items.push(item);
    acc[empId].total += Number(item.jumlah);
    if (item.status === "PENDING") acc[empId].pending += 1;
    if (item.status === "APPROVED") acc[empId].approved += 1;
    if (item.status === "SETTLED") acc[empId].settled += 1;
    return acc;
  }, {} as Record<string, any>);

  const employeeList = Object.values(groupedKasbon).sort((a: any, b: any) =>
    a.employee.namaLengkap.localeCompare(b.employee.namaLengkap)
  );

  const toggleEmployeeDetail = (empId: string) => {
    setExpandedEmployee(expandedEmployee === empId ? null : empId);
  };

  // ── Employee Detail Dialog ────────────────────────────────────────────────
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState<any>(null);

  const openEmployeeDetail = (empData: any) => {
    setSelectedEmployeeDetail(empData);
  };

  const closeEmployeeDetail = () => {
    setSelectedEmployeeDetail(null);
  };

  useEffect(() => {
    if (selectedEmployeeDetail) {
      const updated = groupedKasbon[selectedEmployeeDetail.employee.id];
      if (updated) {
        // Only update if references change or items length/content changes to avoid infinite loop
        if (JSON.stringify(updated.items) !== JSON.stringify(selectedEmployeeDetail.items)) {
          setSelectedEmployeeDetail(updated);
        }
      } else {
        setSelectedEmployeeDetail(null);
      }
    }
  }, [groupedKasbon, selectedEmployeeDetail]);

  // ── Progress Bar Component ────────────────────────────────────────────────
  const StatusProgressBar = ({ pending, approved, settled, total }: { pending: number, approved: number, settled: number, total: number }) => {
    if (total === 0) return null;
    
    const pendingPct = Math.round((pending / total) * 100);
    const approvedPct = Math.round((approved / total) * 100);
    const settledPct = Math.round((settled / total) * 100);
    
    return (
      <div className="w-full">
        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Menunggu {pending}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Disetujui {approved}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Lunas {settled}
          </span>
        </div>
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden flex">
          {pending > 0 && (
            <div 
              className="bg-amber-500 transition-all duration-500" 
              style={{ width: `${pendingPct}%` }}
            />
          )}
          {approved > 0 && (
            <div 
              className="bg-blue-500 transition-all duration-500" 
              style={{ width: `${approvedPct}%` }}
            />
          )}
          {settled > 0 && (
            <div 
              className="bg-emerald-500 transition-all duration-500" 
              style={{ width: `${settledPct}%` }}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <Table>
        <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50">
          <TableRow>
            <TableHead className="font-bold text-gray-700 w-1/3">Karyawan</TableHead>
            <TableHead className="font-bold text-gray-700 text-center w-1/4">Progress</TableHead>
            <TableHead className="font-bold text-gray-700 w-1/6">Total Kasbon</TableHead>
            <TableHead className="text-right font-bold text-gray-700 w-1/6">Aksi</TableHead>
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
            employeeList.map((empGroup: any) => (
              <React.Fragment key={empGroup.employee.id}>
                {/* Group Header Row */}
                <TableRow 
                  className="hover:bg-gradient-to-r hover:from-amber-50/50 hover:to-amber-50/30 transition-colors cursor-pointer group"
                  onClick={() => toggleEmployeeDetail(empGroup.employee.id)}
                >
                  <TableCell className="font-bold text-gray-800">
                    <div className="flex items-center gap-2">
                      <span className={`transition-transform duration-200 ${expandedEmployee === empGroup.employee.id ? 'rotate-90' : ''}`}>
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                      <div className="flex flex-col">
                        <span>{empGroup.employee.namaLengkap}</span>
                        <span className="text-xs text-gray-500 font-normal">{empGroup.employee.nik}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <StatusProgressBar 
                      pending={empGroup.pending} 
                      approved={empGroup.approved} 
                      settled={empGroup.settled} 
                      total={empGroup.items.length} 
                    />
                  </TableCell>
                  <TableCell className="font-bold text-amber-700">
                    <div className="flex flex-col items-start">
                      <span className="text-lg">{formatCurrency(empGroup.total)}</span>
                      <span className="text-xs text-gray-500 font-medium">
                        {empGroup.items.length} transaksi
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200/50 rounded-xl text-xs font-semibold transition-all px-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEmployeeDetail(empGroup);
                      }}
                    >
                      <Info className="h-3 w-3 mr-1" />
                      Lihat / Ubah Data
                    </Button>
                  </TableCell>
                </TableRow>
                
                {/* Expanded Detail Row */}
                {expandedEmployee === empGroup.employee.id && (
                  <TableRow className="bg-gradient-to-r from-gray-50/50 to-gray-100/30">
                    <TableCell colSpan={7} className="py-4">
                      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-bold text-gray-800 text-lg">Riwayat Kasbon {empGroup.employee.namaLengkap}</h4>
                            <p className="text-sm text-gray-500 mt-1">
                              {empGroup.items.length} transaksi • Total: {formatCurrency(empGroup.total)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-100">
                              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                              <span className="text-xs font-bold text-amber-700">{empGroup.pending} Menunggu</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-100">
                              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                              <span className="text-xs font-bold text-blue-700">{empGroup.approved} Disetujui</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              <span className="text-xs font-bold text-emerald-700">{empGroup.settled} Lunas</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                          {empGroup.items.map((k: any) => (
                            <div key={k.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl border border-gray-200 hover:border-amber-200 transition-colors">
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                  k.status === 'PENDING' ? 'bg-amber-100 text-amber-600' :
                                  k.status === 'APPROVED' ? 'bg-blue-100 text-blue-600' :
                                  k.status === 'SETTLED' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                                }`}>
                                  {k.status === 'PENDING' ? '⏳' : k.status === 'APPROVED' ? '✓' : k.status === 'SETTLED' ? '💰' : '✕'}
                                </div>
                                <div>
                                  <p className="text-lg font-bold text-gray-800">{formatCurrency(Number(k.jumlah))}</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    <span className="font-medium">{format(new Date(k.tanggal), "dd MMM yyyy", { locale: id })}</span>
                                    {k.bulanPotong && (
                                      <span className="mx-2">•</span>
                                    )}
                                    {k.bulanPotong && (
                                      <span className="text-gray-600">Pelunasan: {format(new Date(k.bulanPotong), "MMM yyyy", { locale: id })}</span>
                                    )}
                                  </p>
                                  {k.keperluan && (
                                    <p className="text-xs text-gray-600 mt-1 bg-white/60 px-2 py-1 rounded inline-block">
                                      {k.keperluan}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {getStatusBadge(k.status, k.isPosted)}
                                {k.status === "APPROVED" && !k.isPosted && (
                                  <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                                    ⚠ Belum Posting
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between bg-gradient-to-r from-amber-50 to-amber-100/30 rounded-xl p-3">
                          <span className="text-sm font-semibold text-gray-700">Total Kasbon:</span>
                          <span className="text-2xl font-bold text-amber-700">{formatCurrency(empGroup.total)}</span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
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
                className={`rounded-xl ${isOverLimit() ? "border-red-400 bg-red-50" : "border-gray-200"} disabled:opacity-50`}
                value={editForm.jumlah}
                onChange={(e) => setEditForm({ ...editForm, jumlah: e.target.value })}
                disabled={editingKasbon?.status !== "PENDING"}
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
                className="rounded-xl border-gray-200 min-h-[70px] disabled:opacity-50"
                value={editForm.keperluan}
                onChange={(e) => setEditForm({ ...editForm, keperluan: e.target.value })}
                disabled={editingKasbon?.status !== "PENDING"}
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

      {/* ══ Employee Detail Dialog ══ */}
      <Dialog open={!!selectedEmployeeDetail} onOpenChange={closeEmployeeDetail}>
        <DialogContent className="sm:max-w-[850px] rounded-[2.5rem] max-h-[92vh] flex flex-col p-0 overflow-hidden bg-slate-50 border-0 shadow-2xl shadow-indigo-900/20">
          
          {/* Header Section - Premium Dark Gradient */}
          <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-8 pt-10 pb-20 overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-[-20%] right-[-5%] w-64 h-64 rounded-full bg-indigo-500/20 blur-[80px]"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 rounded-full bg-blue-500/20 blur-[60px]"></div>

            <div className="relative flex items-start justify-between z-10">
              <div className="flex gap-5 items-center">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center text-blue-200 shadow-lg">
                  <Info className="h-8 w-8" />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-black text-white tracking-tight drop-shadow-md">
                    {selectedEmployeeDetail?.employee?.namaLengkap}
                  </DialogTitle>
                  <p className="text-sm font-medium text-indigo-200/80 mt-1 flex items-center gap-3">
                    <span className="bg-white/10 border border-white/10 px-2.5 py-1 rounded-md text-white tracking-wide">
                      NIK: {selectedEmployeeDetail?.employee?.nik}
                    </span>
                    <span className="opacity-80">Detail Kasbon Karyawan</span>
                  </p>
                </div>
              </div>
              <div className="text-right bg-white/5 backdrop-blur-sm px-6 py-4 rounded-2xl border border-white/10 shadow-inner">
                <p className="text-xs font-semibold text-indigo-200 uppercase tracking-widest mb-1.5 opacity-80">Total Kasbon</p>
                <div className="text-4xl font-black text-white drop-shadow-sm">
                  {formatCurrency(selectedEmployeeDetail?.total || 0)}
                </div>
              </div>
            </div>
          </div>
          
          {/* Stats Summary - Floating Cards */}
          <div className="px-8 relative z-20 -mt-12 mb-2">
            <div className="grid grid-cols-3 gap-5">
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-5 text-center border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-400 group-hover:h-2 transition-all"></div>
                <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-2">Menunggu</p>
                <p className="text-4xl font-black text-slate-800 tracking-tight">{selectedEmployeeDetail?.pending || 0}</p>
                <p className="text-xs font-medium text-slate-400 mt-1">{selectedEmployeeDetail?.pending || 0} transaksi berjalan</p>
              </div>
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-5 text-center border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-500 group-hover:h-2 transition-all"></div>
                <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-2">Disetujui</p>
                <p className="text-4xl font-black text-slate-800 tracking-tight">{selectedEmployeeDetail?.approved || 0}</p>
                <p className="text-xs font-medium text-slate-400 mt-1">{selectedEmployeeDetail?.approved || 0} transaksi berjalan</p>
              </div>
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-5 text-center border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500 group-hover:h-2 transition-all"></div>
                <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-2">Lunas</p>
                <p className="text-4xl font-black text-slate-800 tracking-tight">{selectedEmployeeDetail?.settled || 0}</p>
                <p className="text-xs font-medium text-slate-400 mt-1">{selectedEmployeeDetail?.settled || 0} transaksi selesai</p>
              </div>
            </div>
          </div>
          
          {/* Transaction List */}
          <div className="flex-1 overflow-y-auto px-8 py-4 space-y-5 custom-scrollbar">
            <div className="flex items-center justify-between mt-2 mb-4">
              <h4 className="font-extrabold text-slate-800 text-xl tracking-tight">Riwayat Transaksi</h4>
              <span className="text-xs font-bold text-slate-500 bg-slate-200/60 px-3 py-1.5 rounded-full shadow-sm">
                {selectedEmployeeDetail?.items?.length || 0} Data Ditemukan
              </span>
            </div>
            
            {selectedEmployeeDetail?.items?.map((k: any) => (
              <div key={k.id} className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-[0_4px_20px_rgb(0,0,0,0.08)] transition-all duration-300 relative overflow-hidden group">
                
                {/* Decorative side accent */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 opacity-80 group-hover:opacity-100 transition-opacity ${
                  k.status === 'PENDING' ? 'bg-gradient-to-b from-amber-300 to-amber-500' :
                  k.status === 'APPROVED' ? 'bg-gradient-to-b from-blue-400 to-blue-600' :
                  k.status === 'SETTLED' ? 'bg-gradient-to-b from-emerald-400 to-emerald-600' : 'bg-gradient-to-b from-red-400 to-red-600'
                }`}></div>

                <div className="flex items-start justify-between mb-5 pl-2">
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 font-bold text-2xl shadow-inner ${
                      k.status === 'PENDING' ? 'bg-amber-50 text-amber-500 border border-amber-100' :
                      k.status === 'APPROVED' ? 'bg-blue-50 text-blue-500 border border-blue-100' :
                      k.status === 'SETTLED' ? 'bg-emerald-50 text-emerald-500 border border-emerald-100' : 'bg-red-50 text-red-500 border border-red-100'
                    }`}>
                      {k.status === 'PENDING' ? '⏳' : k.status === 'APPROVED' ? '✓' : k.status === 'SETTLED' ? '💰' : '✕'}
                    </div>
                    <div>
                      <p className="text-3xl font-black text-slate-800 tracking-tight">{formatCurrency(Number(k.jumlah))}</p>
                      <p className="text-sm font-semibold text-slate-400 mt-1">
                        Diajukan pada: <span className="text-slate-600">{format(new Date(k.tanggal), "dd MMM yyyy", { locale: id })}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2.5 mt-1">
                    {getStatusBadge(k.status, k.isPosted)}
                    {k.status === "APPROVED" && !k.isPosted && (
                      <span className="text-[10px] text-amber-600 font-extrabold tracking-wide uppercase bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200/60 flex items-center gap-1.5 shadow-sm">
                        <AlertTriangle className="h-3.5 w-3.5" /> Belum Posting
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="pl-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Info Cards */}
                  {k.keperluan && (
                    <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 col-span-1 md:col-span-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <span className="text-base grayscale opacity-60">📝</span> Keperluan / Alasan
                      </p>
                      <p className="text-sm text-slate-700 font-semibold">{k.keperluan}</p>
                    </div>
                  )}
                  
                  {k.bulanPotong && (
                    <div className="bg-blue-50/40 rounded-xl p-4 border border-blue-100/50">
                      <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1.5">Target Pelunasan</p>
                      <p className="text-sm text-blue-900 font-extrabold">
                        {format(new Date(k.bulanPotong), "MMMM yyyy", { locale: id })}
                      </p>
                    </div>
                  )}
                  
                  {k.approvedBy && (
                    <div className="bg-emerald-50/40 rounded-xl p-4 border border-emerald-100/50">
                      <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1.5">Otorisasi Oleh</p>
                      <p className="text-sm text-emerald-900 font-extrabold">{k.approvedBy}</p>
                    </div>
                  )}
                </div>
                
                {/* ── Action Buttons ── */}
                <div className="mt-6 pt-5 border-t border-slate-100/80 flex flex-wrap gap-3 justify-end pl-2">
                  {k.status === "PENDING" && (
                    <>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-5 shadow-lg shadow-blue-600/20 font-semibold transition-all hover:-translate-y-0.5" onClick={() => handleApprove(k.id)} disabled={!!loadingId}>
                        {loadingId === k.id ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1.5" />} Setujui
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 rounded-xl px-5 py-5 font-semibold transition-all" onClick={() => setRejectTarget(k)}>
                        <XCircle className="w-4 h-4 mr-1.5" /> Tolak
                      </Button>
                      <Button size="sm" variant="outline" className="text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl px-5 py-5 font-semibold transition-all" onClick={() => setEditingKasbon(k)}>
                        <Pencil className="w-4 h-4 mr-1.5" /> Edit
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-500 border-red-100 hover:bg-red-50 hover:border-red-200 rounded-xl px-5 py-5 font-semibold transition-all ml-auto" onClick={() => { setDeletingId(k.id); setDeletingName(selectedEmployeeDetail?.employee?.namaLengkap); }}>
                        <Trash2 className="w-4 h-4 mr-1.5" /> Hapus
                      </Button>
                    </>
                  )}
                  {k.status === "APPROVED" && (
                    <>
                      {!k.isPosted && (
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-5 py-5 shadow-lg shadow-emerald-600/20 font-semibold transition-all hover:-translate-y-0.5" onClick={() => setPostingKasbon(k)}>
                          <SendHorizontal className="w-4 h-4 mr-1.5" /> Posting GL
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl px-5 py-5 font-semibold transition-all" onClick={() => setEditingKasbon(k)}>
                        <Pencil className="w-4 h-4 mr-1.5" /> Edit Tanggal
                      </Button>
                      <Button size="sm" variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:border-orange-300 rounded-xl px-5 py-5 font-semibold transition-all" onClick={() => setRejectTarget(k)}>
                        <XCircle className="w-4 h-4 mr-1.5" /> Batalkan
                      </Button>
                      {k.isPosted && (
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-5 py-5 shadow-lg shadow-emerald-600/20 font-semibold transition-all hover:-translate-y-0.5" onClick={() => setSettlingId(k.id)}>
                          <CheckCheck className="w-4 h-4 mr-1.5" /> Lunaskan
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-white/80 backdrop-blur-xl border-t border-slate-200/60 p-6 flex justify-end">
            <Button 
              variant="outline" 
              className="rounded-xl px-8 py-6 font-bold text-slate-600 border-slate-300 hover:bg-slate-100 hover:text-slate-900 shadow-sm transition-all"
              onClick={closeEmployeeDetail}
            >
              Tutup Dialog
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KasbonTable;
