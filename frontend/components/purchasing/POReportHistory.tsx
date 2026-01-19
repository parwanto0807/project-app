import React, { useState } from 'react';
import { PurchaseOrder, PurchaseExecution, PurchaseReceipt, ReceiptItem } from "@/types/poType";
import { getImageUrl } from "@/lib/getImageUrl";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
    User,
    Receipt,
    ShoppingBag,
    Camera,
    Package,
    CheckCircle2,
    AlertCircle,
    Edit2,
    Save,
    X,
    TrendingUp,
    TrendingDown
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

interface POReportHistoryProps {
    purchaseOrder: PurchaseOrder;
    onUpdate?: () => void; // Callback untuk refresh data tanpa reload
}

const POReportHistory: React.FC<POReportHistoryProps> = ({ purchaseOrder, onUpdate }) => {
    const executions = purchaseOrder.PurchaseExecution || [];
    const poLines = purchaseOrder.lines || [];

    if (executions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <Receipt className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200">Belum ada Laporan</h3>
                <p className="text-sm text-gray-500 max-w-sm mt-1">
                    Belum ada laporan pembelian lapangan yang dibuat untuk Purchase Order ini.
                </p>
            </div>
        );
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(value);
    };

    // Calculate total spent correctly by ensuring numbers
    const calculateTotalSpent = (receipts: PurchaseReceipt[] | undefined) => {
        if (!receipts || receipts.length === 0) return 0;
        return receipts.reduce((sum, r) => {
            const amount = typeof r.totalAmount === 'string' ? parseFloat(r.totalAmount) : r.totalAmount;
            return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
    };

    // Match receipts to PO lines
    const matchReceiptsToPoLines = (execution: PurchaseExecution) => {
        const matched: { [poLineId: string]: PurchaseReceipt[] } = {};

        execution.receipts?.forEach(receipt => {
            receipt.items?.forEach(item => {
                if (item.poLineId) {
                    if (!matched[item.poLineId]) {
                        matched[item.poLineId] = [];
                    }
                    if (!matched[item.poLineId].find(r => r.id === receipt.id)) {
                        matched[item.poLineId].push(receipt);
                    }
                }
            });
        });

        return matched;
    };

    return (
        <div className="space-y-8">
            <h3 className="text-lg font-semibold flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" />
                Riwayat Pembelian Lapangan
            </h3>

            <div className="relative border-l-2 border-gray-100 dark:border-gray-700 ml-3 space-y-10 pb-10">
                {executions.map((execution, index) => {
                    const matchedReceipts = matchReceiptsToPoLines(execution);
                    const totalSpent = calculateTotalSpent(execution.receipts);

                    return (
                        <div key={execution.id} className="relative pl-8">
                            {/* Timeline Dot */}
                            <div className={`absolute -left-[9px] top-0 w-5 h-5 rounded-full border-2 border-white dark:border-gray-900 shadow-sm
                                ${execution.status === 'COMPLETED' ? 'bg-green-500' :
                                    execution.status === 'CANCELLED' ? 'bg-red-500' : 'bg-amber-500'}`}
                            />

                            {/* Card Content */}
                            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 p-5">

                                {/* Execution Header */}
                                <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                {format(new Date(execution.executionDate), "eeee, dd MMMM yyyy", { locale: localeId })}
                                            </span>
                                            <span className="text-xs text-gray-400">•</span>
                                            <span className="text-xs text-gray-500">
                                                {format(new Date(execution.executionDate), "HH:mm")}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                <User className="w-3.5 h-3.5" />
                                                <span>{execution.executor?.namaLengkap || "Unknown Executor"}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <Badge className={`${execution.status === 'COMPLETED' ? 'bg-teal-100 text-teal-700 hover:bg-teal-200' :
                                            execution.status === 'CANCELLED' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                                                'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                            }`}>
                                            {execution.status.replace('_', ' ')}
                                        </Badge>
                                        <div className="text-[11px] text-gray-400">
                                            Total Pengeluaran
                                        </div>
                                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                                            {formatCurrency(totalSpent)}
                                        </div>
                                    </div>
                                </div>

                                <Separator className="my-4" />

                                {/* ALL PO Items with Actual Data */}
                                <div className="space-y-4 mb-6">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Semua Item PO & Data Aktual</h4>
                                    <div className="space-y-3">
                                        {poLines.map((poLine) => {
                                            const receipts = matchedReceipts[poLine.id] || [];
                                            const hasReport = receipts.length > 0;

                                            return (
                                                <POLineItem
                                                    key={poLine.id}
                                                    poLine={poLine}
                                                    receipts={receipts}
                                                    hasReport={hasReport}
                                                    purchaseOrderStatus={purchaseOrder.status}
                                                    onUpdate={onUpdate}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Grand Total */}
                                <div className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl p-5 border-2 border-purple-200 dark:border-purple-800">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                                                <Receipt className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Grand Total (Actual)</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-500">Total keseluruhan pembelian</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-pink-400">
                                                {formatCurrency(
                                                    poLines.reduce((sum, line) => {
                                                        const qty = Number(line.qtyActual) || 0;
                                                        const price = Number(line.unitPriceActual) || 0;
                                                        return sum + (qty * price);
                                                    }, 0)
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                {poLines.filter(l => Number(l.qtyActual) > 0 && Number(l.unitPriceActual) > 0).length} item(s) dengan data aktual
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Separator className="my-4" />

                                {/* Receipts List */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Daftar Nota / Kwitansi</h4>
                                    {execution.receipts && execution.receipts.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {execution.receipts.map((receipt) => (
                                                <div key={receipt.id} className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center text-blue-500 shadow-sm">
                                                                <ShoppingBag className="w-4 h-4" />
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-bold text-gray-900 dark:text-gray-200">
                                                                    {receipt.storeName || "Toko Tanpa Nama"}
                                                                </div>
                                                                <div className="text-[10px] text-gray-500">
                                                                    {receipt.receiptNumber ? `#${receipt.receiptNumber}` : "No Receipt #"}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-sm font-bold text-gray-900 dark:text-gray-200">
                                                                {formatCurrency(typeof receipt.totalAmount === 'string' ? parseFloat(receipt.totalAmount) : receipt.totalAmount)}
                                                            </div>
                                                            <div className="text-[10px] text-gray-500 uppercase">
                                                                {receipt.paymentMethod.replace('_', ' ')}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Receipt Items Preview */}
                                                    <div className="space-y-1">
                                                        {receipt.items?.map((item, idx) => (
                                                            <div key={idx} className="flex justify-between text-xs text-gray-600 dark:text-gray-400 py-0.5">
                                                                <div className='flex gap-1'>
                                                                    <span>{item.quantity}x</span>
                                                                    <span>{item.productName || "Item"}</span>
                                                                </div>
                                                                <span>{formatCurrency(typeof item.totalPrice === 'string' ? parseFloat(item.totalPrice) : item.totalPrice)}</span>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Photos Grid */}
                                                    {receipt.photos && receipt.photos.length > 0 && (
                                                        <div className="mt-3 space-y-2">
                                                            <div className="flex flex-wrap gap-2">
                                                                {receipt.photos
                                                                    .filter(photo => photo && photo.photoUrl)
                                                                    .map((photo, pIdx) => (
                                                                        <div
                                                                            key={photo.id || pIdx}
                                                                            className="w-25 h-25 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 cursor-pointer hover:scale-105 transition-transform shadow-sm bg-gray-100 dark:bg-gray-800"
                                                                            onClick={() => window.open(getImageUrl(photo.photoUrl), '_blank')}
                                                                            title="Klik untuk memperbesar"
                                                                        >
                                                                            <img
                                                                                src={getImageUrl(photo.photoUrl)}
                                                                                alt="Lampiran"
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                        </div>
                                                                    ))}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                                                                <Camera className="w-3 h-3" />
                                                                {receipt.photos.filter(p => p && p.photoUrl).length} Foto Lampiran
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-gray-500 italic text-center py-4 bg-gray-50 rounded-xl">
                                            Tidak ada data kwitansi
                                        </div>
                                    )}
                                </div>

                            </div>
                        </div>
                    );
                })}
            </div>
        </div >
    );
};

// Separate component for PO Line Item with edit functionality
const POLineItem: React.FC<{
    poLine: any;
    receipts: PurchaseReceipt[];
    hasReport: boolean;
    purchaseOrderStatus: string;
    onUpdate?: () => void;
}> = ({ poLine, receipts, hasReport, purchaseOrderStatus, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [qtyActual, setQtyActual] = useState(poLine.qtyActual || 0);
    const [unitPriceActual, setUnitPriceActual] = useState(poLine.unitPriceActual || 0);
    const [checkMatch, setCheckMatch] = useState(poLine.checkMatch || false);

    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    const poQty = Number(poLine.quantity);
    const poUnitPrice = Number(poLine.unitPrice);
    const actualQty = Number(qtyActual);
    const actualUnitPrice = Number(unitPriceActual);

    // Check if quantities and prices match
    const qtyMatch = actualQty > 0 && Math.abs(poQty - actualQty) < 0.01;
    const priceMatch = actualUnitPrice > 0 && Math.abs(poUnitPrice - actualUnitPrice) < 0.01;
    const isFullMatch = qtyMatch && priceMatch;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(value);
    };

    const handleSaveClick = () => {
        setShowConfirmDialog(true);
    };

    const executeSave = async () => {
        setIsUpdating(true);
        setShowConfirmDialog(false); // Close dialog

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/po/line/${poLine.id}/update-actual`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    qtyActual: Number(qtyActual),
                    unitPriceActual: Number(unitPriceActual)
                })
            });

            if (response.ok) {
                const result = await response.json();
                toast.success("Data aktual berhasil disimpan");
                setIsEditing(false);

                // Update local state dengan data dari server
                setCheckMatch(result.data.checkMatch);

                // Call parent callback untuk refresh data tanpa reload
                if (onUpdate) {
                    onUpdate();
                }
            } else {
                const error = await response.json();
                toast.error(error.message || "Gagal menyimpan data");
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error("Terjadi kesalahan saat menyimpan");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCancel = () => {
        setQtyActual(poLine.qtyActual || 0);
        setUnitPriceActual(poLine.unitPriceActual || 0);
        setIsEditing(false);
    };

    return (
        <Card
            className={`border-l-4 transition-all ${checkMatch || isFullMatch
                ? 'border-l-green-500 bg-green-50/50 dark:bg-green-950/20'
                : hasReport
                    ? 'border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/10'
                    : 'border-l-gray-300 bg-gray-50/30 dark:bg-gray-900/10'
                }`}
        >
            <CardContent className="px-4 py-4">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                {poLine?.product?.name || "Produk Tidak Diketahui"}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                                SKU: {poLine?.product?.sku || "-"}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {hasReport && (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        {receipts.length} Nota
                                    </Badge>
                                )}
                                {(checkMatch || isFullMatch) && (
                                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-xs">
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        Match ✓
                                    </Badge>
                                )}
                                {poLine.checkPurchaseExecution && (
                                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        Verified
                                    </Badge>
                                )}
                                {!hasReport && (
                                    <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200 text-xs">
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        Belum Dilaporkan
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Edit Button or Locked Status */}
                    <div className="flex gap-2 ml-4">
                        {poLine.checkPurchaseExecution ? (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700" title="Data sudah diverifikasi dan masuk laporan keuangan">
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                                <span className="text-xs font-medium text-gray-500">Locked / Final</span>
                            </div>
                        ) : (
                            !isEditing ? (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setIsEditing(true)}
                                    // disabled={purchaseOrderStatus === 'FULLY_RECEIVED'} // Removed restricted access
                                    className="h-8"
                                >
                                    <Edit2 className="w-3.5 h-3.5 mr-1" />
                                    Input Actual
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        size="sm"
                                        onClick={handleSaveClick}
                                        disabled={isUpdating}
                                        className="h-8 bg-green-600 hover:bg-green-700"
                                    >
                                        <Save className="w-3.5 h-3.5 mr-1" />
                                        {isUpdating ? 'Menyimpan...' : 'Simpan'}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleCancel}
                                        disabled={isUpdating}
                                        className="h-8"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </Button>
                                </>
                            )
                        )}
                    </div>
                </div>

                {/* Comparison Grid */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                    {/* Quantity Comparison */}
                    <div className="space-y-2">
                        <div className="text-xs font-semibold text-gray-500 uppercase">Kuantitas</div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-gray-500">Qty PO:</span>
                                <span className="text-sm font-bold">{poQty} {poLine?.product?.purchaseUnit || 'unit'}</span>
                            </div>

                            {isEditing ? (
                                <Input
                                    type="number"
                                    value={qtyActual}
                                    onChange={(e) => setQtyActual(Number(e.target.value))}
                                    className="h-8 text-sm"
                                    min={0} step={0.01}
                                />
                            ) : (
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">Aktual:</span>
                                    <span className={`text-sm font-bold ${actualQty > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                                        {actualQty > 0 ? `${actualQty} ${poLine?.product?.purchaseUnit || 'unit'}` : '-'}
                                    </span>
                                </div>
                            )}

                            {actualQty > 0 && !isEditing && (
                                <div className="mt-2 flex items-center gap-1 text-xs">
                                    {Math.abs(actualQty - poQty) < 0.01 ? (
                                        <span className="text-green-600 font-medium flex items-center">
                                            <CheckCircle2 className="w-3 h-3 mr-1" /> Cocok
                                        </span>
                                    ) : (
                                        <span className="text-amber-600 font-medium flex items-center">
                                            {actualQty > poQty ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                                            {Math.abs(actualQty - poQty)} {actualQty > poQty ? 'Lebih' : 'Kurang'}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Price Comparison */}
                    <div className="space-y-2">
                        <div className="text-xs font-semibold text-gray-500 uppercase">Harga Satuan</div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-gray-500">Harga PO:</span>
                                <span className="text-sm font-bold">{formatCurrency(poUnitPrice)}</span>
                            </div>

                            {isEditing ? (
                                <Input
                                    type="number"
                                    value={unitPriceActual}
                                    onChange={(e) => setUnitPriceActual(Number(e.target.value))}
                                    className="h-8 text-sm"
                                    min={0}
                                />
                            ) : (
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">Aktual:</span>
                                    <span className={`text-sm font-bold ${actualUnitPrice > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                                        {actualUnitPrice > 0 ? formatCurrency(actualUnitPrice) : '-'}
                                    </span>
                                </div>
                            )}

                            {actualUnitPrice > 0 && !isEditing && (
                                <div className="mt-2 flex items-center gap-1 text-xs">
                                    {Math.abs(actualUnitPrice - poUnitPrice) < 1 ? (
                                        <span className="text-green-600 font-medium flex items-center">
                                            <CheckCircle2 className="w-3 h-3 mr-1" /> Cocok
                                        </span>
                                    ) : (
                                        <span className="text-amber-600 font-medium flex items-center">
                                            {actualUnitPrice > poUnitPrice ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                                            {formatCurrency(Math.abs(actualUnitPrice - poUnitPrice))} Selisih
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Total Price Comparison */}
                    <div className="space-y-2">
                        <div className="text-xs font-semibold text-gray-500 uppercase">Total Harga</div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-gray-500">Total PO:</span>
                                <span className="text-sm font-bold">{formatCurrency(poQty * poUnitPrice)}</span>
                            </div>
                            <Separator className="my-2" />
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">Total Aktual:</span>
                                <span className={`text-sm font-bold ${actualQty > 0 && actualUnitPrice > 0 ? 'text-blue-700 dark:text-blue-400' : 'text-gray-400'}`}>
                                    {actualQty > 0 && actualUnitPrice > 0 ? formatCurrency(actualQty * actualUnitPrice) : '-'}
                                </span>
                            </div>
                            {actualQty > 0 && actualUnitPrice > 0 && !isEditing && (
                                <div className="mt-2 flex items-center gap-1 text-xs">
                                    {Math.abs((actualQty * actualUnitPrice) - (poQty * poUnitPrice)) < 1 ? (
                                        <>
                                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                                            <span className="text-green-600 font-medium">Cocok</span>
                                        </>
                                    ) : (
                                        <>
                                            {(actualQty * actualUnitPrice) > (poQty * poUnitPrice) ? (
                                                <TrendingUp className="w-3 h-3 text-red-600" />
                                            ) : (
                                                <TrendingDown className="w-3 h-3 text-green-600" />
                                            )}
                                            <span className={(actualQty * actualUnitPrice) > (poQty * poUnitPrice) ? 'text-red-600' : 'text-green-600'}>
                                                {formatCurrency((actualQty * actualUnitPrice) - (poQty * poUnitPrice))}
                                            </span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </CardContent>

            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Penyimpanan</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin data aktual sudah benar? <br /><br />
                            <span className="font-semibold text-red-600">PENTING:</span> Data tidak dapat diubah (Locked) setelah disimpan.
                            Sistem akan otomatis mencatat transaksi ini ke Laporan Keuangan (Ledger).
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={executeSave} className="bg-blue-600 hover:bg-blue-700">
                            Ya, Simpan Permanen
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
};

export default POReportHistory;
