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
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { PicLayout } from "@/components/admin-panel/pic-layout";
import { useSession } from "@/components/clientSessionProvider";
import SearchInput from "@/components/shared/SearchInput";
import PurchaseOrderTable from "@/components/purchasing/tabelDataPO";
import CreatePOFromPRButton from "@/components/purchasing/createPOFromPRButton";
import ItemsPerPageDropdown from "@/components/shared/itemsPerPageDropdown";
import {
  PurchaseOrder,
} from "@/types/poType";
import { Package, ShoppingCart, FileEdit, Clock, AlertCircle, CheckCircle, XCircle, Send } from "lucide-react";
import { toast } from "sonner";
import StatusFilterDropdown from "@/components/purchasing/statusFilterDropdown";
import HeaderCard from "@/components/ui/header-card";

// Status configuration for filters - must match available statuses in TabelDataPO/Type
const statusConfig: Record<string, { label: string; className: string; icon: any; iconColor: string; variant?: string }> = {
  DRAFT: {
    label: "Draft",
    className: "bg-gray-100 text-gray-800 border-gray-300",
    icon: FileEdit,
    iconColor: "text-gray-600",
    variant: "secondary"
  },
  PENDING_APPROVAL: {
    label: "Pending Aproval",
    className: "bg-amber-50 text-amber-800 border-amber-300",
    icon: Clock,
    iconColor: "text-amber-600",
    variant: "secondary"
  },
  REVISION_NEEDED: {
    label: "Perlu Revisi",
    className: "bg-orange-50 text-orange-800 border-orange-300",
    icon: AlertCircle,
    iconColor: "text-orange-600",
    variant: "secondary"
  },
  REQUEST_REVISION: {
    label: "Permintaan Revisi",
    className: "bg-yellow-200 text-yellow-900 border-yellow-600 font-bold shadow-sm",
    icon: AlertCircle,
    iconColor: "text-yellow-800",
    variant: "secondary"
  },
  APPROVED: {
    label: "Disetujui",
    className: "bg-blue-50 text-blue-800 border-blue-300",
    icon: CheckCircle,
    iconColor: "text-blue-600",
    variant: "secondary"
  },
  REJECTED: {
    label: "Ditolak",
    className: "bg-red-50 text-red-800 border-red-300",
    icon: XCircle,
    iconColor: "text-red-600",
    variant: "destructive"
  },
  SENT: {
    label: "Terkirim",
    className: "bg-purple-50 text-purple-800 border-purple-300",
    icon: Send,
    iconColor: "text-purple-600",
    variant: "secondary"
  },
  PARTIALLY_RECEIVED: {
    label: "Parsial",
    className: "bg-orange-50 text-orange-800 border-orange-300",
    icon: Package,
    iconColor: "text-orange-600",
    variant: "secondary"
  },
  FULLY_RECEIVED: {
    label: "Selesai",
    className: "bg-emerald-50 text-emerald-800 border-emerald-300",
    icon: CheckCircle,
    iconColor: "text-emerald-600",
    variant: "default"
  },
  CANCELLED: {
    label: "Dibatalkan",
    className: "bg-slate-100 text-slate-800 border-slate-300",
    icon: XCircle,
    iconColor: "text-slate-600",
    variant: "secondary"
  },
};

