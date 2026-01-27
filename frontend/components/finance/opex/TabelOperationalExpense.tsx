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
import { Button } from "@/components/ui/button";
import {
    Eye,
    CheckCircle2,
    XCircle,
    Trash2,
    ExternalLink,
    Printer,
    FileText,
    Clock,
    Pencil,
    AlertTriangle
} from "lucide-react";
import { OperationalExpense, ExpenseStatus } from "@/types/finance/operationalExpense";
import { cn, formatCurrencyNumber, formatDate, getFullImageUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { updateOperationalExpenseStatus, deleteOperationalExpense } from "@/lib/action/operationalExpense";
import { coaApi } from "@/lib/action/coa/coa";
import { CoaType } from "@/types/coa";
import { toast } from "sonner";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { pdf } from "@react-pdf/renderer";
import OperationalExpensePDF from "./OperationalExpensePDF";
import OperationalExpenseListPDF from "./OperationalExpenseListPDF";
import OpexDetailDialog from "./OpexDetailDialog";
import EditOpexDialog from "./EditOpexDialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Props {
    data: OperationalExpense[];
    isLoading: boolean;
    onRefresh: () => void;
}

const statusConfig: Record<string, { label: string, color: string, icon: any }> = {
    DRAFT: { label: "Draft", color: "text-slate-500 bg-slate-50 border-slate-200", icon: FileText },
    PENDING_APPROVAL: { label: "Menunggu Approval", color: "text-amber-500 bg-amber-50 border-amber-200", icon: Clock },
    APPROVED: { label: "Disetujui & Posting", color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
    REJECTED: { label: "Ditolak", color: "text-rose-600 bg-rose-50 border-rose-200", icon: XCircle },
    PAID: { label: "Dibayar", color: "text-blue-600 bg-blue-50 border-blue-200", icon: CheckCircle2 },
    CANCELLED: { label: "Dibatalkan", color: "text-slate-400 bg-slate-100 border-slate-200", icon: Trash2 },
};

const TabelOperationalExpense: React.FC<Props> = ({ data, isLoading, onRefresh }) => {
    const [selectedOpex, setSelectedOpex] = useState<OperationalExpense | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isGeneratingListPdf, setIsGeneratingListPdf] = useState(false);
    const [assetBalances, setAssetBalances] = useState<Record<string, number>>({});

    useEffect(() => {
        const loadBalances = async () => {
            const result = await coaApi.getCOAsWithBalance(CoaType.ASET);
            if (result.success) {
                const balances: Record<string, number> = {};
                result.data.forEach((coa: any) => {
                    balances[coa.id] = coa.balance || 0;
                });
                setAssetBalances(balances);
            }
        };
        loadBalances();
    }, [data]); // Refresh when data changes (e.g. after refresh)

    const handleStatusUpdate = async (id: string, status: ExpenseStatus) => {
        const result = await updateOperationalExpenseStatus(id, status);
        if (result.success) {
            toast.success(`Status berhasil diperbarui menjadi ${status}`);
            onRefresh();
        } else {
            toast.error(result.error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;

        const result = await deleteOperationalExpense(id);
        if (result.success) {
            toast.success("Data berhasil dihapus");
            onRefresh();
        } else {
            toast.error(result.error);
        }
    };

    const handlePrintPdf = async (opex: OperationalExpense) => {
        setIsGeneratingPdf(true);
        try {
            const blob = await pdf(<OperationalExpensePDF data={opex} />).toBlob();
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast.error("Gagal membuat PDF Voucher");
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const handlePrintListPdf = async () => {
        if (data.length === 0) {
            toast.error("Tidak ada data untuk dicetak");
            return;
        }

        setIsGeneratingListPdf(true);
        try {
            const blob = await pdf(<OperationalExpenseListPDF data={data} />).toBlob();
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error("Error generating List PDF:", error);
            toast.error("Gagal membuat Laporan PDF");
        } finally {
            setIsGeneratingListPdf(false);
        }
    };

    if (isLoading) {
        return (
            <div className="w-full h-40 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Print List Button */}
            <div className="flex justify-end mb-4">
                <Button
                    onClick={handlePrintListPdf}
                    disabled={isGeneratingListPdf || data.length === 0}
                    variant="outline"
                    className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 transition-all font-medium"
                >
                    {isGeneratingListPdf ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                        <Printer className="h-4 w-4" />
                    )}
                    Cetak Laporan
                </Button>
            </div>

            <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-white">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-slate-50/50 border-b border-slate-100">
                            <TableHead className="w-[50px] font-bold text-slate-700">No</TableHead>
                            <TableHead className="font-bold text-slate-700">Tanggal</TableHead>
                            <TableHead className="font-bold text-slate-700">No. Bukti</TableHead>
                            <TableHead className="font-bold text-slate-700">Akun Biaya</TableHead>
                            <TableHead className="font-bold text-slate-700">Deskripsi</TableHead>
                            <TableHead className="font-bold text-slate-700 text-right">Nominal</TableHead>
                            <TableHead className="font-bold text-slate-700">Status</TableHead>
                            <TableHead className="font-bold text-slate-700 text-center w-[260px]">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                                    Belum ada data biaya operasional
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item, index) => {
                                const StatusIcon = statusConfig[item.status]?.icon || FileText;
                                return (
                                    <TableRow key={item.id} className="hover:bg-blue-50/30 transition-colors border-b border-slate-50 last:border-0 group">
                                        <TableCell className="font-medium text-slate-500">{index + 1}</TableCell>
                                        <TableCell className="font-medium">
                                            {formatDate(item.date)}
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-mono text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                                                {item.expenseNumber}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-slate-700">{item.expenseAccount?.name}</span>
                                                <span className="text-[10px] text-slate-400 font-mono">{item.expenseAccount?.code}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-[250px]">
                                            <p className="truncate text-slate-600 text-sm" title={item.description}>
                                                {item.description}
                                            </p>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-slate-700">
                                            {formatCurrencyNumber(Number(item.amount))}
                                        </TableCell>
                                        <TableCell>
                                            <div className={cn(
                                                "flex items-center gap-1.5 px-2.5 py-1 rounded-full w-fit border text-[11px] font-bold shadow-sm",
                                                statusConfig[item.status]?.color || "text-slate-500 bg-slate-50"
                                            )}>
                                                <StatusIcon className="h-3 w-3" />
                                                {statusConfig[item.status]?.label || item.status}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-center gap-1 opacity-100 transition-opacity">
                                                <TooltipProvider delayDuration={0}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 rounded-lg transition-all shadow-sm"
                                                                onClick={() => {
                                                                    setSelectedOpex(item);
                                                                    setDetailOpen(true);
                                                                }}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent><p>Lihat Detail</p></TooltipContent>
                                                    </Tooltip>

                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 rounded-lg transition-all shadow-sm"
                                                                onClick={() => handlePrintPdf(item)}
                                                                disabled={isGeneratingPdf}
                                                            >
                                                                <Printer className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent><p>Cetak Voucher PDF</p></TooltipContent>
                                                    </Tooltip>

                                                    {item.receiptUrl && (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <a
                                                                    href={item.receiptUrl}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="h-8 w-8 flex items-center justify-center text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-emerald-600 hover:border-emerald-200 rounded-lg transition-all shadow-sm"
                                                                >
                                                                    <ExternalLink className="h-4 w-4" />
                                                                </a>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>Lihat Bukti Foto/PDF</p></TooltipContent>
                                                        </Tooltip>
                                                    )}

                                                    {(item.status === 'DRAFT' || item.status === 'REJECTED') && (
                                                        <>
                                                            {/* Edit Button */}
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-amber-600 bg-amber-50 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 rounded-lg transition-all shadow-sm"
                                                                        onClick={() => {
                                                                            setSelectedOpex(item);
                                                                            setEditOpen(true);
                                                                        }}
                                                                    >
                                                                        <Pencil className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent><p>Edit Data</p></TooltipContent>
                                                            </Tooltip>

                                                            {/* Approve Button */}
                                                            {item.status === 'DRAFT' && (
                                                                <AlertDialog>
                                                                    <Tooltip delayDuration={0}>
                                                                        <TooltipTrigger asChild>
                                                                            <AlertDialogTrigger asChild>
                                                                                <Button
                                                                                    size="sm"
                                                                                    className="h-8 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 border border-emerald-600 hover:border-emerald-700 rounded-lg transition-all shadow-sm flex items-center gap-1.5 ml-1"
                                                                                >
                                                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                                                    Posting
                                                                                </Button>
                                                                            </AlertDialogTrigger>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>Setujui & Buat Jurnal</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle className="flex items-center gap-2">
                                                                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                                                                Konfirmasi Posting
                                                                            </AlertDialogTitle>
                                                                            <AlertDialogDescription asChild>
                                                                                <div className="space-y-4 pt-2">
                                                                                    <p className="text-muted-foreground text-sm font-medium">
                                                                                        Apakah Anda yakin ingin melakukan posting untuk biaya ini?
                                                                                        Data yang sudah diposting akan langsung tercatat di Buku Besar dan tidak dapat diubah secara langsung.
                                                                                    </p>

                                                                                    {item.paidFromAccountId && (
                                                                                        <div className={cn(
                                                                                            "p-4 rounded-2xl border flex flex-col gap-2",
                                                                                            (assetBalances[item.paidFromAccountId] || 0) < Number(item.amount)
                                                                                                ? "bg-rose-50 border-rose-100"
                                                                                                : "bg-slate-50 border-slate-100"
                                                                                        )}>
                                                                                            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                                                                                                <span>Sumber Dana:</span>
                                                                                                <span className="text-slate-700 font-mono">{item.paidFromAccount?.code}</span>
                                                                                            </div>
                                                                                            <div className="flex items-center justify-between">
                                                                                                <span className="text-sm font-medium text-slate-600">{item.paidFromAccount?.name}</span>
                                                                                                <span className={cn(
                                                                                                    "text-sm font-bold",
                                                                                                    (assetBalances[item.paidFromAccountId] || 0) < Number(item.amount) ? "text-rose-600" : "text-emerald-600"
                                                                                                )}>
                                                                                                    Saldo: {formatCurrencyNumber(assetBalances[item.paidFromAccountId] || 0)}
                                                                                                </span>
                                                                                            </div>

                                                                                            {(assetBalances[item.paidFromAccountId] || 0) < Number(item.amount) && (
                                                                                                <div className="flex items-start gap-2 mt-1 text-rose-600 animate-pulse">
                                                                                                    <AlertTriangle className="h-4 w-4 shrink-0" />
                                                                                                    <p className="text-[11px] font-bold leading-tight">
                                                                                                        Peringatan: Saldo tidak mencukupi untuk nominal posting {formatCurrencyNumber(Number(item.amount))}.
                                                                                                    </p>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>Batal</AlertDialogCancel>
                                                                            <AlertDialogAction
                                                                                onClick={() => handleStatusUpdate(item.id, 'APPROVED')}
                                                                                className={cn(
                                                                                    "text-white shadow-lg",
                                                                                    (item.paidFromAccountId && (assetBalances[item.paidFromAccountId] || 0) < Number(item.amount))
                                                                                        ? "bg-rose-600 hover:bg-rose-700 border-rose-600 shadow-rose-100"
                                                                                        : "bg-emerald-600 hover:bg-emerald-700 border-emerald-600 shadow-emerald-100"
                                                                                )}
                                                                            >
                                                                                Posting Sekarang
                                                                            </AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            )}

                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 hover:border-rose-300 rounded-lg transition-all shadow-sm ml-1"
                                                                        onClick={() => handleDelete(item.id)}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent><p>Hapus Data</p></TooltipContent>
                                                            </Tooltip>
                                                        </>
                                                    )}
                                                </TooltipProvider>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {selectedOpex && (
                <>
                    <OpexDetailDialog
                        open={detailOpen}
                        onOpenChange={setDetailOpen}
                        data={selectedOpex}
                    />
                    <EditOpexDialog
                        open={editOpen}
                        onOpenChange={setEditOpen}
                        onSuccess={onRefresh}
                        data={selectedOpex}
                    />
                </>
            )}
        </div>
    );
};

export default TabelOperationalExpense;
