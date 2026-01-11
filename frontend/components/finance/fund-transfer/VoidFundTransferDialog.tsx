"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { voidFundTransfer } from "@/lib/action/fundTransfer";
import { FundTransfer } from "@/types/finance/fundTransfer";

interface VoidFundTransferDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    transfer: FundTransfer | null;
    onSuccess: () => void;
}

const VoidFundTransferDialog = ({ open, onOpenChange, transfer, onSuccess }: VoidFundTransferDialogProps) => {
    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState("");

    const handleVoid = async () => {
        if (!transfer) return;
        if (!reason.trim()) {
            toast.error("Alasan void wajib diisi");
            return;
        }

        setLoading(true);
        try {
            const result = await voidFundTransfer(transfer.id, reason);
            if (result.success) {
                toast.success("Transaksi berhasil di-void");
                onSuccess();
                onOpenChange(false);
                setReason("");
            } else {
                toast.error(result.message || "Gagal melakukan void");
            }
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan sistem");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                <DialogHeader className="bg-gradient-to-br from-rose-600 to-rose-700 p-6 text-white text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-white/20 rounded-full animate-pulse">
                            <ShieldAlert className="h-10 w-10" />
                        </div>
                    </div>
                    <DialogTitle className="text-2xl font-bold">Void Transaction</DialogTitle>
                    <p className="text-rose-100/80 mt-1 text-sm leading-relaxed">
                        Tindakan ini akan membatalkan transaksi <span className="font-bold underline">{transfer?.transferNo}</span> dan membuat jurnal balik di General Ledger.
                    </p>
                </DialogHeader>

                <div className="p-6 space-y-5 bg-white">
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex gap-3 items-start">
                        <AlertTriangle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-rose-800 font-medium">
                            Status transaksi akan berubah menjadi <span className="font-bold">VOIDED</span>. Data tidak dapat dikembalikan setelah proses ini.
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reason" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Alasan Pembatalan / Void
                        </Label>
                        <Textarea
                            id="reason"
                            placeholder="Contoh: Kesalahan input nominal, double entry, dsb..."
                            className="h-28 rounded-xl border-slate-200 focus:ring-rose-500 resize-none"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter className="p-6 pt-0 bg-white grid grid-cols-2 gap-3">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="rounded-xl h-11 border-slate-200"
                    >
                        Batal
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleVoid}
                        disabled={loading || !reason.trim()}
                        className="rounded-xl h-11 font-bold bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Konfirmasi Void
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default VoidFundTransferDialog;
