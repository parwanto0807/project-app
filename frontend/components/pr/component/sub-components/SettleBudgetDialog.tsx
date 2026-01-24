"use client";

import React, { useState } from "react";
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
import { formatCurrency } from "../utils";
import { AlertCircle, CheckCircle2, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { settlePRBudgetAction } from "@/lib/action/staffBalance/staffBalanceAction";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SettleBudgetDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    pr: any;
    onSuccess?: () => void;
}

export function SettleBudgetDialog({
    open,
    onOpenChange,
    pr,
    onSuccess,
}: SettleBudgetDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const router = useRouter();

    if (!pr) return null;

    const sisaBudget = Number(pr.sisaBudget || 0);
    const isRefund = sisaBudget > 0;
    const isReimburse = sisaBudget < 0;
    const absAmount = Math.abs(sisaBudget);

    const handleSettle = async () => {
        setIsSubmitting(true);
        try {
            const result = await settlePRBudgetAction(pr.id);

            toast.success("Settlement Berhasil", {
                description: result.message || "Budget PR telah berhasil di-settle.",
            });

            onOpenChange(false);
            if (onSuccess) onSuccess();
            router.refresh();
        } catch (error: any) {
            toast.error("Settlement Gagal", {
                description: error.message || "Terjadi kesalahan saat memproses settlement.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {isRefund ? (
                            <Info className="h-5 w-5 text-blue-600" />
                        ) : (
                            <AlertCircle className="h-5 w-5 text-rose-600" />
                        )}
                        Settlement Budget PR
                    </DialogTitle>
                    <DialogDescription>
                        Konfirmasi settlement untuk sisa budget pada PR {pr.nomorPr}.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-4">
                    <div className={cn(
                        "p-4 rounded-xl border flex items-start gap-4",
                        isRefund
                            ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
                            : "bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800"
                    )}>
                        <div className={cn(
                            "p-2 rounded-full",
                            isRefund ? "bg-blue-100 dark:bg-blue-800" : "bg-rose-100 dark:bg-rose-800"
                        )}>
                            {isRefund ? (
                                <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            ) : (
                                <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                {isRefund ? "Kelebihan Budget (Refund)" : "Kekurangan Budget (Reimbursment)"}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                {isRefund
                                    ? "Staff memiliki sisa uang tunai yang harus dikembalikan ke perusahaan."
                                    : "Biaya rincian melebihi budget PR, perusahaan harus membayarkan selisihnya ke staff."}
                            </p>
                            <div className="mt-3 flex items-center justify-between bg-white/50 dark:bg-black/20 p-2 rounded-lg border border-white/50">
                                <span className="text-xs font-bold text-gray-500 uppercase">Nilai Settlement</span>
                                <span className={cn(
                                    "text-lg font-black tabular-nums",
                                    isRefund ? "text-emerald-600" : "text-rose-600"
                                )}>
                                    {formatCurrency(absAmount)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl space-y-2">
                        <p className="text-[11px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Info className="h-3 w-3" />
                            Dampak Akuntansi
                        </p>
                        <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1 ml-4 list-disc">
                            <li>Mengesampingkan (settle) sisa budget PR menjadi Rp 0.</li>
                            <li>Otomatis memperbarui saldo **Staff Balance** ({isRefund ? "Berkurang" : "Bertambah"}).</li>
                            <li>Mencatat mutasi di **Staff Ledger**.</li>
                            <li>Membuat Jurnal Umum (Ledger) di akun **Petty Cash** dan **Staff Advance**.</li>
                        </ul>
                    </div>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 flex justify-start">
                        {!pr.spkId && Number(pr.sisaBudget || 0) === 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 font-bold"
                                onClick={async () => {
                                    setIsSubmitting(true);
                                    try {
                                        const res = await fetch(`/api/pr/recalculateSisaBudget/${pr.id}`, {
                                            method: 'PUT'
                                        });
                                        const result = await res.json();
                                        if (result.success) {
                                            toast.success("Recalculate Berhasil", {
                                                description: result.message
                                            });
                                            router.refresh();
                                            // Close and reopen or just tell user to refresh? 
                                            // router.refresh() should update server components, 
                                            // but since this dialog handles its own 'pr' prop, 
                                            // we might need to tell user to close/reopen or update local state if possible.
                                            // However, router.refresh() is usually enough for data consistency.
                                            onOpenChange(false);
                                        } else {
                                            throw new Error(result.message);
                                        }
                                    } catch (err: any) {
                                        toast.error("Recalculate Gagal", {
                                            description: err.message
                                        });
                                    } finally {
                                        setIsSubmitting(false);
                                    }
                                }}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                ) : (
                                    <Info className="h-3 w-3 mr-1" />
                                )}
                                re-Calculate
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Batal
                        </Button>
                        <Button
                            className={cn(
                                "font-bold px-8",
                                isRefund
                                    ? "bg-blue-600 hover:bg-blue-700"
                                    : "bg-rose-600 hover:bg-rose-700"
                            )}
                            onClick={handleSettle}
                            disabled={isSubmitting || (Number(pr.sisaBudget || 0) === 0)}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                isRefund ? "Proses Refund" : "Proses Reimbursment"
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
