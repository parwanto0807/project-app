"use client";

import React, { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Search,
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Package,
    TrendingUp,
    AlertCircle,
    Info,
    Filter,
    Eye,
    WarehouseIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import axios from "axios";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

// Extended Interface matching new backend response
interface StockMonitoringItem {
    id: string; // StockBalance ID
    productId: string;
    code: string;
    name: string;
    category?: string;
    storageUnit: string;
    isActive: boolean;

    warehouse: string;
    period: string; // ISO Date string

    stockAwal: number;
    stockIn: number;
    stockOut: number;
    justIn: number;
    justOut: number;

    onPR: number;
    bookedStock: number; // approved PR/MR

    stockAkhir: number; // Fisik saat ini
    availableStock: number; // (stockAkhir - bookedStock)

    inventoryValue: number;
    updatedAt: string;

    status: 'SAFE' | 'WARNING' | 'CRITICAL';
}

export default function TabelMonitoring() {
    const [items, setItems] = useState<StockMonitoringItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [warehouseFilter, setWarehouseFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [activeTab, setActiveTab] = useState("all");
    const [warehouses, setWarehouses] = useState<string[]>([]);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await axios.get<{ success: boolean; data: StockMonitoringItem[] }>('/api/inventory/monitoring');
            if (res.data.success) {
                setItems(res.data.data);
                setLastUpdated(new Date());

                // Extract unique warehouses
                const uniqueWarehouses = [...new Set(res.data.data.map((item) => item.warehouse))];
                setWarehouses(uniqueWarehouses);
            }
        } catch (error) {
            console.error("Failed to load inventory monitoring data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filteredItems = items.filter((item) => {
        const matchesSearch =
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.code.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesWarehouse = warehouseFilter === "all" || item.warehouse === warehouseFilter;
        const matchesStatus = statusFilter === "all" || item.status === statusFilter;
        const matchesTab = activeTab === "all" ||
            (activeTab === "critical" && item.status === "CRITICAL") ||
            (activeTab === "warning" && item.status === "WARNING") ||
            (activeTab === "inactive" && !item.isActive);

        return matchesSearch && matchesWarehouse && matchesStatus && matchesTab;
    });

    const getStatusStats = () => {
        const total = items.length;
        const critical = items.filter(item => item.status === "CRITICAL").length;
        const warning = items.filter(item => item.status === "WARNING").length;
        const safe = items.filter(item => item.status === "SAFE").length;

        return { total, critical, warning, safe };
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('id-ID', {
            maximumFractionDigits: 2,
            minimumFractionDigits: 0
        }).format(num);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "CRITICAL":
                return (
                    <Badge variant="destructive" className="gap-1 px-2 py-1 rounded-full">
                        <XCircle className="w-3 h-3" />
                        Critical
                    </Badge>
                );
            case "WARNING":
                return (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1 px-2 py-1 rounded-full">
                        <AlertTriangle className="w-3 h-3" />
                        Low
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 px-2 py-1 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Safe
                    </Badge>
                );
        }
    };

    const stats = getStatusStats();

    return (
        <div className="space-y-6">
            {/* Header Card with Stats */}
            <Card className="border-border/50 bg-gradient-to-br from-white to-gray-50/50 shadow-sm">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2.5 rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100">
                                    <TrendingUp className="h-6 w-6 text-indigo-600" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-foreground">Live Stock Monitoring</h1>
                                    <p className="text-sm text-muted-foreground">Real-time stock balances and inventory tracking</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Updated</div>
                                <div className="text-sm font-medium">
                                    {format(lastUpdated, "HH:mm:ss", { locale: idLocale })}
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={loadData}
                                className="h-9 w-9 rounded-lg border-border/60"
                            >
                                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                            </Button>
                        </div>
                    </div>

                    {/* Stats Overview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-gray-50 to-white border border-border/40 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Items</p>
                                    <p className="text-xl font-bold text-foreground mt-1">{stats.total}</p>
                                </div>
                                <div className="p-2 rounded-lg bg-blue-100">
                                    <Package className="h-4 w-4 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-50/50 to-white border border-emerald-200/50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Safe</p>
                                    <p className="text-xl font-bold text-emerald-600 mt-1">{stats.safe}</p>
                                </div>
                                <div className="p-2 rounded-lg bg-emerald-100">
                                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-amber-50/50 to-white border border-amber-200/50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Low</p>
                                    <p className="text-xl font-bold text-amber-600 mt-1">{stats.warning}</p>
                                </div>
                                <div className="p-2 rounded-lg bg-amber-100">
                                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-rose-50/50 to-white border border-rose-200/50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Critical</p>
                                    <p className="text-xl font-bold text-rose-600 mt-1">{stats.critical}</p>
                                </div>
                                <div className="p-2 rounded-lg bg-rose-100">
                                    <XCircle className="h-4 w-4 text-rose-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Filters Card */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">Filter & Search</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Filter stock items by various criteria
                            </p>
                        </div>

                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                            <TabsList className="grid grid-cols-5 w-full md:w-auto">
                                <TabsTrigger value="all" className="text-xs px-3">All</TabsTrigger>
                                <TabsTrigger value="critical" className="text-xs px-3">Critical</TabsTrigger>
                                <TabsTrigger value="warning" className="text-xs px-3">Low</TabsTrigger>
                                <TabsTrigger value="inactive" className="text-xs px-3">Inactive</TabsTrigger>
                                <TabsTrigger value="info" className="text-xs px-3">
                                    <Info className="h-3 w-3" />
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Search Products</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search product name or code..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 border-border/60 focus:border-indigo-500"
                                />
                            </div>
                        </div>

                        {/* Warehouse Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Warehouse</label>
                            <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                                <SelectTrigger className="border-border/60 focus:ring-indigo-500">
                                    <SelectValue placeholder="All Warehouses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Warehouses</SelectItem>
                                    {warehouses.map((wh) => (
                                        <SelectItem key={wh} value={wh}>{wh}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Stock Status</label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="border-border/60 focus:ring-indigo-500">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="SAFE">Safe</SelectItem>
                                    <SelectItem value="WARNING">Low</SelectItem>
                                    <SelectItem value="CRITICAL">Critical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Data Table Card */}
            <Card className="border-border/50 overflow-hidden">
                <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">Stock Details</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Showing {filteredItems.length} of {items.length} items
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="sm" className="h-8 gap-1.5">
                                            <Eye className="h-3.5 w-3.5" />
                                            <span className="text-xs">View</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Quick view options</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={loadData}
                                className="h-8 gap-1.5"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                                <span className="text-xs">Refresh</span>
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                                <TableHead className="w-[60px] text-center font-semibold text-muted-foreground">No</TableHead>
                                <TableHead className="min-w-[200px] font-semibold text-foreground">Informasi Produk</TableHead>
                                <TableHead className="min-w-[120px] font-semibold text-foreground">Gudang</TableHead>
                                <TableHead className="text-center font-semibold text-foreground">Satuan</TableHead>

                                {/* Section: Pergerakan Stok */}
                                <TableHead className="text-right font-semibold text-blue-700 bg-blue-50/50 border-l">Awal</TableHead>
                                <TableHead className="text-right font-semibold text-blue-700 bg-blue-50/50">Masuk</TableHead>
                                <TableHead className="text-right font-semibold text-blue-700 bg-blue-50/50 border-l border-blue-200">Masuk Terakhir</TableHead>
                                <TableHead className="text-right font-semibold text-blue-700 bg-blue-50/50">Keluar</TableHead>
                                <TableHead className="text-right font-semibold text-blue-700 bg-blue-50/50 border-l border-blue-200">Keluar Terakhir</TableHead>

                                {/* Section: Alokasi */}
                                <TableHead className="text-right font-semibold text-amber-700 bg-amber-50/30 border-l">On PR</TableHead>
                                <TableHead className="text-right font-semibold text-amber-700 bg-amber-50/30">Booked</TableHead>
                                <TableHead className="text-right font-semibold text-blue-700 bg-blue-50/30 border-l border-blue-200">Tersedia</TableHead>
                                <TableHead className="text-right font-semibold text-emerald-700 bg-emerald-50/30 border-l">Fisik</TableHead>

                                <TableHead className="text-right font-semibold text-foreground border-l">Nilai</TableHead>
                                <TableHead className="text-center font-semibold text-foreground">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                // Skeleton Loading
                                Array.from({ length: 5 }).map((_, index) => (
                                    <TableRow key={index}>
                                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={15} className="h-48 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="p-3 rounded-full bg-muted">
                                                <Package className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-foreground">No stock records found</h4>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Try adjusting your search or filters
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredItems.map((item, index) => (
                                    <TableRow
                                        key={item.id}
                                        className={`hover:bg-muted/20 transition-colors ${item.status === "CRITICAL" ? "bg-rose-50/30" :
                                            item.status === "WARNING" ? "bg-amber-50/30" :
                                                "hover:bg-muted/10"
                                            }`}
                                    >
                                        <TableCell className="text-center text-sm font-medium text-muted-foreground">
                                            {index + 1}
                                        </TableCell>

                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-sm text-foreground line-clamp-1">{item.name}</span>
                                                    {!item.isActive && (
                                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-red-50 text-red-700 border-red-200">
                                                            Inactive
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <code className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                        {item.code}
                                                    </code>
                                                    {item.category && (
                                                        <span className="text-xs text-muted-foreground">• {item.category}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>

                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <WarehouseIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="text-sm">{item.warehouse}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className="text-xs font-normal px-2 py-0.5">
                                                {item.storageUnit}
                                            </Badge>
                                        </TableCell>

                                        {/* Movement Data */}
                                        <TableCell className="text-right text-sm font-mono bg-blue-50/20 border-l">
                                            {formatNumber(item.stockAwal)}
                                        </TableCell>
                                        <TableCell className="text-right text-sm font-mono text-emerald-600 bg-blue-50/20">
                                            <div className="flex items-center justify-end gap-1">
                                                <TrendingUp className="h-3 w-3" />
                                                {formatNumber(item.stockIn)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right text-sm font-mono text-blue-600 bg-blue-50/20 border-l border-blue-200">
                                            {formatNumber(item.justIn)}
                                        </TableCell>
                                        <TableCell className="text-right text-sm font-mono text-rose-600 bg-blue-50/20">
                                            <div className="flex items-center justify-end gap-1">
                                                <TrendingUp className="h-3 w-3 rotate-180" />
                                                {formatNumber(item.stockOut)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right text-sm font-mono text-orange-600 bg-blue-50/20 border-l border-blue-200">
                                            {formatNumber(item.justOut)}
                                        </TableCell>

                                        {/* Allocation Data */}
                                        <TableCell className="text-right text-sm font-mono text-purple-600 border-l bg-amber-50/20">
                                            {formatNumber(item.onPR)}
                                        </TableCell>
                                        <TableCell className="text-right text-sm font-mono text-amber-600 bg-amber-50/20">
                                            {formatNumber(item.bookedStock)}
                                        </TableCell>
                                        <TableCell className="text-right text-sm font-mono font-semibold text-blue-700 bg-blue-50/20 border-l border-blue-200">
                                            {formatNumber(item.availableStock)}
                                        </TableCell>
                                        <TableCell className="text-right text-sm font-mono font-semibold text-emerald-700 bg-emerald-50/20 border-l">
                                            {formatNumber(item.stockAkhir)}
                                        </TableCell>

                                        {/* Value and Status */}
                                        <TableCell className="text-right text-sm font-mono font-medium border-l">
                                            {formatCurrency(item.inventoryValue)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {getStatusBadge(item.status)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer */}
                {!loading && filteredItems.length > 0 && (
                    <div className="border-t p-4 bg-muted/5">
                        <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                                <span className="font-medium text-foreground">{filteredItems.length}</span> items •
                                Last updated: {format(lastUpdated, "dd MMM yyyy, HH:mm:ss", { locale: idLocale })}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs gap-1"
                                    onClick={loadData}
                                >
                                    <RefreshCw className="h-3 w-3" />
                                    Sync Now
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}