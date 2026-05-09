"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CheckCircle2, Clock, AlertTriangle, CreditCard, Loader2 } from "lucide-react";
import { recordRepayment, fetchBankAccounts } from "@/lib/action/hr/loans";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LoanDetailDialogProps {
  loan: any;
  open: boolean;
  onClose: () => void;
}

const LoanDetailDialog: React.FC<LoanDetailDialogProps> = ({ loan, open, onClose }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [selectedBankId, setSelectedBankId] = useState("");
  const [showManualForm, setShowManualForm] = useState<string | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Lunas
          </Badge>
        );
      case "PENDING":
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50/50">
            <Clock className="h-3 w-3 mr-1" /> Menunggu
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleRepayment = async (detailId: string) => {
    if (!selectedBankId) {
      toast.error("Pilih akun kas/bank terlebih dahulu");
      return;
    }
    
    setLoading(detailId);
    try {
      const res = await recordRepayment(detailId, {
        bankAccountId: selectedBankId,
        tanggalBayar: new Date().toISOString(),
        keterangan: "Pembayaran manual (Non-Payroll)",
      });
      if (res.success) {
        toast.success("Pembayaran berhasil dicatat");
        setShowManualForm(null);
        // Refresh would be handled by revalidatePath, but we close to be safe or update local
        onClose();
      } else {
        toast.error(res.error || "Gagal mencatat pembayaran");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setLoading(null);
    }
  };

  const loadBanks = async () => {
    const banks = await fetchBankAccounts();
    setBankAccounts(banks);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[700px] rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl font-bold">
            Jadwal Angsuran: {loan.karyawan?.namaLengkap}
          </DialogTitle>
          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100 mt-4">
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Pinjaman</p>
              <p className="text-lg font-black text-blue-600">{formatCurrency(Number(loan.jumlahPinjaman))}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Sisa Saldo</p>
              <p className="text-lg font-black text-amber-600">{formatCurrency(Number(loan.sisaPinjaman))}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-gray-700 flex items-center">
              <CreditCard className="h-4 w-4 mr-2 text-blue-600" />
              Detail Angsuran ({loan.tenor} Bulan)
            </h4>
            {loan.status === "ACTIVE" && (
               <div className="text-[10px] text-gray-500 bg-blue-50 px-2 py-1 rounded-md flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1 text-blue-600" />
                  Potongan otomatis via Payroll
               </div>
            )}
          </div>

          <div className="border rounded-2xl overflow-hidden border-gray-100">
            <Table>
              <TableHeader className="bg-gray-50/80">
                <TableRow>
                  <TableHead className="w-[80px]">Bulan</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loan.details?.map((detail: any) => (
                  <TableRow key={detail.id} className="hover:bg-gray-50/30 transition-colors">
                    <TableCell className="font-bold text-gray-700 text-center">#{detail.bulanKe}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {format(new Date(detail.tanggalJatuhTempo), "MMMM yyyy", { locale: id })}
                    </TableCell>
                    <TableCell className="font-medium text-gray-800">
                      {formatCurrency(Number(detail.jumlahBayar))}
                    </TableCell>
                    <TableCell>{getStatusBadge(detail.status)}</TableCell>
                    <TableCell className="text-right">
                      {detail.status === "PENDING" && (
                        <>
                          {showManualForm === detail.id ? (
                            <div className="flex items-center gap-2">
                               <Select 
                                  onValueChange={setSelectedBankId} 
                                  onOpenChange={(open) => open && loadBanks()}
                                >
                                 <SelectTrigger className="w-[150px] h-8 text-[10px] rounded-lg">
                                   <SelectValue placeholder="Pilih Bank" />
                                 </SelectTrigger>
                                 <SelectContent className="rounded-xl">
                                   {bankAccounts.map(b => (
                                     <SelectItem key={b.id} value={b.id} className="text-xs">
                                       {b.bankName}
                                     </SelectItem>
                                   ))}
                                 </SelectContent>
                               </Select>
                               <Button 
                                  size="sm" 
                                  className="h-8 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-[10px]"
                                  disabled={loading === detail.id}
                                  onClick={() => handleRepayment(detail.id)}
                                >
                                  {loading === detail.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Bayar"}
                               </Button>
                               <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 text-[10px]" 
                                  onClick={() => setShowManualForm(null)}
                                >
                                  X
                               </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-[10px] rounded-lg hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                              onClick={() => setShowManualForm(detail.id)}
                            >
                              Bayar Manual
                            </Button>
                          )}
                        </>
                      )}
                      {detail.status === "PAID" && (
                        <p className="text-[10px] text-emerald-600 font-medium">
                          {detail.tanggalBayar ? format(new Date(detail.tanggalBayar), "dd/MM/yy") : "-"}
                        </p>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoanDetailDialog;
