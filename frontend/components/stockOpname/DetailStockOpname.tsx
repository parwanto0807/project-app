"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Calendar,
    Warehouse,
    User,
    Package,
    ArrowLeft,
    Printer,
    Edit,
    TrendingUp,
    TrendingDown,
    Minus,
    ClipboardList,
    FileText,
    CheckCircle,
    XCircle,
    AlertCircle,
    Info,
    Layers,
    Lock,
} from "lucide-react";
import { api } from "@/lib/http";
import { toast } from "sonner";

import { cn, formatCurrency, formatNumber, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { StockOpname, OpnameStatus } from "@/types/soType";


interface DetailStockOpnameProps {
    data: StockOpname;
    onBack: () => void;
    onEdit?: (id: string) => void;
}

export default function DetailStockOpname({
    data,
    onBack,
    onEdit,
}: DetailStockOpnameProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(false);

    // Local state for immediate UI update
    const [opname, setOpname] = useState<StockOpname>(data);

    // Sync prop changes
    useEffect(() => {
        setOpname(data);
    }, [data]);

    const handleLock = async () => {
        if (!confirm("Apakah Anda yakin ingin mengunci data ini? Data yang sudah dikunci tidak dapat diedit kembali.")) return;

        setIsLoading(true);
        try {
            await api.patch(`/api/stock-opname/${opname.id}/complete`);
            toast.success("Stock Opname berhasil dikunci.");

            // Optimistic Update
            setOpname(prev => ({ ...prev, status: OpnameStatus.COMPLETED }));

            router.refresh(); // Still call refresh just in case
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Terjadi kesalahan saat mengunci data.");
        } finally {
            setIsLoading(false);
        }
    };


    const handlePrint = () => window.print();

    // Helper: Status Styling
    const getStatusConfig = (status: OpnameStatus) => {
        switch (status) {
            case OpnameStatus.DRAFT:
                return { color: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20", icon: FileText, label: "Draft" };
            case OpnameStatus.ADJUSTED:
                return { color: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20", icon: CheckCircle, label: "Selesai (Adjusted)" };
            case OpnameStatus.COMPLETED:
                return { color: "text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20", icon: Lock, label: "Terkunci (Locked)" };
            case OpnameStatus.CANCELLED:
                return { color: "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20", icon: XCircle, label: "Dibatalkan" };
            default:
                return { color: "text-slate-600 bg-slate-50", icon: Info, label: status };
        }
    };

    const statusCfg = getStatusConfig(opname.status);
    const StatusIcon = statusCfg.icon;

    // Totals
    const totalItems = opname.items.length;
    const totalNilai = opname.items.reduce((acc, item) => acc + Number(item.totalNilai || 0), 0);
    const totalSelisih = opname.items.reduce((acc, item) => acc + Number(item.selisih || 0), 0);
    const totalSelisihValue = opname.items.reduce((acc, item) => acc + (Number(item.selisih || 0) * Number(item.hargaSatuan || 0)), 0);

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-2 duration-500">

            {/* 1. TOP ACTION BAR */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
                <Button
                    variant="outline"
                    className="group gap-2.5 p-6 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
                    onClick={onBack}
                >
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                        <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all group-hover:-translate-x-0.5" />
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-xs text-slate-500 dark:text-slate-500 font-medium">Kembali ke</span>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Data Stock Opname</span>
                    </div>
                </Button>

                <div className="flex w-full sm:w-auto gap-3">
                    <Button variant="outline" className="flex-1 sm:flex-none gap-2 shadow-sm dark:bg-slate-900 p-6" onClick={handlePrint}>
                        <Printer className="w-4 h-4" />
                        Cetak Laporan
                    </Button>
                    {opname.status === OpnameStatus.DRAFT && (
                        <>
                            <Button
                                className="flex-1 sm:flex-none gap-2 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200 dark:shadow-none transition-all active:scale-95 p-6"
                                onClick={() => onEdit ? onEdit(opname.id) : router.push(`/admin-area/inventory/stock-opname/${opname.id}/edit`)}
                                disabled={isLoading}
                            >
                                <Edit className="w-4 h-4" />
                                Edit Data
                            </Button>
                            <Button
                                className="flex-1 sm:flex-none gap-2 bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-200 dark:shadow-none transition-all active:scale-95 p-6"
                                onClick={handleLock}
                                disabled={isLoading}
                            >
                                {isLoading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <Lock className="w-4 h-4" />}
                                Lock / Approve
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* 2. MAIN CONTENT WRAPPER */}
            <div className="space-y-4 rounded-2xl print:p-0">

                {/* --- DYNAMIC HEADER CARD --- */}
                <div className={cn(
                    "relative overflow-hidden rounded-3xl p-4 sm:p-6 text-white shadow-2xl transition-all duration-700",
                    opname.status === OpnameStatus.ADJUSTED ? "bg-slate-900" : "bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950"
                )}>
                    {/* Background Patterns */}
                    <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
                        <svg viewBox="0 0 100 100" className="w-full h-full"><circle cx="80" cy="20" r="40" fill="currentColor" /></svg>
                    </div>

                    <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-8">
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className={cn("flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border shadow-sm", statusCfg.color)}>
                                    <StatusIcon className="w-3.5 h-3.5" />
                                    {statusCfg.label}
                                </div>
                                <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/20 border-white/20 backdrop-blur-md px-4 py-1.5 rounded-full uppercase text-[10px] tracking-widest font-bold">
                                    {opname.type} Opname
                                </Badge>
                            </div>

                            <div>
                                <h1 className="text-xl sm:text-3xl font-extrabold tracking-tighter mb-3 drop-shadow-md">
                                    {opname.nomorOpname}
                                </h1>
                                <div className="flex flex-wrap items-center gap-6 text-blue-100/80">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-blue-400" />
                                        <span className="font-medium">{formatDate(opname.tanggalOpname, 'long')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Warehouse className="w-5 h-5 text-blue-400" />
                                        <span className="font-medium">{opname.warehouse?.name}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Summary Widgets */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 flex flex-col justify-center items-center text-center min-w-[140px]">
                                <Layers className="w-5 h-5 text-blue-400 mb-2 opacity-60" />
                                <span className="text-blue-200/60 text-[10px] uppercase font-bold tracking-widest">Total Item</span>
                                <span className="text-3xl font-black mt-1">{totalItems}</span>
                            </div>
                            <div className="bg-emerald-500/10 backdrop-blur-xl rounded-2xl p-5 border border-emerald-500/20 flex flex-col justify-center items-center text-center min-w-[160px]">
                                <TrendingUp className="w-5 h-5 text-emerald-400 mb-2 opacity-60" />
                                <span className="text-emerald-200/60 text-[10px] uppercase font-bold tracking-widest">Aset Ternilai</span>
                                <span className="text-2xl font-black mt-1 text-emerald-300">{formatCurrency(totalNilai)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. INFORMATION GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left: General Details */}
                    <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-950">
                        <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50 py-4 px-6">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <ClipboardList className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Atribut Pemeriksaan</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                                <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Petugas Lapangan</p>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 transition-colors hover:border-blue-200">
                                        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-inner">
                                            {opname.petugas?.name?.charAt(0) || <User className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white leading-none mb-1">{opname.petugas?.name || 'Unassigned'}</p>
                                            <p className="text-xs text-slate-500 italic">Inventory Officer</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Lokasi Gudang</p>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 transition-colors hover:border-blue-200">
                                        <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold shadow-inner">
                                            <Warehouse className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white leading-none mb-1">{opname.warehouse?.name}</p>
                                            <p className="text-xs text-slate-500">{opname.warehouse?.code}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <FileText className="w-3.5 h-3.5" /> Catatan Audit
                                </p>
                                <div className="p-4 rounded-xl bg-blue-50/30 dark:bg-slate-900/50 border border-blue-100/50 dark:border-slate-800 min-h-[80px]">
                                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                        {opname.keterangan || "Tidak ada instruksi atau catatan khusus untuk sesi opname ini."}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Right: Difference Analytics */}
                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950">
                        <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50 py-4 px-6">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                    <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Analisis Selisih</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <span className="text-sm text-slate-500 font-medium">Deviasi Kuantitas</span>
                                    <span className={cn(
                                        "text-xl font-black tabular-nums",
                                        totalSelisih > 0 ? "text-emerald-600" : totalSelisih < 0 ? "text-rose-600" : "text-slate-400"
                                    )}>
                                        {totalSelisih > 0 ? "+" : ""}{formatNumber(totalSelisih)} <span className="text-xs font-normal text-slate-400">Unit</span>
                                    </span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className={cn("h-full transition-all duration-1000", totalSelisih >= 0 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]")}
                                        style={{ width: `${Math.min(Math.abs(totalSelisih), 100)}%` }}
                                    />
                                </div>
                            </div>

                            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 shadow-inner">
                                <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black mb-1">Estimasi Valuasi Selisih</p>
                                <p className={cn(
                                    "text-2xl font-black tabular-nums tracking-tight",
                                    totalSelisihValue > 0 ? "text-emerald-600" : totalSelisihValue < 0 ? "text-rose-600" : "text-slate-900 dark:text-white"
                                )}>
                                    {formatCurrency(totalSelisihValue)}
                                </p>
                            </div>

                            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 rounded-2xl text-xs border border-amber-100 dark:border-amber-900/30">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p className="leading-relaxed">
                                    <strong>Peringatan:</strong> Selisih nilai yang signifikan memerlukan tinjauan manajemen sebelum melakukan penyesuaian stok permanen.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 4. DATA TABLE SECTION */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden bg-white dark:bg-slate-950 print:border print:shadow-none">
                    <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b py-5 px-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-200 dark:bg-slate-800 rounded-lg">
                                    <Package className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                                </div>
                                <CardTitle className="text-lg font-bold tracking-tight">Rincian Inventaris</CardTitle>
                            </div>
                            <Badge variant="outline" className="font-mono px-3 bg-white dark:bg-slate-950">
                                {totalItems} entries
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Mobile View */}
                        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                            {opname.items.map((item, index) => (
                                <div key={item.id} className="p-5 space-y-4 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-4">
                                            <span className="text-xs font-black text-slate-300 mt-1">{(index + 1).toString().padStart(2, '0')}</span>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white leading-tight mb-1">{item.product?.name}</p>
                                                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded w-fit">
                                                    {item.product?.code} • {item.product?.storageUnit}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(item.totalNilai)}</p>
                                            <p className="text-[10px] text-slate-400 font-medium tracking-wide italic">Total Value</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                                            <p className="text-[9px] text-slate-400 uppercase font-black mb-1">System</p>
                                            <p className="text-sm font-bold">{formatNumber(item.stokSistem)}</p>
                                        </div>
                                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30 text-center">
                                            <p className="text-[9px] text-blue-400 dark:text-blue-500 uppercase font-black mb-1">Physical</p>
                                            <p className="text-sm font-black text-blue-700 dark:text-blue-300">{formatNumber(item.stokFisik)}</p>
                                        </div>
                                        <div className={cn(
                                            "p-2 rounded-xl border text-center",
                                            item.selisih === 0 ? "bg-slate-50 border-slate-100" : item.selisih > 0 ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"
                                        )}>
                                            <p className="text-[9px] text-slate-400 uppercase font-black mb-1">Diff</p>
                                            <p className={cn("text-sm font-black", item.selisih > 0 ? "text-emerald-600" : item.selisih < 0 ? "text-rose-600" : "text-slate-400")}>
                                                {item.selisih > 0 ? "+" : ""}{formatNumber(item.selisih)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop View */}
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/80 dark:bg-slate-900/80 border-b hover:bg-slate-50/80">
                                        <TableHead className="w-[60px] text-center font-black text-[10px] uppercase tracking-widest text-slate-400">No</TableHead>
                                        <TableHead className="min-w-[280px] font-black text-[10px] uppercase tracking-widest text-slate-400">Informasi Produk</TableHead>
                                        <TableHead className="text-center font-black text-[10px] uppercase tracking-widest text-slate-400">Stok Sistem</TableHead>
                                        <TableHead className="text-center font-black text-[10px] uppercase tracking-widest text-slate-400">Stok Fisik</TableHead>
                                        <TableHead className="text-center font-black text-[10px] uppercase tracking-widest text-slate-400">Selisih (Unit)</TableHead>
                                        <TableHead className="text-right font-black text-[10px] uppercase tracking-widest text-slate-400">Harga Satuan</TableHead>
                                        <TableHead className="text-right font-black text-[10px] uppercase tracking-widest text-slate-400 px-6">Total Valuasi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {opname.items.map((item, index) => (
                                        <TableRow key={item.id} className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors border-b dark:border-slate-800">
                                            <TableCell className="text-center font-mono text-xs text-slate-400">
                                                {(index + 1).toString().padStart(2, '0')}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors">{item.product?.name}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded leading-none">
                                                            {item.product?.code}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">
                                                            {item.product?.storageUnit || 'Unit'}
                                                        </span>
                                                    </div>
                                                    {item.catatanItem && (
                                                        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-blue-500 italic bg-blue-50 dark:bg-blue-900/20 w-fit px-2 py-0.5 rounded-full">
                                                            <Info className="w-3 h-3" /> {item.catatanItem}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center tabular-nums font-medium text-slate-600 dark:text-slate-400">
                                                {formatNumber(item.stokSistem)}
                                            </TableCell>
                                            <TableCell className="text-center bg-slate-50/30 dark:bg-slate-900/30">
                                                <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-black text-blue-600 dark:text-blue-400 shadow-sm tabular-nums">
                                                    {formatNumber(item.stokFisik)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className={cn(
                                                        "flex items-center gap-1 px-2.5 py-1 rounded-full font-black text-xs tabular-nums border",
                                                        item.selisih === 0 ? "bg-slate-50 text-slate-400 border-slate-100" :
                                                            item.selisih > 0 ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                                "bg-rose-50 text-rose-600 border-rose-100"
                                                    )}>
                                                        {item.selisih === 0 ? <Minus className="w-3 h-3" /> : item.selisih > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                        {item.selisih > 0 ? "+" : ""}{formatNumber(item.selisih)}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right text-slate-500 tabular-nums text-xs font-medium">
                                                {formatCurrency(item.hargaSatuan)}
                                            </TableCell>
                                            <TableCell className="text-right px-6">
                                                <span className="font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                                                    {formatCurrency(item.totalNilai)}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* 5. SIGNATURE SECTION (VISIBLE ON PRINT ONLY) */}
                <div className="hidden print:grid grid-cols-3 gap-8 mt-16 pt-8 border-t">
                    <div className="text-center space-y-20">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Dibuat Oleh (Petugas)</p>
                        <div className="space-y-1">
                            <p className="font-bold underline text-sm">{opname.petugas?.name}</p>
                            <p className="text-[10px] text-slate-400 italic">Inventory Clerk</p>
                        </div>
                    </div>
                    <div className="text-center space-y-20">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Diperiksa Oleh (Manager)</p>
                        <div className="space-y-1">
                            <p className="font-bold underline text-sm">________________________</p>
                            <p className="text-[10px] text-slate-400 italic">Warehouse Manager</p>
                        </div>
                    </div>
                    <div className="text-center space-y-20">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Divalidasi Oleh (Finance)</p>
                        <div className="space-y-1">
                            <p className="font-bold underline text-sm">________________________</p>
                            <p className="text-[10px] text-slate-400 italic">Financial Auditor</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}