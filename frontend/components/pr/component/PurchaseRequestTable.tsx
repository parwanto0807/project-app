"use client";

import React, { useState, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { PurchaseRequestTableProps } from "./types";
import { TableHeader } from "./sub-components/TableHeader";
import { DesktopTableView } from "./sub-components/DesktopTableView";
import { MobileCardView } from "./sub-components/MobileCardView";
import { Pagination } from "./sub-components/Pagination";
import SimplePurchaseRequestPdfDialog from "../prPdfDialog";
import { PurchaseRequestDetailSheet } from "../detailSheetPr";
import { ShoppingBagIcon } from "lucide-react";
import { deletePurchaseRequest, updatePurchaseRequestStatus } from "@/lib/action/pr/pr";
import { PRStatus, PurchaseRequestWithRelations } from "@/types/pr";
import { Button } from "@/components/ui/button";
import CreateButtonPR from "./sub-components/createButtonPr";
import HeaderCard from "@/components/ui/header-card";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useSession } from "@/components/clientSessionProvider";

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
    } = props;

    // State untuk dialogs
    const [selectedPurchaseRequest, setSelectedPurchaseRequest] = useState<PurchaseRequestWithRelations | null>(null);
    const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
    const [selectedPR, setSelectedPR] = useState<PurchaseRequestWithRelations | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const isMobile = useMediaQuery("(max-width: 768px)");
    const { user, isLoading: userLoading } = useSession();

    const urlPage = Number(searchParams.get("page")) || 1;
    const urlPageSize = Number(searchParams.get("limit")) || 10;
    const urlSearch = searchParams.get("search") || "";
    const urlFilter = searchParams.get("filter") || "on-progress";
    const urlStatus = searchParams.get("status") || "";
    const urlProject = searchParams.get("projectId") || "";
    const highlightId = searchParams.get("highlightId") || "";


    // Ambil nilai langsung dari URL params
    const query = new URLSearchParams({
        page: String(urlPage),
        limit: String(urlPageSize),
        search: urlSearch,
        filter: urlFilter,
        status: urlStatus,
        projectId: urlProject,
    }).toString();


    // DEBUG: Log loading states
    console.log('🔍 PurchaseRequestTable Debug:');
    console.log('   - isLoading:', isLoading);
    console.log('   - userLoading:', userLoading);
    console.log('   - isError:', isError);
    console.log('   - data length:', purchaseRequests.length);

    // Fungsi untuk update URL
    const updateURL = (updates: Record<string, string | undefined>) => {
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

        router.push(`?${params.toString()}`, { scroll: false });
    };

    // Handler functions
    const handleSearchChange = (search: string) => {
        updateURL({ search });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
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
        updateURL({ page: page.toString() });
    };

    const handleLimitChange = (limit: number) => {
        updateURL({ limit: limit.toString(), page: "1" });
    };

    const handleClearFilters = () => {
        router.push("?", { scroll: false });
        setShowFilters(false);
    };

    const handleClearDateFilters = () => {
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
    const isCreateButtonDisabled = isLoading || userLoading;

    const getSerialNumber = (index: number) => {
        return (pagination.page - 1) * pagination.limit + index + 1;
    };

    // Highlight effect
    React.useEffect(() => {
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

        // Delay kecil supaya DOM siap
        const scrollTimer = setTimeout(() => {
            highlightElement.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "nearest"
            });
        }, SCROLL_DELAY);

        // Tambahkan highlight animasi
        highlightElement.classList.add(...ANIMATION_CLASSES);

        // Hapus highlight + bersihkan URL
        const cleanupTimer = setTimeout(() => {
            highlightElement.classList.remove(...ANIMATION_CLASSES);

            // Tambahkan sedikit smoothing setelah animasi
            highlightElement.classList.add("transition-colors", "duration-300");

            // Hapus highlightId dari URL tanpa reload
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
                title={isMobile ? "PR" : "Purchase Request Management"}
                description={
                    isMobile ? "View all PR records" : "Manage and monitor all purchase requests"
                }
                icon={<ShoppingBagIcon className={isMobile ? "h-5 w-5" : "h-7 w-7"} />}
                showActionArea={!isMobile}
                actionArea={
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
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
                                isDataFetching={isLoading}
                            />

                            <CreateButtonPR
                                role={user?.role || "admin"}
                                onSuccess={handleRefresh}
                                variant="default"
                                size={isMobile ? "sm" : "default"}
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

            {/* Konten Utama */}
            <Card className="w-full">
                <CardContent className="p-1 sm:px-4 relative">

                    {/* Tampilkan Pagination di atas */}
                    {!isLoading && purchaseRequests.length > 0 && (
                        <Pagination
                            pagination={pagination}
                            totalPages={Math.ceil(pagination.totalCount / pagination.limit)}
                            onPageChange={handlePageChange}
                            onLimitChange={handleLimitChange}
                        />
                    )}

                    {/* Desktop Table */}
                    <div className="hidden lg:block rounded-md border mt-4">
                        <DesktopTableView
                            purchaseRequests={purchaseRequests}
                            isLoading={isLoading}
                            expandedRows={new Set()}
                            role={role}
                            isDeleting={isDeleting}
                            onToggleRowExpansion={() => { }}
                            onViewDetail={handleViewDetail}
                            onViewPdf={handleViewPdf}
                            onCreateLpp={(id) => router.push(`/admin-area/logistic/lpp/create/${id}`)}
                            onEdit={(pr) =>
                                router.push(`/admin-area/logistic/pr/update/${pr.id}?highlightId=${pr.id}&${query}`)
                            }
                            onDelete={handleDelete}
                            getSerialNumber={getSerialNumber}
                        />
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden space-y-3 mt-4">
                        <MobileCardView
                            purchaseRequests={purchaseRequests}
                            isLoading={isLoading}
                            expandedRows={new Set()}
                            role={role}
                            isDeleting={isDeleting}
                            hasActiveFilters={!!(currentSearch || currentStatus || currentProjectId || currentDateFrom)}
                            onToggleRowExpansion={() => { }}
                            onViewPdf={handleViewPdf}
                            onEdit={(pr) =>
                                router.push(`/admin-area/logistic/pr/update/${pr.id}?highlightId=${pr.id}&${query}`)
                            }
                            onDelete={handleDelete}
                        />
                    </div>

                    {/* Pagination Bawah */}
                    {!isLoading && purchaseRequests.length > 0 && (
                        <Pagination
                            pagination={pagination}
                            totalPages={Math.ceil(pagination.totalCount / pagination.limit)}
                            onPageChange={handlePageChange}
                            onLimitChange={handleLimitChange}
                        />
                    )}

                    {/* Tampilkan loading session di mobile */}
                    {isMobile && userLoading && (
                        <div className="text-center text-sm text-gray-500 py-2">
                            Loading user session...
                        </div>
                    )}

                    {/* Tampilkan pesan No Records */}
                    {!isLoading && purchaseRequests.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500 dark:text-gray-400">
                            <ShoppingBagIcon className="h-10 w-10 mb-3 text-gray-300 dark:text-gray-600" />
                            <p className="font-semibold">No Purchase Requests Found</p>
                            <p className="text-sm">Adjust your filters or create a new request.</p>
                        </div>
                    )}
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
        </>
    );
}