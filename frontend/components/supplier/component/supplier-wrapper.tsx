"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/components/clientSessionProvider";
import SearchInput from "@/components/shared/SearchInput";
import Pagination from "@/components/ui/paginationNew";
import ItemsPerPageDropdown from "@/components/shared/itemsPerPageDropdown";
import { AdminLoading } from "@/components/admin-loading";
import { useSupplier } from "@/hooks/use-supplier";
import { Button } from "@/components/ui/button";
import { SupplierTable } from "./tabelSupplier";
import { SupplierListResponse } from "@/types/supplierType";
import HeaderCard from "@/components/ui/header-card";
import { useMediaQuery } from "@/hooks/use-media-query";

// Komponen yang dipakai sama seperti SalesOrder

import CreateSupplierButton from "./createSupplierButton";
import SupplierStatusDropdown from "./statusFilterDropdown";
import { WalletCardsIcon } from "lucide-react";

// Konfigurasi status sama seperti SalesOrder (pilih label & class sesuai desain Anda)
export enum SupplierStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    BLACKLISTED = "BLACKLISTED",
}

export const statusConfig: Record<SupplierStatus, { label: string; className: string }> = {
    [SupplierStatus.ACTIVE]: {
        label: "Active",
        className: "bg-green-500",
    },
    [SupplierStatus.INACTIVE]: {
        label: "Inactive",
        className: "bg-gray-500",
    },
    [SupplierStatus.BLACKLISTED]: {
        label: "Blacklisted",
        className: "bg-red-600",
    },
};


interface SupplierClientWrapperProps {
    initialData: SupplierListResponse | null;
}

