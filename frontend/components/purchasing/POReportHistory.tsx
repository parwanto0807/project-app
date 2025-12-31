import React from 'react';
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
    AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

interface POReportHistoryProps {
    purchaseOrder: PurchaseOrder;
}

const POReportHistory: React.FC<POReportHistoryProps> = ({ purchaseOrder }) => {
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
        const matched: { [poLineId: string]: { poLine: any, receipts: PurchaseReceipt[] } } = {};

        execution.receipts?.forEach(receipt => {
            receipt.items?.forEach(item => {
                if (item.poLineId) {
                    if (!matched[item.poLineId]) {
                        const poLine = poLines.find(pl => pl.id === item.poLineId);
                        matched[item.poLineId] = { poLine, receipts: [] };
                    }
                    if (!matched[item.poLineId].receipts.find(r => r.id === receipt.id)) {
                        matched[item.poLineId].receipts.push(receipt);
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
                    const matchedData = matchReceiptsToPoLines(execution);
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

                                {/* PO Item Matching Section */}
                                <div className="space-y-4 mb-6">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Matching Item PO dengan Laporan</h4>
                                    {Object.keys(matchedData).length > 0 ? (
                                        <div className="space-y-3">
                                            {Object.entries(matchedData).map(([poLineId, { poLine, receipts }]) => {
                                                const [isChecked, setIsChecked] = React.useState(poLine?.checkPurchaseExecution || false);
                                                const [isUpdating, setIsUpdating] = React.useState(false);

                                                const handleToggle = async () => {
                                                    const newValue = !isChecked;
                                                    setIsUpdating(true);

                                                    try {
                                                        const response = await fetch(`http://localhost:5000/api/po/line/${poLineId}/verify`, {
                                                            method: 'PATCH',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            credentials: 'include',
                                                            body: JSON.stringify({ checked: newValue })
                                                        });

                                                        if (response.ok) {
                                                            setIsChecked(newValue);
                                                        }
                                                    } catch (error) {
                                                        console.error('Error:', error);
                                                    } finally {
                                                        setIsUpdating(false);
                                                    }
                                                };

                                                return (
                                                    <Card
                                                        key={poLineId}
                                                        className={`border-l-4 transition-all ${isChecked
                                                            ? 'border-l-green-500 bg-green-50/50 dark:bg-green-950/20'
                                                            : 'border-l-blue-500'
                                                            }`}
                                                    >
                                                        <CardContent className="px-4">
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div className="flex items-start gap-3 flex-1">
                                                                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                                                        <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className={`font-semibold transition-colors duration-300 ${isChecked
                                                                            ? 'text-green-900 dark:text-green-100'
                                                                            : 'text-gray-900 dark:text-gray-100'
                                                                            }`}>
                                                                            {poLine?.product?.name || "Unknown Product"}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500 mt-0.5">
                                                                            PO Qty: {poLine?.quantity} {poLine?.product?.purchaseUnit || 'unit'}
                                                                        </div>
                                                                        <Badge
                                                                            variant="outline"
                                                                            className={`mt-2 transition-colors duration-300 ${isChecked
                                                                                ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-300'
                                                                                : 'bg-green-50 text-green-700 border-green-200'
                                                                                }`}
                                                                        >
                                                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                                                            {receipts.length} Nota
                                                                        </Badge>
                                                                    </div>
                                                                </div>

                                                                {/* Beautiful Animated Toggle Switch */}
                                                                <div className="flex flex-col items-end gap-2 ml-4">
                                                                    <button
                                                                        onClick={handleToggle}
                                                                        disabled={isUpdating}
                                                                        className={`relative w-16 h-8 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${isChecked
                                                                            ? 'bg-green-500 focus:ring-green-500'
                                                                            : 'bg-gray-300 dark:bg-gray-600 focus:ring-gray-400'
                                                                            } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                        aria-label={isChecked ? 'Verified' : 'Mark as verified'}
                                                                    >
                                                                        <span
                                                                            className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-all duration-300 ease-in-out flex items-center justify-center ${isChecked ? 'translate-x-8' : 'translate-x-0'
                                                                                }`}
                                                                        >
                                                                            {isChecked && (
                                                                                <CheckCircle2 className="w-4 h-4 text-green-600 animate-in zoom-in duration-200" />
                                                                            )}
                                                                        </span>
                                                                    </button>
                                                                    <span className={`text-xs font-medium transition-colors duration-300 ${isChecked
                                                                        ? 'text-green-600 dark:text-green-400'
                                                                        : 'text-gray-500 dark:text-gray-400'
                                                                        }`}>
                                                                        {isChecked ? 'Verified ✓' : 'Verify'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                                            <AlertCircle className="w-4 h-4" />
                                            <span>Tidak ada item PO yang terhubung dengan laporan ini</span>
                                        </div>
                                    )}
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
                                                                    .filter(photo => photo && photo.photoUrl) // Only show photos with valid URLs
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
        </div>
    );
};

export default POReportHistory;
