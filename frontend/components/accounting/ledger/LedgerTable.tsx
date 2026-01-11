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
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
    ArrowRightLeft,
    BookOpen,
    Calendar,
    FileText,
    ChevronRight,
    ChevronDown,
    Wallet,
    PieChart,
    TrendingUp,
    TrendingDown,
    Receipt,
    CreditCard,
    Building,
    Users,
    DollarSign,
    Eye,
    Filter,
    Download,
    Search,
    MoreVertical,
    CheckCircle,
    AlertCircle
} from "lucide-react";
import { Ledger, LedgerLine } from "@/schemas/accounting/ledger";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface LedgerTableProps {
    data: Ledger[];
    isLoading: boolean;
    globalStats?: {
        totalTransactions: number;
        totalDebit: number;
        totalCredit: number;
        balancedCount: number;
    };
}

interface LedgerGroup {
    ledgerNumber: string;
    transactionDate: Date;
    referenceType: string;
    description: string;
    lines: LedgerLine[];
    totalDebit: number;
    totalCredit: number;
}

export function LedgerTable({ data, isLoading, globalStats }: LedgerTableProps) {
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [groupedData, setGroupedData] = useState<LedgerGroup[]>([]);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            // Updated to 1024 to include tablets in the card-based view
            setIsMobile(window.innerWidth < 1024);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (!data.length) {
            setGroupedData([]);
            return;
        }

        const groups = data.map(ledger => {
            const lines = ledger.ledgerLines || [];
            return {
                ledgerNumber: ledger.ledgerNumber,
                transactionDate: new Date(ledger.transactionDate),
                referenceType: ledger.referenceType,
                description: ledger.description,
                lines: lines,
                totalDebit: lines.reduce((sum, line) => sum + line.debitAmount, 0),
                totalCredit: lines.reduce((sum, line) => sum + line.creditAmount, 0)
            };
        });

        setGroupedData(groups);
    }, [data]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const formatCurrencyCompact = (amount: number) => {
        if (amount >= 1000000000) {
            return `Rp${(amount / 1000000000).toFixed(1)}M`;
        }
        if (amount >= 1000000) {
            return `Rp${(amount / 1000000).toFixed(1)}JT`;
        }
        if (amount >= 1000) {
            return `Rp${(amount / 1000).toFixed(0)}RB`;
        }
        return `Rp${amount}`;
    };

    const getReferenceIcon = (type: string) => {
        const baseClass = "h-3.5 w-3.5";
        switch (type?.toUpperCase()) {
            case "INVOICE":
            case "SALES":
                return <Receipt className={cn(baseClass, "text-emerald-600")} />;
            case "PAYMENT":
            case "EXPENSE":
                return <CreditCard className={cn(baseClass, "text-rose-600")} />;
            case "JOURNAL":
                return <BookOpen className={cn(baseClass, "text-blue-600")} />;
            case "PURCHASE":
                return <Building className={cn(baseClass, "text-purple-600")} />;
            case "PAYROLL":
                return <Users className={cn(baseClass, "text-amber-600")} />;
            default:
                return <FileText className={cn(baseClass, "text-gray-600")} />;
        }
    };

    const getAccountIcon = (accountName?: string) => {
        const baseClass = "h-3.5 w-3.5";
        if (!accountName) return <Wallet className={cn(baseClass, "text-gray-600")} />;

        const name = accountName.toLowerCase();
        if (name.includes('cash') || name.includes('bank') || name.includes('asset'))
            return <Wallet className={cn(baseClass, "text-emerald-600")} />;
        if (name.includes('revenue') || name.includes('income') || name.includes('sales'))
            return <TrendingUp className={cn(baseClass, "text-blue-600")} />;
        if (name.includes('expense') || name.includes('cost') || name.includes('beban'))
            return <TrendingDown className={cn(baseClass, "text-rose-600")} />;
        if (name.includes('equity') || name.includes('capital'))
            return <PieChart className={cn(baseClass, "text-purple-600")} />;
        if (name.includes('liability') || name.includes('debt') || name.includes('loan'))
            return <CreditCard className={cn(baseClass, "text-orange-600")} />;

        return <BookOpen className={cn(baseClass, "text-gray-600")} />;
    };

    const getReferenceBadgeStyles = (type: string) => {
        switch (type?.toUpperCase()) {
            case "INVOICE":
            case "SALES":
                return "bg-emerald-50 text-emerald-700 border-emerald-200";
            case "PAYMENT":
            case "EXPENSE":
                return "bg-rose-50 text-rose-700 border-rose-200";
            case "JOURNAL":
                return "bg-blue-50 text-blue-700 border-blue-200";
            case "PURCHASE":
            case "FUND_TRANSFER":
                return "bg-indigo-50 text-indigo-700 border-indigo-200";
            case "PAYROLL":
                return "bg-amber-50 text-amber-700 border-amber-200";
            case "ADJUSTMENT":
                return "bg-purple-50 text-purple-700 border-purple-200";
            default:
                return "bg-slate-50 text-slate-700 border-slate-200";
        }
    };

    const toggleGroup = (ledgerNumber: string) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(ledgerNumber)) {
            newExpanded.delete(ledgerNumber);
        } else {
            newExpanded.add(ledgerNumber);
        }
        setExpandedGroups(newExpanded);
    };

    const toggleAll = () => {
        if (expandedGroups.size === groupedData.length) {
            setExpandedGroups(new Set());
        } else {
            setExpandedGroups(new Set(groupedData.map(g => g.ledgerNumber)));
        }
    };

    const filteredGroups = searchQuery
        ? groupedData.filter(group =>
            group.ledgerNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            group.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            group.lines.some(line =>
                line.coa?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                line.coa?.code?.toLowerCase().includes(searchQuery.toLowerCase())
            )
        )
        : groupedData;

    const MobileView = () => (
        <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGroups.map((group) => {
                const isExpanded = expandedGroups.has(group.ledgerNumber);
                const isBalanced = Math.abs(group.totalDebit - group.totalCredit) < 0.01;

                return (
                    <div key={group.ledgerNumber} className="bg-white rounded-lg border shadow-xs overflow-hidden">
                        {/* Group Header */}
                        <div
                            className="p-3 cursor-pointer hover:bg-gray-50 transition-colors border-b"
                            onClick={() => toggleGroup(group.ledgerNumber)}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    {getReferenceIcon(group.referenceType)}
                                    <div>
                                        <div className="font-bold text-sm text-blue-700">{group.ledgerNumber}</div>
                                        <div className="text-xs text-gray-600">
                                            {format(group.transactionDate, "dd MMM yyyy")}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "text-xs px-2",
                                            isBalanced
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                : "bg-rose-50 text-rose-700 border-rose-200"
                                        )}
                                    >
                                        {isBalanced ? "Balanced" : "Unbalanced"}
                                    </Badge>
                                    {isExpanded ? (
                                        <ChevronDown className="h-4 w-4 text-gray-500" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-gray-500" />
                                    )}
                                </div>
                            </div>

                            <div className="text-xs text-gray-700 line-clamp-2 mb-2">
                                {group.description}
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="text-center p-1.5 bg-emerald-50 rounded">
                                    <div className="text-[10px] text-emerald-700 font-medium">Debit</div>
                                    <div className="font-mono text-xs font-bold text-emerald-800">
                                        {formatCurrencyCompact(group.totalDebit)}
                                    </div>
                                </div>
                                <div className="text-center p-1.5 bg-rose-50 rounded">
                                    <div className="text-[10px] text-rose-700 font-medium">Credit</div>
                                    <div className="font-mono text-xs font-bold text-rose-800">
                                        {formatCurrencyCompact(group.totalCredit)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Expanded Content */}
                        {isExpanded && (
                            <div className="bg-gray-50 p-3">
                                <div className="space-y-2">
                                    {group.lines.map((line, index) => (
                                        <div key={line.id} className="bg-white rounded border p-2">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    {getAccountIcon(line.coa?.name)}
                                                    <div>
                                                        <div className="font-medium text-xs text-gray-900">
                                                            {line.coa?.name || "Unknown Account"}
                                                        </div>
                                                        <div className="text-[10px] text-gray-500">
                                                            {line.coa?.code || "N/A"}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="text-[10px] px-1.5">
                                                    Line {index + 1}
                                                </Badge>
                                            </div>

                                            <div className="text-xs text-gray-600 mb-2 line-clamp-2">
                                                {line.description || group.description}
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                {line.debitAmount > 0 ? (
                                                    <div className="text-center p-1 bg-emerald-50 rounded">
                                                        <div className="text-[10px] text-emerald-700">Debit</div>
                                                        <div className="font-mono text-xs font-bold text-emerald-800">
                                                            {formatCurrencyCompact(line.debitAmount)}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-center p-1 bg-rose-50 rounded">
                                                        <div className="text-[10px] text-rose-700">Credit</div>
                                                        <div className="font-mono text-xs font-bold text-rose-800">
                                                            {formatCurrencyCompact(line.creditAmount)}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="text-center p-1 bg-gray-50 rounded">
                                                    <div className="text-[10px] text-gray-700">Ref</div>
                                                    <div className="text-xs font-medium text-gray-800">
                                                        {line.reference || "-"}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-3 pt-2 border-t flex justify-between items-center text-xs">
                                    <div className="text-gray-600">
                                        {group.lines.length} entries
                                    </div>
                                    <div className="font-medium text-gray-800">
                                        Balance: {(() => {
                                            const balance = Math.abs(group.totalDebit - group.totalCredit);
                                            const roundedBalance = Math.round(balance * 100) / 100;
                                            return roundedBalance < 0.01 ? 'Rp 0' : formatCurrencyCompact(roundedBalance);
                                        })()}
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
                {/* Header Skeleton */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 p-4 md:p-6 bg-gradient-to-r from-gray-50 to-white rounded-xl border shadow-sm">
                    <div>
                        <Skeleton className="h-7 w-48" />
                        <Skeleton className="h-3 w-64 mt-2" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-9 w-24" />
                        <Skeleton className="h-9 w-9" />
                    </div>
                </div>

                {/* Search Skeleton */}
                <div className="flex flex-col md:flex-row gap-3">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 w-32" />
                </div>

                {/* Stats Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 rounded-lg" />
                    ))}
                </div>

                {/* Table Skeleton */}
                <div className="border rounded-xl overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b">
                        <Skeleton className="h-5 w-64" />
                    </div>
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                {Array.from({ length: 7 }).map((_, i) => (
                                    <TableHead key={i}>
                                        <Skeleton className="h-3 w-full" />
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    {Array.from({ length: 7 }).map((_, j) => (
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
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-3 items-center justify-end">
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 no-scrollbar justify-end">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 text-xs whitespace-nowrap"
                                    onClick={toggleAll}
                                >
                                    {expandedGroups.size === groupedData.length ? (
                                        <>
                                            <ChevronDown className="h-3.5 w-3.5" />
                                            Collapse All
                                        </>
                                    ) : (
                                        <>
                                            <ChevronRight className="h-3.5 w-3.5" />
                                            Expand All
                                        </>
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                {expandedGroups.size === groupedData.length ? "Collapse all transactions" : "Expand all transactions"}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <Button variant="outline" size="sm" className="gap-2 text-xs whitespace-nowrap">
                        <Download className="h-3.5 w-3.5" />
                        Export
                    </Button>

                    <Button variant="outline" size="sm" className="text-xs whitespace-nowrap">
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        This Month
                    </Button>

                    {/* <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="px-2">
                                <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-sm">
                            <DropdownMenuItem className="gap-2 py-2">
                                <Filter className="h-3.5 w-3.5" />
                                Filter Transactions
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 py-2">
                                <Eye className="h-3.5 w-3.5" />
                                View Options
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 py-2">
                                <Calendar className="h-3.5 w-3.5" />
                                Date Range
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu> */}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Total Transactions */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-xs font-medium text-blue-800">Total Transactions</p>
                            <p className="text-xl font-bold text-blue-900 mt-1">
                                {globalStats ? globalStats.totalTransactions : groupedData.length}
                            </p>
                            {globalStats && (
                                <div className="mt-1 pt-1 border-t border-blue-200">
                                    <p className="text-[10px] text-blue-600 font-medium">
                                        This Page: <span className="font-bold">{groupedData.length}</span>
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="text-blue-600">
                            <Receipt className="h-8 w-8" />
                        </div>
                    </div>
                </div>

                {/* Total Debit */}
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-xs font-medium text-emerald-800">Total Debit</p>
                            <p className="text-xl font-bold text-emerald-900 mt-1">
                                <span className="lg:hidden">
                                    {formatCurrencyCompact(
                                        globalStats ? globalStats.totalDebit : groupedData.reduce((sum, g) => sum + g.totalDebit, 0)
                                    )}
                                </span>
                                <span className="hidden lg:inline text-lg">
                                    {formatCurrency(
                                        globalStats ? globalStats.totalDebit : groupedData.reduce((sum, g) => sum + g.totalDebit, 0)
                                    )}
                                </span>
                            </p>
                            {globalStats && (
                                <div className="mt-1 pt-1 border-t border-emerald-200">
                                    <p className="text-[10px] text-emerald-600 font-medium">
                                        This Page: <span className="font-bold">
                                            {formatCurrencyCompact(groupedData.reduce((sum, g) => sum + g.totalDebit, 0))}
                                        </span>
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="text-emerald-600">
                            <TrendingUp className="h-8 w-8" />
                        </div>
                    </div>
                </div>

                {/* Total Credit */}
                <div className="bg-gradient-to-r from-rose-50 to-rose-100 border border-rose-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-xs font-medium text-rose-800">Total Credit</p>
                            <p className="text-xl font-bold text-rose-900 mt-1">
                                <span className="lg:hidden">
                                    {formatCurrencyCompact(
                                        globalStats ? globalStats.totalCredit : groupedData.reduce((sum, g) => sum + g.totalCredit, 0)
                                    )}
                                </span>
                                <span className="hidden lg:inline text-lg">
                                    {formatCurrency(
                                        globalStats ? globalStats.totalCredit : groupedData.reduce((sum, g) => sum + g.totalCredit, 0)
                                    )}
                                </span>
                            </p>
                            {globalStats && (
                                <div className="mt-1 pt-1 border-t border-rose-200">
                                    <p className="text-[10px] text-rose-600 font-medium">
                                        This Page: <span className="font-bold">
                                            {formatCurrencyCompact(groupedData.reduce((sum, g) => sum + g.totalCredit, 0))}
                                        </span>
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="text-rose-600">
                            <TrendingDown className="h-8 w-8" />
                        </div>
                    </div>
                </div>

                {/* Balanced */}
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-xs font-medium text-purple-800">Balanced</p>
                            <p className="text-xl font-bold text-purple-900 mt-1">
                                {globalStats
                                    ? `${globalStats.balancedCount} / ${globalStats.totalTransactions}`
                                    : `${groupedData.filter(g => Math.abs(g.totalDebit - g.totalCredit) < 0.01).length} / ${groupedData.length}`
                                }
                            </p>
                            {globalStats && (
                                <div className="mt-1 pt-1 border-t border-purple-200">
                                    <p className="text-[10px] text-purple-600 font-medium">
                                        This Page: <span className="font-bold">
                                            {groupedData.filter(g => Math.abs(g.totalDebit - g.totalCredit) < 0.01).length} / {groupedData.length}
                                        </span>
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="text-purple-600">
                            <CheckCircle className="h-8 w-8" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile View */}
            {(isMobile) && data.length > 0 && (
                <>
                    <MobileView />
                    <div className="lg:hidden bg-white rounded-lg p-4 border shadow-sm mt-4">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                            <div className="text-gray-500 font-medium">
                                Showing {filteredGroups.length} of {groupedData.length} transactions
                            </div>
                            <div className="font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded">
                                {data.reduce((sum, l) => sum + (l.ledgerLines?.length || 0), 0)} Detailed Entries
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Desktop View (>= 1024px) */}
            {(!isMobile) && (
                <div className="hidden lg:block border rounded-xl bg-white shadow-xs overflow-hidden transition-all">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead className="py-3 px-4 w-[50px]"></TableHead>
                                    <TableHead className="py-3 px-4 font-bold text-gray-700 text-xs min-w-[120px]">
                                        Date & Transaction
                                    </TableHead>
                                    <TableHead className="py-3 px-4 font-bold text-gray-700 text-xs min-w-[200px]">
                                        Account Details
                                    </TableHead>
                                    <TableHead className="py-3 px-4 font-bold text-gray-700 text-xs min-w-[250px]">
                                        Description
                                    </TableHead>
                                    <TableHead className="py-3 px-4 font-bold text-gray-700 text-xs min-w-[100px]">
                                        Reference
                                    </TableHead>
                                    <TableHead className="py-3 px-4 font-bold text-gray-700 text-xs text-right min-w-[120px]">
                                        Debit
                                    </TableHead>
                                    <TableHead className="py-3 px-4 font-bold text-gray-700 text-xs text-right min-w-[120px]">
                                        Credit
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredGroups.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-400">
                                                <BookOpen className="h-12 w-12 mb-4 opacity-20" />
                                                <p className="text-lg font-medium">No ledger entries found</p>
                                                <p className="text-sm mt-1">
                                                    {searchQuery ? "Try a different search term" : "No transactions in the selected period"}
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredGroups.flatMap((group) => {
                                        const isExpanded = expandedGroups.has(group.ledgerNumber);
                                        const isBalanced = Math.abs(group.totalDebit - group.totalCredit) < 0.01;

                                        return [
                                            // Group Header Row
                                            <TableRow
                                                key={`group-${group.ledgerNumber}`}
                                                className="bg-gray-50/70 hover:bg-gray-100/70 cursor-pointer border-t border-b-2"
                                                onClick={() => toggleGroup(group.ledgerNumber)}
                                            >
                                                <TableCell className="py-3 px-4">
                                                    <div className="flex items-center justify-center">
                                                        {isExpanded ? (
                                                            <ChevronDown className="h-4 w-4 text-gray-600" />
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4 text-gray-600" />
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        {getReferenceIcon(group.referenceType)}
                                                        <div>
                                                            <div className="font-bold text-sm text-blue-700">
                                                                {group.ledgerNumber}
                                                            </div>
                                                            <div className="text-xs text-gray-600">
                                                                {format(group.transactionDate, "dd MMM yyyy")}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell colSpan={2} className="py-3 px-4">
                                                    <div className="text-sm text-gray-700">
                                                        {group.description}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                "text-[10px] font-bold px-2 py-0 uppercase tracking-wider transition-colors",
                                                                getReferenceBadgeStyles(group.referenceType)
                                                            )}
                                                        >
                                                            {group.referenceType}
                                                        </Badge>
                                                        <span className="text-xs text-gray-500">
                                                            {group.lines.length} entries
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3 px-4">
                                                    <div className="text-xs text-gray-600">
                                                        Total
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-right">
                                                    <div className="font-mono font-bold text-sm text-emerald-700">
                                                        {group.totalDebit > 0 ? formatCurrency(group.totalDebit) : "-"}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-right">
                                                    <div className="font-mono font-bold text-sm text-rose-700">
                                                        {group.totalCredit > 0 ? formatCurrency(group.totalCredit) : "-"}
                                                    </div>
                                                </TableCell>
                                            </TableRow>,

                                            // Expanded Detail Rows
                                            ...(isExpanded ? group.lines.map((line, index) => (
                                                <TableRow
                                                    key={line.id}
                                                    className="hover:bg-gray-50/50 border-b"
                                                >
                                                    <TableCell className="py-2 px-4">
                                                        <div className="flex items-center justify-center">
                                                            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-2 px-4">
                                                        <div className="text-xs text-gray-500 pl-6">
                                                            Line {index + 1}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-2 px-4">
                                                        <div className="flex items-center gap-2">
                                                            {getAccountIcon(line.coa?.name)}
                                                            <div>
                                                                <div className="font-medium text-sm text-gray-900">
                                                                    {line.coa?.name || "Unknown Account"}
                                                                </div>
                                                                <div className="font-mono text-xs text-gray-600">
                                                                    {line.coa?.code || "N/A"}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-2 px-4">
                                                        <div className="text-sm text-gray-700 line-clamp-2">
                                                            {line.description || group.description}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-2 px-4">
                                                        <Badge
                                                            variant="outline"
                                                            className="font-mono text-xs px-2"
                                                        >
                                                            {line.reference || "-"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="py-2 px-4 text-right">
                                                        {line.debitAmount > 0 ? (
                                                            <div className="font-mono text-sm font-semibold text-emerald-700">
                                                                {formatCurrency(line.debitAmount)}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400 text-sm">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="py-2 px-4 text-right">
                                                        {line.creditAmount > 0 ? (
                                                            <div className="font-mono text-sm font-semibold text-rose-700">
                                                                {formatCurrency(line.creditAmount)}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400 text-sm">-</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            )) : [])
                                        ];
                                    })
                                )}
                            </TableBody>

                            {filteredGroups.length > 0 && (
                                <tfoot className="bg-gray-50 border-t-2">
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-3 px-4">
                                            <div className="font-bold text-gray-900 text-sm">
                                                Grand Total ({filteredGroups.length} transactions, {data.reduce((sum, l) => sum + (l.ledgerLines?.length || 0), 0)} entries)
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3 px-4 text-right">
                                            <div className="font-mono font-bold text-lg text-emerald-900">
                                                {formatCurrency(groupedData.reduce((sum, g) => sum + g.totalDebit, 0))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3 px-4 text-right">
                                            <div className="font-mono font-bold text-lg text-rose-900">
                                                {formatCurrency(groupedData.reduce((sum, g) => sum + g.totalCredit, 0))}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                </tfoot>
                            )}
                        </Table>
                    </div>

                    {filteredGroups.length > 0 && (
                        <div className="bg-gray-50 border-t p-4">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "px-3 py-1.5 rounded-full font-bold flex items-center gap-2 text-sm",
                                        groupedData.every(g => Math.abs(g.totalDebit - g.totalCredit) < 0.01)
                                            ? "bg-emerald-100 text-emerald-800"
                                            : "bg-amber-100 text-amber-800"
                                    )}>
                                        {groupedData.every(g => Math.abs(g.totalDebit - g.totalCredit) < 0.01) ? (
                                            <>
                                                <CheckCircle className="h-4 w-4" />
                                                All transactions balanced
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle className="h-4 w-4" />
                                                {groupedData.filter(g => Math.abs(g.totalDebit - g.totalCredit) >= 0.01).length} unbalanced transactions
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        <span>Debit: {formatCurrencyCompact(groupedData.reduce((sum, g) => sum + g.totalDebit, 0))}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                                        <span>Credit: {formatCurrencyCompact(groupedData.reduce((sum, g) => sum + g.totalCredit, 0))}</span>
                                    </div>
                                    <div className="font-bold text-gray-900">
                                        Balance: {(() => {
                                            const totalDebit = groupedData.reduce((sum, g) => sum + g.totalDebit, 0);
                                            const totalCredit = groupedData.reduce((sum, g) => sum + g.totalCredit, 0);
                                            const balance = Math.abs(totalDebit - totalCredit);
                                            // Round to 2 decimal places to avoid floating point errors
                                            const roundedBalance = Math.round(balance * 100) / 100;
                                            return roundedBalance < 0.01 ? 'Rp 0' : formatCurrencyCompact(roundedBalance);
                                        })()}
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