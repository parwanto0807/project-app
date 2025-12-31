"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, FileText, CheckCircle, Receipt, Box, Camera,
    Calendar, Store, CreditCard, StickyNote, User,
    Package, DollarSign, Image as ImageIcon, ChevronRight
} from "lucide-react";

interface ReceiptData {
    id: string;
    receiptNumber?: string;
    storeName?: string;
    receiptDate: string;
    totalAmount: number;
    paymentMethod: 'CASH' | 'TRANSFER' | 'CREDIT_CARD';
    receiptPhotoUrl?: string;
}

interface ExecutionData {
    id: string;
    executionDate: string;
    status: string;
    notes?: string;
    executor?: {
        id: string;
        namaLengkap: string;
    };
    receipts?: ReceiptData[];
    materialPhotos?: string[];
}

interface ProductData {
    id: string;
    name: string;
    code: string;
    purchaseUnit: string;
}

interface ViewPurchaseReportProps {
    isOpen: boolean;
    onClose: () => void;
    reportData: {
        id: string;
        productName: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        unit: string;
        product?: ProductData;
        receipt?: {
            id: string;
            receiptNumber?: string;
            storeName?: string;
            receiptDate: string;
            totalAmount: number;
            paymentMethod?: string;
            receiptPhotoUrl?: string;
            execution?: ExecutionData;
        };
    } | null;
    poNumber?: string;
}

