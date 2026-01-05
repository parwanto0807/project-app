"use client";

import React, { useCallback, useEffect, useState } from "react";
import z from "zod";
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
import { SalesOrderTable } from "@/components/sales/salesOrder/tabelData";
import { useSalesOrder } from "@/hooks/use-salesOrder";
import { AdminLoading } from "@/components/admin-loading";
import { useSession } from "@/components/clientSessionProvider";
import Pagination from "@/components/ui/paginationNew";
import HeaderCard from "@/components/ui/header-card";
import { Package } from "lucide-react";

import CreateSalesOrderButton from "@/components/sales/salesOrder/create-salesOrder-button";
import StatusFilterDropdown from "@/components/sales/salesOrder/statusFilterDropdown";
import ItemsPerPageDropdown from "@/components/shared/itemsPerPageDropdown";
import { OrderStatusEnum } from "@/schemas/index";
import SearchInput from "@/components/shared/SearchInput";

type OrderStatus = z.infer<typeof OrderStatusEnum>;

const statusConfig = {
  DRAFT: {
    label: "Draft",
    className: "bg-gray-500"
  },
  CONFIRMED: {
    label: "Confirmed",
    className: "bg-blue-500"
  },
  IN_PROGRESS_SPK: {
    label: "In Progress SPK",
    className: "bg-yellow-500"
  },
  FULFILLED: {
    label: "Fulfilled",
    className: "bg-green-500"
  },
  BAST: {
    label: "BAST",
    className: "bg-purple-500"
  },
  PARTIALLY_INVOICED: {
    label: "Partially Invoiced",
    className: "bg-orange-500"
  },
  INVOICED: {
    label: "Invoiced",
    className: "bg-indigo-500"
  },
  PARTIALLY_PAID: {
    label: "Partially Paid",
    className: "bg-pink-500"
  },
  PAID: {
    label: "Paid",
    className: "bg-green-600"
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-red-500"
  },
};

