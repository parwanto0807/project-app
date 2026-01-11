"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { formatCurrencyNumber } from "@/lib/utils";
import { FundTransfer } from "@/types/finance/fundTransfer";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Landmark, Calendar, FileText, User, Receipt, Info, CheckCircle2, XCircle, ShieldAlert } from "lucide-react";

interface ViewFundTransferDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    transfer: FundTransfer | null;
}

const ViewFundTransferDialog = ({ open, onOpenChange, transfer }: ViewFundTransferDialogProps) => {
    if (!transfer) return null;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'POSTED':
                return <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none px-3 py-1 rounded-full"><CheckCircle2 className="w-3 h-3 mr-1" /> Posted</Badge>;
            case 'VOIDED':
                return <Badge className="bg-rose-500 hover:bg-rose-600 border-none px-3 py-1 rounded-full"><XCircle className="w-3 h-3 mr-1" /> Voided</Badge>;
            default:
                return <Badge variant="secondary" className="rounded-full px-3 py-1">{status}</Badge>;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
                <DialogHeader className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-8 text-white">
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-indigo-300 border-indigo-500/50 bg-indigo-500/10">TRANSACTION VOUCHER</Badge>
                                {getStatusBadge(transfer.status)}
                            </div>
                            <DialogTitle className="text-3xl font-black tracking-tight">{transfer.transferNo}</DialogTitle>
                            <p className="text-slate-400 text-sm flex items-center gap-2">
                                <Calendar className="h-4 w-4" /> {format(new Date(transfer.transferDate), "EEEE, dd MMMM yyyy")}
                            </p>
                        </div>
                        <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                            <Landmark className="h-8 w-8 text-indigo-400" />
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-8 bg-white space-y-8 max-h-[70vh] overflow-y-auto">
                    {/* Transfer Flow */}
                    <div className="relative p-6 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dari Akun</span>
                                <p className="font-bold text-slate-800 text-lg leading-tight">{transfer.fromAccount?.name}</p>
                                <p className="text-sm text-slate-500 font-medium font-mono">{transfer.fromAccount?.code}</p>
                            </div>

                            <div className="flex flex-col items-center">
                                <div className="p-2 bg-indigo-100 rounded-full text-indigo-600 shadow-md">
                                    <ArrowRight className="h-5 w-5" />
                                </div>
                            </div>

                            <div className="md:text-right space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ke Akun</span>
                                <p className="font-bold text-slate-800 text-lg leading-tight">{transfer.toAccount?.name}</p>
                                <p className="text-sm text-slate-500 font-medium font-mono">{transfer.toAccount?.code}</p>
                            </div>
                        </div>
                    </div>

                    {/* Financial Details */}
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="flex gap-4 items-start">
                                <div className="p-2 bg-slate-100 rounded-xl text-slate-500">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ref No.</p>
                                    <p className="text-slate-700 font-semibold">{transfer.referenceNo || "-"}</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <div className="p-2 bg-slate-100 rounded-xl text-slate-500">
                                    <User className="h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Created By</p>
                                    <p className="text-slate-700 font-semibold">{transfer.createdBy?.name || "System"}</p>
                                    <p className="text-[10px] text-slate-400">{format(new Date(transfer.createdAt), "dd/MM/yyyy HH:mm")}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100/50">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 font-medium">Nominal:</span>
                                <span className="text-slate-900 font-bold">{formatCurrencyNumber(Number(transfer.amount))}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 font-medium">Beban Admin:</span>
                                <span className="text-rose-600 font-bold">+{formatCurrencyNumber(Number(transfer.feeAmount))}</span>
                            </div>
                            <div className="h-px bg-indigo-200/50 my-2" />
                            <div className="flex justify-between items-end">
                                <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">Total Transaction</span>
                                <span className="text-xl font-black text-indigo-700">{formatCurrencyNumber(Number(transfer.totalAmount))}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes Section */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm uppercase tracking-wider">
                            <Receipt className="h-4 w-4 text-indigo-500" />
                            Keterangan
                        </div>
                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-slate-600 text-sm leading-relaxed italic">
                            {transfer.notes || "Tidak ada catatan tambahan."}
                        </div>
                    </div>

                    {/* Void Info if any */}
                    {transfer.status === 'VOIDED' && (
                        <div className="p-5 bg-rose-50 rounded-2xl border border-rose-100 space-y-3">
                            <div className="flex items-center gap-2 text-rose-800 font-bold text-sm uppercase tracking-wider">
                                <ShieldAlert className="h-4 w-4 text-rose-600" /> Detail Void
                            </div>
                            <div className="grid grid-cols-[1fr_2fr] gap-4 text-sm text-rose-700">
                                <span className="font-semibold italic">Alasan:</span>
                                <span>{transfer.voidReason}</span>
                                <span className="font-semibold italic">Waktu:</span>
                                <span>{transfer.voidedAt ? format(new Date(transfer.voidedAt), "dd MMM yyyy HH:mm") : "-"}</span>
                            </div>
                        </div>
                    )}

                    {/* General Ledger Info */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            Posted to General Ledger: {transfer.ledgerId ? "Yes" : "No"}
                        </div>
                        <div className="flex items-center gap-1">
                            <Info className="h-3 w-3 text-indigo-400" /> ID: {transfer.id}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ViewFundTransferDialog;
