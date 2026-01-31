"use client";

import React, { useState, useEffect } from "react";
import {
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Loader2,
    Calculator,
    FileText,
    ArrowRightCircle,
    Info,
    ShieldAlert,
    RefreshCw
} from "lucide-react";
import {
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { getClosingValidation, closePeriod } from "@/lib/action/accounting/period";
import { AccountingPeriod } from "@/schemas/accounting/period";
import { toast } from "sonner";

interface ClosingWizardProps {
    period: AccountingPeriod;
    onClose: () => void;
    onSuccess: () => void;
}

export function ClosingWizard({ period, onClose, onSuccess }: ClosingWizardProps) {
    const [step, setStep] = useState<'validating' | 'result' | 'closing'>('validating');
    const [validation, setValidation] = useState<any>(null);
    const [isClosing, setIsClosing] = useState(false);
    const [autoCreate, setAutoCreate] = useState(true);

    const runValidation = async () => {
        setStep('validating');
        try {
            const res = await getClosingValidation(period.id);
            setValidation(res);
            setStep('result');
        } catch (error: any) {
            toast.error(error.message);
            onClose();
        }
    };

    useEffect(() => {
        runValidation();
    }, [period.id]);

    const handleConfirmClose = async () => {
        setIsClosing(true);
        setStep('closing');
        try {
            const res = await closePeriod(period.id, autoCreate);
            if (res.success) {
                toast.success(`Periode ${period.periodCode} berhasil ditutup.`);
                onSuccess();
            }
        } catch (error: any) {
            toast.error(error.message);
            setStep('result');
        } finally {
            setIsClosing(false);
        }
    };

    if (step === 'validating') {
        return (
            <AlertDialogContent className="rounded-3xl max-w-md bg-white border-0 shadow-2xl p-8">
                <div className="flex flex-col items-center justify-center space-y-4 py-8">
                    <div className="relative">
                        <Loader2 className="h-12 w-12 text-emerald-500 animate-spin" />
                        <ActivityIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="text-center">
                        <AlertDialogTitle className="text-xl font-black text-gray-800 tracking-tight">Menjalankan Audit...</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-gray-500 mt-2 font-medium">
                            Sistem sedang melakukan pemeriksaan data transaksi,<br />saldo buku, dan dokumen sumber.
                        </AlertDialogDescription>
                    </div>
                </div>
            </AlertDialogContent>
        );
    }

    if (step === 'closing') {
        return (
            <AlertDialogContent className="rounded-3xl max-w-md bg-white border-0 shadow-2xl p-8">
                <div className="flex flex-col items-center justify-center space-y-4 py-8">
                    <RefreshCw className="h-12 w-12 text-emerald-500 animate-spin" />
                    <div className="text-center">
                        <AlertDialogTitle className="text-xl font-black text-gray-800 tracking-tight">Finalisasi Tutup Buku...</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-gray-500 mt-2 font-medium">
                            Mengunci transaksi, menghitung saldo akhir,<br />dan memindahkan saldo ke bulan baru.
                        </AlertDialogDescription>
                    </div>
                </div>
            </AlertDialogContent>
        );
    }

    const canClose = validation?.success;

    return (
        <AlertDialogContent className="rounded-3xl max-w-lg bg-white border-0 shadow-2xl p-0 overflow-hidden">
            <div className="bg-emerald-600 p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                    <Calculator className="h-32 w-32" />
                </div>
                <div className="relative z-10">
                    <Badge className="bg-emerald-400/30 text-emerald-50 border-0 mb-2 uppercase text-[10px] font-black tracking-widest">Verify & Close</Badge>
                    <AlertDialogTitle className="text-2xl font-black tracking-tight leading-none">Tutup Buku: {period.periodName}</AlertDialogTitle>
                    <AlertDialogDescription className="text-emerald-50/80 text-xs mt-2 leading-relaxed">
                        Audit otomatis telah selesai. Pastikan semua persyaratan di bawah ini terpenuhi sebelum mengunci periode.
                    </AlertDialogDescription>
                </div>
            </div>

            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                {/* 1. Transaction Status */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-emerald-600" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">Status Dokumen & Jurnal</h4>
                    </div>

                    <div className="grid gap-2">
                        <ValidationStep
                            label="Ledger/Jurnal (DRAFT)"
                            count={validation.summary.draftLedgers}
                            description="Semua entri jurnal harus di-POSTED agar masuk ke buku besar."
                        />
                        <ValidationStep
                            label="Invoice & Penjualan (DRAFT)"
                            count={validation.summary.draftInvoices}
                            description="Faktur yang masih draft tidak akan dihitung dalam laporan keuangan."
                        />
                        <ValidationStep
                            label="Biaya / Opex (DRAFT)"
                            count={validation.summary.draftExpenses}
                            description="Semua pengajuan biaya harus sudah disetujui atau dibayar."
                        />
                        <ValidationStep
                            label="Purchase Order (DRAFT)"
                            count={validation.summary.draftPurchaseOrders}
                            description="Pesanan pembelian yang aktif mempengaruhi liabilitas."
                        />
                    </div>
                </div>

                <Separator className="bg-gray-100" />

                {/* 2. Balance Check */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 text-emerald-600" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">Integritas Saldo</h4>
                    </div>

                    <div className={`p-4 rounded-2xl border flex items-center justify-between ${validation.summary.isBalanced ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50/50 border-red-100'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${validation.summary.isBalanced ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                {validation.summary.isBalanced ? <CheckCircle2 className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                            </div>
                            <div>
                                <p className="text-xs font-black text-gray-800">Keseimbangan Debit/Kredit</p>
                                <p className="text-[10px] text-gray-500 font-medium leading-tight">Total mutasi harus 0 (balance) di akhir periode.</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-600">IDR {validation.summary.totalDebit.toLocaleString()}</p>
                            <Badge variant="outline" className={`text-[8px] font-black ${validation.summary.isBalanced ? 'text-emerald-600' : 'text-red-600'}`}>
                                {validation.summary.isBalanced ? 'BALANCE' : 'UNBALANCED'}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* 3. Automation Option */}
                {canClose && (
                    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-3">
                        <div className="flex items-start gap-3">
                            <Checkbox
                                id="autoCreate"
                                checked={autoCreate}
                                onCheckedChange={(checked) => setAutoCreate(!!checked)}
                                className="mt-1"
                            />
                            <div className="grid gap-1">
                                <label htmlFor="autoCreate" className="text-xs font-black text-blue-800 cursor-pointer">Buat periode baru secara otomatis?</label>
                                <p className="text-[10px] text-blue-600/80 font-medium leading-relaxed">
                                    Sistem akan membuat periode berikutnya dan memindahkan **Saldo Akhir** bulan ini menjadi **Saldo Awal** bulan depan. Sangat direkomendasikan.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <AlertDialogFooter className="p-6 bg-gray-50 border-t flex-col md:flex-row gap-3">
                <AlertDialogCancel onClick={onClose} className="rounded-2xl h-12 flex-1 border-gray-200 font-bold text-gray-500 hover:bg-white m-0">
                    Batal
                </AlertDialogCancel>
                <Button
                    disabled={!canClose || isClosing}
                    onClick={handleConfirmClose}
                    className="rounded-2xl h-12 flex-1 bg-emerald-600 hover:bg-emerald-700 font-black text-white shadow-xl shadow-emerald-600/20 m-0"
                >
                    {isClosing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightCircle className="h-4 w-4 mr-2" />}
                    Finalisasi Tutup Buku
                </Button>
            </AlertDialogFooter>
        </AlertDialogContent>
    );
}

function ValidationStep({ label, count, description }: { label: string, count: number, description: string }) {
    const isError = count > 0;
    return (
        <div className={`p-3 rounded-xl border flex items-start justify-between gap-4 transition-all ${isError ? 'border-amber-100 bg-white shadow-sm' : 'border-emerald-100/50 bg-emerald-50/20'}`}>
            <div className="flex gap-3">
                <div className={`mt-0.5 ${isError ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {isError ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                </div>
                <div className="grid gap-0.5">
                    <span className={`text-[11px] font-black ${isError ? 'text-gray-800' : 'text-emerald-700'}`}>{label}</span>
                    <span className="text-[10px] text-gray-500 font-medium leading-tight">{description}</span>
                </div>
            </div>
            <div className="flex-shrink-0">
                {isError ? (
                    <Badge variant="destructive" className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 px-2 py-0.5 rounded-lg text-[9px] font-black">
                        {count} ITEM
                    </Badge>
                ) : (
                    <div className="bg-emerald-100 text-emerald-600 p-1 rounded-lg">
                        <CheckCircle2 className="h-3 w-3" />
                    </div>
                )}
            </div>
        </div>
    );
}

function ActivityIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    );
}
