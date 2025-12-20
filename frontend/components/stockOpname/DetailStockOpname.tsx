"use client";

import React, { useRef } from "react";
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
    AlertCircle
} from "lucide-react";
import { format } from "date-fns";


import { cn, formatCurrency, formatNumber, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { StockOpname, OpnameType, OpnameStatus } from "@/types/soType";

interface DetailStockOpnameProps {
    data: StockOpname;
    onBack: () => void;
    onEdit?: (id: string) => void;
}

export default function DetailStockOpname({
    data,
    onBack,
    onEdit
}: DetailStockOpnameProps) {
    const router = useRouter();
    const handlePrint = () => {
        window.print();
    };

    // Helper functions for badges and icons
    const getStatusBadge = (status: OpnameStatus) => {
        switch (status) {
            case OpnameStatus.DRAFT:
                return (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1 text-sm font-medium">
                        <FileText className="w-3 h-3 mr-1" /> Draft
                    </Badge>
                );
            case OpnameStatus.ADJUSTED:
                return (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1 text-sm font-medium">
                        <CheckCircle className="w-3 h-3 mr-1" /> Adjusted
                    </Badge>
                );
            case OpnameStatus.CANCELLED:
                return (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 px-3 py-1 text-sm font-medium">
                        <XCircle className="w-3 h-3 mr-1" /> Cancelled
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getTypeBadge = (type: OpnameType) => {
        switch (type) {
            case OpnameType.INITIAL:
                return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200">Initial</Badge>;
            case OpnameType.PERIODIC:
                return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200">Periodic</Badge>;
            case OpnameType.AD_HOC:
                return <Badge className="bg-cyan-100 text-cyan-800 hover:bg-cyan-100 border-cyan-200">Ad-Hoc</Badge>;
            default:
                return <Badge>{type}</Badge>;
        }
    };

    const getSelisihIcon = (selisih: number) => {
        if (selisih > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
        if (selisih < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
        return <Minus className="h-4 w-4 text-slate-400" />;
    };

    // Calculate totals
    const totalItems = data.items.length;
    const totalNilai = data.items.reduce((acc, item) => acc + Number(item.totalNilai || 0), 0);
    const totalSelisih = data.items.reduce((acc, item) => acc + Number(item.selisih || 0), 0);
    const totalSelisihValue = data.items.reduce((acc, item) => acc + (Number(item.selisih || 0) * Number(item.hargaSatuan || 0)), 0);

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Top Navigation & Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <Button variant="outline" className="gap-2 pl-0 hover:bg-transparent hover:text-blue-600" onClick={onBack}>
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-lg font-medium">Kembali ke Daftar</span>
                </Button>

                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2 bg-white" onClick={handlePrint}>
                        <Printer className="w-4 h-4" />
                        Print / PDF
                    </Button>
                    {data.status === OpnameStatus.DRAFT && (
                        <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => onEdit ? onEdit(data.id) : router.push(`/admin-area/inventory/stock-opname/${data.id}/edit`)}>
                            <Edit className="w-4 h-4" />
                            Edit Opname
                        </Button>
                    )}
                </div>
            </div>

            <div className="space-y-6 bg-slate-50/30 p-1 sm:p-6 rounded-xl print:bg-white print:p-0">

                {/* --- HEADER SECTION --- */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 p-8 text-white shadow-xl print:hidden">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                {getStatusBadge(data.status)}
                                {getTypeBadge(data.type)}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
                                    {data.nomorOpname}
                                </h1>
                                <div className="flex items-center gap-2 text-blue-200 text-sm">
                                    <Calendar className="w-4 h-4" />
                                    <span>Dilakukan pada {formatDate(data.tanggalOpname, 'long')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Summary Cards in Header */}
                        <div className="flex gap-4">
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 min-w-[120px] border border-white/10">
                                <p className="text-blue-200 text-xs uppercase tracking-wider font-semibold">Total Items</p>
                                <p className="text-2xl font-bold text-white mt-1">{totalItems}</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 min-w-[140px] border border-white/10">
                                <p className="text-blue-200 text-xs uppercase tracking-wider font-semibold">Total Nilai</p>
                                <p className="text-xl font-bold text-emerald-300 mt-1">{formatCurrency(totalNilai)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Background decoration */}
                    <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute left-10 bottom-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl translate-y-1/3" />
                </div>

                {/* Print Header (Visible only on print) */}
                <div className="hidden print:block mb-8 border-b pb-4">
                    <h1 className="text-2xl font-bold text-slate-900">Laporan Stock Opname</h1>
                    <div className="flex justify-between mt-4">
                        <div>
                            <p className="text-sm text-slate-500">Nomor Dokumen</p>
                            <p className="font-semibold">{data.nomorOpname}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-500">Tanggal</p>
                            <p className="font-semibold">{formatDate(data.tanggalOpname, 'long')}</p>
                        </div>
                    </div>
                </div>

                {/* --- MAIN INFO GRID --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column: Details */}
                    <Card className="md:col-span-2 border-slate-200 shadow-sm print:border-none print:shadow-none">
                        <CardHeader className="bg-slate-50/50 border-b pb-4">
                            <div className="flex items-center gap-2 text-slate-700">
                                <ClipboardList className="w-5 h-5 text-blue-600" />
                                <h3 className="font-semibold">Informasi Detail</h3>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                    <Warehouse className="w-4 h-4" /> Gudang Lokasi
                                </label>
                                <p className="font-semibold text-slate-900 text-lg">
                                    {data.warehouse?.name || '-'}
                                </p>
                                <p className="text-xs text-slate-500">{data.warehouse?.code}</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                    <User className="w-4 h-4" /> Petugas Pemeriksa
                                </label>
                                <p className="font-semibold text-slate-900 text-lg">
                                    {data.petugas?.name || '-'}
                                </p>
                            </div>

                            <div className="space-y-1.5 sm:col-span-2">
                                <label className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Keterangan / Catatan
                                </label>
                                <div className="bg-slate-50 p-3 rounded-md border border-slate-100 min-h-[60px]">
                                    <p className="text-slate-700 text-sm whitespace-pre-wrap">
                                        {data.keterangan || "Tidak ada catatan tambahan."}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Right Column: Statistics */}
                    <Card className="border-slate-200 shadow-sm bg-gradient-to-b from-white to-slate-50 print:border hidden print:block md:block">
                        <CardHeader className="border-b pb-4">
                            <div className="flex items-center gap-2 text-slate-700">
                                <TrendingUp className="w-5 h-5 text-emerald-600" />
                                <h3 className="font-semibold">Ringkasan Selisih</h3>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Total Unit Selisih</span>
                                    <span className={cn(
                                        "font-bold",
                                        totalSelisih > 0 ? "text-green-600" : totalSelisih < 0 ? "text-red-600" : "text-slate-600"
                                    )}>
                                        {totalSelisih > 0 ? "+" : ""}{formatNumber(totalSelisih)}
                                    </span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                    <div
                                        className={cn("h-full rounded-full", totalSelisih >= 0 ? "bg-green-500" : "bg-red-500")}
                                        style={{ width: `${Math.min(Math.abs(totalSelisih), 100)}%` }}
                                    />
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                                <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Nilai Selisih (Estimasi)</p>
                                <p className={cn(
                                    "text-2xl font-bold",
                                    totalSelisihValue > 0 ? "text-green-600" : totalSelisihValue < 0 ? "text-red-600" : "text-slate-900"
                                )}>
                                    {formatCurrency(totalSelisihValue)}
                                </p>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-blue-50 text-blue-800 rounded-lg text-xs leading-relaxed">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <p>Pastikan untuk melakukan review terhadap selisih stok sebelum melakukan Adjustment pada sistem.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* --- ITEM DETAILS TABLE --- */}
                <Card className="border-slate-200 shadow-md overflow-hidden print:shadow-none print:border">
                    <CardHeader className="bg-slate-50 border-b py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Package className="w-5 h-5 text-blue-600" />
                                <CardTitle className="text-base font-semibold text-slate-700">
                                    Rincian Barang (Item Details)
                                </CardTitle>
                            </div>
                            <Badge variant="outline" className="bg-white">
                                {totalItems} Items
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Mobile View for Items */}
                        <div className="md:hidden divide-y divide-slate-100">
                            {data.items.map((item, index) => (
                                <div key={item.id} className="p-4 space-y-3 bg-white">
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{item.product?.name}</p>
                                                <p className="text-xs text-slate-500 font-mono">{item.product?.code} • {item.product?.storageUnit || 'Unit'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-slate-900">{formatCurrency(item.totalNilai)}</p>
                                            <p className="text-[10px] text-slate-500">{formatCurrency(item.hargaSatuan)} / unit</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-dashed border-slate-100">
                                        <div className="text-center">
                                            <p className="text-[10px] text-slate-500 uppercase font-semibold">Sistem</p>
                                            <p className="text-sm font-medium">{formatNumber(item.stokSistem)}</p>
                                        </div>
                                        <div className="text-center bg-slate-50 rounded-md py-1">
                                            <p className="text-[10px] text-slate-500 uppercase font-semibold">Fisik</p>
                                            <p className="text-sm font-bold text-blue-700">{formatNumber(item.stokFisik)}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] text-slate-500 uppercase font-semibold">Selisih</p>
                                            <div className="flex items-center justify-center gap-1">
                                                {getSelisihIcon(item.selisih)}
                                                <span className={cn(
                                                    "text-sm font-bold",
                                                    item.selisih > 0 ? "text-green-600" : item.selisih < 0 ? "text-red-600" : "text-slate-400"
                                                )}>
                                                    {formatNumber(item.selisih)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {item.catatanItem && (
                                        <div className="flex gap-2 items-start bg-blue-50/50 p-2 rounded-md">
                                            <FileText className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                                            <p className="text-xs text-blue-700 italic">{item.catatanItem}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {data.items.length === 0 && (
                                <div className="p-8 text-center text-slate-400 text-sm">
                                    Tidak ada item dalam opname ini.
                                </div>
                            )}
                        </div>

                        {/* Desktop View for Items */}
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader className="bg-slate-100/50">
                                    <TableRow>
                                        <TableHead className="w-[50px] text-center font-bold text-slate-600">No</TableHead>
                                        <TableHead className="min-w-[250px] font-bold text-slate-600">Produk</TableHead>
                                        <TableHead className="text-center font-bold text-slate-600">Stok Sistem</TableHead>
                                        <TableHead className="text-center font-bold text-slate-600">Stok Fisik</TableHead>
                                        <TableHead className="text-center font-bold text-slate-600">Selisih</TableHead>
                                        <TableHead className="text-right font-bold text-slate-600">Harga Satuan</TableHead>
                                        <TableHead className="text-right font-bold text-slate-600">Total Nilai</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.items.map((item, index) => (
                                        <TableRow key={item.id} className="hover:bg-blue-50/30 transition-colors">
                                            <TableCell className="text-center font-medium text-slate-500">
                                                {index + 1}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-slate-800">{item.product?.name}</span>
                                                    <span className="text-xs text-slate-500 font-mono">
                                                        {item.product?.code} • {item.product?.storageUnit || 'Unit'}
                                                    </span>
                                                    {item.catatanItem && (
                                                        <span className="text-xs text-blue-600 mt-1 italic flex items-center gap-1">
                                                            <FileText className="w-3 h-3" /> {item.catatanItem}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center text-slate-600">
                                                {formatNumber(item.stokSistem)}
                                            </TableCell>
                                            <TableCell className="text-center font-semibold text-slate-900 bg-slate-50/50">
                                                {formatNumber(item.stokFisik)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {getSelisihIcon(item.selisih)}
                                                    <span className={cn(
                                                        "font-bold",
                                                        item.selisih > 0 ? "text-green-600" : item.selisih < 0 ? "text-red-600" : "text-slate-400"
                                                    )}>
                                                        {formatNumber(item.selisih)}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right text-slate-600 tabular-nums">
                                                {formatCurrency(item.hargaSatuan)}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-slate-900 tabular-nums">
                                                {formatCurrency(item.totalNilai)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {data.items.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                                Tidak ada item dalam opname ini.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
