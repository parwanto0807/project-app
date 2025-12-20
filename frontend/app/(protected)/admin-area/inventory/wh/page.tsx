"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { useRouter, useSearchParams } from "next/navigation";

import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { useSession } from "@/components/clientSessionProvider";
import { useMediaQuery } from "@/hooks/use-media-query";
import Pagination from "@/components/ui/paginationNew";
import HeaderCard from "@/components/ui/header-card";
import SearchInput from "@/components/shared/SearchInput";

import WarehouseTable from "@/components/wh/WarehouseTable";
import { getWarehouses } from "@/lib/action/wh/whAction";
import { Warehouse } from "@/types/whType";
import { WarehouseIcon } from "lucide-react";
import CreateWhButton from "@/components/wh/create-wh-button";

export default function WarehousePageAdmin() {
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isLoading } = useSession();
    const isMobile = useMediaQuery("(max-width: 768px)");

    const urlSearchTerm = searchParams.get("search") || "";
    const currentPage = Number(searchParams.get("page")) || 1;
    const highlightId = searchParams.get("highlightId");

    /* =========================
       FETCH DATA (ONCE / REFRESH)
    ========================= */
    useEffect(() => {
        if (isLoading) return;

        if (user?.role !== "admin") {
            router.push("/unauthorized");
            return;
        }

        const fetchData = async () => {
            try {
                const res = await getWarehouses();

                if (!res.success || !res.data) {
                    setWarehouses([]);
                    return;
                }

                setWarehouses(res.data.data); // ⬅️ FIX UTAMA
            } catch (error) {
                console.error("❌ Error fetching warehouses:", error);
                setWarehouses([]);
            }
        };

        fetchData();
    }, [router, user, isLoading, refreshTrigger]);

    /* =========================
       SEARCH FILTER
    ========================= */
    const filteredWarehouses = useMemo(() => {
        if (!urlSearchTerm) return warehouses;

        return warehouses.filter((wh) =>
            `${wh.code} ${wh.name} ${wh.address || ""}`
                .toLowerCase()
                .includes(urlSearchTerm.toLowerCase())
        );
    }, [warehouses, urlSearchTerm]);

    /* =========================
       PAGINATION META
    ========================= */
    const paginationMeta = useMemo(() => {
        const totalItems = filteredWarehouses.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

        return {
            totalItems,
            totalPages,
            startIndex,
            endIndex,
        };
    }, [filteredWarehouses.length, currentPage, itemsPerPage]);

    /* =========================
       PAGINATED DATA
    ========================= */
    const paginatedWarehouses = useMemo(() => {
        const { startIndex, endIndex } = paginationMeta;
        return filteredWarehouses.slice(startIndex, endIndex);
    }, [filteredWarehouses, paginationMeta]);

    /* =========================
       HANDLERS
    ========================= */
    const handleSearch = useCallback(
        (term: string) => {
            const params = new URLSearchParams(searchParams);

            if (term) params.set("search", term);
            else params.delete("search");

            params.set("page", "1");
            router.push(`?${params.toString()}`);
        },
        [router, searchParams]
    );

    const handleItemsPerPageChange = useCallback(
        (value: number) => {
            setItemsPerPage(value);
            const params = new URLSearchParams(searchParams);
            params.set("page", "1");
            router.push(`?${params.toString()}`);
        },
        [router, searchParams]
    );

    const handleRefresh = useCallback(() => {
        setRefreshTrigger((prev) => prev + 1);
    }, []);

    const tableKey = useMemo(
        () =>
            `warehouse-${currentPage}-${itemsPerPage}-${paginatedWarehouses.length}-${refreshTrigger}-${urlSearchTerm}`,
        [
            currentPage,
            itemsPerPage,
            paginatedWarehouses.length,
            refreshTrigger,
            urlSearchTerm,
        ]
    );

    /* =========================
       RENDER
    ========================= */
    return (
        <AdminLayout
            title="Warehouse Management"
            role={user?.role || "guest"}
        >
            {/* Breadcrumb */}
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Badge variant="outline">
                                <Link href="/admin-area">Dashboard</Link>
                            </Badge>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <Badge variant="outline">
                            <BreadcrumbPage>Master Data</BreadcrumbPage>
                        </Badge>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <Badge variant="outline">
                            <BreadcrumbPage>Warehouse</BreadcrumbPage>
                        </Badge>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

                <div className="flex-1 min-h-0 overflow-auto">
                    <div className="space-y-4 p-2 pt-1 md:p-4">
                    {/* Header */}
                    <HeaderCard
                        title={isMobile ? "Warehouse" : "Warehouse Management"}
                        description={
                            isMobile
                                ? "Manage warehouses"
                                : "Manage and organize warehouse locations"
                        }
                        icon={<WarehouseIcon className={isMobile ? "h-5 w-5" : "h-7 w-7"} />}
                        variant={isMobile ? "compact" : "default"}
                        gradientFrom="from-indigo-600"
                        gradientTo="to-blue-600"
                        showActionArea={!isMobile}   // ⬅️ PENTING
                        actionArea={
                            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                <SearchInput
                                    onSearch={handleSearch}
                                    placeholder="Search warehouse..."
                                    className="w-full sm:w-64"
                                    disabled={isLoading}
                                    initialValue={urlSearchTerm}
                                />
                                <CreateWhButton
                                    role={user?.role || "admin"}
                                    variant="default"
                                    onSuccess={handleRefresh}
                                    size={isMobile ? "sm" : "default"}
                                />
                            </div>
                        }
                    />


                    {isMobile && (
                        <div className="mt-4 p-4 bg-white dark:bg-slate-900 rounded-lg shadow-sm border">
                            <div className="flex flex-col gap-3">

                                {/* Search */}
                                <SearchInput
                                    onSearch={handleSearch}
                                    placeholder="Search warehouse..."
                                    className="w-full"
                                    disabled={isLoading}
                                    initialValue={urlSearchTerm}
                                />

                                {/* Items per page */}
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-muted-foreground">
                                        Items per page
                                    </span>
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) =>
                                            handleItemsPerPageChange(Number(e.target.value))
                                        }
                                        className="w-full h-9 px-3 border rounded-md bg-background text-sm"
                                        disabled={isLoading}
                                    >
                                        {[10, 20, 30, 50, 100].map((n) => (
                                            <option key={n} value={n}>
                                                {n}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* (Optional) Create Warehouse Button */}
                                {/* Kalau sudah ada dialog create */}
                                <CreateWhButton
                                    role={user?.role || "admin"}
                                    onSuccess={handleRefresh}
                                    size="sm"
                                    className="w-full"
                                />

                            </div>
                        </div>
                    )}

                    {/* Search info */}
                    {urlSearchTerm && (
                        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border">
                            <p className="text-sm">
                                Showing results for{" "}
                                <span className="font-semibold">
                                    “{urlSearchTerm}”
                                </span>{" "}
                                ({filteredWarehouses.length} found)
                            </p>
                        </div>
                    )}

                    {/* Table */}
                    <WarehouseTable
                        key={tableKey}
                        data={paginatedWarehouses}
                        isLoading={isLoading}
                        highlightId={highlightId}
                        onRefresh={handleRefresh}
                    />

                    {/* Footer info */}
                    {paginationMeta.totalItems > 0 && (
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm border-t pt-3">
                            <div className="flex items-center gap-2">
                                <span>Items per page</span>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) =>
                                        handleItemsPerPageChange(Number(e.target.value))
                                    }
                                    className="w-20 h-8 border rounded-md"
                                >
                                    {[10, 20, 30, 50, 100].map((n) => (
                                        <option key={n} value={n}>
                                            {n}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="text-muted-foreground">
                                Showing {paginationMeta.startIndex + 1}-
                                {paginationMeta.endIndex} of{" "}
                                {paginationMeta.totalItems}
                            </div>
                        </div>
                    )}

                    {/* Pagination */}
                    {paginationMeta.totalPages > 1 && (
                        <div className="flex justify-center">
                            <Pagination totalPages={paginationMeta.totalPages} />
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
