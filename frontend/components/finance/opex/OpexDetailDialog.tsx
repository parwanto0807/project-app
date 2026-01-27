import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OperationalExpense } from "@/types/finance/operationalExpense";
import { formatCurrencyNumber, formatDate, getFullImageUrl } from "@/lib/utils";
import { Calendar, CreditCard, Tag, FileText, User, CheckCircle2, XCircle, Clock } from "lucide-react";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: OperationalExpense | null;
}

const OpexDetailDialog: React.FC<Props> = ({ open, onOpenChange, data }) => {
    if (!data) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case 'REJECTED': return "bg-rose-100 text-rose-700 border-rose-200";
            case 'CANCELLED': return "bg-amber-100 text-amber-700 border-amber-200";
            default: return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden rounded-2xl gap-0">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                    <DialogHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                    <FileText className="h-6 w-6 opacity-80" />
                                    Detail Pengeluaran
                                </DialogTitle>
                                <DialogDescription className="text-blue-100 opacity-90 mt-1">
                                    {data.expenseNumber}
                                </DialogDescription>
                            </div>
                            <Badge className={`border-none shadow-none text-sm px-3 py-1 ${getStatusColor(data.status)}`}>
                                {data.status}
                            </Badge>
                        </div>
                    </DialogHeader>
                </div>

                <div className="p-6 overflow-y-auto max-h-[70vh]">
                    {/* Amount Section */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 mb-6 text-center">
                        <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Total Nominal</span>
                        <div className="text-3xl font-bold text-slate-800 mt-1">
                            {formatCurrencyNumber(data.amount)}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center gap-2 text-slate-500 mb-1">
                                    <Calendar className="h-4 w-4" />
                                    <span className="text-xs font-bold uppercase">Tanggal Transaksi</span>
                                </div>
                                <p className="font-medium text-slate-900 pl-6">{formatDate(data.date)}</p>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 text-slate-500 mb-1">
                                    <Tag className="h-4 w-4" />
                                    <span className="text-xs font-bold uppercase">Kategori Akun</span>
                                </div>
                                <div className="pl-6">
                                    <p className="font-bold text-slate-900">{data.expenseAccount?.code}</p>
                                    <p className="text-sm text-slate-600">{data.expenseAccount?.name}</p>
                                </div>
                            </div>
                            {data.paidFromAccount && (
                                <div>
                                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                                        <CreditCard className="h-4 w-4" />
                                        <span className="text-xs font-bold uppercase">Dibayar Dari</span>
                                    </div>
                                    <div className="pl-6">
                                        <p className="font-bold text-slate-900">{data.paidFromAccount.code}</p>
                                        <p className="text-sm text-slate-600">{data.paidFromAccount.name}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center gap-2 text-slate-500 mb-1">
                                    <User className="h-4 w-4" />
                                    <span className="text-xs font-bold uppercase">Dibuat Oleh</span>
                                </div>
                                <p className="font-medium text-slate-900 pl-6">{data.createdBy?.name || '-'}</p>
                            </div>
                            {data.approvedBy && (
                                <div>
                                    <div className="flex items-center gap-2 text-emerald-600 mb-1">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span className="text-xs font-bold uppercase">Disetujui Oleh</span>
                                    </div>
                                    <p className="font-medium text-slate-900 pl-6">{data.approvedBy.name}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Deskripsi / Keterangan</h4>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-slate-700 text-sm leading-relaxed">
                            {data.description}
                        </div>
                    </div>

                    {/* Receipt Preview */}
                    {data.receiptUrl ? (
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Bukti Transaksi</h4>
                            <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                                {data.receiptUrl.toLowerCase().endsWith('.pdf') ? (
                                    <div className="p-8 text-center">
                                        <FileText className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                                        <p className="text-sm text-slate-600 mb-4">Dokumen PDF Terlampir</p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(getFullImageUrl(data.receiptUrl), '_blank')}
                                        >
                                            Buka PDF
                                        </Button>
                                    </div>
                                ) : (
                                    <img
                                        src={getFullImageUrl(data.receiptUrl)}
                                        alt="Bukti Transaksi"
                                        className="w-full h-auto max-h-[300px] object-contain bg-white"
                                    />
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-6 text-center text-slate-400">
                            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Tidak ada bukti lampiran</p>
                        </div>
                    )}
                </div>

                <DialogFooter className="bg-slate-100 p-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default OpexDetailDialog;
