"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { LayoutProps } from "@/types/layout";
import { useSession } from "@/components/clientSessionProvider";
import { AdminLoading } from "@/components/admin-loading";
import { toast } from "sonner";
import HeaderCard from "@/components/ui/header-card";
import {
    Calculator,
    Search,
    RotateCcw,
    Download,
    Printer,
    Filter,
    Calendar,
    Layers
} from "lucide-react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { TrialBalanceDataTable } from "@/components/accounting/trial-balance/tableData";
import { getTrialBalance, recalculateTrialBalance } from "@/lib/action/accounting/trialBalance";
import { getPeriods } from "@/lib/action/accounting/period";
import { TrialBalance, TrialBalanceTotals } from "@/schemas/accounting/trialBalance";
import { AccountingPeriod } from "@/schemas/accounting/period";
import Link from "next/link";

export default function TrialBalancePage() {
    const { user, isLoading: userLoading } = useSession();
    const [isLoading, setIsLoading] = useState(true);
    const [isDataFetching, setIsDataFetching] = useState(false);
    const [periods, setPeriods] = useState<AccountingPeriod[]>([]);
    const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
    const [tbData, setTbData] = useState<TrialBalance[]>([]);
    const [totals, setTotals] = useState<TrialBalanceTotals>({
        openingDebit: 0,
        openingCredit: 0,
        periodDebit: 0,
        periodCredit: 0,
        endingDebit: 0,
        endingCredit: 0,
        ytdDebit: 0,
        ytdCredit: 0,
    });
    const [search, setSearch] = useState("");
    const [coaType, setCoaType] = useState("all");

    // Load Initial Data
    useEffect(() => {
        const loadPeriods = async () => {
            try {
                const result = await getPeriods({ limit: 100 });
                if (result.success && result.data.length > 0) {
                    setPeriods(result.data);
                    // Set current or latest period
                    const openPeriod = result.data.find((p: AccountingPeriod) => !p.isClosed);
                    setSelectedPeriodId(openPeriod?.id || result.data[0].id);
                }
            } catch (error) {
                console.error("Load Periods Error:", error);
                toast.error("Failed to load accounting periods");
            } finally {
                setIsLoading(false);
            }
        };

        if (!userLoading && user) {
            loadPeriods();
        }
    }, [userLoading, user]);

    // Fetch Trial Balance Data
    const fetchTB = useCallback(async () => {
        if (!selectedPeriodId) {
            console.log("[TB Page] No period selected");
            return;
        }

        console.log("[TB Page] Fetching TB for period:", selectedPeriodId);
        console.log("[TB Page] Search:", search);
        console.log("[TB Page] COA Type:", coaType);

        try {
            setIsDataFetching(true);
            const result = await getTrialBalance(
                selectedPeriodId,
                search || undefined,
                coaType !== "all" ? coaType : undefined
            );

            console.log("[TB Page] Result:", result);

            if (result.success) {
                console.log("[TB Page] Setting data - count:", result.data?.length);
                setTbData(result.data);
                setTotals(result.totals);
            } else {
                console.error("[TB Page] Failed:", result.message);
                toast.error(result.message || "Failed to fetch trial balance");
            }
        } catch (error) {
            console.error("[TB Page] Exception:", error);
            toast.error("An error occurred while fetching trial balance");
        } finally {
            setIsDataFetching(false);
        }
    }, [selectedPeriodId, search, coaType]);

    useEffect(() => {
        if (selectedPeriodId) {
            fetchTB();
        }
    }, [selectedPeriodId, fetchTB]);

    const handleRecalculate = async () => {
        if (!selectedPeriodId) return;

        toast.promise(recalculateTrialBalance(selectedPeriodId), {
            loading: 'Recalculating trial balance...',
            success: (data) => {
                fetchTB();
                return 'Trial balance recalculated successfully';
            },
            error: 'Failed to recalculate'
        });
    };

    if (userLoading || isLoading) {
        return <AdminLoading message="Loading trial balance..." />;
    }

    const selectedPeriod = periods.find(p => p.id === selectedPeriodId);

    const layoutProps: LayoutProps = {
        title: "Trial Balance",
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
                                    Trial Balance
                                </Badge>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>

                {/* Header Card */}
                <HeaderCard
                    title={
                        <div className="flex items-center gap-3">
                            <span className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Calculator className="h-6 w-6 text-white" />
                            </span>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-white">Trial Balance</h1>
                                <p className="text-blue-100 text-sm font-medium opacity-90">
                                    {selectedPeriod ? `Report for ${selectedPeriod.periodName} (${selectedPeriod.periodCode})` : 'Summary of all account balances'}
                                </p>
                            </div>
                        </div>
                    }
                    gradientFrom="from-blue-600"
                    gradientTo="to-indigo-700"
                    showActionArea={true}
                    actionArea={
                        <div className="flex items-center gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                                onClick={handleRecalculate}
                                disabled={isDataFetching}
                            >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Recalculate
                            </Button>
                            {/* <Button
                                variant="secondary"
                                size="sm"
                                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </Button> */}
                        </div>
                    }
                />

                {/* Filters Area */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
                    <div className="flex flex-col lg:flex-row gap-4 items-end">
                        <div className="w-full lg:w-72 space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> Accounting Period
                            </label>
                            <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
                                <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                                    <SelectValue placeholder="Select Period" />
                                </SelectTrigger>
                                <SelectContent>
                                    {periods.map((period) => (
                                        <SelectItem key={period.id} value={period.id}>
                                            {period.periodName} ({period.periodCode}) {period.isClosed ? '🔒' : '🔓'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-full lg:w-48 space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                <Layers className="h-3 w-3" /> Account Type
                            </label>
                            <Select value={coaType} onValueChange={setCoaType}>
                                <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Tipe Akun</SelectItem>
                                    <SelectItem value="ASET">Aset</SelectItem>
                                    <SelectItem value="LIABILITAS">Liabilitas</SelectItem>
                                    <SelectItem value="EKUITAS">Ekuitas</SelectItem>
                                    <SelectItem value="PENDAPATAN">Pendapatan</SelectItem>
                                    <SelectItem value="HPP">Harga Pokok Penjualan (HPP)</SelectItem>
                                    <SelectItem value="BEBAN">Beban</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex-1 space-y-1.5 w-full">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                <Search className="h-3 w-3" /> Search Account
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Account name or code..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                                />
                            </div>
                        </div>

                        <Button
                            variant="default"
                            className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200 dark:shadow-none"
                            onClick={fetchTB}
                            disabled={isDataFetching}
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Apply Filter
                        </Button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-hidden min-h-0 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <TrialBalanceDataTable
                        data={tbData}
                        totals={totals}
                        isLoading={isDataFetching}
                    />
                </div>

                {/* Footer Info */}
                {!isDataFetching && tbData.length > 0 && (
                    <div className="flex justify-between items-center text-xs text-muted-foreground px-2">
                        <div>
                            Generated at: {new Date().toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1">
                                <Printer className="h-3 w-3" /> Print Ready
                            </span>
                        </div>
                    </div>
                )}
            </div>
        ),
    };

    return <AdminLayout {...layoutProps} />;
}
