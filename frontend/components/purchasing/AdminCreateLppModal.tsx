"use client";

import React, { useEffect, useState } from "react";
import {
    X,
    Camera,
    Plus,
    Send,
    Box,
    Receipt,
    User,
    DollarSign,
    Store,
    Calendar,
    CreditCard,
    Trash2,
    CheckCircle2,
    AlertCircle,
    FileText,
    Upload,
    Sparkles,
    ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { PurchaseOrder } from "@/types/poType";
import { fetchAllKaryawan } from "@/lib/action/master/karyawan";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ReceiptFile {
    file?: File;
    preview?: string;
    receiptNumber: string;
    storeName: string;
    receiptDate: string;
    totalAmount: number;
    paymentMethod: 'CASH' | 'TRANSFER' | 'CREDIT_CARD';
    notes?: string;
    materialPhotos: File[];
    materialPreviews: string[];
}

interface AdminCreateLppModalProps {
    isOpen: boolean;
    onClose: () => void;
    purchaseOrder: PurchaseOrder;
    onSuccess: () => void;
}

export default function AdminCreateLppModal({
    isOpen,
    onClose,
    purchaseOrder,
    onSuccess
}: AdminCreateLppModalProps) {
    const [selectedLineId, setSelectedLineId] = useState<string>("");
    const [selectedExecutorId, setSelectedExecutorId] = useState<string>("");
    const [karyawanList, setKaryawanList] = useState<any[]>([]);
    const [reportNotes, setReportNotes] = useState<string>("");
    const [receipts, setReceipts] = useState<ReceiptFile[]>([]);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isLoadingKaryawan, setIsLoadingKaryawan] = useState<boolean>(false);

    // Initialize form when modal opens
    useEffect(() => {
        if (isOpen) {
            // Default select first line if available
            if (purchaseOrder?.lines && purchaseOrder.lines.length > 0) {
                setSelectedLineId(purchaseOrder.lines[0].id);
            } else {
                setSelectedLineId("");
            }

            setSelectedExecutorId("");
            setReportNotes("");
            
            // Start with 1 empty receipt
            setReceipts([{
                file: undefined,
                preview: "",
                receiptNumber: "",
                storeName: "",
                receiptDate: new Date().toISOString().split('T')[0],
                totalAmount: 0,
                paymentMethod: 'CASH',
                notes: "",
                materialPhotos: [],
                materialPreviews: []
            }]);

            // Fetch Karyawan List for proxy selection
            loadKaryawan();
        }
    }, [isOpen, purchaseOrder]);

    const loadKaryawan = async () => {
        try {
            setIsLoadingKaryawan(true);
            const res = await fetchAllKaryawan();
            if (res && res.karyawan) {
                setKaryawanList(res.karyawan);
            }
        } catch (error) {
            console.error("Failed to load karyawan list:", error);
        } finally {
            setIsLoadingKaryawan(false);
        }
    };

    const addReceipt = () => {
        setReceipts(prev => [
            ...prev,
            {
                file: undefined,
                preview: "",
                receiptNumber: "",
                storeName: "",
                receiptDate: new Date().toISOString().split('T')[0],
                totalAmount: 0,
                paymentMethod: 'CASH',
                notes: "",
                materialPhotos: [],
                materialPreviews: []
            }
        ]);
    };

    const removeReceipt = (index: number) => {
        setReceipts(prev => {
            const item = prev[index];
            if (item.preview) URL.revokeObjectURL(item.preview);
            item.materialPreviews.forEach(p => URL.revokeObjectURL(p));
            return prev.filter((_, i) => i !== index);
        });
    };

    const updateReceipt = (index: number, field: keyof ReceiptFile, value: any) => {
        setReceipts(prev => prev.map((item, i) => 
            i === index ? { ...item, [field]: value } : item
        ));
    };

    const handleReceiptPhotoChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const preview = URL.createObjectURL(file);
            setReceipts(prev => prev.map((item, i) => {
                if (i === index) {
                    if (item.preview) URL.revokeObjectURL(item.preview);
                    return { ...item, file, preview };
                }
                return item;
            }));
        }
    };

    const handleMaterialPhotoChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            const newPreviews = newFiles.map(file => URL.createObjectURL(file));

            setReceipts(prev => prev.map((item, i) => {
                if (i === index) {
                    return {
                        ...item,
                        materialPhotos: [...item.materialPhotos, ...newFiles],
                        materialPreviews: [...item.materialPreviews, ...newPreviews]
                    };
                }
                return item;
            }));
        }
    };

    const removeMaterialPhoto = (receiptIndex: number, materialIndex: number) => {
        setReceipts(prev => prev.map((item, i) => {
            if (i === receiptIndex) {
                const newPhotos = [...item.materialPhotos];
                const newPreviews = [...item.materialPreviews];
                if (newPreviews[materialIndex]) URL.revokeObjectURL(newPreviews[materialIndex]);
                newPhotos.splice(materialIndex, 1);
                newPreviews.splice(materialIndex, 1);
                return { ...item, materialPhotos: newPhotos, materialPreviews: newPreviews };
            }
            return item;
        }));
    };

    const selectedLine = purchaseOrder?.lines?.find(l => l.id === selectedLineId);
    const totalActual = receipts.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);
    const totalPOLine = selectedLine ? Number(selectedLine.quantity) * Number(selectedLine.unitPrice) : 0;

    const handleSubmit = async () => {
        if (!selectedLineId) {
            toast.error("Silakan pilih Item PO yang dilaporkan terlebih dahulu.");
            return;
        }

        if (receipts.length === 0) {
            toast.error("Minimal harus ada 1 nota atau kwitansi.");
            return;
        }

        const invalidReceipt = receipts.find(r => !r.totalAmount || r.totalAmount <= 0);
        if (invalidReceipt) {
            toast.error("Semua nota harus memiliki nominal biaya (Total Biaya) yang valid.");
            return;
        }

        try {
            setIsSubmitting(true);
            const formData = new FormData();
            formData.append('poLineId', selectedLineId);
            formData.append('notes', reportNotes || (selectedExecutorId ? `[Input Bantu Admin] Laporan dicatat atas nama pelaksana lapangan.` : `[Input Bantu Admin] Laporan dicatat langsung oleh Admin.`));
            
            if (selectedExecutorId) {
                formData.append('executorId', selectedExecutorId);
            }

            const receiptsData = receipts.map((r) => ({
                receiptNumber: r.receiptNumber || `NOTA-${Date.now().toString().slice(-6)}`,
                storeName: r.storeName || "Toko Lapangan / Umum",
                receiptDate: r.receiptDate,
                totalAmount: Number(r.totalAmount),
                paymentMethod: r.paymentMethod,
                notes: r.notes || ""
            }));
            formData.append('receiptsData', JSON.stringify(receiptsData));

            // Append receipt photos and material photos
            receipts.forEach((receipt, index) => {
                if (receipt.file) {
                    formData.append('receiptPhotos', receipt.file);
                }
                receipt.materialPhotos.forEach(file => {
                    formData.append('materialPhotos', file);
                    formData.append('material_photo_map', index.toString());
                });
            });

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/po/${purchaseOrder.id}/execution`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Laporan Pembelian Lapangan (LPB) berhasil dibuat!", {
                    duration: 5000,
                    style: {
                        background: '#10b981',
                        color: '#ffffff',
                        fontWeight: 'bold'
                    }
                });
                onSuccess();
                onClose();
            } else {
                toast.error(data.error || "Gagal membuat laporan lapangan.");
            }
        } catch (error) {
            console.error("Error submitting assisted LPP:", error);
            toast.error("Terjadi kesalahan sistem saat menyimpan laporan.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white dark:bg-gray-900 w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-gray-100 dark:border-gray-800"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-5 flex justify-between items-center text-white shrink-0 shadow-md">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
                                    <Receipt className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="font-bold text-lg leading-tight">
                                            Input Laporan Bon (Bantu Admin)
                                        </h2>
                                        <span className="bg-white/20 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                            Proxy Entry
                                        </span>
                                    </div>
                                    <p className="text-xs text-white/90 mt-0.5">
                                        Catat bukti foto WA atau bon fisik yang diserahkan dari tim lapangan • PO: <span className="font-bold underline">{purchaseOrder?.poNumber}</span>
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={onClose} 
                                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                                aria-label="Close modal"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body Scrollable */}
                        <div className="p-6 overflow-y-auto space-y-6 flex-grow custom-scrollbar">
                            
                            {/* Step 1: Pilih Item PO & Pelaksana */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-amber-50/50 dark:bg-amber-950/10 p-5 rounded-2xl border border-amber-200/60 dark:border-amber-900/40">
                                {/* Pilih Item PO */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                                        <Box className="w-3.5 h-3.5 text-amber-600" />
                                        1. Pilih Item PO yang Dilaporkan <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={selectedLineId}
                                        onChange={(e) => setSelectedLineId(e.target.value)}
                                        className="w-full h-11 px-3.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all dark:text-gray-100 shadow-sm"
                                    >
                                        <option value="" disabled>-- Pilih Item Barang --</option>
                                        {purchaseOrder?.lines?.map((line) => (
                                            <option key={line.id} value={line.id}>
                                                {line.product?.name || line.description || "Item Barang"} ({line.product?.code || line.product?.sku || "-"}) - Qty: {line.quantity} {line.product?.purchaseUnit || line.product?.usageUnit || ""}
                                            </option>
                                        ))}
                                    </select>
                                    {selectedLine && (
                                        <div className="text-[11px] text-gray-600 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 p-2.5 rounded-xl border border-amber-100 dark:border-gray-700 flex justify-between items-center mt-1.5 shadow-sm">
                                            <span>Harga Satuan: <b>Rp {Number(selectedLine.unitPrice).toLocaleString('id-ID')}</b></span>
                                            <span className="text-amber-700 dark:text-amber-400 font-bold">Total PO: Rp {totalPOLine.toLocaleString('id-ID')}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Pilih Pelaksana Lapangan */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5 text-blue-600" />
                                        2. Pelaksana Lapangan (Jejak Audit)
                                    </label>
                                    <select
                                        value={selectedExecutorId}
                                        onChange={(e) => setSelectedExecutorId(e.target.value)}
                                        disabled={isLoadingKaryawan}
                                        className="w-full h-11 px-3.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-gray-100 shadow-sm"
                                    >
                                        <option value="">-- Default (Dicatat atas nama Admin saat ini) --</option>
                                        {karyawanList.map((k: any) => (
                                            <option key={k.id} value={k.id}>
                                                {k.namaLengkap} {k.jabatan ? `(${k.jabatan})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-[11px] text-muted-foreground italic mt-1">
                                        💡 Pilih nama staf lapangan jika bon ini diserahkan oleh mereka agar nama pelaksana tercatat akurat.
                                    </p>
                                </div>
                            </div>

                            {/* Step 2: Catatan Laporan */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-gray-500" />
                                    3. Catatan / Keterangan Tambahan
                                </label>
                                <textarea
                                    value={reportNotes}
                                    onChange={(e) => setReportNotes(e.target.value)}
                                    placeholder="Contoh: Diinput oleh Admin berdasarkan foto nota WA dari Pak Bambang, barang sudah tiba di proyek..."
                                    rows={2}
                                    className="w-full p-3.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all dark:text-gray-100 shadow-sm"
                                />
                            </div>

                            <Separator className="dark:bg-gray-800" />

                            {/* Step 3: Daftar Nota / Kwitansi */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                            <Store className="w-4 h-4 text-amber-600" />
                                            4. Detail Nota & Foto Bukti Lapangan
                                        </h3>
                                        <p className="text-xs text-muted-foreground">Input nominal aktual dan upload foto bon fisik atau kiriman WhatsApp.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addReceipt}
                                        className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Tambah Nota
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {receipts.map((receipt, idx) => (
                                        <div 
                                            key={idx} 
                                            className="bg-gray-50/80 dark:bg-gray-800/50 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 relative space-y-5 shadow-sm transition-all hover:border-amber-300 dark:hover:border-amber-800"
                                        >
                                            <div className="flex justify-between items-center border-b border-gray-200/80 dark:border-gray-700 pb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                                                        {idx + 1}
                                                    </span>
                                                    <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">
                                                        Nota / Bukti Pengeluaran #{idx + 1}
                                                    </h4>
                                                </div>
                                                {receipts.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeReceipt(idx)}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        Hapus Nota
                                                    </button>
                                                )}
                                            </div>

                                            {/* Inputs Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <div>
                                                    <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 block mb-1">
                                                        Nomor Nota / Bon
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={receipt.receiptNumber}
                                                        onChange={(e) => updateReceipt(idx, 'receiptNumber', e.target.value)}
                                                        placeholder="Contoh: INV-001 / WA-BON"
                                                        className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 block mb-1">
                                                        Nama Toko / Supplier
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={receipt.storeName}
                                                        onChange={(e) => updateReceipt(idx, 'storeName', e.target.value)}
                                                        placeholder="Contoh: TB. Makmur / Toko Besi"
                                                        className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 block mb-1">
                                                        Tanggal Nota
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={receipt.receiptDate}
                                                        onChange={(e) => updateReceipt(idx, 'receiptDate', e.target.value)}
                                                        className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1 flex items-center justify-between">
                                                        <span>Metode Bayar</span>
                                                    </label>
                                                    <select
                                                        value={receipt.paymentMethod}
                                                        onChange={(e) => updateReceipt(idx, 'paymentMethod', e.target.value as any)}
                                                        className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                    >
                                                        <option value="CASH">CASH (Tunai)</option>
                                                        <option value="TRANSFER">TRANSFER (Bank)</option>
                                                        <option value="CREDIT_CARD">CREDIT CARD / KARTU</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Nominal Biaya & Notes */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-gray-800/80 p-4 rounded-xl border border-gray-200/80 dark:border-gray-700">
                                                <div>
                                                    <label className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-1.5 flex items-center gap-1">
                                                        <DollarSign className="w-4 h-4 text-emerald-600" />
                                                        Nominal Aktual Nota (Total Biaya) <span className="text-red-500">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <span className="absolute left-3.5 top-2.5 text-xs font-bold text-gray-400">Rp</span>
                                                        <input
                                                            type="number"
                                                            value={receipt.totalAmount || ''}
                                                            onChange={(e) => updateReceipt(idx, 'totalAmount', parseFloat(e.target.value) || 0)}
                                                            placeholder="0"
                                                            className="w-full h-11 pl-9 pr-4 rounded-xl border-2 border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/20 text-sm font-bold text-emerald-700 dark:text-emerald-400 focus:outline-none focus:border-emerald-600 transition-all"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block mb-1.5">
                                                        Keterangan Khusus Nota Ini (Opsional)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={receipt.notes || ''}
                                                        onChange={(e) => updateReceipt(idx, 'notes', e.target.value)}
                                                        placeholder="Contoh: Lunas dibayar tunai oleh Mandor..."
                                                        className="w-full h-11 px-3.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                    />
                                                </div>
                                            </div>

                                            {/* Photo Upload Section */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Foto Nota */}
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                                        <Camera className="w-3.5 h-3.5 text-amber-600" />
                                                        Foto Nota / Kwitansi Fisik (Atau Screenshot WA)
                                                    </label>
                                                    <div className="flex items-center gap-3">
                                                        <label className="cursor-pointer px-4 py-2.5 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-amber-500 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 transition-all flex items-center gap-2 shadow-sm hover:shadow">
                                                            <Upload className="w-4 h-4 text-amber-600" />
                                                            <span>{receipt.file ? 'Ganti Foto Nota' : 'Pilih Foto Nota...'}</span>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => handleReceiptPhotoChange(e, idx)}
                                                                className="hidden"
                                                            />
                                                        </label>
                                                        {receipt.preview && (
                                                            <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 shrink-0 shadow-sm group">
                                                                <img src={receipt.preview} alt="Nota Preview" className="w-full h-full object-cover" />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateReceipt(idx, 'preview', '')}
                                                                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Foto Barang / Material */}
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                                        <Box className="w-3.5 h-3.5 text-blue-600" />
                                                        Foto Barang Datang / Bukti Fisik Lapangan
                                                    </label>
                                                    <div className="flex items-center gap-3 flex-wrap">
                                                        <label className="cursor-pointer px-4 py-2.5 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 transition-all flex items-center gap-2 shadow-sm hover:shadow">
                                                            <Plus className="w-4 h-4 text-blue-600" />
                                                            <span>Tambah Foto Barang ({receipt.materialPhotos.length})</span>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                multiple
                                                                onChange={(e) => handleMaterialPhotoChange(e, idx)}
                                                                className="hidden"
                                                            />
                                                        </label>
                                                        {receipt.materialPreviews.map((previewUrl, mIdx) => (
                                                            <div key={mIdx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 shrink-0 shadow-sm group">
                                                                <img src={previewUrl} alt={`Material ${mIdx}`} className="w-full h-full object-cover" />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeMaterialPhoto(idx, mIdx)}
                                                                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 dark:bg-gray-800/80 p-5 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
                            {/* Summary Comparison */}
                            <div className="flex items-center gap-4 text-xs">
                                <div className="bg-white dark:bg-gray-900 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Total PO Item:</span>
                                    <span className="font-bold text-gray-800 dark:text-gray-200">Rp {totalPOLine.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="bg-emerald-50 dark:bg-emerald-950/30 px-3.5 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-sm">
                                    <span className="text-emerald-600 dark:text-emerald-400 block text-[10px] uppercase font-bold">Total Laporan Aktual:</span>
                                    <span className="font-extrabold text-emerald-700 dark:text-emerald-300">Rp {totalActual.toLocaleString('id-ID')}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                    className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !selectedLineId}
                                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs shadow-lg shadow-orange-500/25 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Menyimpan Laporan...</span>
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck className="w-4 h-4" />
                                            <span>Simpan & Terbitkan Laporan</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
