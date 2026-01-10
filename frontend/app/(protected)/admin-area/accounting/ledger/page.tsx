"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { LayoutProps } from "@/types/layout";
import { useSession } from "@/components/clientSessionProvider";
import { AdminLoading } from "@/components/admin-loading";
import HeaderCard from "@/components/ui/header-card";
import { BookOpen, Calendar, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { LedgerTable } from "@/components/accounting/ledger/LedgerTable";
import PaginationComponent from "@/components/ui/paginationNew";
import { getGeneralLedgerLines } from "@/lib/action/accounting/ledger";
import { getPeriods } from "@/lib/action/accounting/period";
import { AccountingPeriod } from "@/schemas/accounting/period";
import { Ledger, LedgerLine } from "@/schemas/accounting/ledger";
import { toast } from "sonner";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function LedgerPage() {
    const { user, isLoading: userLoading } = useSession();
    const [isLoading, setIsLoading] = useState(true);
    const [isDataFetching, setIsDataFetching] = useState(false);

    // Data
    const [ledgers, setLedgers] = useState<Ledger[]>([]);
    const [periods, setPeriods] = useState<AccountingPeriod[]>([]);

    // Filters
    const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
    const [search, setSearch] = useState("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalEntries, setTotalEntries] = useState(0);
    const [pageSize, setPageSize] = useState(10); // Reduced for visibility

    // Global Stats (calculated from all data, not just current page)
    const [globalStats, setGlobalStats] = useState<{
        totalTransactions: number;
        totalDebit: number;
        totalCredit: number;
        balancedCount: number;
    }>({
        totalTransactions: 0,
        totalDebit: 0,
        totalCredit: 0,
        balancedCount: 0
    });

    // Load Initial Data (Periods)
    useEffect(() => {
        const loadPeriods = async () => {
            const result = await getPeriods({ limit: 50 });
            if (result.success) {
                setPeriods(result.data);
                const activePeriod = result.data.find((p: AccountingPeriod) => !p.isClosed);
                if (activePeriod) {
                    setSelectedPeriodId(activePeriod.id);
                } else if (result.data.length > 0) {
                    setSelectedPeriodId(result.data[0].id);
                }
            }
            setIsLoading(false);
        };

        if (!userLoading && user) {
            loadPeriods();
        }
    }, [userLoading, user]);

    // Fetch Ledger Data
    useEffect(() => {
        const fetchData = async () => {
            if (!selectedPeriodId) return;

            setIsDataFetching(true);
            try {
                const result = await getGeneralLedgerLines({
                    periodId: selectedPeriodId,
                    search: search || undefined,
                    page: currentPage,
                    limit: pageSize
                });

                if (result.success) {
                    setLedgers(result.data);
                    if (result.pagination) {
                        setTotalPages(result.pagination.totalPages || 1);
                        setTotalEntries(result.pagination.total || 0);
                    }

                    // Use backend-calculated aggregates for global stats
                    if (result.aggregates) {
                        setGlobalStats({
                            totalTransactions: result.aggregates.totalTransactions,
                            totalDebit: result.aggregates.totalDebit,
                            totalCredit: result.aggregates.totalCredit,
                            balancedCount: result.aggregates.balancedCount,
                        });
                    } else {
                        // Fallback: calculate from current page data if aggregates not available
                        const totalDebit = result.data.reduce((sum: number, ledger: Ledger) => {
                            const ledgerDebit = ledger.ledgerLines?.reduce((s, line) => s + line.debitAmount, 0) || 0;
                            return sum + ledgerDebit;
                        }, 0);

                        const totalCredit = result.data.reduce((sum: number, ledger: Ledger) => {
                            const ledgerCredit = ledger.ledgerLines?.reduce((s, line) => s + line.creditAmount, 0) || 0;
                            return sum + ledgerCredit;
                        }, 0);

                        const balancedCount = result.data.filter((ledger: Ledger) => {
                            const debit = ledger.ledgerLines?.reduce((s, line) => s + line.debitAmount, 0) || 0;
                            const credit = ledger.ledgerLines?.reduce((s, line) => s + line.creditAmount, 0) || 0;
                            return Math.abs(debit - credit) < 0.01;
                        }).length;

                        setGlobalStats({
                            totalTransactions: result.pagination?.total || result.data.length,
                            totalDebit,
                            totalCredit,
                            balancedCount
                        });
                    }
                } else {
                    toast.error("Failed to fetch ledger data");
                }
            } catch (error) {
                console.error(error);
                toast.error("Error loading ledger");
            } finally {
                setIsDataFetching(false);
            }
        };

        const timeout = setTimeout(() => {
            if (selectedPeriodId) fetchData();
        }, 500); // Debounce search

        return () => clearTimeout(timeout);
    }, [selectedPeriodId, search, currentPage, pageSize]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedPeriodId, search]);

    if (userLoading || isLoading) {
        return <AdminLoading message="Loading General Ledger..." />;
    }

    const selectedPeriod = periods.find(p => p.id === selectedPeriodId);

    const layoutProps: LayoutProps = {
        title: "General Ledger (BUKU BESAR)",
        role: "admin",
        children: (
            <div className="flex flex-col h-full space-y-4 p-4 lg:p-6 bg-slate-50/50 dark:bg-slate-900/50 min-h-screen">
                {/* Breadcrumb */}
                <div className="flex-shrink-0">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <Link href="/admin-area" className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                                        <Badge variant="outline" className="font-medium">Dashboard</Badge>
                                    </Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <Badge variant="outline" className="font-medium text-muted-foreground cursor-default">Accounting</Badge>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <Badge variant="secondary" className="font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">
                                    General Ledger
                                    {totalEntries > 0 && (
                                        <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-600 border-blue-100">
                                            {totalEntries} Transactions
                                        </Badge>
                                    )}
                                </Badge>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>

                <HeaderCard
                    title={
                        <div className="flex items-center gap-3">
                            <span className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <BookOpen className="h-6 w-6 text-white" />
                            </span>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-white">General Ledger</h1>
                                <p className="text-blue-100 text-sm font-medium opacity-90">
                                    Detailed transaction history by account
                                </p>
                            </div>
                        </div>
                    }
                    gradientFrom="from-blue-600"
                    gradientTo="to-indigo-700"
                />

                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
                    <div className="flex flex-col lg:flex-row gap-4 items-end">
                        <div className="w-full lg:w-72 space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> Accounting Period
                            </label>
                            <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Period" />
                                </SelectTrigger>
                                <SelectContent>
                                    {periods.map((period) => (
                                        <SelectItem key={period.id} value={period.id}>
                                            {period.periodName} ({period.periodCode})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex-1 space-y-1.5 w-full">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                <Search className="h-3 w-3" /> Search Transactions
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search by description, reference, or code..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <Button
                            className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700"
                            onClick={() => { /* Triggered by useEffect automatically */ }}
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Apply Filter
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-visible min-h-0 space-y-4">
                    <LedgerTable
                        data={ledgers}
                        isLoading={isDataFetching}
                        globalStats={globalStats}
                    />

                    {!isDataFetching && totalPages > 1 && (
                        <div className="py-6 border-t bg-white dark:bg-slate-800 rounded-xl shadow-sm px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-gray-500 font-medium">
                                Showing <span className="text-gray-900 font-bold">{ledgers.length}</span> of <span className="text-gray-900 font-bold">{totalEntries}</span> transactions
                            </div>
                            <PaginationComponent
                                totalPages={totalPages}
                                currentPage={currentPage}
                                onPageChange={(page) => setCurrentPage(page)}
                            />
                        </div>
                    )}

                    {!isDataFetching && totalPages <= 1 && totalEntries > 0 && (
                        <div className="py-4 text-center text-sm text-gray-500 italic">
                            Showing all {totalEntries} entries
                        </div>
                    )}
                </div>
            </div>
        )
    };

    return <AdminLayout {...layoutProps} />;
}
