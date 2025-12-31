"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShoppingBag, Calendar, Truck, ChevronRight, FileText, Building2,
    Package, CheckCircle, Clock, MapPin, ArrowLeft,
    Box, Tag, ShoppingCart, Receipt, Camera, Plus, History,
    Send, Info, X, Pencil, Trash
} from "lucide-react";
import { toast } from "sonner";
import { PurchaseOrder, PurchaseOrderLine } from "@/types/poExecution";
import ViewPurchaseReport from "./ViewPurchaseReport";
import EditPurchaseExecutionForm from "./EditPurchaseExecutionForm";

interface ReceiptFile {
    file: File;
    preview: string;
    receiptNumber: string;
    storeName: string;
    receiptDate: string;
    totalAmount: number;
    paymentMethod: 'CASH' | 'TRANSFER' | 'CREDIT_CARD';
    notes?: string;
    // New: Per-receipt material photos
    materialPhotos: File[];
    materialPreviews: string[];
}

export default function PurchaseOrderDetail() {
    const { id } = useParams();
    const router = useRouter();
    const [po, setPo] = useState<PurchaseOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'detail' | 'report' | 'history'>('detail');
    const [selectedItem, setSelectedItem] = useState<PurchaseOrderLine | null>(null);

    // State untuk Form Laporan removed (redundant with per-receipt details)

    // State untuk Upload Foto
    // State untuk Upload Foto
    const [receipts, setReceipts] = useState<ReceiptFile[]>([]);
    // Removed global materialFiles state

    // ... existing state ...
    const [reportNotes, setReportNotes] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [viewingReport, setViewingReport] = useState<any>(null);
    const [fullReportData, setFullReportData] = useState<any>(null);
    const [showReportModal, setShowReportModal] = useState(false);

    // Edit State
    const [editingReport, setEditingReport] = useState<any>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'nota' | 'material') => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);

            if (type === 'nota') {
                const newReceipts: ReceiptFile[] = newFiles.map(file => ({
                    file,
                    preview: URL.createObjectURL(file),
                    receiptNumber: '',
                    storeName: '',
                    receiptDate: new Date().toISOString().split('T')[0],
                    totalAmount: 0,
                    paymentMethod: 'CASH',
                    notes: '',
                    materialPhotos: [],
                    materialPreviews: []
                }));
                setReceipts(prev => [...prev, ...newReceipts]);
            }
            // 'material' case removed as it is now handled per receipt
        }
    };

    // Helper to add material photos to a specific receipt
    const handleMaterialFileChange = (e: React.ChangeEvent<HTMLInputElement>, receiptIndex: number) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            const newPreviews = newFiles.map(file => URL.createObjectURL(file));

            setReceipts(prev => prev.map((receipt, idx) => {
                if (idx === receiptIndex) {
                    return {
                        ...receipt,
                        materialPhotos: [...receipt.materialPhotos, ...newFiles],
                        materialPreviews: [...receipt.materialPreviews, ...newPreviews]
                    };
                }
                return receipt;
            }));
        }
    };

    const removeFile = (index: number, type: 'nota' | 'material', materialIndex?: number) => {
        if (type === 'nota') {
            setReceipts(prev => {
                const newReceipts = [...prev];
                URL.revokeObjectURL(newReceipts[index].preview); // Cleanup memory
                // Also cleanup material previews for this receipt
                newReceipts[index].materialPreviews.forEach(p => URL.revokeObjectURL(p));
                return newReceipts.filter((_, i) => i !== index);
            });
        } else if (type === 'material' && typeof materialIndex === 'number') {
            setReceipts(prev => prev.map((receipt, idx) => {
                if (idx === index) {
                    const newMaterialPhotos = [...receipt.materialPhotos];
                    const newMaterialPreviews = [...receipt.materialPreviews];

                    // Cleanup memory
                    URL.revokeObjectURL(newMaterialPreviews[materialIndex]);

                    newMaterialPhotos.splice(materialIndex, 1);
                    newMaterialPreviews.splice(materialIndex, 1);

                    return {
                        ...receipt,
                        materialPhotos: newMaterialPhotos,
                        materialPreviews: newMaterialPreviews
                    };
                }
                return receipt;
            }));
        }
    };

    const updateReceipt = (index: number, field: keyof ReceiptFile, value: any) => {
        setReceipts(prev => prev.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
        ));
    };

    const fetchPODetail = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/po/${id}`, {
                method: 'GET',
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) setPo(data.data);
        } catch (error) {
            toast.error("Gagal memuat data");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { if (id) fetchPODetail(); }, [id, fetchPODetail]);

    const fetchFullReportData = async (poLineId: string) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/po/execution/${poLineId}`, {
                method: 'GET',
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success && data.data) {
                setFullReportData(data.data);
                setShowReportModal(true);
            } else {
                toast.error('Gagal memuat detail laporan');
            }
        } catch (error) {
            console.error('Error fetching report:', error);
            toast.error('Terjadi kesalahan saat memuat laporan');
        }
    };

    // Effects for report detail form removed

    const handleSubmitReport = async () => {
        // Validation
        if (!selectedItem) {
            toast.error('Silakan pilih item PO terlebih dahulu');
            return;
        }

        if (receipts.length === 0) {
            toast.error('Minimal harus ada 1 nota/kwitansi');
            return;
        }

        // Validate each receipt has totalAmount
        const invalidReceipt = receipts.find(r => !r.totalAmount || r.totalAmount <= 0);
        if (invalidReceipt) {
            toast.error('Semua nota harus memiliki total biaya yang valid');
            return;
        }

        try {
            setIsSubmitting(true);

            // Prepare FormData
            const formData = new FormData();
            formData.append('poLineId', selectedItem.id);
            formData.append('notes', reportNotes);

            // Prepare receipts data (without files)
            const receiptsData = receipts.map(r => ({
                receiptNumber: r.receiptNumber,
                storeName: r.storeName,
                receiptDate: r.receiptDate,
                totalAmount: r.totalAmount,
                paymentMethod: r.paymentMethod,
                notes: r.notes
            }));
            formData.append('receiptsData', JSON.stringify(receiptsData));

            // Append receipt photos and material photos
            receipts.forEach((receipt, index) => {
                if (receipt.file) {
                    formData.append('receiptPhotos', receipt.file);
                }

                // Material Photos (Multiple per receipt)
                receipt.materialPhotos.forEach(file => {
                    formData.append('materialPhotos', file);
                    // Map this photo to the current receipt index
                    formData.append('material_photo_map', index.toString());
                });
            });

            // Submit to API
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/po/${id}/execution`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Laporan berhasil dikirim!', {
                    duration: 5000,
                    style: {
                        background: '#10b981',
                        color: '#ffffff',
                        fontWeight: 'bold'
                    }
                });

                // Reset form
                // Reset form
                setReceipts([]);
                setReportNotes('');
                setSelectedItem(null);
                setActiveTab('detail');

                // Refresh PO data
                fetchPODetail();
            } else {
                toast.error(data.error || 'Gagal mengirim laporan');
            }
        } catch (error) {
            console.error('Error submitting report:', error);
            toast.error('Terjadi kesalahan saat mengirim laporan');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditReport = async (poLineId: string) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/po/execution/${poLineId}`, {
                method: 'GET',
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success && data.data && data.data.receipt?.execution) {
                setEditingReport(data.data.receipt.execution);
                setSelectedItem(data.data);
                setShowEditModal(true);
            } else {
                toast.error('Gagal memuat data untuk edit');
            }
        } catch (error) {
            toast.error('Gagal memuat data');
        }
    };

    const handleDeleteReport = async (executionId: string) => {
        if (confirm('Apakah Anda yakin ingin menghapus laporan ini? Data yang dihapus tidak dapat dikembalikan.')) {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/po/execution/${executionId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                const data = await response.json();
                if (data.success) {
                    toast.success('Laporan berhasil dihapus');
                    fetchPODetail(); // Refresh
                } else {
                    toast.error(data.error || 'Gagal menghapus laporan');
                }
            } catch (error) {
                toast.error('Terjadi kesalahan saat menghapus');
            }
        }
    };



    if (loading) return <div className="p-8 text-center animate-pulse text-amber-600 font-medium">Memuat Data PO...</div>;
    if (!po) return <div className="p-8 text-center text-red-500">PO tidak ditemukan.</div>;

    return (
        <div className="max-w-5xl mx-auto pb-24 lg:pb-10 px-3 md:px-6">

            {/* HEADER COMPACT */}
            <header className="flex items-center gap-3 mb-5 py-2">
                <div className="flex-grow">
                    <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white leading-tight">
                        {po.poNumber}
                    </h1>
                    <div className="flex items-center gap-2 text-[11px] md:text-xs text-gray-500">
                        <span className="font-semibold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">
                            {po.status}
                        </span>
                        <span className="truncate max-w-[150px]">{po.project?.name}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 border border-blue-100 dark:border-blue-800">
                        <History className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {/* TAB NAVIGATION (Mobile Friendly) */}
            <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-6 gap-1">
                {[
                    { id: 'detail', label: 'Item PO', icon: <ShoppingCart className="w-4 h-4" /> },
                    { id: 'report', label: 'Buat Laporan', icon: <Receipt className="w-4 h-4" /> }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            if (tab.id === 'report') return;
                            setActiveTab(tab.id as any);
                        }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === tab.id
                            ? 'bg-white dark:bg-gray-700 shadow-sm text-amber-600'
                            : tab.id === 'report'
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-gray-500 hover:bg-gray-200/50'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* LEFT CONTENT */}
                <div className={`${activeTab === 'report' ? 'lg:col-span-12' : 'lg:col-span-8'} space-y-4`}>
                    {activeTab === 'detail' ? (
                        <div className="space-y-3">
                            {po.lines?.map((item, idx) => (
                                <div key={idx} className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="flex gap-3">
                                            <div className="w-10 h-10 shrink-0 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-amber-600">
                                                <Box className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight mb-1">{item.product.name}</h4>
                                                <p className="text-[10px] text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded w-fit">
                                                    {item.product.code}
                                                </p>
                                                {/* Report Status Badge */}
                                                {item.receiptItems && item.receiptItems.length > 0 && item.receiptItems[0].receipt?.execution && (
                                                    <div className="mt-1.5 flex items-center gap-1.5">
                                                        <div className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-2 py-0.5 rounded-full">
                                                            <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                                                            <span className="text-[9px] font-bold text-green-700 dark:text-green-400">Laporan Terkirim</span>
                                                        </div>
                                                        <span className="text-[9px] text-gray-500">
                                                            {new Date(item.receiptItems?.[0]?.receipt?.execution?.executionDate || '').toLocaleString('id-ID', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400">Qty Pesanan</p>
                                            <p className="text-sm font-black text-amber-600">{item.quantity} {item.product.purchaseUnit}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-dashed border-gray-100 dark:border-gray-700 flex flex-col gap-1 text-[11px]">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500 italic">Rp. {Number(item.unitPrice).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / {item.product.purchaseUnit}</span>
                                            <span className="font-bold text-gray-700 dark:text-gray-200">Total PO: Rp. {(Number(item.quantity) * Number(item.unitPrice)).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        {(() => {
                                            const totalReport = item.receiptItems?.reduce((sum, rItem) => sum + Number(rItem.totalPrice || 0), 0) || 0;
                                            const totalPO = Number(item.quantity) * Number(item.unitPrice);
                                            const diff = totalPO - totalReport;

                                            // Only show if there is a report logic? Or always? User asked to "Add Total Report and Diff".
                                            // If totalReport is 0, diff is equal to totalPO.

                                            return (
                                                <>
                                                    <div className="flex justify-between items-center text-blue-600">
                                                        <span>Total Laporan:</span>
                                                        <span className="font-bold">Rp. {totalReport.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    </div>
                                                    <div className={`flex justify-between items-center ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        <span>Selisih Saldo {diff < 0 ? '(Anda Lebih bayar)' : ''}:</span>
                                                        <span className="font-bold">Rp. {diff.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedItem(item);
                                            setActiveTab('report');
                                            toast.warning(`Anda akan membuat Laporan Pembelian Item ${item.product.name}`, {
                                                position: 'top-center',
                                                duration: 4000,
                                                style: {
                                                    background: '#f59e0b', // Amber-500
                                                    color: '#ffffff',
                                                    border: 'none',
                                                    fontWeight: 'bold'
                                                },
                                                className: "text-white bg-amber-500"
                                            });
                                        }}
                                        className="mt-3 w-full py-2 bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-bold hover:bg-amber-200 dark:hover:bg-amber-900/30 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Receipt className="w-3 h-3" />
                                        Buat Laporan
                                    </button>
                                    {/* View Report Button - Only show if report exists */}
                                    {item.receiptItems && item.receiptItems.length > 0 && item.receiptItems[0].receipt?.execution && (
                                        <button
                                            onClick={() => fetchFullReportData(item.id)}
                                            className="mt-2 w-full py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <FileText className="w-3 h-3" />
                                            Lihat Laporan
                                        </button>
                                    )}

                                    {/* Action Buttons: Edit & Delete */}
                                    {item.receiptItems && item.receiptItems.length > 0 && item.receiptItems[0].receipt?.execution && (
                                        <div className="mt-2 grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => handleEditReport(item.id)}
                                                className="py-2 bg-white border border-amber-200 text-amber-600 rounded-lg text-xs font-bold hover:bg-amber-50 flex items-center justify-center gap-2 transition-colors"
                                            >
                                                <Pencil className="w-3 h-3" /> Edit
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const executionId = item.receiptItems?.[0]?.receipt?.execution?.id;
                                                    if (executionId) handleDeleteReport(executionId);
                                                }}
                                                className="py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 flex items-center justify-center gap-2 transition-colors"
                                            >
                                                <Trash className="w-3 h-3" /> Hapus
                                            </button>
                                        </div>
                                    )}


                                </div>
                            ))}
                        </div>
                    ) : (
                        /* LAPORAN BON SECTION */
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-[2rem] border-2 border-amber-500/20 shadow-xl space-y-5">
                            <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 pb-4">
                                <div className="p-2 bg-amber-500 rounded-lg text-white">
                                    <Camera className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">
                                        {selectedItem ? `Laporan: ${selectedItem.product.name}` : "Laporan Pembelian Lapangan"}
                                    </h3>
                                    {selectedItem ? (
                                        <div className="mt-1 text-[11px] text-gray-500 space-y-0.5">
                                            <p><span className="font-semibold">Kode:</span> {selectedItem.product.code}</p>
                                            <div className="flex gap-3">
                                                <p><span className="font-semibold">Harga:</span> Rp. {Number(selectedItem.unitPrice).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                <p><span className="font-semibold">Qty:</span> {selectedItem.quantity} {selectedItem.product.purchaseUnit}</p>
                                            </div>
                                            <div className="flex gap-4 items-center mt-1">
                                                <p className="font-bold text-amber-600">
                                                    Total PO: <br />
                                                    Rp. {(Number(selectedItem.quantity) * Number(selectedItem.unitPrice)).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </p>
                                                <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
                                                <p className={`font-bold ${receipts.reduce((sum, r) => sum + (r.totalAmount || 0), 0) > (Number(selectedItem.quantity) * Number(selectedItem.unitPrice)) ? 'text-red-500' : 'text-green-600'}`}>
                                                    Total Actual (Bon): <br />
                                                    Rp. {receipts.reduce((sum, r) => sum + (r.totalAmount || 0), 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-[10px] text-gray-500 tracking-tight">Foto nota dan input jumlah barang yang dibayar</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6">

                                {/* DETAIL LAPORAN FORM Removed */}

                                {/* Upload Foto Material */}
                                {/* Upload Foto Material */}
                                {/* Global Material Photo Upload Removed */}

                                <div>
                                    <label className="text-[11px] font-bold text-gray-500 uppercase ml-1 mb-2 block">Foto Nota / Kwitansi</label>

                                    <div className="space-y-4">
                                        {receipts.map((receipt, idx) => (
                                            <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-4">
                                                {/* Left: Image Preview */}
                                                <div className="relative w-full md:w-32 aspect-square shrink-0 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 group">
                                                    <img src={receipt.preview} alt={`Receipt ${idx + 1}`} className="w-full h-full object-cover" />
                                                    <button
                                                        onClick={() => removeFile(idx, 'nota')}
                                                        className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-opacity opacity-0 group-hover:opacity-100"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] text-center py-1 font-semibold">
                                                        FOTO NOTA
                                                    </div>
                                                </div>
                                                {/* Material Photos Mini Grid */}
                                                {receipt.materialPhotos.length > 0 && (
                                                    <div className="grid grid-cols-3 gap-1 w-full md:w-32 mt-2">
                                                        {receipt.materialPreviews.slice(0, 3).map((mp, mIdx) => (
                                                            <div key={mIdx} className="aspect-square rounded border border-gray-200 overflow-hidden relative">
                                                                <img src={mp} className="w-full h-full object-cover" />
                                                                {mIdx === 2 && receipt.materialPhotos.length > 3 && (
                                                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[9px] text-white font-bold">
                                                                        +{receipt.materialPhotos.length - 3}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Right: Receipt Details Form */}
                                                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {/* Receipt Number */}
                                                    <div>
                                                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">No. Nota / Kwitansi  (Optional)</label>
                                                        <input
                                                            type="text"
                                                            value={receipt.receiptNumber}
                                                            onChange={(e) => updateReceipt(idx, 'receiptNumber', e.target.value)}
                                                            className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs focus:ring-1 focus:ring-amber-500"
                                                            placeholder="Contoh: INV-001"
                                                        />
                                                    </div>

                                                    {/* Store Name */}
                                                    <div>
                                                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Nama Toko / Supplier  (Optional)</label>
                                                        <input
                                                            type="text"
                                                            value={receipt.storeName}
                                                            onChange={(e) => updateReceipt(idx, 'storeName', e.target.value)}
                                                            className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs focus:ring-1 focus:ring-amber-500"
                                                            placeholder="Nama Toko"
                                                        />
                                                    </div>

                                                    {/* Receipt Date */}
                                                    <div>
                                                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Tanggal Nota</label>
                                                        <input
                                                            type="date"
                                                            value={receipt.receiptDate}
                                                            onChange={(e) => updateReceipt(idx, 'receiptDate', e.target.value)}
                                                            className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs focus:ring-1 focus:ring-amber-500"
                                                        />
                                                    </div>

                                                    {/* Payment Method */}
                                                    <div>
                                                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Metode Pembayaran</label>
                                                        <select
                                                            value={receipt.paymentMethod}
                                                            onChange={(e) => updateReceipt(idx, 'paymentMethod', e.target.value)}
                                                            className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs focus:ring-1 focus:ring-amber-500"
                                                        >
                                                            <option value="CASH">Tunai (Cash)</option>
                                                            <option value="TRANSFER">Transfer Bank</option>
                                                            <option value="CREDIT_CARD">Kartu Kredit / Debit</option>
                                                        </select>
                                                    </div>

                                                    {/* Total Amount */}
                                                    <div className="md:col-span-2">
                                                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                                                            Total Biaya per Nota (Rp)
                                                            {Number(receipt.totalAmount) > 0 && (
                                                                <span className="ml-2 text-amber-600 font-extrabold text-sm border-b border-amber-300">
                                                                    Rp. {Number(receipt.totalAmount).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </span>
                                                            )}
                                                        </label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">Rp</span>
                                                            <input
                                                                type="number"
                                                                value={receipt.totalAmount}
                                                                onChange={(e) => updateReceipt(idx, 'totalAmount', Number(e.target.value))}
                                                                className="w-full pl-8 pr-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 text-sm font-bold text-amber-700 focus:ring-1 focus:ring-amber-500"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Per-Receipt Material Photo Upload Section */}
                                                    <div className="md:col-span-2 pt-3 border-t border-dashed border-gray-200 dark:border-gray-700 mt-2">
                                                        <label className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase block mb-2 flex items-center gap-1">
                                                            <Box className="w-3 h-3" />
                                                            Foto Barang / Material (Bukti Fisik)
                                                        </label>

                                                        <div className="flex flex-wrap gap-2">
                                                            {receipt.materialPreviews.map((preview, mIdx) => (
                                                                <div key={mIdx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-blue-200 dark:border-blue-800 group shadow-sm">
                                                                    <img src={preview} className="w-full h-full object-cover" />
                                                                    <button
                                                                        onClick={() => removeFile(idx, 'material', mIdx)}
                                                                        className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            ))}

                                                            <label className="w-16 h-16 border-2 border-dashed border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-blue-100 transition-colors">
                                                                <Plus className="w-4 h-4 text-blue-500" />
                                                                <span className="text-[8px] font-bold text-blue-600">Add</span>
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    multiple
                                                                    className="hidden"
                                                                    onChange={(e) => handleMaterialFileChange(e, idx)}
                                                                />
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        <label
                                            htmlFor="upload-nota"
                                            className="w-full py-4 border-2 border-dashed border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl flex items-center justify-center gap-3 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all cursor-pointer group"
                                        >
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                className="hidden"
                                                id="upload-nota"
                                                onChange={(e) => handleFileChange(e, 'nota')}
                                            />
                                            <div className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                                                <Camera className="w-5 h-5 text-amber-500" />
                                            </div>
                                            <span className="text-xs font-bold text-amber-700 dark:text-amber-500">
                                                {receipts.length > 0 ? "Tambah Nota Lain" : "Upload Nota Pertama"}
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Catatan Lapangan</label>
                                    <textarea
                                        value={reportNotes}
                                        onChange={(e) => setReportNotes(e.target.value)}
                                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border-none text-sm focus:ring-2 focus:ring-amber-500 min-h-[80px]"
                                        placeholder="Contoh: Barang sudah diterima di gudang proyek, nota asli dititip ke driver..."
                                    />
                                </div>

                                <button
                                    onClick={handleSubmitReport}
                                    disabled={isSubmitting || receipts.length === 0}
                                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Mengirim...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Kirim Laporan Bon
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN - INFO SUPPLIER & RINGKASAN (Compact) */}
                {activeTab === 'detail' && (
                    <div className="lg:col-span-4 space-y-4">
                        {/* RINGKASAN BIAYA CARD */}
                        <div className="relative bg-white dark:bg-gray-800 p-5 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                            {/* Dekorasi Gradient Tipis di Pojok */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl" />

                            <h4 className="text-[10px] font-black text-gray-400 uppercase mb-4 flex items-center gap-2 tracking-widest">
                                <Info className="w-3.5 h-3.5 text-amber-500" /> Ringkasan Biaya
                            </h4>

                            <div className="space-y-3 text-xs mb-6">
                                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                                    <span>Subtotal</span>
                                    <span className="font-medium">Rp. {Number(po.subtotal || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                                    <span>Pajak (PPN)</span>
                                    <span className="font-medium">Rp. {Number(po.taxAmount || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-end pt-3 border-t border-gray-100 dark:border-gray-700">
                                    <span className="font-bold text-gray-900 dark:text-white text-sm">Total PO</span>
                                    <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-500">
                                        Rp. {Number(po.totalAmount || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>

                            {/* PREMIUM BACK BUTTON - Positioned Right */}
                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={() => router.push('/user-area/purchase-execution')}
                                    className="group relative flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 active:scale-95 overflow-hidden"
                                >
                                    {/* Layer Gradient Background */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-900 dark:from-amber-600 dark:to-orange-500 opacity-100 group-hover:opacity-90 transition-opacity" />

                                    {/* Shine Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                                    <div className="relative flex items-center gap-2">
                                        <ArrowLeft className="w-4 h-4 text-white group-hover:-translate-x-1 transition-transform" />
                                        <span className="text-[11px] font-bold text-white uppercase tracking-tighter">
                                            Back to List PO
                                        </span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* INFO SUPPLIER CARD */}
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 text-orange-600 flex items-center justify-center shadow-inner">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-[11px] font-bold text-gray-800 dark:text-white uppercase tracking-tight">Info Supplier</h4>
                                    <p className="text-[10px] text-gray-400">Penyedia Material</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <p className="text-sm font-black text-amber-600 dark:text-amber-500 leading-tight">
                                    {po.supplier?.name}
                                </p>
                                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                                    <div className="flex items-start gap-2.5 text-[11px] text-gray-500 dark:text-gray-400">
                                        <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400" />
                                        <span className="leading-relaxed italic">{po.supplier?.address || "Alamat tidak tersedia"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* New Report View Component */}
            <ViewPurchaseReport
                isOpen={showReportModal}
                onClose={() => {
                    setShowReportModal(false);
                    setFullReportData(null);
                }}
                reportData={fullReportData}
                poNumber={po?.poNumber}
            />

            {/* Edit Report Form Modal */}
            <EditPurchaseExecutionForm
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setEditingReport(null);
                }}
                initialData={editingReport}
                onSuccess={() => {
                    fetchPODetail();
                }}
                poLineId={selectedItem?.id || ''}
            />
        </div >
    );
}