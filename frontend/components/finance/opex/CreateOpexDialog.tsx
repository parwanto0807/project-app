"use client";

import React, { useEffect, useState, useRef } from "react";
import { Banknote, Plus, Search, RefreshCw, Filter, TrendingUp, Wallet, CheckCircle, Clock, AlertCircle, HelpCircle, Info, Upload, X, Image as ImageIcon, FileText } from "lucide-react";
import { CoaType } from "@/types/coa";
import { toast } from "sonner";
import { createOperationalExpense } from "@/lib/action/operationalExpense";
import { getSystemAccounts } from "@/lib/action/systemAccount";
import { coaApi } from "@/lib/action/coa/coa";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, formatCurrencyNumber } from "@/lib/utils";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

const CreateOpexDialog: React.FC<Props> = ({ open, onOpenChange, onSuccess }) => {
    const [submitting, setSubmitting] = useState(false);
    const [categories, setCategories] = useState<{ id: string, name: string, code: string }[]>([]);
    const [fundSources, setFundSources] = useState<{ id: string, name: string, code: string, balance?: number }[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        description: "",
        amount: "",
        expenseAccountId: "",
        paidFromAccountId: ""
    });

    useEffect(() => {
        if (!open) return;

        const loadAccounts = async () => {
            const coaResult = await coaApi.getCOAs({ type: CoaType.BEBAN, limit: 1000 });
            if (coaResult.success) {
                const postingAccounts = coaResult.data.filter((c: any) => c.postingType === 'POSTING');
                setCategories(postingAccounts);
            }

            const assetResult = await coaApi.getCOAsWithBalance(CoaType.ASET);
            if (assetResult.success) {
                const filteredAssets = assetResult.data.filter((c: any) =>
                    (c.code.startsWith('1-1') || c.name.toLowerCase().includes('kas') || c.name.toLowerCase().includes('bank')) &&
                    c.postingType === 'POSTING'
                );
                setFundSources(filteredAssets);
            }
        };

        loadAccounts();
    }, [open]);

    // Handle file selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File terlalu besar (Maks 5MB)");
                return;
            }
            setSelectedFile(file);

            // Create preview if it's an image
            if (file.type.startsWith('image/')) {
                const url = URL.createObjectURL(file);
                setPreviewUrl(url);
            } else {
                setPreviewUrl(null);
            }
        }
    };

    const removeFile = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.description || !formData.amount || !formData.expenseAccountId) {
            toast.error("Mohon isi semua field wajib (*)");
            return;
        }

        setSubmitting(true);

        // Prepare FormData
        const submitData = new FormData();
        submitData.append('date', formData.date);
        submitData.append('description', formData.description);
        submitData.append('amount', formData.amount);
        submitData.append('expenseAccountId', formData.expenseAccountId);
        if (formData.paidFromAccountId) {
            submitData.append('paidFromAccountId', formData.paidFromAccountId);
        }
        if (selectedFile) {
            submitData.append('receipt', selectedFile);
        }

        const result = await createOperationalExpense(submitData);

        if (result.success) {
            toast.success("Biaya operasional berhasil dicatat sebagai DRAFT");
            onSuccess();
            onOpenChange(false);
            resetForm();
        } else {
            toast.error(result.error);
        }
        setSubmitting(false);
    };

    const resetForm = () => {
        setFormData({
            date: new Date().toISOString().split('T')[0],
            description: "",
            amount: "",
            expenseAccountId: "",
            paidFromAccountId: ""
        });
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            onOpenChange(val);
            if (!val) resetForm();
        }}>
            <DialogContent className="sm:max-w-[600px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white sticky top-0 z-10">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                <Banknote className="h-6 w-6" />
                                Catat Biaya Operasional
                            </DialogTitle>
                            <DialogDescription className="text-blue-100 opacity-90">
                                Masukkan rincian pengeluaran rutin kantor atau operasional non-proyek.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-6 space-y-6 bg-white">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="date" className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                    Tanggal Biaya <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="date"
                                    type="date"
                                    className="rounded-xl border-slate-200 focus:ring-blue-500 h-11 transition-all hover:border-blue-300"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="amount" className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                        Nominal (IDR) <span className="text-rose-500">*</span>
                                    </Label>
                                    {formData.amount && !isNaN(Number(formData.amount)) && (
                                        <span className="text-[14px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full animate-in fade-in slide-in-from-right-1">
                                            {formatCurrencyNumber(Number(formData.amount))}
                                        </span>
                                    )}
                                </div>
                                <Input
                                    id="amount"
                                    type="number"
                                    placeholder="0"
                                    className="rounded-xl border-slate-200 focus:ring-blue-500 h-11 font-bold transition-all hover:border-blue-300"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Balance Warning */}
                        {formData.amount && formData.paidFromAccountId && (() => {
                            const selectedSource = fundSources.find(s => s.id === formData.paidFromAccountId);
                            if (selectedSource && Number(formData.amount) > (selectedSource.balance || 0)) {
                                return (
                                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                        <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
                                            <AlertCircle className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-amber-900">Peringatan: Saldo Tidak Mencukupi</p>
                                            <p className="text-[10px] text-amber-700">Nominal pengeluaran melebihi saldo kas/bank saat ini ({formatCurrencyNumber(selectedSource.balance || 0)}).</p>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        })()}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                    Kategori Pengeluaran <span className="text-rose-500">*</span>
                                </Label>
                                <Select
                                    value={formData.expenseAccountId}
                                    onValueChange={(val) => setFormData({ ...formData, expenseAccountId: val })}
                                >
                                    <SelectTrigger className="rounded-xl border-slate-200 h-11 bg-slate-50/50 hover:bg-white transition-all">
                                        <SelectValue placeholder="Pilih Kategori..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200">
                                        {categories.map((coa) => (
                                            <SelectItem key={coa.id} value={coa.id}>
                                                <div className="flex flex-col text-left">
                                                    <span className="font-medium text-sm">{coa.name}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono">{coa.code}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                    Sumber Dana <span className="text-slate-400 text-[10px] font-normal lowercase">(Opsional di Draft)</span>
                                </Label>
                                <Select
                                    value={formData.paidFromAccountId}
                                    onValueChange={(val) => setFormData({ ...formData, paidFromAccountId: val })}
                                >
                                    <SelectTrigger className="rounded-xl border-slate-200 h-11 bg-slate-50/50 hover:bg-white transition-all">
                                        <SelectValue placeholder="Pilih Kas/Bank..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200">
                                        {fundSources.map((coa) => (
                                            <SelectItem key={coa.id} value={coa.id}>
                                                <div className="flex flex-col text-left w-full">
                                                    <div className="flex items-center justify-between gap-4 w-full">
                                                        <span className="font-medium text-sm truncate">{coa.name}</span>
                                                        <span className={cn(
                                                            "text-[11px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap",
                                                            (coa.balance || 0) < 0 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                                                        )}>
                                                            {formatCurrencyNumber(coa.balance || 0)}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 font-mono">{coa.code}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                Keterangan / Deskripsi <span className="text-rose-500">*</span>
                            </Label>
                            <Textarea
                                id="description"
                                placeholder="Contoh: Pembayaran listrik kantor bulan Januari 2024"
                                className="rounded-xl border-slate-200 focus:ring-blue-500 min-h-[80px] transition-all hover:border-blue-300"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Bukti Pengeluaran / Nota</Label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={cn(
                                    "border-2 border-dashed rounded-2xl p-6 transition-all cursor-pointer group flex flex-col items-center justify-center gap-3",
                                    selectedFile ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200 hover:border-blue-400 hover:bg-blue-50/30"
                                )}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*,application/pdf"
                                    onChange={handleFileChange}
                                />

                                {selectedFile ? (
                                    <div className="flex flex-col items-center w-full animate-in fade-in zoom-in duration-300">
                                        {previewUrl ? (
                                            <div className="relative w-full max-w-[200px] aspect-video rounded-lg overflow-hidden border border-emerald-200 shadow-sm mb-3">
                                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); removeFile(); }}
                                                    className="absolute top-1 right-1 bg-rose-500 text-white p-1 rounded-full shadow-lg hover:bg-rose-600"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-emerald-200 shadow-sm mb-3">
                                                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                                                    <FileText className="h-5 w-5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-700 truncate max-w-[200px]">{selectedFile.name}</span>
                                                    <span className="text-[10px] text-slate-400">PDF Document</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); removeFile(); }}
                                                    className="text-slate-400 hover:text-rose-500"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                        <p className="text-xs font-medium text-emerald-600">Klik untuk mengganti file</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="p-3 bg-slate-100 rounded-2xl text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-500 transition-colors">
                                            <Upload className="h-6 w-6" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-bold text-slate-600 group-hover:text-blue-600">Pilih atau Drag Bukti Nota</p>
                                            <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, WebP atau PDF (Maks 5MB)</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-2xl flex gap-3 border border-blue-100">
                            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-blue-900">Petunjuk Jurnal Otomatis</p>
                                <p className="text-[10px] text-blue-700 leading-relaxed italic">
                                    "Biaya operasional yang Anda simpan akan masuk sebagai **Draft**. Jurnal akuntansi hanya akan terbentuk secara otomatis jika transaksi telah **Disetujui/Approved** oleh Admin Keuangan."
                                </p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 gap-2 sticky bottom-0">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl px-6 font-semibold hover:bg-slate-200"
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 font-bold shadow-lg shadow-blue-100 h-11 transition-all hover:-translate-y-0.5"
                        >
                            {submitting ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                "Simpan Draft"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateOpexDialog;
