"use client";

import React, { useEffect, useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { StockMonitoringItem } from "@/types/inventoryType";
import { getStockHistory, StockHistoryItem, getStockBookings, StockBookingItem } from "@/lib/action/inventory/inventoryAction";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
    Loader2,
    Package,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    ArrowRight,
    WarehouseIcon,
    History,
    FileText,
    User
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, toJakartaTimezone } from "@/lib/utils";

interface StockDetailSheetProps {
    isOpen: boolean;
    onClose: () => void;
    item: StockMonitoringItem | null;
    period: string; // YYYY-MM
    warehouseId?: string;
}

export default function StockDetailSheet({
    isOpen,
    onClose,
    item,
    period,
    warehouseId
}: StockDetailSheetProps) {
    const [history, setHistory] = useState<StockHistoryItem[]>([]);
    const [bookings, setBookings] = useState<StockBookingItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingBookings, setLoadingBookings] = useState(false);

    useEffect(() => {
        if (isOpen && item) {
            fetchHistory();
            fetchBookings();
        }
    }, [isOpen, item, period, warehouseId]);

    const fetchHistory = async () => {
        if (!item) return;
        setLoading(true);
        try {
            const data = await getStockHistory(item.productId, period, warehouseId);
            setHistory(data || []);
        } catch (error) {
            console.error("Failed to fetch history", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBookings = async () => {
        if (!item) return;
        setLoadingBookings(true);
        try {
            const data = await getStockBookings(item.productId, warehouseId);
            setBookings(data.bookings || []);
        } catch (error) {
            console.error("Failed to fetch bookings", error);
        } finally {
            setLoadingBookings(false);
        }
    };

    if (!item) return null;

    const formatNumber = (num: number) => new Intl.NumberFormat('id-ID').format(num);

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto bg-slate-50 dark:bg-slate-950 p-0 border-l border-slate-200 dark:border-slate-800">
                {/* Header Section */}
                <div className="bg-white dark:bg-slate-900 p-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10 shadow-sm">
                    <SheetHeader className="mb-4">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 border-indigo-100 mb-2">
                                    Stock Detail
                                </Badge>
                                <SheetTitle className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                                    {item.name}
                                </SheetTitle>
                                <SheetDescription className="flex items-center gap-2 text-slate-500">
                                    <code className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded">{item.code}</code>
                                    <span className="text-xs">•</span>
                                    <span className="text-xs">{item.category || "Uncategorized"}</span>
                                </SheetDescription>
                            </div>
                            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                                <Package className="w-6 h-6 text-slate-400" />
                            </div>
                        </div>
                    </SheetHeader>

                    {/* Stock Summary Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Awal</p>
                            <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{formatNumber(item.stockAwal)}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Akhir</p>
                            <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300">{formatNumber(item.stockAkhir)}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 flex justify-between items-center">
                            <div>
                                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Masuk</p>
                                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{formatNumber(item.stockIn)}</p>
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 flex justify-between items-center">
                            <div>
                                <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1">Keluar</p>
                                <p className="text-lg font-bold text-rose-700 dark:text-rose-300">{formatNumber(item.stockOut)}</p>
                            </div>
                            <ArrowDownRight className="w-4 h-4 text-rose-500" />
                        </div>
                    </div>
                </div>

                {/* Stock Bookings Section */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-400" />
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Stock Bookings</h3>
                        </div>
                        {item.bookedStock > 0 && (
                            <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
                                {formatNumber(item.bookedStock)} Booked
                            </Badge>
                        )}
                        {item.onPR > 0 && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-300">
                                {formatNumber(item.onPR)} On PO
                            </Badge>
                        )}
                    </div>

                    {loadingBookings ? (
                        <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                            <Loader2 className="w-6 h-6 animate-spin mb-2" />
                            <p className="text-xs">Loading bookings...</p>
                        </div>
                    ) : bookings.length === 0 ? (
                        <div className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                            <p className="text-sm text-slate-500 font-medium">No active bookings</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {bookings.map((booking, index) => (
                                <div key={index} className="group relative bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                                    <div className="absolute left-0 top-4 bottom-4 w-1 bg-amber-200 dark:bg-amber-800 rounded-r-full group-hover:bg-amber-500 transition-colors" />

                                    <div className="flex justify-between items-start mb-2 pl-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <a
                                                    // href={`/admin-area/logistic/pr/${booking.prId}`}
                                                    className="text-sm font-bold text-amber-600 hover:text-amber-700 hover:underline"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    {booking.prNumber}
                                                </a>
                                                <Badge variant="outline" className="text-[10px]">{booking.status}</Badge>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <User className="w-3 h-3" />
                                                <span>{booking.requestor}</span>
                                                {booking.project && booking.project !== '-' && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{booking.project}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-lg font-black text-amber-600">
                                                {formatNumber(booking.bookedQty)}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">{booking.unit}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pl-3 border-t border-slate-50 dark:border-slate-800 pt-2 mt-2">
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <WarehouseIcon className="w-3 h-3" />
                                            {booking.warehouseName}
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            Belum Terpenuhi: {formatNumber(booking.totalRequested - booking.jumlahTerpenuhi)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* History Section */}
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <History className="w-4 h-4 text-slate-400" />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Transaction History</h3>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                            <Loader2 className="w-8 h-8 animate-spin mb-2" />
                            <p className="text-xs">Loading history...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                            <p className="text-sm text-slate-500 font-medium">No transactions found for this period</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.map((hist) => (
                                <div key={hist.id} className="group relative bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                                    <div className="absolute left-0 top-4 bottom-4 w-1 bg-slate-200 dark:bg-slate-800 rounded-r-full group-hover:bg-indigo-500 transition-colors" />

                                    <div className="flex justify-between items-start mb-2 pl-3">
                                        <div>
                                            <p className="text-xs font-bold text-slate-400">{format(toJakartaTimezone(hist.date), "dd MMM yyyy, HH:mm", { locale: idLocale })}</p>
                                            <p className={cn(
                                                "text-sm font-bold mt-0.5",
                                                hist.type.includes("IN") ? "text-emerald-600" : "text-rose-600"
                                            )}>
                                                {hist.type.replace(/_/g, " ")}
                                            </p>
                                        </div>
                                        <Badge variant="secondary" className="font-mono text-[10px]">
                                            {hist.referenceNo || "NO REF"}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-between pl-3 border-t border-slate-50 dark:border-slate-800 pt-2 mt-2">
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <WarehouseIcon className="w-3 h-3" />
                                            {hist.warehouse || "Unknown"}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className={cn(
                                                "text-lg font-black",
                                                hist.type.includes("IN") ? "text-emerald-600" : "text-rose-600"
                                            )}>
                                                {hist.type.includes("IN") ? "+" : "-"}{formatNumber(hist.qty)}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">{hist.unit}</span>
                                        </div>
                                    </div>

                                    {hist.notes && (
                                        <div className="mt-2 pl-3 pt-2 border-t border-slate-50 dark:border-slate-800">
                                            <p className="text-xs text-slate-500 italic">"{hist.notes}"</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
