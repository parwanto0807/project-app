"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import HeaderCard from "@/components/ui/header-card";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    FileText,
    RefreshCw,
    Calculator,
    TrendingUp,
    Calendar,
    Search,
    Filter,
    Download,
    ChevronLeft,
    ChevronRight,
    BarChart3,
    PieChart,
    ThumbsUp,
    AlertCircle
} from "lucide-react";
import { getGLSummaries } from "@/lib/action/accounting/glSummary";
import { GeneralLedgerSummary } from "@/types/glSummary";
import { TabelGeneralLedgerSummary } from "@/components/accounting/TabelGeneralLedgerSummary";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function GeneralLedgerSummaryPage() {
    const [data, setData] = useState<GeneralLedgerSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [period, setPeriod] = useState<string>("this-month");
    const [viewMode, setViewMode] = useState<"table" | "summary">("table");

    // Grand Total state (from backend calculation)
    const [totalDebit, setTotalDebit] = useState(0);
    const [totalCredit, setTotalCredit] = useState(0);
    const [isBalanced, setIsBalanced] = useState(true);
    const [balanceDifference, setBalanceDifference] = useState(0);

    const fetchData = useCallback(async (query: string = "") => {
        setIsLoading(true);
        try {
            // Fetch ALL GL Summaries (no pagination - set high limit)
            const queryString = query ? `${query}&limit=1000` : `?limit=1000`;
            const result = await getGLSummaries(queryString);
            setData(result.data);

            // Calculate totals from displayed data (same as Grand Total Summary)
            const calculatedTotalDebit = result.data.reduce((sum: number, item: any) =>
                sum + (Number(item.debitTotal) || 0), 0);
            const calculatedTotalCredit = result.data.reduce((sum: number, item: any) =>
                sum + (Number(item.creditTotal) || 0), 0);

            setTotalDebit(calculatedTotalDebit);
            setTotalCredit(calculatedTotalCredit);

            const difference = Math.abs(calculatedTotalDebit - calculatedTotalCredit);
            setIsBalanced(difference < 0.01);
            setBalanceDifference(difference);
        } catch (error: any) {
            toast.error(error.message || "Gagal memuat data summary buku besar");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Use useEffect with debounce for search
    useEffect(() => {
        const timer = setTimeout(() => {
            let query = `?search=${encodeURIComponent(searchTerm)}`;
            // Add period filter logic if needed, for now focusing on search
            fetchData(query);
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [searchTerm, fetchData]);

    const handleRefresh = () => {
        fetchData();
        toast.success("Data diperbarui");
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleExport = () => {
        toast.info("Fitur ekspor dalam pengembangan");
    };

    return (
        <AdminLayout title="General Ledger Summary" role="admin">
            <div className="space-y-4 px-2 md:px-4 lg:px-6">
                {/* Breadcrumb - Mobile Optimized */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Breadcrumb>
                            <BreadcrumbList className="text-[10px] sm:text-sm">
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/admin-area" className="text-slate-500 hover:text-blue-600 transition-colors text-[10px] sm:text-xs">
                                        Dashboard
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="h-3 w-3" />
                                <BreadcrumbItem>
                                    <span className="text-slate-500 text-[10px] sm:text-xs">Accounting</span>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="h-3 w-3" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="font-semibold text-slate-900 text-[10px] sm:text-xs">GL Summary</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                        <Badge variant="outline" className="bg-blue-50/50 text-blue-600 border-blue-100 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider">
                            REPORT
                        </Badge>
                    </div>

                    {/* View Toggle - Mobile Hidden */}
                    <div className="hidden sm:flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                        <Button
                            variant={viewMode === "table" ? "default" : "ghost"}
                            size="sm"
                            className={cn("h-7 px-3 text-xs rounded-md", viewMode === "table" && "bg-white shadow-sm")}
                            onClick={() => setViewMode("table")}
                        >
                            <FileText className="h-3.5 w-3.5 mr-1.5" />
                            Table
                        </Button>
                        <Button
                            variant={viewMode === "summary" ? "default" : "ghost"}
                            size="sm"
                            className={cn("h-7 px-3 text-xs rounded-md", viewMode === "summary" && "bg-white shadow-sm")}
                            onClick={() => setViewMode("summary")}
                        >
                            <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                            Summary
                        </Button>
                    </div>
                </div>

                {/* Header Card - Responsive */}
                <HeaderCard
                    title="General Ledger Summary"
                    description="Monitoring ringkasan transaksi harian dan akumulasi saldo per akun COA."
                    icon={<FileText className="text-white" />}
                    gradientFrom="from-blue-600"
                    gradientTo="to-indigo-700"
                    showActionArea={true}
                    actionArea={
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRefresh}
                                disabled={isLoading}
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white text-xs h-8 sm:h-9"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
                                <span className="hidden sm:inline">Refresh</span>
                                <span className="sm:hidden">Sync</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExport}
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white text-xs h-8 sm:h-9"
                            >
                                <Download className="h-3.5 w-3.5 mr-1.5" />
                                <span className="hidden sm:inline">Export</span>
                            </Button>
                        </div>
                    }
                />

                {/* Unified Premium Stats Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {/* Total Records */}
                    <Card className="border-none bg-gradient-to-br from-blue-50 to-blue-100/30 shadow-sm rounded-xl hover:shadow-md transition-all duration-300 h-[88px]">
                        <CardContent className="p-3 h-full flex flex-col justify-center">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest leading-none">Records</p>
                                    {isLoading ? (
                                        <Skeleton className="h-6 w-16 mt-1.5" />
                                    ) : (
                                        <p className="text-xl font-black text-slate-900 leading-tight mt-1.5">
                                            {data.length.toLocaleString()}
                                        </p>
                                    )}
                                    <p className="text-[9px] text-slate-400 font-medium italic mt-0.5">Entri Transaksi</p>
                                </div>
                                <div className="p-2 bg-white/60 rounded-xl shadow-sm">
                                    <FileText className="h-5 w-5 text-blue-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Unified Balance Status - GLOWING EDITION */}
                    <Card className={cn(
                        "border-none rounded-xl transition-all duration-500 h-[88px] relative overflow-hidden group",
                        isBalanced
                            ? "bg-emerald-50/80 ring-2 ring-emerald-500/20 shadow-[0_0_25px_rgba(16,185,129,0.25)]"
                            : "bg-rose-50/80 ring-2 ring-rose-500/20 shadow-[0_0_25px_rgba(244,63,94,0.25)]"
                    )}>
                        <CardContent className="p-3 h-full flex flex-col justify-center relative z-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <p className={cn(
                                            "text-[10px] font-black uppercase tracking-[0.2em] leading-none",
                                            isBalanced ? "text-emerald-600" : "text-rose-600"
                                        )}>
                                            STATUS {isBalanced ? 'OK' : 'ERROR'}
                                        </p>
                                        {!isBalanced && <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />}
                                    </div>

                                    <div className="mt-2 flex items-baseline gap-1">
                                        <p className={cn(
                                            "text-lg font-black leading-none tracking-tight",
                                            isBalanced ? "text-emerald-700" : "text-rose-700"
                                        )}>
                                            {isBalanced ? 'BALANCED' : `Diff: Rp${balanceDifference.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                        </p>
                                    </div>
                                    <p className="text-[9px] text-slate-500 font-bold italic mt-1 uppercase tracking-tight">
                                        {isBalanced ? 'Posisi Keuangan Aman' : 'Periksa Jurnal Kembali'}
                                    </p>
                                </div>

                                {/* High Impact Icon */}
                                <div className={cn(
                                    "p-2.5 rounded-2xl shadow-inner transition-transform duration-300 group-hover:scale-110",
                                    isBalanced ? "bg-emerald-500 text-white shadow-emerald-600/20" : "bg-rose-500 text-white shadow-rose-600/20"
                                )}>
                                    {isBalanced ? (
                                        <ThumbsUp className="h-6 w-6 fill-white/20" />
                                    ) : (
                                        <AlertCircle className="h-6 w-6 animate-bounce" />
                                    )}
                                </div>
                            </div>
                        </CardContent>

                        {/* Background Glow Effect */}
                        <div className={cn(
                            "absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 rounded-full blur-3xl opacity-40",
                            isBalanced ? "bg-emerald-400" : "bg-rose-400"
                        )} />
                    </Card>

                    {/* Total Debit */}
                    <Card className="border-none bg-gradient-to-br from-indigo-50 to-indigo-100/30 shadow-sm rounded-xl hover:shadow-md transition-all duration-300 h-[88px]">
                        <CardContent className="p-3 h-full flex flex-col justify-center">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest leading-none">Total Debit</p>
                                    <p className="text-base font-black text-slate-900 leading-tight mt-1.5">
                                        Rp{totalDebit.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-[9px] text-slate-400 font-medium italic mt-0.5">Aktiva (Debit)</p>
                                </div>
                                <div className="p-2 bg-white/60 rounded-xl shadow-sm">
                                    <TrendingUp className="h-5 w-5 text-indigo-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Total Credit */}
                    <Card className="border-none bg-gradient-to-br from-rose-50 to-rose-100/30 shadow-sm rounded-xl hover:shadow-md transition-all duration-300 h-[88px]">
                        <CardContent className="p-3 h-full flex flex-col justify-center">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest leading-none">Total Credit</p>
                                    <p className="text-base font-black text-slate-900 leading-tight mt-1.5">
                                        Rp{totalCredit.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-[9px] text-slate-400 font-medium italic mt-0.5">Pasiva (Kredit)</p>
                                </div>
                                <div className="p-2 bg-white/60 rounded-xl shadow-sm">
                                    <PieChart className="h-5 w-5 text-rose-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Period Filter Select */}
                    <Card className="border-none bg-gradient-to-br from-slate-50 to-slate-200/50 shadow-sm rounded-xl hover:shadow-md transition-all duration-300 h-[88px] col-span-1 sm:col-span-2 lg:col-span-1">
                        <CardContent className="p-3 h-full flex flex-col justify-center">
                            <div className="flex items-center justify-between">
                                <div className="w-full">
                                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest leading-none mb-1">Periode</p>
                                    <Select value={period} onValueChange={setPeriod}>
                                        <SelectTrigger className="h-8 w-full text-xs border-none bg-white/60 shadow-inner mt-1 rounded-lg">
                                            <SelectValue placeholder="Pilih Periode" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="today" className="text-xs">Hari Ini</SelectItem>
                                            <SelectItem value="this-week" className="text-xs">Minggu Ini</SelectItem>
                                            <SelectItem value="this-month" className="text-xs">Bulan Ini</SelectItem>
                                            <SelectItem value="this-year" className="text-xs">Tahun Ini</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="p-2 bg-white/60 rounded-xl shadow-sm ml-2 hidden lg:block">
                                    <Calendar className="h-5 w-5 text-slate-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search & Filters - Mobile Optimized */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <Input
                            placeholder="Search COA code, name, or description..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="pl-10 h-9 text-xs sm:text-sm border-slate-200 focus:ring-2 focus:ring-blue-500"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm("")}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                ×
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 text-xs border-slate-200 hover:bg-slate-50"
                        >
                            <Filter className="h-3.5 w-3.5 mr-1.5" />
                            <span className="hidden sm:inline">Filters</span>
                            <span className="sm:hidden">Filter</span>
                        </Button>
                        <div className="sm:hidden">
                            <Button
                                variant={viewMode === "table" ? "default" : "outline"}
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => setViewMode("table")}
                            >
                                <FileText className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>


                {/* Main Content Card */}
                <Card className="border-none shadow-lg overflow-hidden rounded-xl">
                    {/* <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-blue-50/20 p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex-1">
                                <CardTitle className="text-base sm:text-xl text-slate-800 flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                                    <span>General Ledger Summary</span>
                                </CardTitle>
                                <CardDescription className="text-xs sm:text-sm">
                                    Ringkasan saldo pembukaan, total debit, kredit, dan saldo penutupan per COA
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="text-[10px] sm:text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                    Showing {data.length} of {pagination.total} records
                                </div>
                            </div>
                        </div>
                    </CardHeader> */}
                    <CardContent className="px-2">
                        <TabelGeneralLedgerSummary
                            data={data}
                            isLoading={isLoading}
                        />
                    </CardContent>
                </Card>


                {/* Total Records Info */}
                {!isLoading && data.length > 0 && (
                    <div className="flex items-center justify-center p-3 bg-gradient-to-r from-slate-50 to-blue-50/10 rounded-xl border">
                        <div className="text-sm text-slate-700 font-medium">
                            Showing <span className="font-bold text-blue-600">{data.length}</span> accounts
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}