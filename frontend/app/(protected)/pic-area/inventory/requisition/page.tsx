"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Plus } from "lucide-react";

import { PicLayout } from '@/components/admin-panel/pic-layout';
import { useSession } from "@/components/clientSessionProvider";
import { useMediaQuery } from "@/hooks/use-media-query";
import Pagination from "@/components/ui/paginationNew";
import HeaderCard from "@/components/ui/header-card";
import SearchInput from "@/components/shared/SearchInput";

import { getDataMr } from "@/lib/action/inventory/mrInventroyAction";
import TableMR from "@/components/inventoryMr/TableMr";

export default function MaterialRequisitionPage() {
    const [allMR, setAllMR] = useState<any[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [isInternalLoading, setIsInternalLoading] = useState(true);

    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isLoading: sessionLoading } = useSession();
    const isMobile = useMediaQuery("(max-width: 768px)");

    const urlSearchTerm = searchParams.get("search") || "";
    const currentPage = Number(searchParams.get("page")) || 1;

    /* =========================
        FETCH DATA
    ========================= */
    useEffect(() => {
        if (sessionLoading) return;

        // Proteksi Role (Opsional)
        if (user?.role !== "admin" && user?.role !== "staff" && user?.role !== "pic") {
            router.push("/unauthorized");
            return;
        }

        const fetchData = async () => {
            setIsInternalLoading(true);
            try {
                // Kita ambil data tanpa filter page dulu karena pagination dilakukan di client sesuai pola Anda
                const res = await getDataMr({ pageSize: 9999 });

                if (res.success && res.data) {
                    setAllMR(res.data.data);
                } else {
                    setAllMR([]);
                }
            } catch (error) {
                console.error("❌ Error fetching MR:", error);
                setAllMR([]);
            } finally {
                setIsInternalLoading(false);
            }
        };

        fetchData();
    }, [router, user, sessionLoading, refreshTrigger]);

    /* =========================
        SEARCH FILTER (CLIENT SIDE)
    ========================= */
    const filteredMR = useMemo(() => {
        if (!urlSearchTerm) return allMR;

        return allMR.filter((mr) =>
            `${mr.mrNumber} ${mr.projectName || ""} ${mr.status}`
                .toLowerCase()
                .includes(urlSearchTerm.toLowerCase())
        );
    }, [allMR, urlSearchTerm]);

    /* =========================
        PAGINATION LOGIC (CLIENT SIDE)
    ========================= */
    const paginationMeta = useMemo(() => {
        const totalItems = filteredMR.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

        return {
            totalItems,
            totalPages,
            startIndex,
            endIndex,
        };
    }, [filteredMR.length, currentPage, itemsPerPage]);

    const paginatedMR = useMemo(() => {
        const { startIndex, endIndex } = paginationMeta;
        return filteredMR.slice(startIndex, endIndex);
    }, [filteredMR, paginationMeta]);

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

    return (
        <PicLayout title="Material Requisition" role="pic">
            <div className="space-y-4 p-4">
                {/* Breadcrumb */}
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <Badge variant="outline" asChild>
                                <Link href="/pic-area">Dashboard</Link>
                            </Badge>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <Badge variant="outline">Inventory</Badge>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <Badge variant="outline">
                                <BreadcrumbPage>Material Requisition</BreadcrumbPage>
                            </Badge>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                {/* Header */}
                <HeaderCard
                    title={isMobile ? "MR" : "Material Requisition / Pengambilan Barang Management"}
                    description="Pantau dan kelola pengeluaran barang gudang"
                    icon={<ClipboardList className={isMobile ? "h-5 w-5" : "h-7 w-7"} />}
                    showActionArea={!isMobile}
                    actionArea={
                        <div className="flex flex-col sm:flex-row gap-3">
                            <SearchInput
                                onSearch={handleSearch}
                                placeholder="Cari MR..."
                                initialValue={urlSearchTerm}
                            />
                        </div>
                    }
                />

                {/* Mobile Search Area */}
                {isMobile && (
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-lg shadow-sm border space-y-3">
                        <SearchInput
                            onSearch={handleSearch}
                            placeholder="Cari MR..."
                            initialValue={urlSearchTerm}
                        />
                    </div>
                )}

                {/* Results Info */}
                {urlSearchTerm && (
                    <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border">
                        <p className="text-sm">
                            Hasil pencarian untuk <span className="font-semibold">“{urlSearchTerm}”</span>
                            ({filteredMR.length} data ditemukan)
                        </p>
                    </div>
                )}

                {/* Tabel MR */}
                <TableMR
                    data={paginatedMR}
                    isLoading={isInternalLoading || sessionLoading}
                    onRefresh={handleRefresh}
                />

                {/* Footer & Pagination */}
                {paginationMeta.totalItems > 0 && (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm border-t pt-4">
                            <div className="flex items-center gap-2">
                                <span>Items per page</span>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                                    className="w-20 h-8 border rounded-md bg-background"
                                >
                                    {[10, 20, 30, 50].map((n) => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="text-muted-foreground">
                                Showing {paginationMeta.startIndex + 1} - {paginationMeta.endIndex} of {paginationMeta.totalItems}
                            </div>
                        </div>

                        {paginationMeta.totalPages > 1 && (
                            <div className="flex justify-center">
                                <Pagination totalPages={paginationMeta.totalPages} />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </PicLayout>
    );
}