export default function SalesOrderPageAdmin() {
  const { user, isLoading: userLoading } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlSearchTerm = searchParams.get("search") || "";
  const urlPage = Number(searchParams.get("page")) || 1;
  const urlPageSize = Number(searchParams.get("pageSize")) || 10;
  const urlStatus = searchParams.get("status") as OrderStatus | null;
  const highlightId = searchParams.get("highlightId") || null;


  // ===============================
  //    STATE MANAGEMENT
  // ===============================

  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">(
    urlStatus && Object.values(OrderStatusEnum.Enum).includes(urlStatus)
      ? urlStatus
      : "ALL"
  );
  const [itemsPerPage, setItemsPerPage] = useState(urlPageSize);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // ===============================
  //    FETCH SALES ORDER DATA
  // ===============================
  const {
    data: salesOrderData,
    isLoading: isSalesOrderLoading,
    isFetching: isSalesOrderFetching,
    error: salesOrderError,
  } = useSalesOrder(urlPage, itemsPerPage, urlSearchTerm, statusFilter, refreshTrigger);

  const salesOrders = salesOrderData?.data || [];
  const paginationMeta = salesOrderData?.pagination;

  useEffect(() => {
    if (urlStatus && Object.values(OrderStatusEnum.Enum).includes(urlStatus)) {
      setStatusFilter(urlStatus);
    } else {
      setStatusFilter("ALL");
    }
  }, [urlStatus]);

  // ===============================
  //    TRACK INITIAL LOAD COMPLETION
  // ===============================
  useEffect(() => {
    // Set initial load to false setelah data pertama berhasil dimuat
    if (!isSalesOrderLoading && salesOrderData && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [isSalesOrderLoading, salesOrderData, isInitialLoad]);

  // ===============================
  //    STATUS FILTER HANDLER
  // ===============================
  const handleStatusFilterChange = useCallback(
    (value: OrderStatus | "ALL") => {
      const params = new URLSearchParams(searchParams);

      if (value === "ALL") params.delete("status");
      else params.set("status", value);

      params.set("page", "1");

      router.push(`?${params.toString()}`);
    },
    [searchParams, router]
  );


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

  const handleCreateSuccess = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // ===============================
  //    ITEMS PER PAGE HANDLER
  // ===============================
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);

    const params = new URLSearchParams(searchParams);
    params.set("pageSize", newItemsPerPage.toString());
    params.set("page", "1");

    router.push(`?${params.toString()}`);
  };

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
  }, [itemsPerPage, urlPage]);

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

  // Hanya show AdminLoading untuk initial load
  if (userLoading || isInitialLoad) {
    return <AdminLoading message="Loading sales orders..." />;
  }

  if (salesOrderError) {
    return (
      <AdminLayout title="Sales Order Management" role="admin">
        <div className="p-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h3 className="text-red-800 font-medium">Error loading sales orders</h3>
            <p className="text-red-700 text-sm mt-1">
              {salesOrderError.message || "Failed to load sales orders"}
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
    if (!paginationMeta || paginationMeta.totalPages <= 1) return null;

    return (
      <div className="flex justify-center">
        <Pagination totalPages={paginationMeta.totalPages} />
      </div>
    );
  };

  // ===============================
  //    RENDER ITEMS INFO COMPONENT
  // ===============================
  const renderItemsInfo = () => {
    if (!paginationMeta || paginationMeta.totalCount === 0) return null;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-1 border-t pt-3">
        <div className="text-xs md:text-sm text-muted-foreground">
          Showing {((urlPage - 1) * itemsPerPage) + 1}-
          {Math.min(urlPage * itemsPerPage, paginationMeta.totalCount)} of{" "}
          {paginationMeta.totalCount} entries
          {statusFilter !== "ALL" && ` (filtered by ${statusConfig[statusFilter]?.label})`}
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
    title: "Sales Order Management",
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
                  <BreadcrumbPage>Sales Order List</BreadcrumbPage>
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
                  <>
                    <span className="md:hidden">Sales Orders</span>
                    <span className="hidden md:inline">Sales Order Management</span>
                  </>
                }
                description="Manage and monitor all sales orders"
                icon={<Package className="h-5 w-5 md:h-7 md:w-7" />}
                gradientFrom="from-cyan-600"
                gradientTo="to-purple-600"
                showActionArea={true}
                actionArea={
                  <div className="hidden lg:flex flex-row gap-3 items-center">
                    <SearchInput
                      onSearch={handleSearch}
                      placeholder="Search Sales Order..."
                      className="w-48 xl:w-64"
                      disabled={userLoading}
                      initialValue={urlSearchTerm}
                      isLoading={isSalesOrderFetching}
                    />
                    {/* Status Filter */}
                    <StatusFilterDropdown
                      statusFilter={statusFilter}
                      setStatusFilter={handleStatusFilterChange}
                      statusConfig={statusConfig}
                      disabled={isSalesOrderFetching}
                    />

                    {/* Items Per Page Filter */}
                    <ItemsPerPageDropdown
                      itemsPerPage={itemsPerPage}
                      itemsPerPageOptions={[10, 20, 50, 100, 200, 300, 400]}
                      onItemsPerPageChange={handleItemsPerPageChange}
                      disabled={isSalesOrderFetching}
                    />

                    <CreateSalesOrderButton
                      role={user?.role || "admin"}
                      onSuccess={handleCreateSuccess}
                      variant="default"
                      size="default"
                      disabled={isSalesOrderFetching}
                    />
                  </div>
                }
              />

              {/* Action Area untuk Mobile & Tablet (lg:hidden) */}
              <div className="lg:hidden p-4 bg-white dark:bg-slate-900 rounded-lg shadow-sm border space-y-3">
                <SearchInput
                  onSearch={handleSearch}
                  placeholder="Search Sales Order..."
                  className="w-full"
                  disabled={userLoading}
                  initialValue={urlSearchTerm}
                  isLoading={isSalesOrderFetching}
                />

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <StatusFilterDropdown
                      statusFilter={statusFilter}
                      setStatusFilter={handleStatusFilterChange}
                      statusConfig={statusConfig}
                      disabled={isSalesOrderFetching}
                      className="w-full"
                    />
                  </div>

                  <div className="flex-1">
                    <ItemsPerPageDropdown
                      itemsPerPage={itemsPerPage}
                      itemsPerPageOptions={[10, 20, 50, 100, 200, 300, 400]}
                      onItemsPerPageChange={handleItemsPerPageChange}
                      disabled={isSalesOrderFetching}
                      className="w-full"
                    />
                  </div>
                </div>

                <CreateSalesOrderButton
                  role={user?.role || "admin"}
                  onSuccess={handleCreateSuccess}
                  variant="default"
                  size="sm"
                  disabled={isSalesOrderFetching}
                  className="w-full"
                />
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
            {isSalesOrderFetching && !isInitialLoad ? (
              renderLoadingSkeleton()
            ) : (
              <div className="border rounded-lg bg-card" data-table-container>
                <SalesOrderTable
                  salesOrders={salesOrders}
                  isLoading={false} // Tidak perlu loading indicator di table untuk subsequent fetches
                  role={user?.role || "admin"}
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
            {salesOrders.length === 0 && !isSalesOrderFetching && (
              <div className="text-center py-12 border rounded-lg bg-muted/20">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">No sales orders found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {statusFilter !== "ALL"
                    ? `No sales orders with status "${statusConfig[statusFilter]?.label}"`
                    : "Get started by creating a new sales order"
                  }
                </p>
                {statusFilter === "ALL" && (
                  <div className="mt-4">
                    <CreateSalesOrderButton
                      role={user?.role || "admin"}
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