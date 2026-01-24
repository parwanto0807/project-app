"use client";

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
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, FileText, Lock } from "lucide-react";

interface MRIssueConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    mrNumber: string;
    isWipWarehouse: boolean;
    totalAmount?: number;
    isLoading?: boolean;
}

export function MRIssueConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
    mrNumber,
    isWipWarehouse,
    totalAmount = 0,
    isLoading = false,
}: MRIssueConfirmDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/20">
                            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                        </div>
                        <AlertDialogTitle className="text-lg">
                            Konfirmasi Pengeluaran Barang
                        </AlertDialogTitle>
                    </div>
                    <AlertDialogDescription asChild>
                        <div className="space-y-4 text-left">
                            {/* MR Info */}
                            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Material Requisition
                                    </span>
                                    <Badge variant="outline" className="font-mono text-xs">
                                        {mrNumber}
                                    </Badge>
                                </div>
                                {totalAmount > 0 && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600 dark:text-slate-400">
                                            Total Nilai Material
                                        </span>
                                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                            Rp {totalAmount.toLocaleString("id-ID")}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Warning for WIP Warehouse */}
                            {isWipWarehouse && (
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
                                    <div className="flex items-start gap-2">
                                        <FileText className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                                                Jurnal Akuntansi Akan Dibuat
                                            </p>
                                            <p className="text-xs text-amber-700 dark:text-amber-300">
                                                Pengeluaran dari gudang WIP akan otomatis mencatat jurnal:
                                            </p>
                                            <div className="mt-2 space-y-1 text-xs font-mono bg-white dark:bg-slate-950 p-2 rounded border border-amber-200 dark:border-amber-800">
                                                <div className="flex justify-between">
                                                    <span className="text-green-600 dark:text-green-400">DEBIT:</span>
                                                    <span>5-10101 Biaya Material Proyek</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-red-600 dark:text-red-400">CREDIT:</span>
                                                    <span>1-10205 Persediaan On WIP</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Irreversible Warning */}
                            <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                                <div className="flex items-start gap-2">
                                    <Lock className="h-4 w-4 text-red-600 dark:text-red-500 mt-0.5 flex-shrink-0" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-red-900 dark:text-red-100">
                                            Tindakan Tidak Dapat Dibatalkan
                                        </p>
                                        <ul className="text-xs text-red-700 dark:text-red-300 space-y-1 list-disc list-inside">
                                            <li>Stok akan terpotong secara permanen (FIFO)</li>
                                            {isWipWarehouse && (
                                                <li>Jurnal akuntansi akan di-posting otomatis</li>
                                            )}
                                            <li>Status MR akan berubah menjadi ISSUED</li>
                                            <li>Data tidak dapat diubah setelah proses ini</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Confirmation Question */}
                            <p className="text-sm font-medium text-center text-slate-900 dark:text-slate-100 pt-2">
                                Apakah Anda yakin ingin melanjutkan?
                            </p>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>
                        Batal
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                        }}
                        disabled={isLoading}
                        className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                    >
                        {isLoading ? (
                            <>
                                <span className="animate-spin mr-2">⏳</span>
                                Memproses...
                            </>
                        ) : (
                            <>
                                <FileText className="h-4 w-4 mr-2" />
                                Ya, Keluarkan Barang
                            </>
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
