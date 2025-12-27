"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { StockMonitoringItem } from "@/types/inventoryType";
import { PaginationMeta } from "@/types/api";
import TabelMonitoring from "@/components/inventory/TabelMonitoring";
import { getInventoryMonitoring } from "@/lib/action/inventory/inventoryAction";
import { toast } from "sonner";

interface DashboardClientProps {
    initialItems: StockMonitoringItem[];
    initialPagination: PaginationMeta | null;
    initialTotalValue?: number;
    initialStats?: {
        total: number;
        critical: number;
        warning: number;
        safe: number;
        inactive: number;
    };
    defaultPeriod: string;
    allWarehouses: { id: string; name: string; isMain: boolean }[];
    role: string;
}

export default function DashboardClient({
    initialItems,
    initialPagination,
    initialTotalValue = 0,
    initialStats = {
        total: 0,
        critical: 0,
        warning: 0,
        safe: 0,
        inactive: 0
    },
    defaultPeriod,
    allWarehouses,
    role
}: DashboardClientProps) {
    // --- States ---
    const [items, setItems] = useState<StockMonitoringItem[]>(initialItems);
    const [pagination, setPagination] = useState<PaginationMeta | null>(initialPagination);
    const [totalValue, setTotalValue] = useState<number>(initialTotalValue);
    const [stats, setStats] = useState(initialStats);
    const [loading, setLoading] = useState(false);

    // States untuk Filter (Menggunakan Period tunggal)
    // States untuk Filter (Menggunakan Period tunggal)
    const [filters, setFilters] = useState({
        period: defaultPeriod, // Contoh: "2024-12"
        searchTerm: "",
        warehouseFilter: "all",
        statusFilter: "all",
        page: 1
    });

    const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    // --- Responsive View Logic ---
    useEffect(() => {
        const checkMobile = () => setViewMode(window.innerWidth < 768 ? 'mobile' : 'desktop');
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // --- Load Data Logic (Server-Side Filtering) ---
    const loadData = useCallback(async () => {
        // Jangan jalankan loading jika ini adalah mount pertama kali (data sudah ada dari server)
        setLoading(true);
        try {
            const res = await getInventoryMonitoring({
                period: filters.period,
                search: filters.searchTerm,
                warehouseId: filters.warehouseFilter === "all" ? undefined : filters.warehouseFilter,
                status: filters.statusFilter === "all" ? undefined : filters.statusFilter,
                page: filters.page,
                limit: 10
            });

            if (res.success && res.data) {
                setItems(res.data.data);
                setPagination(res.data.pagination);
                // Update total value if available in summary
                if (res.data.summary?.totalInventoryValue !== undefined) {
                    setTotalValue(Number(res.data.summary.totalInventoryValue));
                }

                // Update Stats if available
                if (res.data.summary?.stats) {
                    setStats(res.data.summary.stats);
                }

                setLastUpdated(new Date());
            } else {
                toast.error(res.message || "Gagal memuat data terbaru");
            }
        } catch (error) {
            console.error("Error refreshing data:", error);
            toast.error("Terjadi kesalahan koneksi ke server");
        } finally {
            setLoading(false);
        }
    }, [filters.period, filters.searchTerm, filters.warehouseFilter, filters.page, filters.statusFilter]);

    // Flag to skip initial fetch since we have server data
    const isFirstRender = React.useRef(true);

    // Efek untuk memicu reload data saat filter krusial berubah
    useEffect(() => {
        // Skip first render because we have initial data
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        loadData();
    }, [filters.period, filters.page, filters.warehouseFilter, filters.searchTerm, filters.statusFilter, loadData]);




    // --- Event Handlers ---
    const handleUpdateFilter = (key: string, value: any) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
            page: 1 // Reset ke halaman pertama setiap kali filter berubah
        }));
    };

    const fetchAllData = useCallback(async () => {
        try {
            const res = await getInventoryMonitoring({
                period: filters.period,
                search: filters.searchTerm,
                warehouseId: filters.warehouseFilter === "all" ? undefined : filters.warehouseFilter,
                status: filters.statusFilter === "all" ? undefined : filters.statusFilter,
                page: 1,
                limit: 100000 // Fetch huge limit for report
            });

            if (res.success && res.data) {
                return res.data.data;
            }
            return [];
        } catch (error) {
            console.error("Error fetching report data:", error);
            toast.error("Gagal mengambil data lengkap untuk laporan");
            return [];
        }
    }, [filters.period, filters.searchTerm, filters.warehouseFilter, filters.statusFilter]);

    return (
        <TabelMonitoring
            data={items}
            pagination={pagination}
            totalInventoryValue={totalValue} // Pass the total value
            loading={loading}

            // Period Filter (Input type="month")
            period={filters.period}
            setPeriod={(val) => handleUpdateFilter('period', val)}

            // Search & Select Filters
            searchTerm={filters.searchTerm}
            setSearchTerm={(val) => handleUpdateFilter('searchTerm', val)}
            warehouseFilter={filters.warehouseFilter}
            setWarehouseFilter={(val) => handleUpdateFilter('warehouseFilter', val)}
            statusFilter={filters.statusFilter}
            setStatusFilter={(val) => handleUpdateFilter('statusFilter', val)}


            // Pagination Logic
            onPageChange={(p) => setFilters(prev => ({ ...prev, page: p }))}
            onFetchAllData={fetchAllData}

            warehouses={allWarehouses}
            lastUpdated={lastUpdated}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onRefresh={loadData}
            stats={stats}
            role={role}
        />
    );
}