export default function PurchaseOrderPagePic() {
  const { user, isLoading: userLoading } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [paginationMeta, setPaginationMeta] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 1,
  });
  const [isInitialLoad, setIsInitialLoad] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  // Filters from URL or default
  const [urlSearchTerm, setUrlSearchTerm] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "ALL");
  const [itemsPerPage, setItemsPerPage] = useState(Number(searchParams.get("limit")) || 10);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch Data
  const fetchPurchaseOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Build query params
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', itemsPerPage.toString());
      if (urlSearchTerm) params.set('search', urlSearchTerm);
      if (statusFilter !== "ALL") params.set('status', statusFilter);

      // Direct fetch to backend API (bypasses Next.js server action caching)
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/po?${params.toString()}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(apiUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        cache: 'no-store',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      setPurchaseOrders(result.data || []);
      setPaginationMeta({
        page: result.pagination?.currentPage || 1,
        limit: result.pagination?.pageSize || 10,
        totalCount: result.pagination?.totalCount || 0,
        totalPages: result.pagination?.totalPages || 1,
      });
    } catch (err: any) {
      console.error("Error fetching POs:", err);
      if (err.name === 'AbortError') {
        setError("Request timed out (15s)");
        toast.error("Request timeout - silakan coba lagi");
      } else {
        setError(err.message || "Failed to fetch purchase orders");
        toast.error("Gagal memuat data purchase order");
      }
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  }, [page, itemsPerPage, urlSearchTerm, statusFilter]);

  // Initial Fetch & Params Sync
  useEffect(() => {
    if (!userLoading && user) {
      fetchPurchaseOrders();
    }
  }, [fetchPurchaseOrders, userLoading, user]);

  // Handle URL updates
  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", page.toString());
    if (itemsPerPage !== 10) params.set("limit", itemsPerPage.toString());
    if (urlSearchTerm) params.set("search", urlSearchTerm);
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [page, itemsPerPage, urlSearchTerm, statusFilter, router]);

  // Handlers
  const handleSearch = (term: string) => {
    setUrlSearchTerm(term);
    setPage(1);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleItemsPerPageChange = (limit: number) => {
    setItemsPerPage(limit);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleRefresh = () => {
    fetchPurchaseOrders();
  };

  const handleCreateSuccess = (newId?: string) => {
    toast.success("Purchase Order created successfully");
    if (newId) {
      setHighlightId(newId);
      setTimeout(() => setHighlightId(null), 3000);
    }
    handleRefresh();
  };

  // Auth Check
  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    if (user.role !== "pic") {
      router.replace("/not-authorized");
      return;
    }
  }, [userLoading, user, router]);

  if (userLoading) {
    return (
      <PicLayout title="Purchase Order Management" role="pic">
        <div className="flex h-[80vh] items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground">Memuat data...</p>
          </div>
        </div>
      </PicLayout>
    );
  }

  // Helper functions for rendering
  const renderItemsInfo = () => {
    const start = (paginationMeta.page - 1) * paginationMeta.limit + 1;
    const end = Math.min(paginationMeta.page * paginationMeta.limit, paginationMeta.totalCount);
    return (
      <p className="text-sm text-muted-foreground">
        Menampilkan <span className="font-medium">{start}-{end}</span> dari <span className="font-medium">{paginationMeta.totalCount}</span> data
      </p>
    );
  };

  const renderPagination = () => {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1 || isLoading}
        >
          Previous
        </Button>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, paginationMeta.totalPages) }, (_, i) => {
            let p = i + 1;
            if (paginationMeta.totalPages > 5 && page > 3) {
              p = page - 2 + i;
            }
            if (p > paginationMeta.totalPages) return null;

            return (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(p)}
                disabled={isLoading}
                className="w-8 h-8 p-0"
              >
                {p}
              </Button>
            );
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(page + 1)}
          disabled={page === paginationMeta.totalPages || isLoading}
        >
          Next
        </Button>
      </div>
    )
  }

  const renderLoadingSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 bg-muted/20 animate-pulse rounded-md" />
      ))}
    </div>
  );

  return (
    <PicLayout title="Purchase Order Management" role="pic">
      <div className="h-full flex flex-col min-h-0">
        {/* Breadcrumb */}
        <div className="flex-shrink-0 px-4 pt-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Badge variant="outline" className="hover:bg-accent cursor-pointer">
                    <Link href="/pic-area">Dashboard</Link>
                  </Badge>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Badge variant="outline" className="hover:bg-accent cursor-pointer">
                    <Link href="/pic-area/logistic/purchasing">Purchase Management</Link>
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
                <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full sm:w-auto items-center justify-end">
                  <SearchInput
                    onSearch={handleSearch}
                    placeholder="Search PO Number, Supplier..."
                    className="w-full sm:w-64"
                    disabled={isLoading}
                    initialValue={urlSearchTerm}
                  />

                  {/* Status Filter */}
                  <StatusFilterDropdown
                    statusFilter={statusFilter}
                    setStatusFilter={handleStatusFilterChange}
                    statusConfig={statusConfig}
                    disabled={isLoading}
                  />

                  {/* Items Per Page Filter */}
                  <ItemsPerPageDropdown
                    itemsPerPage={itemsPerPage}
                    itemsPerPageOptions={[10, 20, 50, 100]}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    disabled={isLoading}
                  />

                  {/* Create PO from PR Button */}
                  <CreatePOFromPRButton
                    role="pic"
                    onSuccess={handleCreateSuccess}
                    variant="default"
                    size={isMobile ? "sm" : "default"}
                    disabled={isLoading}
                    className="ml-auto"
                  />
                </div>
              }
            />

            {/* Mobile Action Area */}
            {isMobile && (
              <div className="p-3 bg-card rounded-lg border shadow-sm">
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 items-center">
                  <SearchInput
                    onSearch={handleSearch}
                    placeholder="Search PO Number, Supplier..."
                    className="w-full sm:flex-1 min-w-[200px]"
                    disabled={isLoading}
                    initialValue={urlSearchTerm}
                  />

                  <div className="flex flex-row gap-2 w-full sm:w-auto">
                    <div className="flex-1 sm:flex-none">
                      <StatusFilterDropdown
                        statusFilter={statusFilter}
                        setStatusFilter={handleStatusFilterChange}
                        statusConfig={statusConfig}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="flex-1 sm:flex-none">
                      <ItemsPerPageDropdown
                        itemsPerPage={itemsPerPage}
                        itemsPerPageOptions={[10, 20, 50]}
                        onItemsPerPageChange={handleItemsPerPageChange}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <CreatePOFromPRButton
                    role="pic"
                    onSuccess={handleCreateSuccess}
                    variant="default"
                    size="sm"
                    disabled={isLoading}
                    className="w-full sm:w-auto sm:ml-auto"
                  />
                </div>
              </div>
            )}

            {/* TOP PAGINATION & ITEMS INFO */}
            {paginationMeta.totalCount > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                {renderItemsInfo()}
                {renderPagination()}
              </div>
            )}

            {/* TABLE */}
            <div data-table-container className="overflow-hidden">
              <PurchaseOrderTable
                purchaseOrders={purchaseOrders}
                isLoading={isLoading && !isInitialLoad}
                role={user?.role || "pic"}
                highlightId={highlightId}
                onRefresh={handleRefresh}
              />
            </div>

            {/* BOTTOM PAGINATION & ITEMS INFO */}
            {paginationMeta.totalCount > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                {renderItemsInfo()}
                {renderPagination()}
              </div>
            )}

            {/* EMPTY STATE */}
            {purchaseOrders.length === 0 && !isLoading && !error && (
              <div className="text-center py-12 border rounded-lg bg-muted/20">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">
                  No purchase orders found
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {statusFilter !== "ALL" && statusConfig[statusFilter]
                    ? `No purchase orders with status "${statusConfig[statusFilter]?.label}"`
                    : "No purchase orders match your criteria."
                  }
                </p>
                {statusFilter === "ALL" && (
                  <div className="mt-4">
                    <CreatePOFromPRButton
                      role="pic"
                      onSuccess={handleCreateSuccess}
                      variant="default"
                      size="sm"
                    />
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="text-center py-12 border rounded-lg bg-red-50 text-red-600">
                <p>{error}</p>
                <Button variant="outline" onClick={handleRefresh} className="mt-2">Try Again</Button>
              </div>
            )}

          </div>
        </div>
      </div>
    </PicLayout>
  );
}