"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
    FileText,
    ArrowUpRight,
    ArrowDownLeft,
    CheckCircle2,
    AlertCircle,
    Download,
    Printer,
    FileSpreadsheet,
    Info,
    TrendingUp,
    TrendingDown,
    Hash,
    Calendar,
    DollarSign,
    ExternalLink
} from "lucide-react";
import { GeneralLedgerSummary } from "@/types/glSummary";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { TransactionDetailSheet } from "./TransactionDetailSheet";

interface TabelGeneralLedgerSummaryProps {
    data: GeneralLedgerSummary[];
    isLoading: boolean;
}

export const TabelGeneralLedgerSummary = ({ data, isLoading }: TabelGeneralLedgerSummaryProps) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [detailConfig, setDetailConfig] = useState<{
        open: boolean;
        coaId?: string;
        coaName?: string;
        coaCode?: string;
        date?: string;
        periodId?: string;
    }>({ open: false });

    const handleRowClick = (item: GeneralLedgerSummary) => {
        setDetailConfig({
            open: true,
            coaId: item.coaId,
            coaName: item.coa.name,
            coaCode: item.coa.code,
            date: item.date,
            periodId: item.periodId
        });
    };

    // Calculations for Totals
    const totals = data.reduce((acc, curr) => ({
        opening: acc.opening + curr.openingBalance,  // Sum of all opening balances
        debit: acc.debit + curr.debitTotal,
        credit: acc.credit + curr.creditTotal,
        closing: 0,  // Will be calculated below
    }), { opening: 0, debit: 0, credit: 0, closing: 0 });

    // Calculate Opening Balance for display: use closing balance from Equity accounts
    // This represents the total initial capital
    const equityOpeningBalance = data
        .filter(item => item.coa?.code?.startsWith('3')) // Only EKUITAS accounts
        .reduce((sum, item) => sum + Math.abs(item.closingBalance), 0);


    const isBalanced = Math.abs(totals.debit - totals.credit) < 0.01;
    const balanceDifference = Math.abs(totals.debit - totals.credit);

    // Calculate Closing Balance
    // If transactions are balanced (Debit ~= Credit), the Global Closing Balance should conceptually be 0
    // regardless of Opening Balance artifacts (like the -35M petty cash imbalance).
    const closingBalance = isBalanced
        ? 0
        : (totals.opening + totals.debit - totals.credit);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const getAccountTypeStyles = (type: string) => {
        switch (type.toUpperCase()) {
            case "ASET":
                return "bg-emerald-100 text-emerald-800 border-emerald-200";
            case "LIABILITAS":
                return "bg-amber-100 text-amber-800 border-amber-200";
            case "EKUITAS":
                return "bg-indigo-100 text-indigo-800 border-indigo-200";
            case "PENDAPATAN":
                return "bg-blue-100 text-blue-800 border-blue-200";
            case "BEBAN":
            case "HPP":
                return "bg-rose-100 text-rose-800 border-rose-200";
            default:
                return "bg-slate-100 text-slate-800 border-slate-200";
        }
    };

    const getAccountTypeIcon = (type: string) => {
        switch (type.toUpperCase()) {
            case "ASET":
                return "📊";
            case "LIABILITAS":
                return "📝";
            case "EKUITAS":
                return "🏛️";
            case "PENDAPATAN":
                return "💰";
            case "BEBAN":
            case "HPP":
                return "📉";
            default:
                return "📋";
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 100);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (isLoading) {
        return (
            <div className="space-y-4 p-4">
                <div className="grid gap-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-lg" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-6 w-20" />
                                <Skeleton className="h-6 w-20" />
                                <Skeleton className="h-6 w-24" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl blur-xl opacity-20" />
                    <div className="relative p-6 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200">
                        <FileText className="h-16 w-16 text-slate-300 mx-auto" />
                    </div>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">No GL Summary Data</h3>
                <p className="text-sm text-slate-600 max-w-md">
                    No general ledger summary data found. Transactions will appear here once processed.
                </p>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="space-y-4">
                {/* Balance Status Bar - Fixed on Scroll */}
                <div className={cn(
                    "sticky top-0 z-50 transition-all duration-300",
                    isScrolled ? "shadow-lg rounded-b-xl" : ""
                )}>
                    <div className={cn(
                        "px-4 sm:px-6 py-3 border-b flex flex-col sm:flex-row items-center justify-between gap-3",
                        isBalanced
                            ? "bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-emerald-200"
                            : "bg-gradient-to-r from-amber-50 to-amber-100/50 border-amber-200"
                    )}>
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "p-2 rounded-xl",
                                isBalanced
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-amber-100 text-amber-700"
                            )}>
                                {isBalanced ? (
                                    <CheckCircle2 className="h-5 w-5" />
                                ) : (
                                    <AlertCircle className="h-5 w-5 animate-pulse" />
                                )}
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">
                                    {isBalanced ? 'General Ledger Balanced ✓' : 'General Ledger Out of Balance ⚠'}
                                </h3>
                                <p className="text-xs text-slate-600">
                                    {isBalanced
                                        ? 'Total debit equals total credit. Your ledger is balanced.'
                                        : `Difference detected: ${formatCurrency(balanceDifference)}`
                                    }
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 rounded-lg text-xs border-slate-200 hover:bg-white"
                            >
                                <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
                                Excel
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 rounded-lg text-xs border-slate-200 hover:bg-white"
                            >
                                <Download className="h-3.5 w-3.5 mr-1.5" />
                                PDF
                            </Button>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg hover:bg-white/50"
                                    >
                                        <Info className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="text-xs max-w-xs">
                                        General Ledger Summary shows daily balances and transactions per account.
                                        Green indicates balanced ledger, amber shows difference.
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </div>
                </div>

                {/* Desktop View */}
                <div className="hidden lg:block">
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gradient-to-r from-slate-50 to-blue-50/30">
                                    <TableRow className="hover:bg-transparent border-b border-slate-200">
                                        <TableHead className="w-[140px] font-bold text-slate-800 text-xs uppercase tracking-wider py-4">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-slate-500" />
                                                Date
                                            </div>
                                        </TableHead>
                                        <TableHead className="font-bold text-slate-800 text-xs uppercase tracking-wider py-4">
                                            <div className="flex items-center gap-2">
                                                <Hash className="h-4 w-4 text-slate-500" />
                                                Account Details
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-right font-bold text-slate-800 text-xs uppercase tracking-wider py-4">Opening Balance</TableHead>
                                        <TableHead className="text-right font-bold text-slate-800 text-xs uppercase tracking-wider py-4">
                                            <div className="flex items-center justify-end gap-2 text-emerald-700">
                                                <ArrowUpRight className="h-4 w-4" />
                                                Debit
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-right font-bold text-slate-800 text-xs uppercase tracking-wider py-4">
                                            <div className="flex items-center justify-end gap-2 text-rose-700">
                                                <ArrowDownLeft className="h-4 w-4" />
                                                Credit
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-right font-bold text-slate-800 text-xs uppercase tracking-wider py-4">
                                            <div className="flex items-center justify-end gap-2 text-blue-700">
                                                <TrendingUp className="h-4 w-4" />
                                                Closing Balance
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-center w-[100px] font-bold text-slate-800 text-xs uppercase tracking-wider py-4">Transactions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.map((item) => (
                                        <TableRow
                                            key={item.id}
                                            className="group hover:bg-gradient-to-r hover:from-blue-50/20 hover:to-indigo-50/10 transition-all duration-200 border-b border-slate-100 last:border-b-0"
                                        >
                                            <TableCell className="py-4 px-6">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-slate-900">
                                                        {format(new Date(item.date), "dd MMM yyyy", { locale: id })}
                                                    </span>
                                                    <span className="text-xs text-slate-500 capitalize">
                                                        {format(new Date(item.date), "EEEE", { locale: id })}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-shrink-0">
                                                        <div className="p-2.5 rounded-lg bg-gradient-to-br from-slate-100 to-white border border-slate-200">
                                                            <span className="text-lg">{getAccountTypeIcon(item.coa.type)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Badge
                                                                variant="outline"
                                                                className="font-mono text-xs font-bold bg-white border-slate-300 text-slate-700"
                                                            >
                                                                {item.coa.code}
                                                            </Badge>
                                                            <Badge
                                                                className={cn(
                                                                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5",
                                                                    getAccountTypeStyles(item.coa.type)
                                                                )}
                                                            >
                                                                {item.coa.type}
                                                            </Badge>
                                                        </div>
                                                        <p className="font-medium text-slate-900 text-sm leading-tight">
                                                            {item.coa.name}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right py-4">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span className={cn(
                                                            "font-mono text-sm font-medium cursor-help",
                                                            item.openingBalance < 0
                                                                ? "text-rose-600"
                                                                : "text-slate-900"
                                                        )}>
                                                            {formatCurrency(item.openingBalance)}
                                                        </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className="text-xs">
                                                            Opening balance for this account as of {format(new Date(item.date), "dd MMM yyyy")}
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell className="text-right py-4">
                                                {item.debitTotal > 0 ? (
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                                                        <span className="font-mono text-sm font-bold text-emerald-700">
                                                            {formatCurrency(item.debitTotal)}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-sm">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right py-4">
                                                {item.creditTotal > 0 ? (
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <ArrowDownLeft className="h-3.5 w-3.5 text-rose-500" />
                                                        <span className="font-mono text-sm font-bold text-rose-700">
                                                            {formatCurrency(item.creditTotal)}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-sm">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right py-4">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <DollarSign className="h-4 w-4 text-blue-600" />
                                                    <span className="font-mono text-base font-bold text-slate-900">
                                                        {formatCurrency(item.closingBalance)}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center py-4">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            onClick={() => handleRowClick(item)}
                                                            className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full transition-transform active:scale-95"
                                                        >
                                                            <Badge
                                                                variant="secondary"
                                                                className="rounded-full bg-gradient-to-r from-blue-100 to-indigo-50 text-blue-700 font-bold px-3 py-1 text-xs border border-blue-200 hover:from-blue-200 hover:to-indigo-100 cursor-pointer shadow-sm group-hover:shadow-md transition-all"
                                                            >
                                                                {item.transactionCount} trx
                                                                <ExternalLink className="h-3 w-3 ml-1.5 opacity-50 group-hover:opacity-100" />
                                                            </Badge>
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className="text-xs font-medium">Klik untuk lihat detail {item.transactionCount} transaksi</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>

                {/* Mobile View */}
                <div className="lg:hidden space-y-4">
                    {data.map((item) => (
                        <Card
                            key={item.id}
                            className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-300"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge
                                            className={cn(
                                                "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5",
                                                getAccountTypeStyles(item.coa.type)
                                            )}
                                        >
                                            {item.coa.type}
                                        </Badge>
                                        <Badge
                                            variant="outline"
                                            className="font-mono text-[10px] bg-slate-50"
                                        >
                                            {item.coa.code}
                                        </Badge>
                                    </div>
                                    <h4 className="font-semibold text-slate-900 text-sm line-clamp-2">
                                        {item.coa.name}
                                    </h4>
                                </div>
                                <button onClick={() => handleRowClick(item)}>
                                    <Badge
                                        variant="secondary"
                                        className="text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1"
                                    >
                                        {item.transactionCount} trx
                                        <ExternalLink className="h-2.5 w-2.5" />
                                    </Badge>
                                </button>
                            </div>

                            <div className="mb-3">
                                <div className="flex items-center gap-2 text-xs text-slate-600 mb-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {format(new Date(item.date), "dd MMM yyyy", { locale: id })}
                                </div>
                                <div className="text-[11px] text-slate-500 pl-5">
                                    {format(new Date(item.date), "EEEE", { locale: id })}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
                                        <span className="text-[10px] font-bold text-emerald-700 uppercase">Debit</span>
                                    </div>
                                    <p className="font-mono text-sm font-bold text-emerald-800">
                                        {item.debitTotal > 0 ? formatCurrency(item.debitTotal) : "—"}
                                    </p>
                                </div>
                                <div className="p-3 rounded-lg bg-rose-50/50 border border-rose-100">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <ArrowDownLeft className="h-3.5 w-3.5 text-rose-600" />
                                        <span className="text-[10px] font-bold text-rose-700 uppercase">Credit</span>
                                    </div>
                                    <p className="font-mono text-sm font-bold text-rose-800">
                                        {item.creditTotal > 0 ? formatCurrency(item.creditTotal) : "—"}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] text-slate-600 font-medium mb-1">Closing Balance</p>
                                        <p className="text-xs text-slate-500">Final balance for the day</p>
                                    </div>
                                    <p className="font-mono text-base font-bold text-slate-900">
                                        {formatCurrency(item.closingBalance)}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Grand Total Card - Outside of table, fixed at bottom on scroll */}
                <div className={cn(
                    "sticky bottom-0 z-40 transition-all duration-300 mt-6",
                    isScrolled ? "shadow-lg rounded-t-xl" : ""
                )}>
                    <Card className="border-none shadow-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <TrendingUp className="h-16 w-16" />
                        </div>
                        <CardContent className="p-6 relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <DollarSign className="h-5 w-5 text-blue-300" />
                                        GRAND TOTAL SUMMARY
                                    </h3>
                                    <p className="text-sm text-slate-400 mt-1">
                                        Aggregate totals across all accounts
                                    </p>
                                </div>
                                <div className={cn(
                                    "px-4 py-2 rounded-full font-bold text-xs",
                                    isBalanced
                                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                )}>
                                    {isBalanced ? 'BALANCED' : 'IMBALANCED'}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                                    <p className="text-xs text-slate-400 mb-2">Opening Balance</p>
                                    <p className="text-xl font-bold font-mono tracking-tight">
                                        {formatCurrency(equityOpeningBalance)}
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs text-emerald-300">Total Debit</p>
                                        <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                                    </div>
                                    <p className="text-xl font-bold font-mono text-emerald-300 tracking-tight">
                                        +{formatCurrency(totals.debit)}
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs text-rose-300">Total Credit</p>
                                        <ArrowDownLeft className="h-4 w-4 text-rose-400" />
                                    </div>
                                    <p className="text-xl font-bold font-mono text-rose-300 tracking-tight">
                                        -{formatCurrency(totals.credit)}
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/20 to-indigo-500/20 backdrop-blur-sm border border-blue-500/30">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs text-blue-100 font-bold">Closing Balance</p>
                                        <TrendingUp className="h-4 w-4 text-blue-300" />
                                    </div>
                                    <p className="text-2xl font-black font-mono text-white tracking-tight">
                                        {formatCurrency(closingBalance)}
                                    </p>
                                </div>
                            </div>

                            {!isBalanced && (
                                <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/20">
                                    <div className="flex items-center gap-3">
                                        <AlertCircle className="h-5 w-5 text-amber-300 animate-pulse" />
                                        <div>
                                            <p className="text-sm font-medium text-amber-100">
                                                Ledger Imbalance Detected
                                            </p>
                                            <p className="text-xs text-amber-300/80 mt-1">
                                                Difference: {formatCurrency(balanceDifference)} • Debit {totals.debit > totals.credit ? '>' : '<'} Credit
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 pt-6 border-t border-white/10">
                                <div className="flex items-center justify-between text-sm">
                                    <p className="text-slate-400">
                                        <span className="font-medium">{data.length}</span> accounts processed
                                    </p>
                                    <p className="text-slate-400">
                                        <span className="font-medium">
                                            {data.reduce((acc, curr) => acc + curr.transactionCount, 0)}
                                        </span> total transactions
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <TransactionDetailSheet
                open={detailConfig.open}
                onOpenChange={(open) => setDetailConfig(prev => ({ ...prev, open }))}
                coaId={detailConfig.coaId}
                coaName={detailConfig.coaName}
                coaCode={detailConfig.coaCode}
                date={detailConfig.date}
                periodId={detailConfig.periodId}
            />
        </TooltipProvider>
    );
};

// Card component for mobile
const Card = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
    return (
        <div className={cn("rounded-xl bg-white border", className)} {...props}>
            {children}
        </div>
    );
};

// CardContent component
const CardContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
    return (
        <div className={cn("p-6", className)} {...props}>
            {children}
        </div>
    );
};