"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { PurchaseRequestTableProps } from "./types";
import { TableHeader } from "./sub-components/TableHeader";
import { DesktopTableView } from "./sub-components/DesktopTableView";
import { MobileCardView } from "./sub-components/MobileCardView";
import { Pagination } from "./sub-components/Pagination";
import SimplePurchaseRequestPdfDialog from "../prPdfDialog";
import { PurchaseRequestDetailSheet } from "../detailSheetPr";
import { ActionButtons } from "./sub-components/actionButtons";
import { SettleBudgetDialog } from "./sub-components/SettleBudgetDialog";
import { ShoppingBagIcon } from "lucide-react";
import { deletePurchaseRequest, updatePurchaseRequestStatus } from "@/lib/action/pr/pr";
import { PRStatus, PurchaseRequestWithRelations } from "@/types/pr";
import { Button } from "@/components/ui/button";
import CreateButtonPR from "./sub-components/createButtonPr";
import HeaderCard from "@/components/ui/header-card";
import { useSession } from "@/components/clientSessionProvider";

function getBaseEditPath(role?: string) {
    const paths: Record<string, string> = {
        super: "/super-admin-area/logistic/lpp/edit/",
        pic: "/pic-area/logistic/lpp/edit/",
        admin: "/admin-area/logistic/lpp/edit/",
    }
    return paths[role ?? "admin"] || "/admin-area/logistic/lpp/edit/" // ✅ Perbaiki default path
}

function getBaseCreatePath(role?: string) {
    const paths: Record<string, string> = {
        super: "/super-admin-area/logistic/lpp/create/",
        pic: "/pic-area/logistic/lpp/create/",
        admin: "/admin-area/logistic/lpp/create/",
    }
    return paths[role ?? "admin"] || "/admin-area/logistic/lpp/create/" // ✅ Perbaiki default path
}

function getBaseEditPrPath(role?: string) {
    const paths: Record<string, string> = {
        super: "/super-admin-area/logistic/pr/update/",
        pic: "/pic-area/logistic/pr/update/",
        admin: "/admin-area/logistic/pr/update/",
    }
    return paths[role ?? "admin"] || "/admin-area/logistic/pr/update/"
}