export default function ViewPurchaseReport({
    isOpen,
    onClose,
    reportData,
    poNumber
}: ViewPurchaseReportProps) {
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [showImageModal, setShowImageModal] = useState(false);

    if (!isOpen || !reportData) return null;

    const execution = reportData.receipt?.execution;
    const receipts = execution?.receipts || (reportData.receipt ? [reportData.receipt] : []);
    const materialPhotos = execution?.materialPhotos || [];

    // Helper function to construct correct image URL
    const getImageUrl = (photoUrl?: string) => {
        if (!photoUrl) return '';

        const cleanUrl = photoUrl.startsWith('public/')
            ? photoUrl.replace('public/', '/')
            : photoUrl.startsWith('/')
                ? photoUrl
                : `/${photoUrl}`;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        return `${apiUrl}${cleanUrl}`;
    };

    const getPaymentMethodLabel = (method?: string) => {
        switch (method) {
            case 'CASH': return 'Tunai';
            case 'TRANSFER': return 'Transfer';
            case 'CREDIT_CARD': return 'Kartu Kredit';
            default: return method || 'N/A';
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header - Compact & Premium */}
                        <div className="shrink-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 px-3 sm:px-4 py-3 sm:py-4 z-10 shadow-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                    <div className="p-1.5 sm:p-2 bg-white/20 rounded-xl backdrop-blur-sm shrink-0">
                                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-sm sm:text-base font-bold text-white truncate">Laporan Pembelian</h3>
                                        <p className="text-[10px] sm:text-xs text-blue-100 truncate">
                                            {poNumber} • {reportData.productName}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-1.5 sm:p-2 hover:bg-white/20 rounded-xl transition-colors shrink-0"
                                >
                                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Content - Maximized Space */}
                        <div className="flex-1 overflow-y-auto px-2 sm:px-3 py-3 sm:py-4 space-y-2 sm:space-y-3 pb-20">

                            {/* Execution Status - Compact */}
                            {execution && (
                                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-3">
                                    <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
                                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                                        <h4 className="font-bold text-emerald-900 dark:text-emerald-100 text-xs sm:text-sm">Status Laporan</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-2">
                                            <div className="flex items-center gap-1 mb-0.5">
                                                <User className="w-3 h-3 text-emerald-600" />
                                                <p className="text-[9px] sm:text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold uppercase">Pelapor</p>
                                            </div>
                                            <p className="font-bold text-emerald-900 dark:text-emerald-100 text-[11px] sm:text-xs truncate">
                                                {execution.executor?.namaLengkap || 'N/A'}
                                            </p>
                                        </div>
                                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-2">
                                            <div className="flex items-center gap-1 mb-0.5">
                                                <Calendar className="w-3 h-3 text-emerald-600" />
                                                <p className="text-[9px] sm:text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold uppercase">Tanggal</p>
                                            </div>
                                            <p className="font-bold text-emerald-900 dark:text-emerald-100 text-[11px] sm:text-xs">
                                                {new Date(execution.executionDate).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    {execution.notes && (
                                        <div className="mt-1.5 sm:mt-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-2">
                                            <div className="flex items-center gap-1 mb-0.5">
                                                <StickyNote className="w-3 h-3 text-emerald-600" />
                                                <p className="text-[9px] sm:text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold uppercase">Catatan</p>
                                            </div>
                                            <p className="text-[11px] sm:text-xs text-gray-700 dark:text-gray-300 italic line-clamp-2">
                                                {execution.notes}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Item Details - Compact */}
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-3">
                                <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
                                    <Box className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
                                    <h4 className="font-bold text-amber-900 dark:text-amber-100 text-xs sm:text-sm">Detail Item PO</h4>
                                </div>
                                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-2 space-y-1.5">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Produk</p>
                                            <p className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm truncate">{reportData.productName}</p>
                                        </div>
                                        {reportData.product && (
                                            <div className="shrink-0">
                                                <p className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 mb-0.5 text-right">Kode</p>
                                                <p className="font-semibold text-amber-600 dark:text-amber-400 text-[10px] sm:text-xs bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                                                    {reportData.product.code}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-amber-200 dark:border-amber-800">
                                        <div>
                                            <p className="text-[9px] sm:text-[10px] text-gray-600 dark:text-gray-400 mb-0.5">Qty</p>
                                            <p className="font-bold text-gray-900 dark:text-white text-[11px] sm:text-xs">
                                                {Number(reportData.quantity).toLocaleString('id-ID')} {reportData.unit}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] sm:text-[10px] text-gray-600 dark:text-gray-400 mb-0.5">Harga</p>
                                            <p className="font-bold text-gray-900 dark:text-white text-[11px] sm:text-xs">
                                                Rp {Number(reportData.unitPrice).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] sm:text-[10px] text-gray-600 dark:text-gray-400 mb-0.5">Total PO</p>
                                            <p className="font-bold text-amber-600 dark:text-amber-400 text-[11px] sm:text-xs">
                                                Rp {Number(reportData.totalPrice).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Material Photos - Compact Grid */}
                            {materialPhotos.length > 0 && (
                                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl p-2.5 sm:p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-1.5 sm:gap-2">
                                            <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                                            <h4 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">Foto Material</h4>
                                        </div>
                                        <span className="text-[9px] sm:text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded-full font-semibold">
                                            {materialPhotos.length}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
                                        {materialPhotos.map((photoUrl, idx) => (
                                            <div
                                                key={idx}
                                                className="relative rounded-lg overflow-hidden border border-blue-200 dark:border-blue-800 aspect-square group cursor-pointer"
                                                onClick={() => {
                                                    setActiveImageIndex(idx);
                                                    setShowImageModal(true);
                                                }}
                                            >
                                                <img
                                                    src={getImageUrl(photoUrl)}
                                                    alt={`Material ${idx + 1}`}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                    onError={(e) => {
                                                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="10"%3ENo Image%3C/text%3E%3C/svg%3E';
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                                    <ImageIcon className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                <div className="absolute bottom-1 left-1 px-1 py-0.5 bg-black/70 text-white text-[8px] sm:text-[9px] font-bold rounded backdrop-blur-sm">
                                                    #{idx + 1}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Receipts - Compact Cards */}
                            {receipts.length > 0 && (
                                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl p-2.5 sm:p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-1.5 sm:gap-2">
                                            <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
                                            <h4 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">Nota Pembelian</h4>
                                        </div>
                                        <span className="text-[9px] sm:text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-semibold">
                                            {receipts.length}
                                        </span>
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-2">
                                        {receipts.map((receipt, idx) => (
                                            <div
                                                key={receipt.id || idx}
                                                className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2"
                                            >
                                                <div className="flex gap-2">
                                                    {/* Receipt Image - Smaller */}
                                                    {receipt.receiptPhotoUrl && (
                                                        <div
                                                            className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-lg overflow-hidden border border-amber-300 dark:border-amber-700 cursor-pointer group"
                                                            onClick={() => {
                                                                setActiveImageIndex(materialPhotos.length + idx);
                                                                setShowImageModal(true);
                                                            }}
                                                        >
                                                            <img
                                                                src={getImageUrl(receipt.receiptPhotoUrl)}
                                                                alt={`Receipt ${idx + 1}`}
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                                onError={(e) => {
                                                                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="10"%3ENo Image%3C/text%3E%3C/svg%3E';
                                                                }}
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Receipt Details - Compact */}
                                                    <div className="flex-1 min-w-0 space-y-1">
                                                        <div className="flex items-center gap-1 pb-1 border-b border-amber-200 dark:border-amber-800">
                                                            <Receipt className="w-3 h-3 text-amber-600 shrink-0" />
                                                            <h5 className="font-bold text-amber-900 dark:text-amber-100 text-[11px] sm:text-xs">Nota #{idx + 1}</h5>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-1 text-[10px] sm:text-[11px]">
                                                            {receipt.receiptNumber && (
                                                                <div className="col-span-2">
                                                                    <p className="text-gray-500 dark:text-gray-400 text-[9px]">No. Nota</p>
                                                                    <p className="font-semibold text-gray-900 dark:text-white truncate">{receipt.receiptNumber}</p>
                                                                </div>
                                                            )}
                                                            {receipt.storeName && (
                                                                <div>
                                                                    <p className="text-gray-500 dark:text-gray-400 text-[9px] flex items-center gap-0.5">
                                                                        <Store className="w-2.5 h-2.5" /> Toko
                                                                    </p>
                                                                    <p className="font-semibold text-gray-900 dark:text-white truncate">{receipt.storeName}</p>
                                                                </div>
                                                            )}
                                                            <div>
                                                                <p className="text-gray-500 dark:text-gray-400 text-[9px] flex items-center gap-0.5">
                                                                    <Calendar className="w-2.5 h-2.5" /> Tanggal
                                                                </p>
                                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                                    {new Date(receipt.receiptDate).toLocaleDateString('id-ID', {
                                                                        day: 'numeric',
                                                                        month: 'short'
                                                                    })}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-gray-500 dark:text-gray-400 text-[9px] flex items-center gap-0.5">
                                                                    <CreditCard className="w-2.5 h-2.5" /> Bayar
                                                                </p>
                                                                <p className="font-semibold text-gray-900 dark:text-white truncate">
                                                                    {getPaymentMethodLabel(receipt.paymentMethod)}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="pt-1 border-t border-amber-200 dark:border-amber-800">
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-[9px] text-gray-600 dark:text-gray-400 font-semibold">Total</p>
                                                                <p className="font-bold text-amber-600 dark:text-amber-400 text-xs sm:text-sm">
                                                                    Rp {Number(receipt.totalAmount).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Total Summary - Compact */}
                                        <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg p-2 text-white">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-[9px] text-amber-100 mb-0.5">Total Actual</p>
                                                    <p className="font-bold text-base sm:text-lg">
                                                        Rp {receipts.reduce((sum, r) => sum + Number(r.totalAmount), 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] text-amber-100 mb-0.5">vs PO</p>
                                                    <p className={`font-bold text-sm sm:text-base ${receipts.reduce((sum, r) => sum + Number(r.totalAmount), 0) > reportData.totalPrice
                                                        ? 'text-red-200'
                                                        : 'text-green-200'
                                                        }`}>
                                                        {receipts.reduce((sum, r) => sum + Number(r.totalAmount), 0) > reportData.totalPrice ? '+' : ''}
                                                        Rp {(receipts.reduce((sum, r) => sum + Number(r.totalAmount), 0) - reportData.totalPrice).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Image Modal - Full Screen */}
                        {showImageModal && (
                            <div
                                className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-2 sm:p-4"
                                onClick={() => setShowImageModal(false)}
                            >
                                <div className="relative w-full h-full flex items-center justify-center">
                                    <button
                                        onClick={() => setShowImageModal(false)}
                                        className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
                                    >
                                        <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                    </button>
                                    <img
                                        src={getImageUrl(
                                            activeImageIndex < materialPhotos.length
                                                ? materialPhotos[activeImageIndex]
                                                : receipts[activeImageIndex - materialPhotos.length]?.receiptPhotoUrl
                                        )}
                                        alt="Preview"
                                        className="max-w-full max-h-full object-contain rounded-lg"
                                        onError={(e) => {
                                            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="20"%3EImage Not Found%3C/text%3E%3C/svg%3E';
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
