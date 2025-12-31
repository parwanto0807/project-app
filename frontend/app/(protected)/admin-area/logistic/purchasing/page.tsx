"use client";

import React, { useCallback, useEffect, useState } from "react";
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
import { AdminLoading } from "@/components/admin-loading";
import { useSession } from "@/components/clientSessionProvider";
import Pagination from "@/components/ui/paginationNew";
import HeaderCard from "@/components/ui/header-card";
import { ShoppingCart, Package, Filter, RefreshCw } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import ItemsPerPageDropdown from "@/components/shared/itemsPerPageDropdown";
import SearchInput from "@/components/shared/SearchInput";
import { getAllPurchaseOrders } from "@/lib/action/po/po";
import { PurchaseOrder } from "@/types/poType";
import { Button } from "@/components/ui/button";
import StatusFilterDropdown from "@/components/purchasing/statusFilterDropdown";
import CreatePOFromPRButton from "@/components/purchasing/createPOFromPRButton";
import PurchaseOrderTable from "@/components/purchasing/tabelDataPO";

// Status configuration for Purchase Orders
const statusConfig = {
  DRAFT: {
    label: "Draft",
    className: "bg-gray-500 hover:bg-gray-600",
    variant: "secondary" as const,
  },
  PENDING_APPROVAL: {
    label: "Pending Approval",
    className: "bg-yellow-500 hover:bg-yellow-600",
    variant: "warning" as const,
  },
  APPROVED: {
    label: "Approved",
    className: "bg-blue-500 hover:bg-blue-600",
    variant: "default" as const,
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-500 hover:bg-red-600",
    variant: "destructive" as const,
  },
  SENT: {
    label: "Sent to Supplier",
    className: "bg-purple-500 hover:bg-purple-600",
    variant: "default" as const,
  },
  PARTIALLY_RECEIVED: {
    label: "Partially Received",
    className: "bg-orange-500 hover:bg-orange-600",
    variant: "warning" as const,
  },
  FULLY_RECEIVED: {
    label: "Fully Received",
    className: "bg-green-500 hover:bg-green-600",
    variant: "success" as const,
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-gray-700 hover:bg-gray-800",
    variant: "secondary" as const,
  },
};

type PurchaseOrderStatus = keyof typeof statusConfig | "ALL";

