"use client";

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
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { LayoutProps } from "@/types/layout";
import { QuotationTable } from "@/components/sales/quotation/tableData";
import { useDeleteQuotation, useQuotations } from "@/hooks/use-quotation";
import { useCallback, useEffect, useState } from "react";
import { AdminLoading } from "@/components/admin-loading";
import SearchInput from "@/components/shared/SearchInput";
import HeaderCard from "@/components/ui/header-card";
import { MessageSquareQuoteIcon } from "lucide-react";
import CreateQuotationButton from "@/components/sales/quotation/createQuotationButton";
import { useSession } from "@/components/clientSessionProvider";
import ItemsPerPageDropdown from "@/components/shared/itemsPerPageDropdown";
import StatusFilterDropdown from "@/components/sales/quotation/statusFilterDropdown";
import { quotationStatusSchema } from "@/schemas/quotation";
import z from "zod";
import Pagination from "@/components/ui/paginationNew";

const quotationStatusConfig = {
  DRAFT: { label: "Draft", className: "bg-gray-400" },
  SENT: { label: "Sent", className: "bg-blue-400" },
  REVIEW: { label: "Review", className: "bg-yellow-400" },
  APPROVED: { label: "Approved", className: "bg-green-400" },
  REJECTED: { label: "Rejected", className: "bg-red-400" },
  EXPIRED: { label: "Expired", className: "bg-orange-400" },
  CANCELLED: { label: "Cancelled", className: "bg-gray-600" },
};

type QuotationStatus = z.infer<typeof quotationStatusSchema>;