export default function SupplierClientWrapper({ initialData }: SupplierClientWrapperProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isLoading: userLoading } = useSession();
    const isMobile = useMediaQuery("(max-width: 640px)");

    // URL params
    const urlSearchTerm = searchParams.get("search") || "";
    const urlPage = Number(searchParams.get("page")) || 1;
    const urlPageSize = Number(searchParams.get("pageSize")) || 10;
    const highlightId = searchParams.get("highlightId") || null;

    // Local state
    const [itemsPerPage, setItemsPerPage] = useState(urlPageSize);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const urlStatus = searchParams.get("status") as SupplierStatus | null;
    const [statusFilter, setStatusFilter] = useState<SupplierStatus | "ALL">(
        urlStatus && statusConfig[urlStatus] ? urlStatus : "ALL"
    );



    // Fetch data (activeOnly param kept as string for compatibility with backend)
    const {
        data: supplierData,
        isLoading,
        isFetching,
        error,
        refetch,
    } = useSupplier(urlPage, itemsPerPage, urlSearchTerm, "false", refreshTrigger);

    // initialData fallback (SSR)
    const initialSuppliers = initialData?.data ?? [];
    const initialPagination = initialData?.pagination;

    const suppliers = isInitialLoad ? initialSuppliers : (supplierData?.data ?? []);
    const paginationMeta = isInitialLoad ? initialPagination : supplierData?.pagination;

    // Handlers
    const handleRefresh = useCallback(() => {
        setRefreshTrigger((p) => p + 1);
    }, []);

    // Keep initial load visible until first fetch completes
    useEffect(() => {
        if (!userLoading && initialData && isLoading) {
            setIsInitialLoad(true);
        }
    }, [initialData, userLoading, isLoading]);

    useEffect(() => {
        if (!isLoading && supplierData && isInitialLoad) {
            setIsInitialLoad(false);
        }
    }, [isLoading, supplierData, isInitialLoad]);

    // Auth check
    useEffect(() => {
        if (userLoading) return;
        if (!user) return router.replace("/auth/login");
        if (user.role !== "admin") return router.replace("/not-authorized");
    }, [userLoading, user, router]);

    // Search -> update URL & reset page
    const handleSearch = useCallback(
        (term: string) => {
            const params = new URLSearchParams(searchParams);
            if (term) params.set("search", term);
            else params.delete("search");
            params.set("page", "1");
            router.push(`?${params.toString()}`);
        },
        [searchParams, router]
    );

    // Items per page change -> update URL
    const handleItemsPerPageChange = useCallback(
        (value: number) => {
            setItemsPerPage(value);
            const params = new URLSearchParams(searchParams);
            params.set("pageSize", value.toString());
            params.set("page", "1");
            router.push(`?${params.toString()}`);
        },
        [searchParams, router]
    );

    // Status filter change (like SalesOrder)
    const handleStatusFilterChange = useCallback(
        (value: SupplierStatus | "ALL") => {
            const params = new URLSearchParams(searchParams);
            if (value === "ALL") params.delete("status");
            else params.set("status", value);
            params.set("page", "1");
            router.push(`?${params.toString()}`);
            setStatusFilter(value);
        },
        [searchParams, router]
    );

    // Scroll to top when page or pageSize changes
    useEffect(() => {
        const t = setTimeout(() => {
            if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
        }, 80);
        return () => clearTimeout(t);
    }, [urlPage, itemsPerPage]);

    // Loading / error UI
    if (userLoading || isInitialLoad) {
        return <AdminLoading message="Loading suppliers..." />;
    }

    if (error) {
        const errorMessage =
            typeof error === "string"
                ? error
                : typeof error === "object" && error && "message" in error
                    ? (error as { message?: string }).message ?? "Failed to fetch suppliers"
                    : "Failed to fetch suppliers";
        return (
            <div className="bg-red-50 border border-red-200 p-4 rounded-md">
                <p className="text-sm text-red-700 font-medium">{errorMessage}</p>
            </div>
        );
    }

    // Pagination render helpers
    const renderPagination = () => {
        if (!paginationMeta || (paginationMeta.totalPages ?? 0) <= 1) return null;
        return (
            <div className="flex justify-center">
                <Pagination totalPages={paginationMeta.totalPages} />
            </div>
        );
    };

    const renderItemsInfo = () => {
        if (!paginationMeta) return null;
        return (
            <div className="text-sm text-muted-foreground px-1">
                Showing {(urlPage - 1) * itemsPerPage + 1}-
                {Math.min(urlPage * itemsPerPage, paginationMeta.totalCount)} of{" "}
                {paginationMeta.totalCount} entries
                {statusFilter !== "ALL" && ` (filtered by ${statusConfig[statusFilter as SupplierStatus]?.label})`}
            </div>
        );
    };

    return (
        <div className="space-y-4 p-2 md:p-4">
            {/* HeaderCard with actionArea (desktop) */}
            <HeaderCard
                title={isMobile ? "Suppliers" : "Supplier Management"}
                description={isMobile ? "View supplier records" : "Manage and monitor all suppliers"}
                icon={<WalletCardsIcon className={isMobile ? "h-5 w-5" : "h-7 w-7"} />}
                gradientFrom="from-cyan-600"
                gradientTo="to-purple-600"
                showActionArea={!isMobile}
                actionArea={
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-start sm:items-center">
                        <SearchInput
                            onSearch={handleSearch}
                            placeholder="Search Supplier..."
                            className="w-full sm:w-64"
                            disabled={isFetching}
                            initialValue={urlSearchTerm}
                        />

                        <SupplierStatusDropdown
                            statusFilter={statusFilter}
                            setStatusFilter={handleStatusFilterChange}
                            statusConfig={statusConfig}
                            disabled={isFetching}
                        />

                        <ItemsPerPageDropdown
                            itemsPerPage={itemsPerPage}
                            itemsPerPageOptions={[10, 20, 50, 100, 200]}
                            onItemsPerPageChange={handleItemsPerPageChange}
                            disabled={isFetching}
                        />

                        <CreateSupplierButton
                            role={user?.role || "admin"}
                            onSuccess={() => {
                                // after create, refresh & highlight new item if you want (CreateSupplierButton should return created id)
                                // optionally CreateSupplierButton can call a callback with newId; here we just refetch
                                setTimeout(() => {
                                    refetch();
                                }, 300);
                            }}
                            variant="default"
                            size={isMobile ? "sm" : "default"}
                            disabled={isFetching}
                        />

                        <Button onClick={handleRefresh} disabled={isFetching} variant="outline" size="sm" className="text-black dark:text-white">
                            Refresh
                        </Button>
                    </div>
                }
            />

            {/* Action area for mobile (stacked) */}
            {isMobile && (
                <div className="mt-4 p-4 bg-card rounded-lg shadow-sm border">
                    <div className="flex flex-col gap-3">
                        <SearchInput
                            onSearch={handleSearch}
                            placeholder="Search Supplier..."
                            className="w-full"
                            disabled={isFetching}
                            initialValue={urlSearchTerm}
                        />

                        <div className="flex gap-2">
                            <div className="flex-1">
                                <SupplierStatusDropdown
                                    statusFilter={statusFilter}
                                    setStatusFilter={handleStatusFilterChange}
                                    statusConfig={statusConfig}
                                    disabled={isFetching}
                                />

                            </div>

                            <div className="flex-1">
                                <ItemsPerPageDropdown
                                    itemsPerPage={itemsPerPage}
                                    itemsPerPageOptions={[10, 20, 50, 100, 200]}
                                    onItemsPerPageChange={handleItemsPerPageChange}
                                    disabled={isFetching}
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <CreateSupplierButton
                                role={user?.role || "admin"}
                                onSuccess={() => refetch()}
                                variant="default"
                                size="sm"
                                className="flex-1"
                                disabled={isFetching}
                            />
                            <Button onClick={handleRefresh} disabled={isFetching} variant="outline" size="sm" className="flex-0">
                                Refresh
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Top pagination & info */}
            {paginationMeta && (
                <div className="space-y-2">
                    {renderItemsInfo()}
                    {renderPagination()}
                </div>
            )}

            {/* Table */}
            <div className="border rounded-lg bg-card" data-table-container>
                <SupplierTable suppliers={suppliers} isLoading={isFetching} highlightId={highlightId} />
            </div>

            {/* Bottom pagination & info */}
            {paginationMeta && (
                <div className="space-y-2">
                    {renderItemsInfo()}
                    {renderPagination()}
                </div>
            )}

            {/* Empty state */}
            {suppliers.length === 0 && !isFetching && (
                <div className="py-10 text-center text-muted-foreground text-sm">No suppliers found.</div>
            )}
        </div>
    );
}
