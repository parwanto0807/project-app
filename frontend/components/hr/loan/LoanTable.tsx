"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Eye,
  Calendar,
  SendHorizontal,
  Loader2,
  Pencil,
  Trash2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import LoanDetailDialog from "@/components/hr/loan/LoanDetailDialog";
import { postLoan, updateLoan, deleteLoan, fetchAllEmployees, fetchBankAccounts } from "@/lib/action/hr/loans";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface LoanTableProps {
  loans: any[];
  onRefresh?: () => void;
}

const LoanTable: React.FC<LoanTableProps> = ({ loans, onRefresh }) => {
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [postingLoanId, setPostingLoanId] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  // Edit state
  const [editingLoan, setEditingLoan] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [editForm, setEditForm] = useState({
    karyawanId: "",
    tanggalPinjam: "",
    jumlahPinjaman: "",
    tenor: "12",
    bunga: "0",
    keterangan: "",
    bankAccountId: "",
  });

  // Delete state
  const [deletingLoanId, setDeletingLoanId] = useState<string | null>(null);
  const [deletingLoanName, setDeletingLoanName] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);

  // Load dropdown data when edit dialog opens
  useEffect(() => {
    if (editingLoan) {
      const load = async () => {
        const [empData, bankData] = await Promise.all([
          fetchAllEmployees(),
          fetchBankAccounts(),
        ]);
        setEmployees(empData);
        setBankAccounts(bankData);
      };
      load();

      // Populate form with existing loan data
      setEditForm({
        karyawanId: editingLoan.karyawanId || "",
        tanggalPinjam: editingLoan.tanggalPinjam
          ? new Date(editingLoan.tanggalPinjam).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        jumlahPinjaman: String(editingLoan.jumlahPinjaman || ""),
        tenor: String(editingLoan.tenor || "12"),
        bunga: String(editingLoan.bunga || "0"),
        keterangan: editingLoan.keterangan || "",
        bankAccountId: editingLoan.bankAccountId || "",
      });
    }
  }, [editingLoan]);

  const calculateMonthly = () => {
    const amount = parseFloat(editForm.jumlahPinjaman || "0");
    const tenor = parseInt(editForm.tenor || "1");
    const bunga = parseFloat(editForm.bunga || "0");
    if (!amount || !tenor) return 0;
    return Math.ceil((amount + (amount * bunga) / 100) / tenor);
  };

  // --- POST ---
  const handlePost = async () => {
    if (!postingLoanId) return;
    try {
      setIsPosting(true);
      const res = await postLoan(postingLoanId);
      if (res.success) {
        toast.success("Pinjaman berhasil di-posting ke Jurnal Umum");
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.error || "Gagal posting pinjaman");
      }
    } catch {
      toast.error("Terjadi kesalahan saat posting");
    } finally {
      setIsPosting(false);
      setPostingLoanId(null);
    }
  };

  // --- EDIT SUBMIT ---
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLoan) return;
    if (!editForm.karyawanId || !editForm.jumlahPinjaman) {
      toast.error("Harap isi Karyawan dan Jumlah Pinjaman");
      return;
    }
    try {
      setEditLoading(true);
      const res = await updateLoan(editingLoan.id, editForm);
      if (res.success) {
        toast.success("Pinjaman berhasil diperbarui");
        setEditingLoan(null);
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.error || "Gagal memperbarui pinjaman");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setEditLoading(false);
    }
  };

  // --- DELETE ---
  const handleDelete = async () => {
    if (!deletingLoanId) return;
    try {
      setIsDeleting(true);
      const res = await deleteLoan(deletingLoanId);
      if (res.success) {
        toast.success("Pinjaman berhasil dihapus");
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.error || "Gagal menghapus pinjaman");
      }
    } catch {
      toast.error("Terjadi kesalahan saat menghapus");
    } finally {
      setIsDeleting(false);
      setDeletingLoanId(null);
      setDeletingLoanName("");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none">Draft</Badge>;
      case "ACTIVE":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">Aktif</Badge>;
      case "COMPLETED":
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">Lunas</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50/50">
          <TableRow>
            <TableHead className="font-bold text-gray-700">Karyawan</TableHead>
            <TableHead className="font-bold text-gray-700">Tgl Pinjam</TableHead>
            <TableHead className="font-bold text-gray-700">Total Pinjaman</TableHead>
            <TableHead className="font-bold text-gray-700">Tenor</TableHead>
            <TableHead className="font-bold text-gray-700">Angsuran</TableHead>
            <TableHead className="font-bold text-gray-700">Sisa Saldo</TableHead>
            <TableHead className="font-bold text-gray-700">Status</TableHead>
            <TableHead className="text-right font-bold text-gray-700">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loans.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-10 text-gray-500">
                Belum ada data pinjaman.
              </TableCell>
            </TableRow>
          ) : (
            loans.map((loan) => (
              <TableRow key={loan.id} className="hover:bg-gray-50/50 transition-colors">
                <TableCell>
                  <div>
                    <p className="font-bold text-gray-800">{loan.karyawan?.namaLengkap}</p>
                    <p className="text-xs text-gray-500">{loan.karyawan?.nik} • {loan.karyawan?.jabatan}</p>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                    {format(new Date(loan.tanggalPinjam), "dd MMM yyyy", { locale: id })}
                  </div>
                </TableCell>
                <TableCell className="font-semibold text-gray-700">
                  {formatCurrency(Number(loan.jumlahPinjaman))}
                </TableCell>
                <TableCell className="text-sm text-gray-600">{loan.tenor} Bulan</TableCell>
                <TableCell className="font-medium text-blue-600">
                  {formatCurrency(Number(loan.angsuranBulanan))}
                </TableCell>
                <TableCell className="font-bold text-amber-600">
                  {formatCurrency(Number(loan.sisaPinjaman))}
                </TableCell>
                <TableCell>{getStatusBadge(loan.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {/* === DRAFT-only actions === */}
                    {loan.status === "DRAFT" && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg"
                          onClick={() => setPostingLoanId(loan.id)}
                          title="Posting ke Jurnal"
                        >
                          <SendHorizontal className="h-4 w-4 mr-1" />
                          Posting
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg"
                          onClick={() => setEditingLoan(loan)}
                          title="Edit pinjaman"
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg"
                          onClick={() => {
                            setDeletingLoanId(loan.id);
                            setDeletingLoanName(loan.karyawan?.namaLengkap || "");
                          }}
                          title="Hapus pinjaman"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Hapus
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-gray-100 hover:text-gray-700 rounded-lg"
                      onClick={() => setSelectedLoan(loan)}
                      title="Lihat detail"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Detail
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* ===== Posting Confirmation Dialog ===== */}
      <AlertDialog open={!!postingLoanId} onOpenChange={(open) => !open && setPostingLoanId(null)}>
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-gray-900">
              Konfirmasi Posting Jurnal
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 text-base">
              Apakah Anda yakin ingin mem-posting pinjaman ini ke Jurnal Umum?
              Tindakan ini akan membuat entri akuntansi otomatis dan pinjaman akan menjadi aktif.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-gray-200">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePost}
              disabled={isPosting}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-100"
            >
              {isPosting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Memproses...</>
              ) : (
                "Ya, Posting Sekarang"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ===== Delete Confirmation Dialog ===== */}
      <AlertDialog open={!!deletingLoanId} onOpenChange={(open) => !open && setDeletingLoanId(null)}>
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <AlertDialogTitle className="text-2xl font-black text-gray-900">
                Hapus Pinjaman?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-gray-600 text-base">
              Pinjaman atas nama <strong>{deletingLoanName}</strong> akan dihapus permanen beserta
              seluruh jadwal angsurannya. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-gray-200">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-100"
            >
              {isDeleting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menghapus...</>
              ) : (
                "Ya, Hapus Permanen"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ===== Edit Dialog ===== */}
      <Dialog open={!!editingLoan} onOpenChange={(open) => !open && setEditingLoan(null)}>
        <DialogContent className="sm:max-w-[520px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl font-bold">
              <Pencil className="mr-2 h-5 w-5 text-blue-600" />
              Edit Pinjaman Draft
            </DialogTitle>
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3 mt-1">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                Perubahan akan meregenerasi jadwal angsuran secara otomatis. Pinjaman tetap
                berstatus <strong>Draft</strong> hingga di-Posting.
              </p>
            </div>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              {/* Karyawan */}
              <div className="col-span-2 space-y-2">
                <Label className="text-gray-600">Pilih Karyawan *</Label>
                <Select
                  value={editForm.karyawanId}
                  onValueChange={(val) => setEditForm({ ...editForm, karyawanId: val })}
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

              {/* Tanggal */}
              <div className="space-y-2">
                <Label className="text-gray-600">Tanggal Pencairan</Label>
                <Input
                  type="date"
                  className="rounded-xl border-gray-200"
                  value={editForm.tanggalPinjam}
                  onChange={(e) => setEditForm({ ...editForm, tanggalPinjam: e.target.value })}
                />
              </div>

              {/* Tenor */}
              <div className="space-y-2">
                <Label className="text-gray-600">Tenor (Bulan)</Label>
                <Select
                  value={editForm.tenor}
                  onValueChange={(val) => setEditForm({ ...editForm, tenor: val })}
                >
                  <SelectTrigger className="rounded-xl border-gray-200">
                    <SelectValue placeholder="Pilih Tenor" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {[3, 6, 12, 18, 24, 36].map((m) => (
                      <SelectItem key={m} value={m.toString()}>{m} Bulan</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Jumlah */}
              <div className="space-y-2">
                <Label className="text-gray-600">Jumlah Pinjaman (IDR) *</Label>
                <Input
                  type="number"
                  placeholder="0"
                  className="rounded-xl border-gray-200"
                  value={editForm.jumlahPinjaman}
                  onChange={(e) => setEditForm({ ...editForm, jumlahPinjaman: e.target.value })}
                />
              </div>

              {/* Bunga */}
              <div className="space-y-2">
                <Label className="text-gray-600">Bunga (%)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  className="rounded-xl border-gray-200"
                  value={editForm.bunga}
                  onChange={(e) => setEditForm({ ...editForm, bunga: e.target.value })}
                />
              </div>

              {/* Bank Account */}
              <div className="col-span-2 space-y-2">
                <Label className="text-gray-600 font-bold text-blue-700">
                  Sumber Dana (Akun Kas/Bank)
                  <span className="ml-1 text-xs font-normal text-amber-600">(Wajib untuk Posting)</span>
                </Label>
                <Select
                  value={editForm.bankAccountId}
                  onValueChange={(val) => setEditForm({ ...editForm, bankAccountId: val })}
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

              {/* Keterangan */}
              <div className="col-span-2 space-y-2">
                <Label className="text-gray-600">Keterangan</Label>
                <Textarea
                  placeholder="Tujuan pinjaman..."
                  className="rounded-xl border-gray-200 min-h-[70px]"
                  value={editForm.keterangan}
                  onChange={(e) => setEditForm({ ...editForm, keterangan: e.target.value })}
                />
              </div>
            </div>

            {/* Estimasi */}
            <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-700">Estimasi Angsuran:</span>
                <span className="text-base font-bold text-blue-800">
                  {formatCurrency(calculateMonthly())}
                  <span className="text-xs font-normal text-blue-600"> /bulan</span>
                </span>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl flex-1"
                onClick={() => setEditingLoan(null)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="rounded-xl bg-blue-600 hover:bg-blue-700 flex-1 shadow-md shadow-blue-200"
                disabled={editLoading}
              >
                {editLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</>
                ) : (
                  "Simpan Perubahan"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      {selectedLoan && (
        <LoanDetailDialog
          loan={selectedLoan}
          open={!!selectedLoan}
          onClose={() => setSelectedLoan(null)}
        />
      )}
    </div>
  );
};

export default LoanTable;
