"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { LayoutProps } from "@/types/layout";
import { useSession } from "@/components/clientSessionProvider";
import { AdminLoading } from "@/components/admin-loading";
import { toast } from "sonner";
import HeaderCard from "@/components/ui/header-card";
import { FileText, CreditCard } from "lucide-react";
import SearchInput from "@/components/shared/SearchInput";
import ItemsPerPageDropdown from "@/components/shared/itemsPerPageDropdown";

import Pagination from "@/components/ui/paginationNew";
import { InvoiceDataTable } from "@/components/invoice/tableData";
import { getInvoices } from "@/lib/action/invoice/invoice";
import { Invoice } from "@/schemas/invoice";
import { getBankAccounts } from "@/lib/action/master/bank/bank";
import { BankAccount } from "@/schemas/bank";
import CreateButtonInvoice from "@/components/invoice/createButtonInvoice";
import { InvoiceStatusFilter } from "@/components/invoice/invoiceFilter";
import { DateFilter } from "@/components/invoice/dateFilter";
import { BranchFilter } from "@/components/invoice/BranchFilter";

interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
    nextPage?: number | null;
    prevPage?: number | null;
}

export default function InvoicePageAdmin() {
    const [invoiceData, setInvoiceData] = useState<Invoice[]>([]);
    const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(null);
    const { user, isLoading: userLoading } = useSession();
    const [isLoading, setIsLoading] = useState(true);
    const [isDataFetching, setIsDataFetching] = useState(false);
    const [banks, setBanks] = useState<BankAccount[]>([]);

    const searchParams = useSearchParams();

    const router = useRouter();

    // Ambil nilai langsung dari URL params
    const urlPage = Number(searchParams.get("page")) || 1;
    const urlPageSize = Number(searchParams.get("pageSize")) || 10;
    const urlSearch = searchParams.get("search") || "";
    const urlStatusFilter = searchParams.get("status") || "all";
    const urlDateFilter = searchParams.get("date") || "all";
    const urlBranchFilter = searchParams.get("branch") || "all";

    // ===============================
    //    FETCH INVOICE DATA - DENGAN FILTER
    // ===============================
    const fetchData = useCallback(async () => {
        if (userLoading) return;
        if (!user || user.role !== "admin") return;

        try {
            setIsDataFetching(true);

            // DEBUG: Pastikan urlDateFilter ada nilainya
            console.log('🔄 fetchData URL parameters:', {
                urlPage,
                urlPageSize,
                urlSearch,
                urlStatusFilter,
                urlDateFilter // Pastikan ini ada nilainya
            });

            const [result, resultBank] = await Promise.all([
                getInvoices(
                    {},
                    urlPage,
                    urlPageSize,
                    urlSearch || undefined,
                    urlStatusFilter !== "all" ? urlStatusFilter : undefined,
                    "createdAt",
                    "desc",
                    urlDateFilter !== "all" ? urlDateFilter : undefined, // Parameter ke-8 untuk date
                    undefined, // customId removed
                    urlBranchFilter !== "all" ? urlBranchFilter : undefined
                ),
                getBankAccounts()
            ]);

            if (result.success) {
                setInvoiceData(result.data);
                setBanks(resultBank || []);

                if (result.pagination) {
                    setPaginationMeta(result.pagination);
                } else {
                    setPaginationMeta({
                        page: urlPage,
                        limit: urlPageSize,
                        total: result.data?.length || 0,
                        pages: Math.ceil((result.data?.length || 0) / urlPageSize)
                    });
                }
            } else {
                toast.error(result.message || "Gagal memuat data invoice");
            }

        } catch (error) {
            console.error("❌ Error fetching invoice data:", error);
            toast.error("Gagal memuat data invoice");
        } finally {
            setIsDataFetching(false);
            setIsLoading(false);
        }
    }, [urlPage, urlPageSize, urlSearch, urlStatusFilter, urlDateFilter, user, userLoading]);

    // ===============================
    //    DATA FETCHING EFFECT
    // ===============================
    useEffect(() => {
        // Cek authentication dan authorization
        if (userLoading) return;

        if (!user) {
            router.replace("/auth/login");
            return;
        }

        if (user.role !== "admin") {
            router.replace("/not-authorized");
            return;
        }

        // Fetch data
        fetchData();
    }, [user, userLoading, fetchData, router, urlPage, urlPageSize, urlSearch, urlStatusFilter, urlDateFilter, urlBranchFilter]);

    // ===============================
    //    HANDLERS
    // ===============================
    const handleStatusFilterChange = useCallback((newStatus: string) => {
        const params = new URLSearchParams(searchParams);

        if (newStatus && newStatus !== "all") {
            params.set("status", newStatus);
        } else {
            params.delete("status");
        }

        params.set("page", "1");

        if (urlSearch) params.set("search", urlSearch);
        if (urlDateFilter !== "all") params.set("date", urlDateFilter);
        if (urlBranchFilter !== "all") params.set("branch", urlBranchFilter);
        if (urlPageSize !== 10) params.set("pageSize", urlPageSize.toString());

        router.push(`?${params.toString()}`);
    }, [searchParams, router, urlSearch, urlDateFilter, urlBranchFilter, urlPageSize]);

    const handleDateFilterChange = useCallback((newDate: string) => {
        const params = new URLSearchParams(searchParams);

        if (newDate && newDate !== "all") {
            params.set("date", newDate);
        } else {
            params.delete("date");
        }

        params.set("page", "1");

        if (urlSearch) params.set("search", urlSearch);
        if (urlStatusFilter !== "all") params.set("status", urlStatusFilter);
        if (urlBranchFilter !== "all") params.set("branch", urlBranchFilter);
        if (urlPageSize !== 10) params.set("pageSize", urlPageSize.toString());

        router.push(`?${params.toString()}`);
    }, [searchParams, router, urlSearch, urlStatusFilter, urlBranchFilter, urlPageSize]);

    const handleBranchFilterChange = useCallback((newBranch: string) => {
        const params = new URLSearchParams(searchParams);

        if (newBranch && newBranch !== "all") {
            params.set("branch", newBranch);
        } else {
            params.delete("branch");
        }

        params.set("page", "1");

        if (urlSearch) params.set("search", urlSearch);
        if (urlStatusFilter !== "all") params.set("status", urlStatusFilter);
        if (urlDateFilter !== "all") params.set("date", urlDateFilter);
        if (urlPageSize !== 10) params.set("pageSize", urlPageSize.toString());

        router.push(`?${params.toString()}`);
    }, [searchParams, router, urlSearch, urlStatusFilter, urlDateFilter, urlPageSize]);

    const handleSearch = useCallback((term: string) => {
        const params = new URLSearchParams(searchParams);

        if (term) {
            params.set("search", term);
        } else {
            params.delete("search");
        }

        params.set("page", "1");

        if (urlStatusFilter !== "all") params.set("status", urlStatusFilter);
        if (urlDateFilter !== "all") params.set("date", urlDateFilter);
        if (urlBranchFilter !== "all") params.set("branch", urlBranchFilter);
        if (urlPageSize !== 10) params.set("pageSize", urlPageSize.toString());

        router.push(`?${params.toString()}`);
    }, [searchParams, router, urlStatusFilter, urlDateFilter, urlBranchFilter, urlPageSize]);

    const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
        const params = new URLSearchParams(searchParams);

        params.set("pageSize", newItemsPerPage.toString());
        params.set("page", "1");

        if (urlSearch) params.set("search", urlSearch);
        if (urlStatusFilter !== "all") params.set("status", urlStatusFilter);
        if (urlDateFilter !== "all") params.set("date", urlDateFilter);
        if (urlBranchFilter !== "all") params.set("branch", urlBranchFilter);

        router.push(`?${params.toString()}`);
    }, [searchParams, router, urlSearch, urlStatusFilter, urlDateFilter, urlBranchFilter]);

    // ===============================
    //    GET AVAILABLE STATUS FOR FILTER
    // ===============================
    const availableStatus = useMemo(() => {
        if (!Array.isArray(invoiceData)) return [];

        const statuses = invoiceData
            .map(invoice => invoice.status)
            .filter((status): status is "DRAFT" | "WAITING_APPROVAL" | "APPROVED" | "REJECTED" | "UNPAID" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELLED" =>
                status !== undefined && status !== null
            );
        return [...new Set(statuses)];
    }, [invoiceData]);

    // ===============================
    //    REFRESH HANDLER
    // ===============================
    const handleRefresh = useCallback(() => {
        fetchData();
    }, [fetchData]);

    // ===============================
    //    SCROLL TO TOP EFFECT
    // ===============================
    useEffect(() => {
        const scrollToTop = () => {
            if (typeof window !== "undefined") {
                window.scrollTo({ top: 0, behavior: "smooth" });

                const tableContainer = document.querySelector(".table-container") ||
                    document.querySelector(".overflow-auto") ||
                    document.querySelector("[data-table-container]");

                if (tableContainer instanceof HTMLElement) {
                    tableContainer.scrollTop = 0;
                }
            }
        };

        const timeout = setTimeout(scrollToTop, 100);
        return () => clearTimeout(timeout);
    }, [urlPage]);

    // ===============================
    //    LOADING & ERROR STATE
    // ===============================
    if (userLoading || isLoading) {
        return <AdminLoading message="Loading invoice data..." />;
    }

    // ===============================
    //    RENDER PAGINATION COMPONENT
    // ===============================
    const renderPagination = () => {
        if (!paginationMeta || paginationMeta.pages <= 1) return null;

        return (
            <div className="flex justify-center">
                <Pagination
                    totalPages={paginationMeta.pages}
                />
            </div>
        );
    };

    // ===============================
    //    RENDER ITEMS INFO COMPONENT  
    // ===============================
    const renderItemsInfo = () => {
        if (!paginationMeta || paginationMeta.total === 0) return null;

        const startItem = (paginationMeta.page - 1) * paginationMeta.limit + 1;
        const endItem = Math.min(paginationMeta.page * paginationMeta.limit, paginationMeta.total);

        return (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-1 border-t pt-3">
                <div className="text-xs md:text-sm text-muted-foreground">
                    Showing {startItem}-{endItem} of {paginationMeta.total} entries
                    {urlSearch && ` (search: "${urlSearch}")`}
                    {(urlStatusFilter !== "all" || urlDateFilter !== "all") && (
                        <span>
                            {urlStatusFilter !== "all" && ` (status: ${urlStatusFilter})`}
                            {urlDateFilter !== "all" && ` (date: ${urlDateFilter})`}
                            {urlBranchFilter !== "all" && ` (branch: ${urlBranchFilter})`}
                        </span>
                    )}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">
                    Page {paginationMeta.page} of {paginationMeta.pages}
                    {` | ${paginationMeta.limit} per page`}
                </div>
            </div>
        );
    };

    // ===============================
    //    RENDER LOADING SKELETON
    // ===============================
    const renderLoadingSkeleton = () => (
        <div className="border rounded-lg bg-card">
            <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                    <div className="h-6 bg-muted rounded w-1/4"></div>
                    <div className="h-9 bg-muted rounded w-24"></div>
                </div>
                {Array.from({ length: urlPageSize }).map((_, index) => (
                    <div key={index} className="flex items-center space-x-4 p-3 border-b">
                        <div className="h-4 bg-muted rounded w-1/6"></div>
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                        <div className="h-4 bg-muted rounded w-1/5"></div>
                        <div className="h-4 bg-muted rounded w-1/6"></div>
                        <div className="h-4 bg-muted rounded w-1/12 ml-auto"></div>
                    </div>
                ))}
            </div>
        </div>
    );

    // ===============================
    //    CURRENT USER HANDLING
    // ===============================
    const currentUser = user ? {
        id: user.id,
        name: user.name || 'Unknown User'
    } : undefined;

    // ===============================
    //    PAGE LAYOUT
    // ===============================
    const layoutProps: LayoutProps = {
        title: "Finance Management",
        role: "admin",
        children: (
            <div className="h-full flex flex-col min-h-0">
                {/* Breadcrumb */}
                <div className="flex-shrink-0">
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
                                <BreadcrumbLink asChild>
                                    <Badge variant="outline">
                                        <BreadcrumbPage>Finance Management</BreadcrumbPage>
                                    </Badge>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <Badge variant="outline">
                                    <BreadcrumbPage>Invoice List</BreadcrumbPage>
                                </Badge>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>

                {/* Konten utama yang bisa scroll */}
                <div className="flex-1 min-h-0 overflow-auto">
                    <div className="space-y-4 p-2 pt-1 md:p-4">
                        {/* HEADER CARD */}
                        <HeaderCard
                            title={
                                <span>
                                    <span className="lg:hidden">Invoice Management</span>
                                    <span className="hidden lg:inline">Invoice Management</span>
                                </span>
                            }
                            description={
                                <span>
                                    <span className="lg:hidden">View all invoice records</span>
                                    <span className="hidden lg:inline">Manage and track all customer invoices and payments</span>
                                </span>
                            }
                            icon={<FileText className="h-5 w-5 lg:h-7 lg:w-7" />}
                            gradientFrom="from-blue-600"
                            gradientTo="to-purple-600"
                            showActionArea={true}
                            actionArea={
                                <div className="hidden lg:flex flex-wrap items-center justify-end gap-2">
                                    <SearchInput
                                        onSearch={handleSearch}
                                        placeholder="Search invoice..."
                                        className="w-72"
                                        disabled={userLoading || isDataFetching}
                                        initialValue={urlSearch}
                                    />
                                    <InvoiceStatusFilter
                                        statusFilter={urlStatusFilter}
                                        onStatusFilterChange={handleStatusFilterChange}
                                        availableStatus={availableStatus}
                                        className="w-36"
                                    />
                                    <DateFilter
                                        dateFilter={urlDateFilter}
                                        onDateFilterChange={handleDateFilterChange}
                                        className="w-36"
                                    />
                                    <BranchFilter
                                        branchFilter={urlBranchFilter}
                                        onBranchFilterChange={handleBranchFilterChange}
                                        className="w-36"
                                    />
                                    <ItemsPerPageDropdown
                                        itemsPerPage={urlPageSize}
                                        itemsPerPageOptions={[10, 20, 50, 100, 200, 300, 400, 500]}
                                        onItemsPerPageChange={handleItemsPerPageChange}
                                        disabled={isDataFetching}
                                    />
                                    <CreateButtonInvoice
                                        role={user?.role || "admin"}
                                        onSuccess={handleRefresh}
                                        variant="default"
                                        size="default"
                                        disabled={isDataFetching}
                                    />
                                </div>
                            }
                        />

                        {/* Action Area untuk Mobile */}
                        <div className="lg:hidden mt-4 p-4 bg-white dark:bg-slate-900 rounded-lg shadow-sm border">
                            <div className="flex flex-col gap-3">
                                <SearchInput
                                    onSearch={handleSearch}
                                    placeholder="Search invoice..."
                                    className="w-full"
                                    disabled={userLoading || isDataFetching}
                                    initialValue={urlSearch}
                                />
                                <InvoiceStatusFilter
                                    statusFilter={urlStatusFilter}
                                    onStatusFilterChange={handleStatusFilterChange}
                                    availableStatus={availableStatus}
                                    className="w-full"
                                />
                                <DateFilter
                                    dateFilter={urlDateFilter}
                                    onDateFilterChange={handleDateFilterChange}
                                    className="w-full"
                                />
                                <ItemsPerPageDropdown
                                    itemsPerPage={urlPageSize}
                                    itemsPerPageOptions={[10, 20, 50, 100, 200, 300, 400, 500]}
                                    onItemsPerPageChange={handleItemsPerPageChange}
                                    disabled={isDataFetching}
                                />
                                <BranchFilter
                                    branchFilter={urlBranchFilter}
                                    onBranchFilterChange={handleBranchFilterChange}
                                    className="w-full"
                                />
                                <CreateButtonInvoice
                                    role={user?.role || "admin"}
                                    onSuccess={handleRefresh}
                                    variant="default"
                                    size="sm"
                                    disabled={isDataFetching}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* TOP PAGINATION & ITEMS INFO */}
                        {paginationMeta && paginationMeta.pages > 1 && (
                            <div className="space-y-3">
                                {renderItemsInfo()}
                                {renderPagination()}
                            </div>
                        )}

                        {/* TABLE */}
                        {isDataFetching ? (
                            renderLoadingSkeleton()
                        ) : (
                            <div className="border rounded-lg bg-card" data-table-container>
                                <InvoiceDataTable
                                    invoiceData={invoiceData}
                                    isLoading={false}
                                    role={user?.role}
                                    banks={banks}
                                    currentUser={currentUser}
                                    onRefresh={handleRefresh} // ✅ Pass refresh callback
                                />
                            </div>
                        )}

                        {/* BOTTOM PAGINATION & ITEMS INFO */}
                        {paginationMeta && paginationMeta.pages > 1 && (
                            <div className="space-y-3">
                                {renderItemsInfo()}
                                {renderPagination()}
                            </div>
                        )}

                        {/* EMPTY STATE */}
                        {invoiceData.length === 0 && !isDataFetching && (
                            <div className="text-center py-12 border rounded-lg bg-muted/20">
                                <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium text-muted-foreground">No invoices found</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {urlSearch
                                        ? `No invoices found for "${urlSearch}"`
                                        : urlStatusFilter !== "all" || urlDateFilter !== "all" || urlBranchFilter !== "all"
                                            ? `No invoices found with current filters`
                                            : "No invoice data available"
                                    }
                                </p>
                                <CreateButtonInvoice
                                    role={user?.role || "admin"}
                                    onSuccess={handleRefresh}
                                    variant="default"
                                    size="sm"
                                    className="mt-4"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        ),
    };

    return <AdminLayout {...layoutProps} />;
}