export default function QuotationPageAdmin() {
  const { user, isLoading: userLoading } = useSession();
  const { mutate: deleteQuotation, isPending } = useDeleteQuotation();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Ambil nilai dari query params
  const urlPage = Number(searchParams.get("page")) || 1;
  const urlPageSize = Number(searchParams.get("pageSize")) || 10;
  const urlSearch = searchParams.get("search") || "";
  const urlStatusFilter = (searchParams.get("statusFilter") as QuotationStatus | "ALL") || "ALL";
  const highlightId = searchParams.get("highlightId") || null;

  // ===============================
  //    STATE MANAGEMENT
  // ===============================
  const [itemsPerPage, setItemsPerPage] = useState<number>(urlPageSize);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Sync itemsPerPage dengan URL parameter
  useEffect(() => {
    setItemsPerPage(urlPageSize);
  }, [urlPageSize]);

  // ===============================
  //    FETCH QUOTATION DATA
  // ===============================
  const {
    data: quotationsResponse,
    isLoading,
    isError,
    error,
    isFetching: isDataFetching
  } = useQuotations({
    page: urlPage,
    pageSize: itemsPerPage,
    searchTerm: urlSearch,
    statusFilter: urlStatusFilter,
    refreshTrigger,
  });

  const quotations = quotationsResponse?.data || [];
  const paginationMeta = quotationsResponse?.pagination;

  // ===============================
  //    SEARCH HANDLER
  // ===============================
  const handleSearch = useCallback((term: string) => {
    const params = new URLSearchParams(searchParams);

    if (term) {
      params.set("search", term);
    } else {
      params.delete("search");
    }

    // Reset ke page 1 ketika search berubah
    params.set("page", "1");

    router.push(`?${params.toString()}`);
  }, [searchParams, router]);

  // ===============================
  //    STATUS FILTER HANDLER
  // ===============================
  const handleStatusFilterChange = useCallback((status: QuotationStatus | "ALL") => {
    const params = new URLSearchParams(searchParams);

    if (status && status !== "ALL") {
      params.set("statusFilter", status);
    } else {
      params.delete("statusFilter");
    }

    params.set("page", "1");
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  // ===============================
  //    ITEMS PER PAGE HANDLER
  // ===============================
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("pageSize", newItemsPerPage.toString());
    params.set("page", "1"); // Reset ke page 1 ketika mengubah items per page

    router.push(`?${params.toString()}`);
  };


  // ===============================
  //    REFRESH HANDLER
  // ===============================
  const handleRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // ===============================
  //    SCROLL TO TOP EFFECT
  // ===============================
  useEffect(() => {
    const scrollToTop = () => {
      if (typeof window !== "undefined") {
        // Scroll window ke atas
        window.scrollTo({ top: 0, behavior: "smooth" });

        // Scroll container table jika ada
        const tableContainer = document.querySelector(".table-container") ||
          document.querySelector(".overflow-auto") ||
          document.querySelector("[data-table-container]");

        if (tableContainer instanceof HTMLElement) {
          tableContainer.scrollTop = 0;
        }
      }
    };

    // Delay sedikit untuk memastikan render selesai
    const timeout = setTimeout(scrollToTop, 100);
    return () => clearTimeout(timeout);
  }, [urlPage, itemsPerPage, urlSearch, urlStatusFilter]);

  // ===============================
  //    AUTH CHECK
  // ===============================
  useEffect(() => {
    if (userLoading) return;

    if (!user) {
      router.replace("/auth/login");
      return;
    }

    if (user.role !== "admin") {
      router.replace("/not-authorized");
      return;
    }
  }, [userLoading, user, router]);

  // ===============================
  //    LOADING & ERROR STATE
  // ===============================
  if (userLoading || isLoading) {
    return <AdminLoading message="Loading quotations..." />;
  }

  if (isError) {
    return (
      <AdminLayout title="Quotation Management" role="admin">
        <div className="p-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h3 className="text-red-800 font-medium">Error loading quotations</h3>
            <p className="text-red-700 text-sm mt-1">
              {error?.message || "Failed to load quotations"}
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // ===============================
  //    RENDER PAGINATION COMPONENT
  // ===============================
  const renderPagination = () => {
    if (!paginationMeta || paginationMeta.totalCount <= paginationMeta.pageSize) return null;

    return (
      <div className="flex justify-center">
        <Pagination
          totalPages={paginationMeta.totalPages}
        />
      </div>
    );
  };

  // ===============================
  //    RENDER ITEMS INFO COMPONENT
  // ===============================
  const renderItemsInfo = () => {
    if (!paginationMeta || paginationMeta.totalCount === 0) return null;

    const startItem = (paginationMeta.currentPage - 1) * paginationMeta.pageSize + 1;
    const endItem = Math.min(paginationMeta.currentPage * paginationMeta.pageSize, paginationMeta.totalCount);

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-1 border-t pt-3">
        <div className="text-xs md:text-sm text-muted-foreground">
          Showing {startItem}-{endItem} of {paginationMeta.totalCount} entries
          {urlStatusFilter !== "ALL" &&
            ` (filtered by ${quotationStatusConfig[urlStatusFilter as QuotationStatus]?.label || urlStatusFilter})`}
          {urlSearch && ` (search: "${urlSearch}")`}
        </div>
      </div>
    );
  };


  // ===============================
  //    RENDER LOADING SKELETON FOR SUBSEQUENT FETCHES
  // ===============================
  const renderLoadingSkeleton = () => (
    <div className="border rounded-lg bg-card">
      <div className="p-4 space-y-3">
        {/* Skeleton untuk header table */}
        <div className="flex justify-between items-center">
          <div className="h-6 bg-muted rounded w-1/4"></div>
          <div className="h-9 bg-muted rounded w-24"></div>
        </div>

        {/* Skeleton untuk rows */}
        {Array.from({ length: 5 }).map((_, index) => (
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
  //    PAGE LAYOUT
  // ===============================
  const layoutProps: LayoutProps = {
    title: "Quotation Management",
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
                  <Badge variant="outline">Sales Management</Badge>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <Badge variant="outline">
                  <BreadcrumbPage>Quotation List</BreadcrumbPage>
                </Badge>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Konten utama yang bisa scroll */}
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="space-y-4 p-2 pt-1 md:p-4">
            {/* HEADER CARD */}
            <>
              <HeaderCard
                title={
                  <span>
                    <span className="md:hidden">Quotations</span>
                    <span className="hidden md:inline">Quotation Management</span>
                  </span>
                }
                description={
                  <span>
                    <span className="md:hidden">View all quotation records</span>
                    <span className="hidden md:inline">Manage and monitor all quotations</span>
                  </span>
                }
                icon={<MessageSquareQuoteIcon className="h-5 w-5 md:h-7 md:w-7" />}
                gradientFrom="from-cyan-600"
                gradientTo="to-purple-600"
                showActionArea={true}
                actionArea={
                  <div className="hidden lg:flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <SearchInput
                      onSearch={handleSearch}
                      placeholder="Search Quotation..."
                      className="w-full sm:w-64"
                      disabled={userLoading}
                      initialValue={urlSearch}
                      isLoading={isDataFetching}
                    />
                    {/* Status Filter */}
                    <StatusFilterDropdown
                      statusFilter={urlStatusFilter}
                      setStatusFilter={handleStatusFilterChange}
                      statusConfig={quotationStatusConfig}
                      disabled={isDataFetching}
                    />

                    {/* Items Per Page Filter */}
                    <ItemsPerPageDropdown
                      itemsPerPage={itemsPerPage}
                      itemsPerPageOptions={[10, 20, 50, 100, 200, 300, 400]}
                      onItemsPerPageChange={handleItemsPerPageChange}
                      disabled={isDataFetching}
                    />

                    <CreateQuotationButton
                      role={user?.role || "admin"}
                      onSuccess={handleRefresh}
                      variant="default"
                      size="default"
                      disabled={isDataFetching}
                    />
                  </div>
                }
              />

              {/* Action Area untuk Mobile & Tablet (Breakpoint < lg) */}
              <div className="lg:hidden mt-4 p-4 bg-white dark:bg-slate-900 rounded-lg shadow-sm border">
                <div className="flex flex-col gap-3">
                  <SearchInput
                    onSearch={handleSearch}
                    placeholder="Search Quotation..."
                    className="w-full"
                    disabled={userLoading}
                    initialValue={urlSearch}
                    isLoading={isDataFetching}
                  />

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <StatusFilterDropdown
                        statusFilter={urlStatusFilter}
                        setStatusFilter={handleStatusFilterChange}
                        statusConfig={quotationStatusConfig}
                        disabled={isDataFetching}
                        className="w-full"
                      />
                    </div>

                    <div className="flex-1">
                      <ItemsPerPageDropdown
                        itemsPerPage={itemsPerPage}
                        itemsPerPageOptions={[5, 10, 20, 50, 100, 200, 300, 400]}
                        onItemsPerPageChange={handleItemsPerPageChange}
                        disabled={isDataFetching}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <CreateQuotationButton
                    role={user?.role || "admin"}
                    onSuccess={handleRefresh}
                    variant="default"
                    size="sm"
                    disabled={isDataFetching}
                    className="w-full"
                  />
                </div>
              </div>
            </>

            {/* TOP PAGINATION & ITEMS INFO */}
            {paginationMeta && paginationMeta.totalCount > 0 && (
              <div className="space-y-3">
                {renderItemsInfo()}
                {renderPagination()}
              </div>
            )}


            {/* TABLE - Tampilkan skeleton loading untuk subsequent fetches */}
            {isDataFetching ? (
              renderLoadingSkeleton()
            ) : (
              <div className="border rounded-lg bg-card" data-table-container>
                <QuotationTable
                  quotations={quotations}
                  isLoading={false}
                  isError={isError}
                  onDelete={(id, options) =>
                    deleteQuotation(id, {
                      onSuccess: () => {
                        options?.onSuccess?.();
                        handleRefresh();
                      },
                    })
                  }
                  isDeleting={isPending}
                  highlightId={highlightId}
                />
              </div>
            )}

            {/* BOTTOM PAGINATION & ITEMS INFO */}
            {paginationMeta && paginationMeta.totalCount > 0 && (
              <div className="space-y-3">
                {renderItemsInfo()}
                {renderPagination()}
              </div>
            )}

            {/* EMPTY STATE */}
            {quotations.length === 0 && !isDataFetching && (
              <div className="text-center py-12 border rounded-lg bg-muted/20">
                <MessageSquareQuoteIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">No quotations found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {urlSearch
                    ? `No quotations found for "${urlSearch}"`
                    : urlStatusFilter !== "ALL"
                      ? `No quotations with status "${quotationStatusConfig[urlStatusFilter as QuotationStatus]?.label}"`
                      : "Get started by creating a new quotation"
                  }
                </p>
                {(urlStatusFilter === "ALL" && !urlSearch) && (
                  <div className="mt-4">
                    <CreateQuotationButton
                      role={user?.role || "admin"}
                      onSuccess={handleRefresh}
                      variant="default"
                      size="sm"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    ),
  };

  return <AdminLayout {...layoutProps} />;
}