export function PurchaseRequestTable(props: PurchaseRequestTableProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const {
        purchaseRequests,
        isLoading,
        isError,
        role,
        pagination,
        currentSearch = "",
        currentStatus,
        currentProjectId,
        currentDateFrom,
        currentDateTo,
        currentTab = "umum",
    } = props;

    // State untuk dialogs
    const [selectedPurchaseRequest, setSelectedPurchaseRequest] = useState<PurchaseRequestWithRelations | null>(null);
    const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
    const [selectedPR, setSelectedPR] = useState<PurchaseRequestWithRelations | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [isChangingPage, setIsChangingPage] = useState(false);
    const [settleDialogOpen, setSettleDialogOpen] = useState(false);
    const [settlePr, setSettlePr] = useState<PurchaseRequestWithRelations | null>(null);
    const { user, isLoading: userLoading } = useSession();

    const urlPage = Number(searchParams.get("page")) || 1;
    const urlPageSize = Number(searchParams.get("limit")) || 10;
    const urlSearch = searchParams.get("search") || "";
    const urlFilter = searchParams.get("filter") || "on-progress";
    const urlStatus = searchParams.get("status") || "";
    const urlProject = searchParams.get("projectId") || "";
    const highlightId = searchParams.get("highlightId") || "";

    // Track perubahan search params untuk detect navigation
    const [prevSearchParams, setPrevSearchParams] = useState(searchParams.toString());

    // Reset isChangingPage ketika data berhasil dimuat
    useEffect(() => {
        if (!isLoading) {
            const currentParams = searchParams.toString();
            if (currentParams !== prevSearchParams) {
                setIsChangingPage(false);
                setPrevSearchParams(currentParams);
            }
        }
    }, [isLoading, searchParams, prevSearchParams]);

    // Fallback: reset loading state setelah timeout
    useEffect(() => {
        if (isChangingPage) {
            const timeout = setTimeout(() => {
                setIsChangingPage(false);
            }, 3000);
            return () => clearTimeout(timeout);
        }
    }, [isChangingPage]);

    // Fungsi untuk update URL dengan loading state
    const updateURL = (updates: Record<string, string | undefined>) => {
        setIsChangingPage(true);
        const params = new URLSearchParams(searchParams.toString());

        Object.entries(updates).forEach(([key, value]) => {
            if (value === undefined || value === "") {
                params.delete(key);
            } else {
                params.set(key, value);
            }
        });

        if (Object.keys(updates).some(key => key !== "page")) {
            params.set("page", "1");
        }

        router.push(`?${params.toString()}`);
    };

    // Handler functions dengan loading state
    const handleSearchChange = async (search: string) => {
        // Wrap dalam Promise untuk memastikan SearchInput's await selesai
        return new Promise<void>((resolve) => {
            updateURL({ search });
            // Resolve immediately setelah URL update
            resolve();
        });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
    };

    const handleTabChange = (tab: "all" | "umum" | "project") => {
        updateURL({ tab, page: "1", search: "" });
    };

    const handlePrNumberSearch = (tab: "umum" | "project", search: string) => {
        updateURL({ tab, search, page: "1" });
    };

    const handleStatusFilterChange = (status: PRStatus | undefined) => {
        updateURL({ status: status || undefined });
    };

    const handleProjectFilterChange = (projectId: string) => {
        updateURL({ projectId });
    };

    const handleDateFilterChange = (dateFrom?: Date, dateTo?: Date) => {
        updateURL({
            dateFrom: dateFrom?.toISOString(),
            dateTo: dateTo?.toISOString()
        });
    };

    const handlePageChange = (page: number) => {
        if (isChangingPage) return;
        updateURL({ page: page.toString() });
    };

    const handleLimitChange = (limit: number) => {
        if (isChangingPage) return;
        updateURL({ limit: limit.toString(), page: "1" });
    };

    const handleClearFilters = () => {
        if (isChangingPage) return;
        setIsChangingPage(true);
        router.push("?");
        setShowFilters(false);
    };

    const handleClearDateFilters = () => {
        if (isChangingPage) return;
        handleDateFilterChange(undefined, undefined);
    };

    const handleDateFilterApply = () => {
        setShowFilters(false);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this purchase request?")) {
            setIsDeleting(true);
            try {
                await deletePurchaseRequest(id);
                router.refresh();
            } catch (error) {
                console.error("Failed to delete purchase request:", error);
            } finally {
                setIsDeleting(false);
            }
        }
    };

    const handleStatusUpdate = async (id: string, status: string) => {
        try {
            const validStatuses = ["DRAFT", "REVISION_NEEDED", "SUBMITTED", "APPROVED", "REJECTED", "COMPLETED"];
            if (!validStatuses.includes(status)) {
                console.error(`Invalid status: ${status}`);
                return;
            }

            await updatePurchaseRequestStatus(id, { status: status as PRStatus });
            router.refresh();
            setDetailOpen(false);
        } catch (error) {
            console.error("Failed to update purchase request status:", error);
        }
    };

    const handleViewDetail = (pr: PurchaseRequestWithRelations) => {
        setSelectedPR(pr);
        setDetailOpen(true);
    };

    const handleViewPdf = (pr: PurchaseRequestWithRelations) => {
        setSelectedPurchaseRequest(pr);
        setPdfDialogOpen(true);
    };

    const handleSettleBudget = (prId: string) => {
        const pr = purchaseRequests.find(p => p.id === prId);
        if (pr) {
            setSettlePr(pr);
            setSettleDialogOpen(true);
        }
    };

    const handleRefresh = () => {
        if (!userLoading) {
            router.refresh();
        }
    };

    // Extract unique projects
    const projects = useMemo(() =>
        Array.from(new Map(
            purchaseRequests
                .filter(pr => pr.project?.name)
                .map(pr => [pr.projectId, {
                    id: pr.projectId,
                    name: pr.project?.name || pr.projectId
                }])
        ).values()),
        [purchaseRequests]
    );

    const localDateFrom = currentDateFrom?.toISOString().split('T')[0] || "";
    const localDateTo = currentDateTo?.toISOString().split('T')[0] || "";
    const isCreateButtonDisabled = isLoading || userLoading || isChangingPage;

    const getSerialNumber = (index: number) => {
        return (pagination.page - 1) * pagination.limit + index + 1;
    };

    const handleCreateLpp = (id: string) => {
        if (isChangingPage) return;

        const pr = purchaseRequests?.find(pr => pr.id === id);

        if (!pr) {
            console.warn("Purchase Request tidak ditemukan");
            return;
        }

        const allDetails = pr.uangMuka?.flatMap(um =>
            um.pertanggungjawaban?.flatMap(pj =>
                pj.details ?? []
            ) ?? []
        ) ?? [];

        const hasDetails = allDetails.length;

        const userRole = role;

        // Ambil semua query URL saat ini
        const query = new URLSearchParams({
            page: String(urlPage),
            limit: String(urlPageSize),
            search: urlSearch,
            filter: urlFilter,
            status: urlStatus,
            projectId: urlProject,
        }).toString();

        const appendQuery = query ? `?${query}` : "";

        if (hasDetails === 0) {
            const createPath = getBaseCreatePath(userRole);
            router.push(`${createPath}${id}${appendQuery}&highlightId=${pr.id}`);
        } else {
            const editPath = getBaseEditPath(userRole);
            router.push(`${editPath}${id}${appendQuery}&highlightId=${pr.id}`);
        }
    };

    // Highlight effect
    useEffect(() => {
        if (!highlightId) return;

        const highlightElement = rowRefs.current[highlightId];
        if (!highlightElement) return;

        const SCROLL_DELAY = 300;
        const HIGHLIGHT_DURATION = 5000;
        const ANIMATION_CLASSES = [
            "bg-yellow-200",
            "dark:bg-yellow-900",
            "animate-pulse",
            "ring-2",
            "ring-yellow-400",
            "ring-offset-2",
            "transition-all",
            "duration-500"
        ];

        const scrollTimer = setTimeout(() => {
            highlightElement.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "nearest"
            });
        }, SCROLL_DELAY);

        highlightElement.classList.add(...ANIMATION_CLASSES);

        const cleanupTimer = setTimeout(() => {
            highlightElement.classList.remove(...ANIMATION_CLASSES);
            highlightElement.classList.add("transition-colors", "duration-300");

            const params = new URLSearchParams(window.location.search);
            params.delete("highlightId");
            const newUrl = params.toString()
                ? `${window.location.pathname}?${params.toString()}`
                : window.location.pathname;

            window.history.replaceState({}, "", newUrl);
        }, HIGHLIGHT_DURATION);

        return () => {
            clearTimeout(scrollTimer);
            clearTimeout(cleanupTimer);
            highlightElement.classList.remove(...ANIMATION_CLASSES);
        };
    }, [highlightId]);

    // Tampilkan skeleton loading ketika data sedang loading atau ganti halaman
    const showSkeleton = isLoading || isChangingPage;

    if (isError) {
        return (
            <div className="w-full">
                <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-4 sm:p-6 rounded-lg mb-4">
                    <h1 className="text-xl sm:text-2xl font-bold">Purchase Requests</h1>
                    <p className="text-blue-100 mt-1 text-sm sm:text-base">
                        {role === "admin"
                            ? "Manage and track all purchase requests"
                            : "View and manage your purchase requests"}
                    </p>
                </div>

                <Card className="w-full">
                    <CardContent className="p-8">
                        <div className="flex flex-col items-center justify-center text-center">
                            <div className="text-red-500 text-lg font-semibold mb-2">
                                Failed to load purchase requests
                            </div>
                            <p className="text-gray-600 mb-4">
                                There was an error loading the purchase requests data.
                            </p>
                            <Button
                                onClick={() => router.refresh()}
                                variant="outline"
                                disabled={userLoading}
                            >
                                {userLoading ? "Loading..." : "Try Again"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <>
            {/* Header dengan Gradient */}
            <HeaderCard
                title={
                    <span>
                        <span className="md:hidden">PR</span>
                        <span className="hidden md:inline">Purchase Request Management</span>
                    </span>
                }
                description={
                    <span>
                        <span className="md:hidden">View all PR records</span>
                        <span className="hidden md:inline">Manage and monitor all purchase requests</span>
                    </span>
                }
                gradientFrom="from-blue-600"
                gradientTo="to-violet-500"
                icon={<ShoppingBagIcon className="h-5 w-5 md:h-7 md:w-7" />}
                showActionArea={true}
                actionArea={
                    <div className="hidden lg:flex flex-row gap-3 items-center w-full sm:w-auto">
                        <div className="flex flex-row gap-3 w-full sm:w-auto items-center">
                            <TableHeader
                                searchInput={currentSearch}
                                showFilters={showFilters}
                                localDateFrom={localDateFrom}
                                localDateTo={localDateTo}
                                currentStatus={currentStatus}
                                currentProjectId={currentProjectId}
                                projects={projects}
                                onSearchSubmit={handleSearchSubmit}
                                onSearchChange={handleSearchChange}
                                onShowFiltersChange={setShowFilters}
                                onLocalDateFromChange={(date) => {
                                    const dateFrom = date ? new Date(date) : undefined;
                                    handleDateFilterChange(dateFrom, currentDateTo);
                                }}
                                onLocalDateToChange={(date) => {
                                    const dateTo = date ? new Date(date) : undefined;
                                    handleDateFilterChange(currentDateFrom, dateTo);
                                }}
                                onStatusFilterChange={handleStatusFilterChange}
                                onProjectFilterChange={handleProjectFilterChange}
                                onDateFilterApply={handleDateFilterApply}
                                onClearDateFilters={handleClearDateFilters}
                                onClearFilters={handleClearFilters}
                                userLoading={userLoading}
                                isDataFetching={showSkeleton}
                            />

                            <CreateButtonPR
                                role={user?.role || "admin"}
                                onSuccess={handleRefresh}
                                variant="default"
                                size="default"
                                disabled={isCreateButtonDisabled}
                            />
                        </div>
                        {userLoading && (
                            <div className="text-xs text-gray-500 flex items-center">
                                Loading user session...
                            </div>
                        )}
                    </div>
                }
            />

            {/* Mobile Action Area */}
            <div className="lg:hidden mt-4 p-4 bg-white dark:bg-slate-900 rounded-lg shadow-sm border">
                <div className="flex flex-col gap-3">
                    <TableHeader
                        searchInput={currentSearch}
                        showFilters={showFilters}
                        localDateFrom={localDateFrom}
                        localDateTo={localDateTo}
                        currentStatus={currentStatus}
                        currentProjectId={currentProjectId}
                        projects={projects}
                        onSearchSubmit={handleSearchSubmit}
                        onSearchChange={handleSearchChange}
                        onShowFiltersChange={setShowFilters}
                        onLocalDateFromChange={(date) => {
                            const dateFrom = date ? new Date(date) : undefined;
                            handleDateFilterChange(dateFrom, currentDateTo);
                        }}
                        onLocalDateToChange={(date) => {
                            const dateTo = date ? new Date(date) : undefined;
                            handleDateFilterChange(currentDateFrom, dateTo);
                        }}
                        onStatusFilterChange={handleStatusFilterChange}
                        onProjectFilterChange={handleProjectFilterChange}
                        onDateFilterApply={handleDateFilterApply}
                        onClearDateFilters={handleClearDateFilters}
                        onClearFilters={handleClearFilters}
                        userLoading={userLoading}
                        isDataFetching={showSkeleton}
                    />

                    <CreateButtonPR
                        role={user?.role || "admin"}
                        onSuccess={handleRefresh}
                        variant="default"
                        size="sm"
                        disabled={isCreateButtonDisabled}
                        className="w-full"
                    />
                </div>
            </div>

            {/* Konten Utama */}
            <Card className="w-full">
                <CardContent className="p-1 sm:px-4 relative">

                    {/* Tampilkan Pagination di atas */}
                    {!showSkeleton && purchaseRequests.length > 0 && (
                        <Pagination
                            pagination={pagination}
                            totalPages={Math.ceil(pagination.totalCount / pagination.limit)}
                            onPageChange={handlePageChange}
                            onLimitChange={handleLimitChange}
                        />
                    )}

                    {/* ✅ HAPUS CONDITIONAL RENDERING SKELETON - Biarkan DesktopTableView handle */}

                    {/* Desktop Table - SELALU RENDER, biarkan component internal handle skeleton */}
                    <div className="hidden lg:block rounded-md border mt-4">
                        <DesktopTableView
                            purchaseRequests={purchaseRequests}
                            isLoading={false}
                            expandedRows={new Set()}
                            role={role}
                            isDeleting={isDeleting}
                            onToggleRowExpansion={() => { }}
                            onViewDetail={handleViewDetail}
                            onViewPdf={handleViewPdf}
                            onCreateLpp={handleCreateLpp}
                            enableTabFilter={true} // Aktifkan tab filter
                            activeTab={currentTab} // Sinkronkan dengan URL
                            onTabChange={handleTabChange} // Update URL saat tab berubah
                            onPrNumberSearch={handlePrNumberSearch} // Update URL saat PR Number diklik
                            onEdit={(pr) => {
                                const query = new URLSearchParams({
                                    page: String(urlPage),
                                    limit: String(urlPageSize),
                                    search: urlSearch,
                                    filter: urlFilter,
                                    status: urlStatus,
                                    projectId: urlProject,
                                    tab: currentTab,
                                }).toString();
                                const basePath = getBaseEditPrPath(role);
                                router.push(`${basePath}${pr.id}?highlightId=${pr.id}&${query}`);
                            }}
                            onDelete={handleDelete}
                            getSerialNumber={getSerialNumber}
                            showSkeleton={showSkeleton} // ✅ Biarkan DesktopTableView handle
                            skeletonRows={pagination.limit}
                            counts={pagination.counts}
                            onSettleBudget={handleSettleBudget}
                        />
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden mt-4 w-full">
                        <MobileCardView
                            purchaseRequests={purchaseRequests}
                            isLoading={false}
                            expandedRows={new Set()}
                            role={role}
                            isDeleting={isDeleting}
                            hasActiveFilters={!!(currentSearch || currentStatus || currentProjectId || currentDateFrom)}
                            onToggleRowExpansion={() => { }}
                            onViewPdf={handleViewPdf}
                            onEdit={(pr) => {
                                const query = new URLSearchParams({
                                    page: String(urlPage),
                                    limit: String(urlPageSize),
                                    search: urlSearch,
                                    filter: urlFilter,
                                    status: urlStatus,
                                    projectId: urlProject,
                                }).toString();
                                const basePath = getBaseEditPrPath(role);
                                router.push(`${basePath}${pr.id}?highlightId=${pr.id}&${query}`);
                            }}
                            onDelete={handleDelete}
                        />
                    </div>

                    {/* Pagination Bawah */}
                    {!showSkeleton && purchaseRequests.length > 0 && (
                        <Pagination
                            pagination={pagination}
                            totalPages={Math.ceil(pagination.totalCount / pagination.limit)}
                            onPageChange={handlePageChange}
                            onLimitChange={handleLimitChange}
                        />
                    )}

                    {/* Tampilkan pesan No Records */}
                    {/* {!showSkeleton && purchaseRequests.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500 dark:text-gray-400">
                            <ShoppingBagIcon className="h-10 w-10 mb-3 text-gray-300 dark:text-gray-600" />
                            <p className="font-semibold">No Purchase Requests Found</p>
                            <p className="text-sm">Adjust your filters or create a new request.</p>
                        </div>
                    )} */}
                </CardContent>
            </Card>

            {/* Dialogs */}
            <SimplePurchaseRequestPdfDialog
                purchaseRequest={selectedPurchaseRequest}
                open={pdfDialogOpen}
                onOpenChange={setPdfDialogOpen}
            />

            <PurchaseRequestDetailSheet
                open={detailOpen}
                onOpenChange={setDetailOpen}
                data={selectedPR}
                onStatusUpdate={handleStatusUpdate}
            />

            <SettleBudgetDialog
                open={settleDialogOpen}
                onOpenChange={setSettleDialogOpen}
                pr={settlePr}
                onSuccess={handleRefresh}
            />
        </>
    );
}