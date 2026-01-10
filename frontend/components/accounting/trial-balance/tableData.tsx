"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrialBalance, TrialBalanceTotals } from "@/schemas/accounting/trialBalance";
import {
    BookOpen,
    ArrowRightLeft,
    ArrowUpCircle,
    Calculator,
    Wallet,
    PieChart,
    TrendingUp,
    TrendingDown,
    ChevronRight,
    Eye,
    Filter,
    Download,
    AlertCircle,
    CheckCircle2,
    XCircle,
    MoreVertical
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface TrialBalanceDataTableProps {
    data: TrialBalance[];
    totals: TrialBalanceTotals;
    isLoading: boolean;
}

export function TrialBalanceDataTable({ data, totals, isLoading }: TrialBalanceDataTableProps) {
    const [expandedAccount, setExpandedAccount] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'desktop' | 'mobile' | 'auto'>('auto');
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const formatCurrencyCompact = (amount: number) => {
        return formatCurrency(amount);
    };

    const getDisplayAmount = (debit: number, credit: number) => {
        return debit > 0 ? debit : credit > 0 ? credit : 0;
    };

    const getCOAIcon = (accountType: string) => {
        const baseClass = "h-3 w-3 md:h-4 md:w-4";
        switch (accountType) {
            case "ASET":
                return <Wallet className={cn(baseClass, "text-emerald-600")} />;
            case "LIABILITAS":
                return <ArrowUpCircle className={cn(baseClass, "text-rose-600")} />;
            case "EKUITAS":
                return <PieChart className={cn(baseClass, "text-purple-600")} />;
            case "PENDAPATAN":
                return <TrendingUp className={cn(baseClass, "text-blue-600")} />;
            case "HPP":
                return <TrendingDown className={cn(baseClass, "text-amber-600")} />;
            case "BEBAN":
                return <TrendingDown className={cn(baseClass, "text-orange-600")} />;
            default:
                return <BookOpen className={cn(baseClass, "text-gray-600")} />;
        }
    };

    const getAccountTypeColor = (type: string) => {
        switch (type) {
            case "ASET": return "bg-emerald-50 border-emerald-200 text-emerald-800";
            case "LIABILITAS": return "bg-rose-50 border-rose-200 text-rose-800";
            case "EKUITAS": return "bg-purple-50 border-purple-200 text-purple-800";
            case "PENDAPATAN": return "bg-blue-50 border-blue-200 text-blue-800";
            case "HPP": return "bg-amber-50 border-amber-200 text-amber-800";
            case "BEBAN": return "bg-orange-50 border-orange-200 text-orange-800";
            default: return "bg-gray-50 border-gray-200 text-gray-800";
        }
    };

    const MobileView = () => (
        <div className="md:hidden space-y-3">
            {data.map((record) => {
                const openingAmount = getDisplayAmount(record.openingDebit, record.openingCredit);
                const periodAmount = getDisplayAmount(record.periodDebit, record.periodCredit);
                const endingAmount = getDisplayAmount(record.endingDebit, record.endingCredit);

                return (
                    <div key={record.id} className="bg-white rounded-lg border shadow-xs overflow-hidden">
                        <div
                            className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => setExpandedAccount(expandedAccount === record.id ? null : record.id)}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    {getCOAIcon(record.coa.type)}
                                    <div>
                                        <div className="font-semibold text-xs text-gray-900">{record.coa.code}</div>
                                        <div className="text-xs text-gray-600 truncate max-w-[180px]">
                                            {record.coa.name}
                                        </div>
                                    </div>
                                </div>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "text-[10px] font-bold px-1.5 py-0",
                                        getAccountTypeColor(record.coa.type)
                                    )}
                                >
                                    {record.coa.type}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div className="text-center p-1.5 bg-amber-50 rounded">
                                    <div className="text-[10px] text-amber-700 font-medium mb-0.5">Opening</div>
                                    <div className="font-mono text-xs font-bold text-amber-800">
                                        {openingAmount > 0 ? formatCurrencyCompact(openingAmount) : "-"}
                                    </div>
                                </div>
                                <div className="text-center p-1.5 bg-blue-50 rounded">
                                    <div className="text-[10px] text-blue-700 font-medium mb-0.5">Period</div>
                                    <div className="font-mono text-xs font-bold text-blue-800">
                                        {periodAmount > 0 ? formatCurrencyCompact(periodAmount) : "-"}
                                    </div>
                                </div>
                                <div className="text-center p-1.5 bg-emerald-50 rounded">
                                    <div className="text-[10px] text-emerald-700 font-medium mb-0.5">Ending</div>
                                    <div className="font-mono text-xs font-bold text-emerald-800">
                                        {endingAmount > 0 ? formatCurrencyCompact(endingAmount) : "-"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {expandedAccount === record.id && (
                            <div className="border-t p-3 bg-gray-50">
                                <div className="space-y-2">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-semibold text-amber-700 uppercase">OPENING</div>
                                            <div className="space-y-0.5">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-600">Debit:</span>
                                                    <span className="font-mono">{record.openingDebit > 0 ? formatCurrency(record.openingDebit) : "-"}</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-600">Credit:</span>
                                                    <span className="font-mono">{record.openingCredit > 0 ? formatCurrency(record.openingCredit) : "-"}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="text-[10px] font-semibold text-blue-700 uppercase">TRANSACTIONS</div>
                                            <div className="space-y-0.5">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-600">Debit:</span>
                                                    <span className="font-mono">{record.periodDebit > 0 ? formatCurrency(record.periodDebit) : "-"}</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-600">Credit:</span>
                                                    <span className="font-mono">{record.periodCredit > 0 ? formatCurrency(record.periodCredit) : "-"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t">
                                        <div className="text-[10px] font-semibold text-emerald-700 uppercase mb-1">ENDING DETAIL</div>
                                        <div className="space-y-0.5">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-600">Debit:</span>
                                                <span className="font-mono font-bold">{record.endingDebit > 0 ? formatCurrency(record.endingDebit) : "-"}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-600">Credit:</span>
                                                <span className="font-mono font-bold">{record.endingCredit > 0 ? formatCurrency(record.endingCredit) : "-"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <Skeleton className="h-7 w-40" />
                        <Skeleton className="h-3 w-56 mt-1" />
                    </div>
                    <Skeleton className="h-9 w-28" />
                </div>

                <div className="border rounded-xl overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b">
                        <Skeleton className="h-5 w-48" />
                    </div>
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <TableHead key={i}>
                                        <Skeleton className="h-3 w-full" />
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: 6 }).map((_, i) => (
                                <TableRow key={i}>
                                    {Array.from({ length: 6 }).map((_, j) => (
                                        <TableCell key={j}>
                                            <Skeleton className="h-3 w-full" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 p-1">
            {/* Balance Status Summary */}
            <div className="grid grid-cols-3 gap-2">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 md:p-3 shadow-xs">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-amber-800 mb-0.5">Opening</p>
                            <p className="text-sm md:text-base font-bold text-amber-900">
                                {formatCurrencyCompact(getDisplayAmount(totals.openingDebit, totals.openingCredit))}
                            </p>
                        </div>
                        <div className="text-amber-600">
                            <BookOpen className="h-5 w-5 md:h-6 md:w-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 md:p-3 shadow-xs">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-blue-800 mb-0.5">Transactions</p>
                            <p className="text-sm md:text-base font-bold text-blue-900">
                                {formatCurrencyCompact(getDisplayAmount(totals.periodDebit, totals.periodCredit))}
                            </p>
                        </div>
                        <div className="text-blue-600">
                            <ArrowRightLeft className="h-5 w-5 md:h-6 md:w-6" />
                        </div>
                    </div>
                </div>

                <div className={cn(
                    "border rounded-lg p-2 md:p-3 shadow-xs",
                    Math.abs(totals.endingDebit - totals.endingCredit) < 0.01
                        ? "bg-emerald-50 border-emerald-200"
                        : "bg-rose-50 border-rose-200"
                )}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-emerald-800 mb-0.5">Ending</p>
                            <p className="text-sm md:text-base font-bold text-emerald-900">
                                {formatCurrencyCompact(getDisplayAmount(totals.endingDebit, totals.endingCredit))}
                            </p>
                            <div className={cn(
                                "text-[10px] font-medium mt-0.5 flex items-center gap-1",
                                Math.abs(totals.endingDebit - totals.endingCredit) < 0.01
                                    ? "text-emerald-700"
                                    : "text-rose-700"
                            )}>
                                {Math.abs(totals.endingDebit - totals.endingCredit) < 0.01 ? (
                                    <>
                                        <CheckCircle2 className="h-2.5 w-2.5" />
                                        Balanced
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="h-2.5 w-2.5" />
                                        Unbalanced
                                    </>
                                )}
                            </div>
                        </div>
                        <div className={cn(
                            Math.abs(totals.endingDebit - totals.endingCredit) < 0.01
                                ? "text-emerald-600"
                                : "text-rose-600"
                        )}>
                            {Math.abs(totals.endingDebit - totals.endingCredit) < 0.01 ? (
                                <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6" />
                            ) : (
                                <XCircle className="h-5 w-5 md:h-6 md:w-6" />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile View */}
            {(viewMode === 'mobile' || (viewMode === 'auto' && isMobile)) && data.length > 0 && (
                <>
                    <MobileView />
                    <div className="md:hidden bg-gray-50 rounded-lg p-3 border">
                        <div className="flex items-center justify-between">
                            <div className="text-xs font-medium text-gray-700">
                                Accounts: <span className="font-bold">{data.length}</span>
                            </div>
                            <div className={cn(
                                "text-xs font-bold px-2 py-1 rounded",
                                Math.abs(totals.endingDebit - totals.endingCredit) < 0.01
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-rose-100 text-rose-800"
                            )}>
                                {Math.abs(totals.endingDebit - totals.endingCredit) < 0.01
                                    ? "BALANCED"
                                    : `DIFF: ${formatCurrencyCompact(Math.abs(totals.endingDebit - totals.endingCredit))}`
                                }
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Desktop/Tablet View */}
            {(viewMode === 'desktop' || (viewMode === 'auto' && !isMobile)) && (
                <div className="hidden md:block border rounded-xl bg-white shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table className="text-sm">
                            <TableHeader className="bg-gray-50">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="py-2 px-3 font-semibold text-gray-700 min-w-[80px] text-xs">
                                        Code
                                    </TableHead>
                                    <TableHead className="py-2 px-3 font-semibold text-gray-700 min-w-[180px] text-xs">
                                        Account Name
                                    </TableHead>
                                    <TableHead className="py-2 px-3 font-semibold text-gray-700 min-w-[90px] text-xs border-r">
                                        Type
                                    </TableHead>

                                    <TableHead className="py-2 px-3 font-semibold text-amber-700 text-right min-w-[100px] text-xs">
                                        Opening
                                    </TableHead>
                                    <TableHead className="py-2 px-3 font-semibold text-blue-700 text-right min-w-[100px] text-xs border-r">
                                        Period
                                    </TableHead>
                                    <TableHead className="py-2 px-3 font-semibold text-emerald-700 text-right min-w-[100px] text-xs">
                                        Ending
                                    </TableHead>

                                    <TableHead className="py-2 px-3 font-semibold text-gray-700 text-right min-w-[100px] text-xs">
                                        Debit
                                    </TableHead>
                                    <TableHead className="py-2 px-3 font-semibold text-gray-700 text-right min-w-[100px] text-xs">
                                        Credit
                                    </TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="py-8 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-400">
                                                <BookOpen className="h-8 w-8 mb-2 opacity-20" />
                                                <p className="text-sm font-medium">No trial balance data found</p>
                                                <p className="text-xs mt-0.5">Try adjusting your period selection</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.map((record) => {
                                        const openingAmount = getDisplayAmount(record.openingDebit, record.openingCredit);
                                        const periodAmount = getDisplayAmount(record.periodDebit, record.periodCredit);
                                        const endingAmount = getDisplayAmount(record.endingDebit, record.endingCredit);

                                        return (
                                            <TableRow
                                                key={record.id}
                                                className="group hover:bg-gray-50/50 transition-colors border-b"
                                            >
                                                <TableCell className="py-2 px-3">
                                                    <div className="font-mono font-semibold text-blue-700 text-xs">
                                                        {record.coa.code}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-2 px-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <ChevronRight className="h-3 w-3 text-gray-400" />
                                                        </div>
                                                        {getCOAIcon(record.coa.type)}
                                                        <div className="min-w-0">
                                                            <div className="text-xs font-medium text-gray-900 truncate max-w-[160px]">
                                                                {record.coa.name}
                                                            </div>
                                                            <div className="text-[10px] text-gray-500">ID: {record.id.substring(0, 8)}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-2 px-3 border-r">
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "text-[10px] font-bold px-2 py-0.5",
                                                            getAccountTypeColor(record.coa.type)
                                                        )}
                                                    >
                                                        {record.coa.type}
                                                    </Badge>
                                                </TableCell>

                                                <TableCell className="py-2 px-3 text-right">
                                                    {openingAmount > 0 ? (
                                                        <div className="font-mono text-xs font-semibold text-amber-800">
                                                            {formatCurrency(openingAmount)}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="py-2 px-3 text-right border-r">
                                                    {periodAmount > 0 ? (
                                                        <div className="font-mono text-xs font-semibold text-blue-800">
                                                            {formatCurrency(periodAmount)}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="py-2 px-3 text-right">
                                                    {endingAmount > 0 ? (
                                                        <div className="font-mono text-xs font-bold text-emerald-800">
                                                            {formatCurrency(endingAmount)}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">-</span>
                                                    )}
                                                </TableCell>

                                                <TableCell className="py-2 px-3 text-right">
                                                    {record.endingDebit > 0 ? (
                                                        <div className="font-mono text-xs">
                                                            {formatCurrency(record.endingDebit)}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="py-2 px-3 text-right">
                                                    {record.endingCredit > 0 ? (
                                                        <div className="font-mono text-xs">
                                                            {formatCurrency(record.endingCredit)}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">-</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>

                            {data.length > 0 && (
                                <tfoot className="bg-gray-50 border-t">
                                    <TableRow>
                                        <TableCell colSpan={3} className="py-2 px-3 border-r">
                                            <div className="font-semibold text-gray-900 text-right text-xs">
                                                TOTAL
                                            </div>
                                        </TableCell>

                                        <TableCell className="py-2 px-3 text-right">
                                            <div className="font-mono font-bold text-sm text-amber-900">
                                                {formatCurrency(getDisplayAmount(totals.openingDebit, totals.openingCredit))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-2 px-3 text-right border-r">
                                            <div className="font-mono font-bold text-sm text-blue-900">
                                                {formatCurrency(getDisplayAmount(totals.periodDebit, totals.periodCredit))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-2 px-3 text-right">
                                            <div className={cn(
                                                "font-mono font-bold text-sm",
                                                Math.abs(totals.endingDebit - totals.endingCredit) < 0.01
                                                    ? "text-emerald-900"
                                                    : "text-rose-900"
                                            )}>
                                                {formatCurrency(getDisplayAmount(totals.endingDebit, totals.endingCredit))}
                                            </div>
                                        </TableCell>

                                        <TableCell className="py-2 px-3 text-right">
                                            <div className={cn(
                                                "font-mono font-bold text-sm",
                                                Math.abs(totals.endingDebit - totals.endingCredit) < 0.01
                                                    ? "text-emerald-900"
                                                    : "text-rose-900"
                                            )}>
                                                {formatCurrency(totals.endingDebit)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-2 px-3 text-right">
                                            <div className={cn(
                                                "font-mono font-bold text-sm",
                                                Math.abs(totals.endingDebit - totals.endingCredit) < 0.01
                                                    ? "text-emerald-900"
                                                    : "text-rose-900"
                                            )}>
                                                {formatCurrency(totals.endingCredit)}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                </tfoot>
                            )}
                        </Table>
                    </div>

                    {data.length > 0 && (
                        <div className="bg-gray-50 border-t p-3">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5">
                                        <ArrowRightLeft className="h-3.5 w-3.5 text-gray-600" />
                                        <span className="text-xs font-medium text-gray-700">Status:</span>
                                    </div>
                                    <div className={cn(
                                        "px-2 py-1 rounded text-xs font-bold flex items-center gap-1.5",
                                        Math.abs(totals.endingDebit - totals.endingCredit) < 0.01
                                            ? "bg-emerald-100 text-emerald-800"
                                            : "bg-rose-100 text-rose-800"
                                    )}>
                                        {Math.abs(totals.endingDebit - totals.endingCredit) < 0.01 ? (
                                            <>
                                                <CheckCircle2 className="h-3 w-3" />
                                                BALANCED
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle className="h-3 w-3" />
                                                UNBALANCED: {formatCurrency(Math.abs(totals.endingDebit - totals.endingCredit))}
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-xs text-gray-600">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                        <span>Assets: {data.filter(d => d.coa.type === "ASET").length}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                        <span>Liab: {data.filter(d => d.coa.type === "LIABILITAS").length}</span>
                                    </div>
                                    <div className="font-bold text-gray-900">
                                        Total: {data.length}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}