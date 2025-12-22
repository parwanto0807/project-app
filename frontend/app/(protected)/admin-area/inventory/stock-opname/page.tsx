// app/(dashboard)/admin-area/inventory/stock-opname/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Plus,
    Download,
    RefreshCw,
    Calendar,
    Warehouse,
    FileText,
    CheckCircle,
    ChevronDown,
    AlertCircle,
    ArrowRight
} from "lucide-react";

import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { useSession } from "@/components/clientSessionProvider";
import { AdminLoading } from "@/components/admin-loading";
import { toast } from "sonner";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Pagination from "@/components/ui/paginationNew";
import HeaderCard from "@/components/ui/header-card";
import SearchInput from "@/components/shared/SearchInput";
import DateRangePicker from "@/components/shared/DateRangePicker";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

import { stockOpnameActions } from "@/lib/action/stockOpname/soAction";
import type {
    StockOpname,
    OpnameType,
    OpnameStatus,
    StockOpnameFilterInput
} from "@/types/soType";
import { formatCurrency, formatNumber } from "@/lib/utils";
import TabelStockOpname from "@/components/stockOpname/TabelStockOpname";

export default function StockOpnamePage() {
    const router = useRouter();
    const { user, isLoading: sessionLoading } = useSession();
    const [loading, setLoading] = useState(true);
    const [stockOpnames, setStockOpnames] = useState<StockOpname[]>([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1
    });
    const [filters, setFilters] = useState<StockOpnameFilterInput>({
        page: 1,
        limit: 10,
        search: "",
        status: undefined,
        warehouseId: undefined,
        startDate: undefined,
        endDate: undefined,
        type: undefined
    });
    const [warehouses, setWarehouses] = useState<Array<{ id: string, name: string }>>([]);

    // 🔐 Guard role
    useEffect(() => {
        if (!sessionLoading && user?.role !== "admin" && user?.role !== "inventory_manager" && user?.role !== "super") {
            toast.error("Anda tidak memiliki akses ke halaman ini");
            router.push("/admin");
        }
    }, [user, sessionLoading, router]);

    // Load initial data
    useEffect(() => {
        if (user?.role === "admin" || user?.role === "inventory_manager" || user?.role === "super") {
            fetchStockOpnames();
            fetchWarehouses();
        }
    }, [filters, user?.role]);

    const fetchStockOpnames = async () => {
        setLoading(true);
        try {
            const response = await stockOpnameActions.getAll(filters);
            if (response.success && response.data) {
                setStockOpnames(response.data.data);
                setPagination({
                    page: response.data.pagination.currentPage || 1,
                    limit: response.data.pagination.pageSize || 10,
                    total: response.data.pagination.totalCount || 0,
                    totalPages: response.data.pagination.totalPages || 1
                });
            } else {
                toast.error(response.message || "Gagal memuat data stock opname");
            }
        } catch (error) {
            console.error("Error fetching stock opnames:", error);
            toast.error("Terjadi kesalahan saat memuat data");
        } finally {
            setLoading(false);
        }
    };

    const fetchWarehouses = async () => {
        try {
            // Ganti dengan API warehouses yang sesuai
            const response = await fetch('/api/warehouse');
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    setWarehouses(data.data.data || []);
                }
            }
        } catch (error) {
            console.error("Error fetching warehouses:", error);
        }
    };

    const handlePageChange = (page: number) => {
        setFilters(prev => ({ ...prev, page }));
    };

    const handleSearch = (search: string) => {
        setFilters(prev => ({ ...prev, search, page: 1 }));
    };

    const handleStatusFilter = (status: OpnameStatus | "ALL") => {
        setFilters(prev => ({ ...prev, status: status === "ALL" ? undefined : status, page: 1 }));
    };

    const handleWarehouseFilter = (warehouseId: string) => {
        setFilters(prev => ({ ...prev, warehouseId: warehouseId === "ALL" ? undefined : warehouseId, page: 1 }));
    };

    const handleTypeFilter = (type: OpnameType | "ALL") => {
        setFilters(prev => ({ ...prev, type: type === "ALL" ? undefined : type, page: 1 }));
    };

    const handleDateRangeChange = (startDate: string, endDate: string) => {
        setFilters(prev => ({
            ...prev,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            page: 1
        }));
    };

    const handleRefresh = () => {
        fetchStockOpnames();
    };

    const handleExport = async () => {
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('page', filters.page?.toString() || '1');
            queryParams.append('limit', filters.limit?.toString() || '10');

            if (filters.search) queryParams.append('search', filters.search);
            if (filters.status && filters.status !== 'ALL') queryParams.append('status', filters.status);
            if (filters.type && filters.type !== 'ALL') queryParams.append('type', filters.type);
            if (filters.warehouseId && filters.warehouseId !== 'ALL') queryParams.append('warehouseId', filters.warehouseId);
            if (filters.startDate) queryParams.append('startDate', filters.startDate);
            if (filters.endDate) queryParams.append('endDate', filters.endDate);

            const response = await fetch(`/api/stock-opname/export?${queryParams.toString()}`);

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `stock-opname-${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast.success("Data berhasil diexport");
            } else {
                toast.error("Gagal mengexport data");
            }
        } catch (error) {
            console.error("Export error:", error);
            toast.error("Terjadi kesalahan saat export");
        }
    };

    const handleViewDetail = (id: string) => {
        router.push(`/admin-area/inventory/stock-opname/${id}`);
    };

    const handleEdit = (id: string) => {
        router.push(`/admin-area/inventory/stock-opname/${id}/edit`);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Apakah Anda yakin ingin menghapus stock opname ini?")) return;

        try {
            const response = await stockOpnameActions.delete(id);
            if (response.success) {
                toast.success("Stock opname berhasil dihapus");
                fetchStockOpnames();
            } else {
                toast.error(response.message || "Gagal menghapus stock opname");
            }
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan saat menghapus");
        }
    };

    const handleAdjust = async (id: string) => {
        if (!confirm("Apakah Anda yakin ingin menyesuaikan stok? Tindakan ini tidak dapat dibatalkan.")) return;

        try {
            const response = await stockOpnameActions.adjust(id);
            if (response.success) {
                toast.success("Stok berhasil disesuaikan");
                fetchStockOpnames();
            } else {
                toast.error(response.message || "Gagal menyesuaikan stok");
            }
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan saat adjustment");
        }
    };

    const handleCancel = async (id: string) => {
        if (!confirm("Apakah Anda yakin ingin membatalkan stock opname ini?")) return;

        try {
            const response = await stockOpnameActions.cancel(id);
            if (response.success) {
                toast.success("Stock opname berhasil dibatalkan");
                fetchStockOpnames();
            } else {
                toast.error(response.message || "Gagal membatalkan stock opname");
            }
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan saat pembatalan");
        }
    };

    const getStatusBadge = (status: OpnameStatus) => {
        switch (status) {
            case "DRAFT":
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Draft</Badge>;
            case "ADJUSTED":
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Adjusted</Badge>;
            case "CANCELLED":
                return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getTypeBadge = (type: OpnameType) => {
        switch (type) {
            case "INITIAL":
                return <Badge variant="secondary" className="bg-purple-50 text-purple-700">Initial</Badge>;
            case "PERIODIC":
                return <Badge variant="secondary" className="bg-orange-50 text-orange-700">Periodic</Badge>;
            case "AD_HOC":
                return <Badge variant="secondary" className="bg-cyan-50 text-cyan-700">Ad-hoc</Badge>;
            default:
                return <Badge variant="secondary">{type}</Badge>;
        }
    };

    if (sessionLoading) {
        return <AdminLoading />;
    }

    if (user?.role !== "admin" && user?.role !== "inventory_manager" && user?.role !== "super") {
        return null;
    }

    const totalItems = stockOpnames?.reduce((sum, so) => sum + (so.items?.length || 0), 0) || 0;
    const totalValue = stockOpnames?.reduce((sum, so) =>
        sum + (so.items?.reduce((itemSum, item) => itemSum + Number(item.totalNilai || 0), 0) || 0), 0
    ) || 0;

    return (
        <AdminLayout
            title="Stock Opname Management"
            role={user?.role || "guest"}
        >
            <div className="flex-1 min-h-0 overflow-auto">
                <div className="space-y-4 p-2 pt-1 md:p-4">
                    {/* Breadcrumb */}
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/admin-area">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/admin-area/inventory">
                                    Inventory
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Stock Opname List</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Header Card */}
                    <HeaderCard
                        title="Stock Opname"
                        description="Kelola stock opname untuk melakukan pengecekan stok fisik"
                        icon={<FileText className="h-6 w-6" />}
                        gradientFrom="from-purple-500"
                        gradientTo="to-indigo-600"
                        className="mb-6"
                    />

                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Card className="bg-purple-50/30 dark:bg-purple-900/10 border-purple-100/50 dark:border-purple-800/30 shadow-none transition-colors duration-200">
                            <CardContent className="py-2 px-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-purple-100/80 dark:bg-purple-900/40 rounded-md">
                                            <FileText className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-semibold text-purple-950/40 dark:text-purple-100/30 uppercase tracking-widest leading-none mb-0.5">Total Opname</p>
                                            <p className="text-lg font-bold text-purple-950 dark:text-purple-50 leading-none">{formatNumber(pagination.total)}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-blue-50/30 dark:bg-blue-900/10 border-blue-100/50 dark:border-blue-800/30 shadow-none transition-colors duration-200">
                            <CardContent className="py-2 px-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-blue-100/80 dark:bg-blue-900/40 rounded-md">
                                            <Warehouse className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-semibold text-blue-950/40 dark:text-blue-100/30 uppercase tracking-widest leading-none mb-0.5">Total Items</p>
                                            <p className="text-lg font-bold text-blue-950 dark:text-blue-50 leading-none">{formatNumber(totalItems)}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-green-50/30 dark:bg-green-900/10 border-green-100/50 dark:border-green-800/30 shadow-none transition-colors duration-200">
                            <CardContent className="py-2 px-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-green-100/80 dark:bg-green-900/40 rounded-md">
                                            <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-semibold text-green-950/40 dark:text-green-100/30 uppercase tracking-widest leading-none mb-0.5">Total Nilai</p>
                                            <p className="text-lg font-bold text-green-950 dark:text-green-50 leading-none">{formatCurrency(totalValue)}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Modern Toolbar */}
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
                        {/* Left: Search & Filter */}
                        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto flex-1">
                            <div className="w-full sm:w-72 relative">
                                <SearchInput
                                    placeholder="Cari nomor opname atau produk..."
                                    initialValue={filters.search || ""}
                                    onSearch={handleSearch}
                                    className="w-full"
                                />
                            </div>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="gap-2 w-full sm:w-auto bg-background/50 backdrop-blur-sm border-dashed">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-primary/10 p-1 rounded-md">
                                                <FileText className="h-3 w-3 text-primary" />
                                            </div>
                                            <span>Filter</span>
                                        </div>
                                        {(filters.status || filters.type || filters.warehouseId || filters.startDate) && (
                                            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-primary/10 text-primary hover:bg-primary/20">
                                                Active
                                            </Badge>
                                        )}
                                        <ChevronDown className="h-3 w-3 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent align="start" className="w-80 p-4 space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status & Tipe</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Select
                                                value={filters.status || "ALL"}
                                                onValueChange={handleStatusFilter}
                                            >
                                                <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue placeholder="Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ALL">Semua Status</SelectItem>
                                                    <SelectItem value="DRAFT">Draft</SelectItem>
                                                    <SelectItem value="ADJUSTED">Adjusted</SelectItem>
                                                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                                </SelectContent>
                                            </Select>

                                            <Select
                                                value={filters.type || "ALL"}
                                                onValueChange={handleTypeFilter}
                                            >
                                                <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue placeholder="Tipe" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ALL">Semua Tipe</SelectItem>
                                                    <SelectItem value="INITIAL">Initial</SelectItem>
                                                    <SelectItem value="PERIODIC">Periodic</SelectItem>
                                                    <SelectItem value="AD_HOC">Ad-hoc</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gudang</label>
                                        <Select
                                            value={filters.warehouseId || "ALL"}
                                            onValueChange={handleWarehouseFilter}
                                        >
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue placeholder="Pilih Gudang" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ALL">Semua Gudang</SelectItem>
                                                {warehouses.map((warehouse) => (
                                                    <SelectItem key={warehouse.id} value={warehouse.id}>
                                                        {warehouse.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tanggal</label>
                                        <DateRangePicker
                                            startDate={filters.startDate}
                                            endDate={filters.endDate}
                                            onChange={handleDateRangeChange}
                                            className="w-full"
                                            label=""
                                        />
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full h-8 text-xs text-muted-foreground hover:text-foreground"
                                        onClick={() => setFilters({
                                            page: 1,
                                            limit: 10,
                                            search: filters.search // Keep search
                                        })}
                                    >
                                        Reset Filter
                                    </Button>
                                </PopoverContent>
                            </Popover>

                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleRefresh}
                                    className="h-9 w-9 text-muted-foreground hover:text-foreground"
                                    title="Refresh"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleExport}
                                    className="h-9 w-9 text-muted-foreground hover:text-foreground"
                                    title="Export"
                                >
                                    <Download className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Right: Primary Action */}
                        {(user?.role === "admin" || user?.role === "super") && (
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            className="gap-2 w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20 transition-all duration-200 dark:text-white"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Stock Opname Baru
                                            <ChevronDown className="h-3 w-3 ml-1 opacity-70" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 p-2">
                                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Pilih Tipe Opname
                                        </div>
                                        <DropdownMenuItem
                                            onClick={() => router.push("/admin-area/inventory/stock-opname/create?type=PERIODIC")}
                                            className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2 font-bold text-blue-600">
                                                <Calendar className="h-4 w-4" />
                                                PERIODIC
                                            </div>
                                            <span className="text-[10px] text-muted-foreground leading-tight">
                                                Pemeriksaan stok rutin bulanan atau terjadwal.
                                            </span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => router.push("/admin-area/inventory/stock-opname/create?type=AD_HOC")}
                                            className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2 font-bold text-orange-600">
                                                <AlertCircle className="h-4 w-4" />
                                                AD-HOC
                                            </div>
                                            <span className="text-[10px] text-muted-foreground leading-tight">
                                                Pengecekan mendadak atau investigasi selisih.
                                            </span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => router.push("/admin-area/inventory/stock-opname/create?type=INITIAL")}
                                            className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2 font-bold text-purple-600">
                                                <FileText className="h-4 w-4" />
                                                INITIAL
                                            </div>
                                            <span className="text-[10px] text-muted-foreground leading-tight">
                                                Setup stok awal untuk produk atau sistem baru.
                                            </span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}
                    </div>

                    {/* Main Content - Tabel Stock Opname */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold">Daftar Stock Opname</h3>
                                <p className="text-sm text-muted-foreground">
                                    Menampilkan {stockOpnames.length} dari {pagination.total} data
                                </p>
                            </div>

                            {/* Tabel Component */}
                            <TabelStockOpname
                                data={stockOpnames}
                                loading={loading}
                                pagination={pagination}
                                onViewDetail={handleViewDetail}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onAdjust={handleAdjust}
                                onCancel={handleCancel}
                                getStatusBadge={getStatusBadge}
                                getTypeBadge={getTypeBadge}
                            />

                            {/* Pagination */}
                            <div className="mt-6">
                                <Pagination
                                    currentPage={pagination.page}
                                    totalPages={pagination.totalPages}
                                    pageSize={pagination.limit}
                                    totalItems={pagination.total}
                                    onPageChange={handlePageChange}
                                    showPageSize={false}
                                    className="justify-center"
                                />
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </AdminLayout>
    );
}