"use client";

import React, { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import PaginationComponent from "@/components/ui/paginationNew";
import InventoryFilterBar from "./InventoryFilterBar";
import StockDetailSheet from "./StockDetailSheet";
import { PaginationMeta } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Package,
    WarehouseIcon,
    ArrowUpRight,
    ArrowDownRight,
    Smartphone,
    History,
    MoreHorizontal,
    ArrowRight,
    Eye,
    DollarSign,
    Download,
    AlertCircle,
    ChevronRight,
    Activity,
    Shield,
    Battery,
    BatteryCharging,
    BatteryLow,
    Zap,
    Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { StockMonitoringItem } from "@/types/inventoryType";

interface TabelMonitoringProps {
    data: StockMonitoringItem[];
    loading: boolean;
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    warehouseFilter: string;
    setWarehouseFilter: (value: string) => void;
    statusFilter: string;
    setStatusFilter: (value: string) => void;
    warehouses: { id: string; name: string }[];
    lastUpdated: Date;
    viewMode: 'desktop' | 'mobile';
    onViewModeChange: (mode: 'desktop' | 'mobile') => void;
    onRefresh: () => void;
    stats: {
        total: number;
        critical: number;
        warning: number;
        safe: number;
        inactive: number;
    };
    pagination?: PaginationMeta | null;
    onPageChange?: (page: number) => void;
    startDate?: string;
    setStartDate?: (date: string) => void;
    endDate?: string;
    setEndDate?: (date: string) => void;
    period?: string;
    setPeriod?: (value: string) => void;
    role: string;
    totalInventoryValue?: number;
}

export default function TabelMonitoring({
    data = [],
    loading,
    searchTerm,
    setSearchTerm,
    warehouseFilter,
    setWarehouseFilter,
    statusFilter,
    setStatusFilter,
    warehouses = [],
    lastUpdated,
    viewMode,
    onViewModeChange,
    onRefresh,
    stats,
    pagination,
    onPageChange,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    period,
    setPeriod,
    role,
    totalInventoryValue
}: TabelMonitoringProps) {
    const [selectedItem, setSelectedItem] = useState<StockMonitoringItem | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    // Filter Helper Config
    const canViewFinancials = role === 'admin' || role === 'super_admin';

    // Calculate total inventory value
    // If totalInventoryValue prop is provided (server-side aggregated), use it.
    // Otherwise fallback to client-side calculation (only for current page).
    const displayTotalValue = totalInventoryValue ?? data.reduce((acc, item) => acc + (Number(item.inventoryValue) || 0), 0);

    const handleViewDetail = (item: StockMonitoringItem) => {
        setSelectedItem(item);
        setIsSheetOpen(true);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('id-ID', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(num);
    };




    // Helper Functions
    const getStatusIcon = (status: string, isActive: boolean) => {
        if (!isActive) return <XCircle className="w-3 h-3" />;
        switch (status) {
            case "CRITICAL": return <BatteryLow className="w-3 h-3" />;
            case "WARNING": return <Battery className="w-3 h-3" />;
            default: return <BatteryCharging className="w-3 h-3" />;
        }
    };

    const getStatusStyles = (status: string, isActive: boolean) => {
        if (!isActive) return {
            bg: "bg-slate-100/80 dark:bg-slate-800/50",
            text: "text-slate-500 dark:text-slate-400",
            border: "border-slate-200 dark:border-slate-700",
            icon: <XCircle className="w-3 h-3" />
        };
        switch (status) {
            case "CRITICAL": return {
                bg: "bg-rose-50/80 dark:bg-rose-900/20",
                text: "text-rose-600 dark:text-rose-400",
                border: "border-rose-100 dark:border-rose-900/50",
                icon: <AlertTriangle className="w-3 h-3" />
            };
            case "WARNING": return {
                bg: "bg-amber-50/80 dark:bg-amber-900/20",
                text: "text-amber-600 dark:text-amber-400",
                border: "border-amber-100 dark:border-amber-900/50",
                icon: <AlertCircle className="w-3 h-3" />
            };
            default: return {
                bg: "bg-emerald-50/80 dark:bg-emerald-900/20",
                text: "text-emerald-600 dark:text-emerald-400",
                border: "border-emerald-100 dark:border-emerald-900/50",
                icon: <CheckCircle className="w-3 h-3" />
            };
        }
    };

    const getWarehouseStyles = (warehouse: string) => {
        const colors = [
            { bg: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800", icon: "text-blue-500 dark:text-blue-400" },
            { bg: "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800", icon: "text-purple-500 dark:text-purple-400" },
            { bg: "bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800", icon: "text-pink-500 dark:text-pink-400" },
            { bg: "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800", icon: "text-orange-500 dark:text-orange-400" },
            { bg: "bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800", icon: "text-teal-500 dark:text-teal-400" },
            { bg: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800", icon: "text-indigo-500 dark:text-indigo-400" },
            { bg: "bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800", icon: "text-cyan-500 dark:text-cyan-400" },
            { bg: "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800", icon: "text-rose-500 dark:text-rose-400" },
        ];

        let hash = 0;
        for (let i = 0; i < warehouse.length; i++) {
            hash = warehouse.charCodeAt(i) + ((hash << 5) - hash);
        }

        const index = Math.abs(hash) % colors.length;
        return colors[index];
    };

    // Mobile Card View
    const MobileCardView = ({ item, index }: { item: StockMonitoringItem, index: number }) => {
        const statusStyles = getStatusStyles(item.status, item.isActive);
        return (
            <Drawer>
                <DrawerTrigger asChild>
                    <Card className="border-none shadow-sm bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 mb-4 cursor-pointer group overflow-hidden">
                        <CardContent className="p-6">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={cn(
                                            "p-2.5 rounded-2xl shadow-sm transition-all duration-300 group-hover:shadow-lg",
                                            statusStyles.bg,
                                            statusStyles.border
                                        )}>
                                            <Package className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-base leading-tight">{item.name}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <code className="text-xs font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md border border-indigo-100">
                                                    {item.code}
                                                </code>
                                                <Badge variant="outline" className="text-[10px] px-2 py-0 h-5">
                                                    {item.storageUnit}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <WarehouseIcon className="w-3.5 h-3.5" />
                                        <span>{item.warehouse}</span>
                                        {item.category && (
                                            <>
                                                <span className="text-xs">•</span>
                                                <span>{item.category}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <Badge variant="outline" className={cn(
                                    "px-3 py-1.5 rounded-xl font-bold uppercase text-[9px] tracking-[0.15em] border-2",
                                    statusStyles.bg,
                                    statusStyles.text,
                                    statusStyles.border
                                )}>
                                    <div className="flex items-center gap-1.5">
                                        {getStatusIcon(item.status, item.isActive)}
                                        {!item.isActive ? "Inactive" : item.status}
                                    </div>
                                </Badge>
                            </div>

                            {/* Stock Summary */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-2xl p-4 shadow-sm">
                                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Stock</p>
                                    <p className="text-xl font-black text-indigo-600">{formatNumber(item.stockAkhir)}</p>
                                    <p className="text-[9px] text-indigo-300 font-bold mt-1">PHYSICAL</p>
                                </div>
                                <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-2xl p-4 shadow-sm">
                                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Available</p>
                                    <p className="text-xl font-black text-emerald-600">{formatNumber(item.availableStock)}</p>
                                    <p className="text-[9px] text-emerald-300 font-bold mt-1">READY</p>
                                </div>
                            </div>

                            {/* Movement Info */}
                            <div className="flex items-center justify-between bg-slate-50/50 rounded-2xl p-4 mb-4">
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                                        <span className="font-bold text-emerald-600">{formatNumber(item.stockIn)}</span>
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">In</p>
                                </div>
                                <div className="h-8 w-px bg-slate-200" />
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
                                        <span className="font-bold text-rose-600">{formatNumber(item.stockOut)}</span>
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Out</p>
                                </div>
                                <div className="h-8 w-px bg-slate-200" />
                                <div className="text-center">
                                    <div className="mb-1">
                                        <span className="font-bold text-amber-600">{formatNumber(item.bookedStock)}</span>
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Booked</p>
                                </div>
                            </div>

                            {/* Value & Action */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Value</p>
                                    <p className="text-lg font-black text-slate-900 dark:text-white">{formatCurrency(item.inventoryValue)}</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-xl gap-2 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 dark:text-slate-300"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleViewDetail(item);
                                    }}
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                    Details
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </DrawerTrigger>
                <DrawerContent className="h-[85vh]">
                    <DrawerHeader className="border-b">
                        <DrawerTitle className="flex items-center gap-3">
                            <div className={cn(
                                "p-2 rounded-xl",
                                statusStyles.bg,
                                statusStyles.border
                            )}>
                                <Package className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">{item.name}</p>
                                <DrawerDescription className="flex items-center gap-2">
                                    <code className="text-xs">{item.code}</code>
                                    • {item.warehouse}
                                </DrawerDescription>
                            </div>
                        </DrawerTitle>
                    </DrawerHeader>
                    <div className="p-6 overflow-auto">
                        {/* Detailed mobile view content */}
                        <div className="space-y-6">
                            {/* Add detailed view content here */}
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>
        );
    };

    // Enhanced Desktop Skeleton
    const DesktopTableSkeleton = () => (
        <>
            {[...Array(8)].map((_, i) => (
                <TableRow key={i} className="group hover:bg-slate-50/80 transition-all border-b border-slate-50">
                    <TableCell className="text-center py-5">
                        <Skeleton className="h-4 w-6 mx-auto rounded-full" />
                    </TableCell>
                    <TableCell className="py-5">
                        <div className="flex items-center gap-5">
                            <Skeleton className="w-12 h-12 rounded-2xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-48 rounded-lg" />
                                <Skeleton className="h-3 w-32 rounded-lg" />
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-6">
                            <div className="space-y-1">
                                <Skeleton className="h-3 w-16 rounded" />
                                <Skeleton className="h-4 w-12 rounded" />
                            </div>
                            <div className="space-y-1">
                                <Skeleton className="h-3 w-16 rounded" />
                                <Skeleton className="h-4 w-12 rounded" />
                            </div>
                        </div>
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="space-y-1 inline-block">
                            <Skeleton className="h-4 w-16 rounded ml-auto" />
                            <Skeleton className="h-3 w-24 rounded ml-auto" />
                        </div>
                    </TableCell>
                    <TableCell className="text-right">
                        <Skeleton className="h-12 w-24 rounded-2xl ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                        <Skeleton className="h-4 w-32 rounded ml-auto" />
                    </TableCell>
                    <TableCell className="text-center">
                        <Skeleton className="h-6 w-16 rounded-xl mx-auto" />
                    </TableCell>
                    <TableCell>
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </TableCell>
                </TableRow>
            ))}
        </>
    );

    // Mobile Skeleton
    const MobileSkeleton = () => (
        <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
                <Card key={i} className="border-none shadow-sm bg-white/90 backdrop-blur-sm">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <Skeleton className="w-10 h-10 rounded-2xl" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-40 rounded" />
                                        <Skeleton className="h-3 w-24 rounded" />
                                    </div>
                                </div>
                            </div>
                            <Skeleton className="h-6 w-16 rounded-xl" />
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <Skeleton className="h-16 rounded-2xl" />
                            <Skeleton className="h-16 rounded-2xl" />
                        </div>
                        <Skeleton className="h-12 rounded-2xl w-full mb-4" />
                        <Skeleton className="h-8 w-32 rounded-xl" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 p-1 md:px-6 space-y-4 antialiased text-slate-900 dark:text-slate-50 font-sans transition-colors duration-300">
            {/* HEADER SECTION IS MOVED TO PAGE.TSX */}
            <div className="hidden lg:block"></div>

            {/* DETAILED STATS */}
            <div className={cn(
                "grid grid-cols-2 md:grid-cols-3 gap-4",
                canViewFinancials ? "lg:grid-cols-6" : "lg:grid-cols-5"
            )}>
                {[
                    ...(canViewFinancials ? [{
                        label: "Total Value",
                        value: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(displayTotalValue),
                        icon: DollarSign,
                        color: "text-blue-600 dark:text-blue-400",
                        bgColor: "bg-blue-500/10",
                        accent: "from-blue-600/20 to-transparent"
                    }] : []),
                    { label: "Total Items", value: stats.total, icon: Package, color: "text-indigo-600 dark:text-indigo-400", bgColor: "bg-indigo-500/10", accent: "from-indigo-500/20 to-transparent" },
                    { label: "Safe", value: stats.safe, icon: CheckCircle, color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-500/10", accent: "from-emerald-500/20 to-transparent" },
                    { label: "Low", value: stats.warning, icon: AlertCircle, color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-500/10", accent: "from-amber-500/20 to-transparent" },
                    { label: "Critical", value: stats.critical, icon: AlertTriangle, color: "text-rose-600 dark:text-rose-400", bgColor: "bg-rose-500/10", accent: "from-rose-500/20 to-transparent" },
                    { label: "Inactive", value: stats.inactive, icon: XCircle, color: "text-slate-600 dark:text-slate-400", bgColor: "bg-slate-500/10", accent: "from-slate-500/20 to-transparent" },
                ].map((stat, i) => (
                    <div
                        key={i}
                        className="group relative overflow-hidden bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl rounded-[24px] p-5 border border-white dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-300"
                    >
                        {/* Soft Gradient Accent Background */}
                        <div className={cn("absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br opacity-40 blur-2xl transition-opacity group-hover:opacity-60", stat.accent)} />

                        <div className="relative flex items-center justify-between z-10">
                            <div className="space-y-1">
                                <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
                                    {stat.label}
                                </p>
                                <p className={cn(
                                    "font-black text-slate-900 dark:text-slate-100 tracking-tight",
                                    stat.label === "Total Value" ? "text-lg md:text-xl" : "text-2xl"
                                )}>
                                    {stat.value}
                                </p>
                            </div>

                            <div className={cn(
                                "p-3 rounded-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
                                stat.bgColor,
                                stat.color
                            )}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                        </div>

                        {/* Bottom Accent Line */}
                        <div className={cn("absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-500 opacity-50 bg-current", stat.color)} />
                    </div>
                ))}
            </div>

            {/* FILTER BAR - Moved to Separate Component */}
            <InventoryFilterBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                period={period}
                setPeriod={setPeriod}
                warehouseFilter={warehouseFilter}
                setWarehouseFilter={setWarehouseFilter}
                warehouses={warehouses}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                viewMode={viewMode}
                onViewModeChange={onViewModeChange}
                lastUpdated={lastUpdated}
                onRefresh={onRefresh}
                loading={loading}
            />

            {/* MAIN CONTENT AREA */}
            {
                viewMode === 'mobile' ? (
                    /* MOBILE VIEW */
                    <Card className="border-none shadow-xl shadow-slate-200/60 dark:shadow-none overflow-hidden bg-white dark:bg-slate-900 rounded-3xl transition-colors">
                        <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Stock Items</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                        Showing {data.length} of {stats.total} items
                                    </p>
                                </div>
                                <Badge variant="outline" className="gap-2">
                                    <Smartphone className="w-3 h-3" />
                                    Mobile View
                                </Badge>
                            </div>
                        </div>
                        <CardContent className="p-2">
                            {loading ? (
                                <MobileSkeleton />
                            ) : data.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="mx-auto w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
                                        <Package className="h-10 w-10 text-slate-400" />
                                    </div>
                                    <h3 className="font-bold text-xl text-slate-900 mb-2">No items found</h3>
                                    <p className="text-slate-500 max-w-md mx-auto">
                                        Try adjusting your search criteria or filters to find what you're looking for.
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    {data.map((item, index) => (
                                        <MobileCardView key={item.id} item={item} index={index} />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                        <div className="p-2 bg-slate-50/50 border-t border-slate-100">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-white rounded-xl shadow-sm">
                                        <History className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Last Sync</p>
                                        <p className="text-sm font-bold text-slate-700">{format(lastUpdated, "dd MMM yyyy, HH:mm", { locale: idLocale })}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <p className="text-sm text-slate-500">
                                        <span className="font-bold text-slate-900">{data.length}</span> items shown
                                    </p>
                                    <Button size="sm" className="rounded-xl gap-2" onClick={onRefresh}>
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        Refresh
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                ) : (
                    /* DESKTOP VIEW */
                    <Card className="border-none shadow-2xl shadow-slate-200/60 dark:shadow-none overflow-hidden bg-white dark:bg-slate-900 rounded-[2rem] transition-colors">
                        <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-white/50 dark:from-slate-900 dark:to-slate-800/50 rounded-md">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                                            <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        Live Stock Monitoring Dashboard
                                    </h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                        Real-time tracking of {stats.total} SKUs across {warehouses.length} locations
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button variant="outline" size="sm" className="rounded-xl gap-2 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                                        <Eye className="w-3.5 h-3.5" />
                                        View Options
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={onRefresh} className="rounded-xl gap-2 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        Refresh Data
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Inventory Value Summary Card (Admin Only) */}


                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                        <TableHead className="w-20 text-center font-bold text-slate-400 dark:text-slate-500 py-6">#</TableHead>
                                        <TableHead className="min-w-[300px] font-bold text-slate-900 dark:text-slate-200 text-[10px] uppercase tracking-[0.2em]">Detail Aset</TableHead>
                                        <TableHead className="text-center font-bold text-slate-900 dark:text-slate-200 text-[10px] uppercase tracking-[0.2em]">Stok Awal</TableHead>
                                        <TableHead className="min-w-[150px] font-bold text-slate-900 dark:text-slate-200 text-[10px] uppercase tracking-[0.2em]">Arus Stok (Periode)</TableHead>
                                        <TableHead className="min-w-[150px] font-bold text-slate-900 dark:text-slate-200 text-[10px] uppercase tracking-[0.2em]">Aktivitas (Periode)</TableHead>
                                        <TableHead className="text-right font-bold text-slate-900 dark:text-slate-200 text-[10px] uppercase tracking-[0.2em]">
                                            <div className="flex items-center justify-end gap-2">
                                                <Sparkles className="w-3 h-3" />
                                                Stok Akhir
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-right font-bold text-slate-900 dark:text-slate-200 text-[10px] uppercase tracking-[0.2em]">
                                            <div className="flex items-center justify-end gap-2">
                                                <Package className="w-3 h-3" />
                                                On Request
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-right font-bold text-slate-900 dark:text-slate-200 text-[10px] uppercase tracking-[0.2em]">Dialokasikan</TableHead>
                                        <TableHead className="text-right font-bold text-slate-900 dark:text-slate-200 text-[10px] uppercase tracking-[0.2em]">
                                            <div className="flex items-center justify-end gap-2">
                                                <CheckCircle className="w-3 h-3" />
                                                Stok Tersedia
                                            </div>
                                        </TableHead>

                                        {canViewFinancials && (
                                            <TableHead className="text-right font-bold text-slate-900 dark:text-slate-200 text-[10px] uppercase tracking-[0.2em]">
                                                <div className="flex items-center justify-end gap-2">
                                                    <DollarSign className="w-3 h-3" />
                                                    Nilai Bersih
                                                </div>
                                            </TableHead>
                                        )}
                                        <TableHead className="text-center font-bold text-slate-900 dark:text-slate-200 text-[12px] uppercase tracking-[0.2em]">
                                            <div className="flex items-center justify-center gap-2">
                                                <History className="w-3 h-3" />
                                                Diperbarui
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-center font-bold text-slate-900 dark:text-slate-200 text-[10px] uppercase tracking-[0.2em]">
                                            <div className="flex items-center justify-center gap-2">
                                                <Shield className="w-3 h-3" />
                                                Kesehatan
                                            </div>
                                        </TableHead>
                                        <TableHead className="w-10"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <DesktopTableSkeleton />
                                    ) : data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="py-16 text-center">
                                                <div className="flex flex-col items-center justify-center gap-4">
                                                    <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center">
                                                        <Package className="h-10 w-10 text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-xl text-slate-900 mb-2">No matching items found</h3>
                                                        <p className="text-slate-500 max-w-md">
                                                            Try adjusting your search terms or filters to find what you're looking for.
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data.map((item, idx) => {
                                            const statusStyles = getStatusStyles(item.status, item.isActive);
                                            return (
                                                <TableRow
                                                    key={item.id}
                                                    className={cn(
                                                        "group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all border-b border-slate-50 dark:border-slate-800",
                                                        !item.isActive && "opacity-60"
                                                    )}
                                                >
                                                    <TableCell className="text-center font-mono text-slate-400 text-sm italic py-5">
                                                        <div className="flex items-center justify-center">
                                                            <span className="font-bold text-slate-900 dark:text-slate-300">{idx + 1}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <div className="flex items-center gap-5">
                                                            <div className={cn(
                                                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                                                                statusStyles.bg,
                                                                statusStyles.border
                                                            )}>
                                                                <Package className="w-6 h-6" />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="font-bold text-slate-900 dark:text-white text-lg leading-tight tracking-tight">{item.name}</p>
                                                                <div className="flex items-center gap-2">
                                                                    <code className="text-[10px] font-black bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md uppercase tracking-tighter border border-indigo-100/50 dark:border-indigo-800/50">
                                                                        {item.code}
                                                                    </code>
                                                                    {(() => {
                                                                        const whStyles = getWarehouseStyles(item.warehouse);
                                                                        return (
                                                                            <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5 rounded-md border flex items-center gap-1 font-medium transition-colors cursor-default", whStyles.bg)}>
                                                                                <WarehouseIcon className={cn("w-3 h-3", whStyles.icon)} />
                                                                                {item.warehouse}
                                                                            </Badge>
                                                                        );
                                                                    })()}
                                                                    {item.category && (
                                                                        <span className="text-xs text-slate-400 dark:text-slate-500">• {item.category}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg inline-block">
                                                            <span className="font-bold text-slate-600 dark:text-slate-300">{formatNumber(item.stockAwal)}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-6">
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <div className="space-y-1">
                                                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Masuk</p>
                                                                            <p className="text-sm font-bold text-emerald-600 flex items-center">
                                                                                <ArrowUpRight className="w-3 h-3 mr-1" />
                                                                                {formatNumber(item.stockIn)}
                                                                            </p>
                                                                        </div>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>Total stok masuk periode ini</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <div className="space-y-1">
                                                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Keluar</p>
                                                                            <p className="text-sm font-bold text-rose-500 flex items-center">
                                                                                <ArrowDownRight className="w-3 h-3 mr-1" />
                                                                                {formatNumber(item.stockOut)}
                                                                            </p>
                                                                        </div>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>Total stok keluar periode ini</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-6">
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <div className="space-y-1">
                                                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Just In</p>
                                                                            <p className="text-sm font-bold text-emerald-600 flex items-center">
                                                                                <ArrowUpRight className="w-3 h-3 mr-1" />
                                                                                {formatNumber(item.justIn)}
                                                                            </p>
                                                                        </div>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>Stock received recently</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <div className="space-y-1">
                                                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Just Out</p>
                                                                            <p className="text-sm font-bold text-rose-500 flex items-center">
                                                                                <ArrowDownRight className="w-3 h-3 mr-1" />
                                                                                {formatNumber(item.justOut)}
                                                                            </p>
                                                                        </div>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>Stock shipped recently</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="inline-block px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/50 group-hover:bg-white dark:group-hover:bg-slate-800/80 border border-transparent group-hover:border-slate-100 dark:group-hover:border-slate-700 transition-all">
                                                            <p className="text-xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{formatNumber(item.stockAkhir)}</p>
                                                            <p className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase mt-1">{item.storageUnit}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-bold text-yellow-500 dark:text-yellow-300">{formatNumber(item.onPR)}</p>
                                                            <p className="text-[9px] text-blue-500 dark:text-blue-500 font-bold uppercase tracking-tighter">Purchase Req</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-bold text-orange-400 dark:text-orange-500">{formatNumber(item.bookedStock)}</p>
                                                            <p className="text-[9px] text-blue-500 dark:text-blue-500 font-bold uppercase tracking-tighter">Booked PR</p>
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="text-right">
                                                        <div className="inline-block px-4 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-transparent transition-all">
                                                            <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 tracking-tighter leading-none">{formatNumber(item.availableStock)}</p>
                                                            <p className="text-[10px] font-bold text-emerald-500 dark:text-emerald-300 uppercase mt-1">Ready</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{formatCurrency(item.inventoryValue)}</p>
                                                        <div className="h-1 w-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full ml-auto mt-2 overflow-hidden">
                                                            <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full w-2/3" />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{format(new Date(item.updatedAt), 'dd MMM yy')}</p>
                                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
                                                                {format(new Date(item.updatedAt), 'HH:mm')}
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="outline" className={cn(
                                                            "px-4 py-1.5 rounded-xl font-bold uppercase text-[9px] tracking-[0.15em] border-2",
                                                            statusStyles.bg,
                                                            statusStyles.text,
                                                            statusStyles.border
                                                        )}>
                                                            <div className="flex items-center gap-1.5">
                                                                {statusStyles.icon}
                                                                {!item.isActive ? "Inactive" : item.status}
                                                            </div>
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="space-y-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleViewDetail(item)}
                                                                className="rounded-xl h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>

                        </div>

                        {
                            pagination && (
                                <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                                    <PaginationComponent
                                        currentPage={pagination.currentPage}
                                        totalPages={pagination.totalPages}
                                        onPageChange={onPageChange || (() => { })}
                                    />
                                </div>
                            )
                        }
                    </Card >
                )
            }

            {/* Detail Sheet */}
            <StockDetailSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                item={selectedItem}
                period={period || format(new Date(), "yyyy-MM")}
                warehouseId={selectedItem?.warehouseId || warehouseFilter}
            />

            {/* FOOTER NOTES */}
            <div className="text-center text-sm text-slate-400 pt-8 border-t border-slate-200/50">
                <p className="flex items-center justify-center gap-2">
                    <Zap className="w-3 h-3" />
                    Data updates automatically every 5 minutes • Last full system refresh: {format(lastUpdated, "dd MMM yyyy HH:mm:ss", { locale: idLocale })}
                </p>
            </div>
        </div >
    );
}