export default function PurchaseOrderPageAdmin() {
  const { user, isLoading: userLoading } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");

  // URL parameters
  const urlSearchTerm = searchParams.get("search") || "";
  const urlPage = Number(searchParams.get("page")) || 1;
  const urlPageSize = Number(searchParams.get("pageSize")) || 10;
  const urlStatus = searchParams.get("status") as PurchaseOrderStatus | null;
  const highlightId = searchParams.get("highlightId") || null;

  // State management
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus>(
    urlStatus && statusConfig[urlStatus as keyof typeof statusConfig]
      ? urlStatus
      : "ALL"
  );
  const [itemsPerPage, setItemsPerPage] = useState(urlPageSize);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data state
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [paginationMeta, setPaginationMeta] = useState({
    totalCount: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: 10,
    hasNext: false,
    hasPrev: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch purchase orders
  const fetchPurchaseOrders = useCallback(async () => {
    if (userLoading || !user) return;

    setIsLoading(true);
    setError(null);

    try {
      const filters = {
        page: urlPage,
        limit: itemsPerPage,
        search: urlSearchTerm || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      };

      const result = await getAllPurchaseOrders(filters);

      if (Array.isArray(result.data)) {
        setPurchaseOrders(result.data);
      } else {
        setPurchaseOrders([]);
      }

      if (result.pagination) {
        setPaginationMeta(result.pagination);
      }
    } catch (err) {
      console.error("Error fetching purchase orders:", err);
      setError(err instanceof Error ? err.message : "Failed to load purchase orders");
      setPurchaseOrders([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userLoading, user, urlPage, itemsPerPage, urlSearchTerm, statusFilter]);

  // Initial fetch and refresh on dependencies change
  useEffect(() => {
    fetchPurchaseOrders();
  }, [fetchPurchaseOrders]);

  // Handle refresh trigger
  useEffect(() => {
    if (!isInitialLoad) {
      fetchPurchaseOrders();
    }
  }, [refreshTrigger]);

  // Track initial load completion
  useEffect(() => {
    if (!isLoading && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [isLoading, isInitialLoad]);

  // Status filter handler
  const handleStatusFilterChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams);

      if (value === "ALL") {
        params.delete("status");
      } else {
        params.set("status", value);
      }

      params.set("page", "1");
      router.push(`?${params.toString()}`);
      setStatusFilter(value as PurchaseOrderStatus);
    },
    [searchParams, router]
  );

  // Search handler
  const handleSearch = useCallback(
    (term: string) => {
      const params = new URLSearchParams(searchParams);

      if (term) {
        params.set("search", term);
      } else {
        params.delete("search");
      }

      params.set("page", "1");
      router.push(`?${params.toString()}`);
    },
    [searchParams, router]
  );

  // Items per page handler
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);

    const params = new URLSearchParams(searchParams);
    params.set("pageSize", newItemsPerPage.toString());
    params.set("page", "1");

    router.push(`?${params.toString()}`);
  };

  // Refresh handler
  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshTrigger(prev => prev + 1);
  };

  // Create success handler
  const handleCreateSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Scroll to top on page change
  useEffect(() => {
    const scrollToTop = () => {
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });

        const tableContainer = document.querySelector("[data-table-container]");
        if (tableContainer instanceof HTMLElement) {
          tableContainer.scrollTop = 0;
        }
      }
    };

    const timeout = setTimeout(scrollToTop, 100);
    return () => clearTimeout(timeout);
  }, [urlPage, itemsPerPage]);

  // Auth check
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

  // Loading and error states
  if (userLoading || isInitialLoad) {
    return <AdminLoading message="Loading purchase orders..." />;
  }

  if (error) {
    return (
      <AdminLayout title="Purchase Order Management" role="admin">
        <div className="p-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h3 className="text-red-800 font-medium">Error loading purchase orders</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="mt-3"
            >
              Try Again
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Render pagination component
  const renderPagination = () => {
    if (!paginationMeta || paginationMeta.totalPages <= 1) return null;

    return (
      <div className="flex justify-center">
        <Pagination
          totalPages={paginationMeta.totalPages}
          currentPage={paginationMeta.currentPage}
          onPageChange={(page) => {
            const params = new URLSearchParams(searchParams);
            params.set("page", page.toString());
            router.push(`?${params.toString()}`);
          }}
        />
      </div>
    );
  };

  // Render items info component
  const renderItemsInfo = () => {
    if (!paginationMeta || paginationMeta.totalCount === 0) return null;

    const start = ((urlPage - 1) * itemsPerPage) + 1;
    const end = Math.min(urlPage * itemsPerPage, paginationMeta.totalCount);

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-2 border-t">
        <div className="text-xs md:text-sm text-muted-foreground">
          Showing {start}-{end} of {paginationMeta.totalCount} entries
          {statusFilter !== "ALL" && ` (filtered by ${statusConfig[statusFilter]?.label})`}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="ml-2 hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>
    );
  };

  // Render loading skeleton for subsequent fetches
  const renderLoadingSkeleton = () => (
    <div className="border rounded-lg bg-card animate-pulse">
      <div className="p-4 space-y-3">
        {/* Skeleton for table header */}
        <div className="flex justify-between items-center">
          <div className="h-6 bg-muted rounded w-1/4"></div>
          <div className="h-9 bg-muted rounded w-24"></div>
        </div>

        {/* Skeleton for rows */}
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

  // Page layout
  const layoutProps: LayoutProps = {
    title: "Purchase Order Management",
    role: "admin",
    children: (
      <div className="h-full flex flex-col min-h-0">
        {/* Breadcrumb */}
        <div className="flex-shrink-0 px-4 pt-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Badge variant="outline" className="hover:bg-accent">
                    <Link href="/admin-area">Dashboard</Link>
                  </Badge>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Badge variant="outline" className="hover:bg-accent">
                    <Link href="/purchase">Purchase Management</Link>
                  </Badge>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <Badge variant="outline">
                  <BreadcrumbPage>Purchase Orders</BreadcrumbPage>
                </Badge>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Main content */}
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="space-y-4 p-2 md:p-4">
            {/* HEADER CARD */}
            <HeaderCard
              title={isMobile ? "Purchase Orders" : "Purchase Order Management"}
              description={
                isMobile
                  ? "View all purchase orders"
                  : "Manage and monitor all purchase orders from suppliers"
              }
              icon={<ShoppingCart className={isMobile ? "h-5 w-5" : "h-7 w-7"} />}
              gradientFrom="from-blue-600"
              gradientTo="to-emerald-600"
              showActionArea={!isMobile}
              actionArea={
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <SearchInput
                    onSearch={handleSearch}
                    placeholder="Search PO Number, Supplier..."
                    className="w-full sm:w-64"
                    disabled={isLoading || isRefreshing}
                    initialValue={urlSearchTerm}
                  />

                  {/* Status Filter */}
                  <StatusFilterDropdown
                    statusFilter={statusFilter}
                    setStatusFilter={handleStatusFilterChange}
                    statusConfig={statusConfig}
                    disabled={isLoading || isRefreshing}
                  />

                  {/* Items Per Page Filter */}
                  <ItemsPerPageDropdown
                    itemsPerPage={itemsPerPage}
                    itemsPerPageOptions={[10, 20, 50, 100]}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    disabled={isLoading || isRefreshing}
                  />

                  {/* Create PO from PR Button */}
                  <CreatePOFromPRButton
                    role="admin"
                    onSuccess={handleCreateSuccess}
                    variant="default"
                    size={isMobile ? "sm" : "default"}
                    disabled={isLoading || isRefreshing}
                  />
                </div>
              }
            />

            {/* Mobile Action Area */}
            {isMobile && (
              <div className="p-3 bg-card rounded-lg border shadow-sm">
                <div className="flex flex-col gap-3">
                  <SearchInput
                    onSearch={handleSearch}
                    placeholder="Search PO Number, Supplier..."
                    className="w-full"
                    disabled={isLoading || isRefreshing}
                    initialValue={urlSearchTerm}
                  />

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <StatusFilterDropdown
                        statusFilter={statusFilter}
                        setStatusFilter={handleStatusFilterChange}
                        statusConfig={statusConfig}
                        disabled={isLoading || isRefreshing}
                      />
                    </div>

                    <div className="flex-1">
                      <ItemsPerPageDropdown
                        itemsPerPage={itemsPerPage}
                        itemsPerPageOptions={[10, 20, 50]}
                        onItemsPerPageChange={handleItemsPerPageChange}
                        disabled={isLoading || isRefreshing}
                      />
                    </div>
                  </div>

                  <CreatePOFromPRButton
                    role="admin"
                    onSuccess={handleCreateSuccess}
                    variant="default"
                    size="sm"
                    disabled={isLoading || isRefreshing}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {/* TOP PAGINATION & ITEMS INFO */}
            {paginationMeta.totalCount > 0 && (
              <div className="space-y-3">
                {renderItemsInfo()}
                {renderPagination()}
              </div>
            )}

            {/* TABLE */}
            <div data-table-container className="overflow-hidden">
              {isLoading && !isInitialLoad ? (
                renderLoadingSkeleton()
              ) : (
                <PurchaseOrderTable
                  purchaseOrders={purchaseOrders}
                  isLoading={isLoading}
                  role={user?.role || "admin"}
                  highlightId={highlightId}
                  onRefresh={handleRefresh}
                />
              )}
            </div>

            {/* BOTTOM PAGINATION & ITEMS INFO */}
            {paginationMeta.totalCount > 0 && (
              <div className="space-y-3">
                {renderItemsInfo()}
                {renderPagination()}
              </div>
            )}

            {/* EMPTY STATE */}
            {purchaseOrders.length === 0 && !isLoading && (
              <div className="text-center py-12 border rounded-lg bg-muted/20">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">
                  No purchase orders found
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {statusFilter !== "ALL"
                    ? `No purchase orders with status "${statusConfig[statusFilter]?.label}"`
                    : "Get started by creating a new purchase order from an approved Purchase Request"
                  }
                </p>
                {statusFilter === "ALL" && (
                  <div className="mt-4">
                    <CreatePOFromPRButton
                      role="admin"
                      onSuccess={handleCreateSuccess}
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