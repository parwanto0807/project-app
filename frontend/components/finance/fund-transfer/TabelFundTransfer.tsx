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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, ArrowRight, FileText, CheckCircle2, XCircle, AlertCircle, Clock, Loader2, Pencil, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { formatCurrencyNumber } from "@/lib/utils";
import { FundTransfer } from "@/types/finance/fundTransfer";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { postFundTransfer, deleteFundTransfer } from "@/lib/action/fundTransfer";
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
import EditFundTransferDialog from "./EditFundTransferDialog";
import { BlobProvider } from "@react-pdf/renderer";
import FundTransferVoucherPDF from "./FundTransferVoucherPDF";

interface TabelFundTransferProps {
    data: FundTransfer[];
    isLoading: boolean;
    onView: (transfer: FundTransfer) => void;
    onVoid: (transfer: FundTransfer) => void;
    onRefresh: () => void;
}

const TabelFundTransfer = ({ data, isLoading, onView, onVoid, onRefresh }: TabelFundTransferProps) => {
    const [postingId, setPostingId] = useState<string | null>(null);
    const [isPosting, setIsPosting] = useState(false);

    // New states for Edit and Delete
    const [editTransfer, setEditTransfer] = useState<FundTransfer | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // State untuk PDF loading per row
    const [pdfLoadingStates, setPdfLoadingStates] = useState<Record<string, boolean>>({});

    if (isLoading) {
        return (
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mb-2 opacity-20" />
                    <p>Belum ada data transfer dana.</p>
                </CardContent>
            </Card>
        );
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'DRAFT':
                return <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">
                    <Clock className="w-3 h-3 mr-1" /> Draft
                </Badge>;
            case 'POSTED':
                return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Posted
                </Badge>;
            case 'VOIDED':
                return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
                    <XCircle className="w-3 h-3 mr-1" /> Voided
                </Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const handlePost = async () => {
        if (!postingId) return;

        setIsPosting(true);
        try {
            const result = await postFundTransfer(postingId);
            if (result.success) {
                toast.success("Transfer berhasil diposting ke Buku Besar");
                onRefresh();
            } else {
                toast.error(result.message || "Gagal memposting transfer");
            }
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan sistem");
        } finally {
            setIsPosting(false);
            setPostingId(null);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            const result = await deleteFundTransfer(deleteId);
            if (result.success) {
                toast.success("Draft transfer berhasil dihapus");
                onRefresh();
            } else {
                toast.error(result.message || "Gagal menghapus draft");
            }
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan sistem");
        } finally {
            setIsDeleting(false);
            setDeleteId(null);
        }
    };

    const handleOpenPDF = (blob: Blob | null, transferId: string, transferNo: string) => {
        if (!blob) {
            toast.error("Gagal membuat dokumen PDF");
            return;
        }

        try {
            // Buat URL dari blob
            const pdfUrl = URL.createObjectURL(blob);

            // Buka di tab baru
            const newWindow = window.open(pdfUrl, '_blank');

            if (!newWindow) {
                toast.warning("Popup diblokir! Izinkan popup untuk situs ini.");
                URL.revokeObjectURL(pdfUrl);
                return;
            }

            // Focus ke window baru
            newWindow.focus();

            // Cleanup URL setelah beberapa detik
            setTimeout(() => {
                URL.revokeObjectURL(pdfUrl);
                setPdfLoadingStates(prev => ({ ...prev, [transferId]: false }));
            }, 1000);

            toast.success("Dokumen PDF berhasil dibuka di tab baru");

        } catch (error) {
            console.error('Error opening PDF:', error);
            toast.error("Gagal membuka dokumen PDF");
            setPdfLoadingStates(prev => ({ ...prev, [transferId]: false }));
        }
    };

    const startPdfLoading = (transferId: string) => {
        setPdfLoadingStates(prev => ({ ...prev, [transferId]: true }));
    };

    return (
        <div className="rounded-md border bg-white overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-slate-50">
                    <TableRow>
                        <TableHead className="w-[180px]">No. Transfer</TableHead>
                        <TableHead className="w-[120px]">Tanggal</TableHead>
                        <TableHead>Deskripsi Akun</TableHead>
                        <TableHead className="text-right">Nominal</TableHead>
                        <TableHead className="text-center w-[120px]">Status</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((transfer) => (
                        <TableRow key={transfer.id} className="hover:bg-slate-50/50 transition-colors">
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-bold text-slate-900">{transfer.transferNo}</span>
                                    {transfer.referenceNo && (
                                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Ref: {transfer.referenceNo}</span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="text-sm">
                                {format(new Date(transfer.transferDate), "dd MMM yyyy")}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col max-w-[180px]">
                                        <span className="text-xs font-semibold text-slate-600 truncate">DARI :</span>
                                        <span className="text-sm font-medium truncate">{transfer.fromAccount?.name}</span>
                                        <span className="text-[10px] text-slate-400">{transfer.fromAccount?.code}</span>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-slate-300 flex-shrink-0" />
                                    <div className="flex flex-col max-w-[180px]">
                                        <span className="text-xs font-semibold text-slate-600 truncate">KE :</span>
                                        <span className="text-sm font-medium truncate">{transfer.toAccount?.name}</span>
                                        <span className="text-[10px] text-slate-400">{transfer.toAccount?.code}</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex flex-col">
                                    <span className="font-bold text-slate-900">
                                        {formatCurrencyNumber(Number(transfer.totalAmount))}
                                    </span>
                                    {Number(transfer.feeAmount) > 0 && (
                                        <span className="text-[10px] text-rose-500 font-medium">
                                            Inc. Fee: {formatCurrencyNumber(Number(transfer.feeAmount))}
                                        </span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="text-center">
                                {getStatusBadge(transfer.status)}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 transition-all hover:scale-110 shadow-sm"
                                                    onClick={() => onView(transfer)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-white text-indigo-900 border-indigo-100">Lihat Detail</TooltipContent>
                                        </Tooltip>

                                        {/* Print Action for Posted Transfers */}
                                        {transfer.status === 'POSTED' && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div>
                                                        <BlobProvider
                                                            document={<FundTransferVoucherPDF data={transfer} />}
                                                        >
                                                            {({ blob, loading, error }) => {
                                                                if (error) {
                                                                    console.error('PDF generation error:', error);
                                                                    return (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100 transition-all hover:scale-110 shadow-sm"
                                                                            onClick={() => toast.error("Gagal membuat PDF")}
                                                                        >
                                                                            <Printer className="h-4 w-4" />
                                                                        </Button>
                                                                    );
                                                                }

                                                                const isLoading = pdfLoadingStates[transfer.id] || loading;

                                                                return (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100 transition-all hover:scale-110 shadow-sm"
                                                                        onClick={() => {
                                                                            if (!isLoading && blob) {
                                                                                handleOpenPDF(blob, transfer.id, transfer.transferNo);
                                                                            }
                                                                        }}
                                                                        disabled={isLoading}
                                                                    >
                                                                        {isLoading ? (
                                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                                        ) : (
                                                                            <Printer className="h-4 w-4" />
                                                                        )}
                                                                    </Button>
                                                                );
                                                            }}
                                                        </BlobProvider>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-white text-slate-900 border-slate-100">
                                                    {pdfLoadingStates[transfer.id] ? "Menyiapkan PDF..." : "Buka Voucher PDF"}
                                                </TooltipContent>
                                            </Tooltip>
                                        )}

                                        {/* Draft Actions: Edit, Delete, Post */}
                                        {transfer.status === 'DRAFT' && (
                                            <>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-100 transition-all hover:scale-110 shadow-sm"
                                                            onClick={() => setEditTransfer(transfer)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="bg-white text-amber-900 border-amber-100">Edit Draft</TooltipContent>
                                                </Tooltip>

                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 transition-all hover:scale-110 shadow-sm"
                                                            onClick={() => setDeleteId(transfer.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="bg-white text-rose-900 border-rose-100">Hapus Draft</TooltipContent>
                                                </Tooltip>

                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 transition-all hover:scale-110 shadow-sm"
                                                            onClick={() => setPostingId(transfer.id)}
                                                        >
                                                            <CheckCircle2 className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="bg-white text-emerald-900 border-emerald-100">Posting ke GL</TooltipContent>
                                                </Tooltip>
                                            </>
                                        )}

                                        {transfer.status === 'POSTED' && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-400 border border-slate-100 transition-all hover:scale-110 shadow-sm"
                                                        onClick={() => onVoid(transfer)}
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-white text-slate-600 border-slate-100">Void Transaksi</TooltipContent>
                                            </Tooltip>
                                        )}
                                    </TooltipProvider>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* Dialog Edit */}
            {editTransfer && (
                <EditFundTransferDialog
                    open={!!editTransfer}
                    onOpenChange={(open) => !open && setEditTransfer(null)}
                    onSuccess={() => {
                        onRefresh();
                        setEditTransfer(null);
                    }}
                    data={editTransfer}
                />
            )}

            {/* Dialog Hapus Draft */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-rose-500" />
                            Hapus Draft Transfer
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus draft transfer dana ini? Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-xl h-11 border-slate-200">Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                            disabled={isDeleting}
                            className="rounded-xl h-11 bg-rose-600 hover:bg-rose-700 text-white font-bold px-6"
                        >
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Ya, Hapus Sekarang"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dialog Posting */}
            <AlertDialog open={!!postingId} onOpenChange={(open) => !open && setPostingId(null)}>
                <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            Konfirmasi Posting Jurnal
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="text-slate-600">
                                Apakah Anda yakin ingin melakukan posting untuk transfer dana ini?
                                <br /><br />
                                Tindakan ini akan membuat entri jurnal otomatis di Buku Besar dan mengurangi saldo akun asal serta menambah saldo akun tujuan.
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-xl h-11 border-slate-200">Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handlePost();
                            }}
                            disabled={isPosting}
                            className="rounded-xl h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6"
                        >
                            {isPosting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Ya, Posting Sekarang"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default TabelFundTransfer;