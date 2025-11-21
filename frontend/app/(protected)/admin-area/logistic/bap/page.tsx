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
import { BAPDataTable } from "@/components/bap/tableData";
import { getAllBAP } from "@/lib/action/bap/bap";
import { useSession } from "@/components/clientSessionProvider";
import { AdminLoading } from "@/components/admin-loading";
import { toast } from "sonner";
import HeaderCard from "@/components/ui/header-card";
import { FileImageIcon, TruckIcon } from "lucide-react";
import SearchInput from "@/components/shared/SearchInput";
import ItemsPerPageDropdown from "@/components/shared/itemsPerPageDropdown";
import { useMediaQuery } from "@/hooks/use-media-query";
import Pagination from "@/components/ui/paginationNew";
import BapFilter from "@/components/bap/bapDropDownFilter";
import CreateButtonBAP from "@/components/bap/createBapButton";

export interface BAPData {
  id: string;
  bapNumber: string;
  bapDate: string;
  salesOrderId: string;
  projectId: string;
  createdById: string;
  userId: string;
  workDescription: string;
  location: string;
  status: "DRAFT" | "IN_PROGRESS" | "COMPLETED" | "APPROVED";
  isApproved: boolean;
  approvedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  salesOrder: {
    id: string;
    soNumber: string;
    customer: {
      id: string;
      name: string;
      branch: string;
      contactPerson: string;
      address: string;
    };
    project?: {
      name: string;
      location: string | null;
    };
    spk: {
      spkNumber: string;
      spkDate: string;
    }[];
    items?: {
      id: string;
      name: string;
      description: string;
      productId: string;
      qty: number;
      price: number;
      discount?: number;
      total: number;
      uom: string;
    }[];
  };
  createdBy: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    namaLengkap: string;
  };
  photos?: {
    id?: string;
    bapId: string;
    photoUrl: string;
    caption?: string;
    category: "BEFORE" | "PROCESS" | "AFTER";
    createdAt?: string;
  }[];
}

interface PaginationMeta {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export default function BapPageAdmin() {
  const [bapData, setBapData] = useState<BAPData[]>([]);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(null);
  const { user, isLoading: userLoading } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isDataFetching, setIsDataFetching] = useState(false);

  const searchParams = useSearchParams();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const router = useRouter();

  // Ambil nilai langsung dari URL params
  const urlPage = Number(searchParams.get("page")) || 1;
  const urlPageSize = Number(searchParams.get("pageSize")) || 10;
  const urlSearch = searchParams.get("search") || "";
  const urlFilter = searchParams.get("filter") || "all";

  // ===============================
  //    FETCH BAP DATA - DENGAN FILTER
  // ===============================
  const fetchData = useCallback(async () => {
    if (userLoading) return;
    if (!user || user.role !== "admin") return;

    try {
      setIsDataFetching(true);

      const result = await getAllBAP({
        page: urlPage,
        limit: urlPageSize,
        status: urlFilter !== "all" ? urlFilter as "DRAFT" | "IN_PROGRESS" | "COMPLETED" | "APPROVED" : undefined,
        search: urlSearch || undefined,
      });

      if (result.data) {
        setBapData(result.data);
      }
      if (result.pagination) {
        setPaginationMeta(result.pagination);
      } else {
        setPaginationMeta({
          currentPage: urlPage,
          pageSize: urlPageSize,
          totalCount: result.data?.length || 0,
          totalPages: Math.ceil((result.data?.length || 0) / urlPageSize)
        });
      }

    } catch (error) {
      console.error("❌ Error fetching BAP data:", error);
      toast.error("Gagal memuat data BAP");
    } finally {
      setIsDataFetching(false);
      setIsLoading(false);
    }
  }, [urlPage, urlPageSize, urlSearch, urlFilter, user, userLoading]);

  // ===============================
  //    DATA FETCHING EFFECT - SATUKAN MENJADI SATU
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
  }, [user, userLoading, fetchData, router, urlPage, urlPageSize, urlSearch, urlFilter]); // TAMBAHKAN DEPENDENSI URL

  // ===============================
  //    HANDLERS - OPTIMIZE DEPENDENCIES
  // ===============================
  const handleFilterChange = useCallback((newFilter: string) => {
    const params = new URLSearchParams(searchParams);

    if (newFilter && newFilter !== "all") {
      params.set("filter", newFilter);
    } else {
      params.delete("filter");
    }

    params.set("page", "1");

    if (urlSearch) params.set("search", urlSearch);
    if (urlPageSize !== 10) params.set("pageSize", urlPageSize.toString());

    router.push(`?${params.toString()}`);
  }, [searchParams, router, urlSearch, urlPageSize]);

  const handleSearch = useCallback((term: string) => {
    const params = new URLSearchParams(searchParams);

    if (term) {
      params.set("search", term);
    } else {
      params.delete("search");
    }

    params.set("page", "1");

    if (urlFilter !== "all") params.set("filter", urlFilter);
    if (urlPageSize !== 10) params.set("pageSize", urlPageSize.toString());

    router.push(`?${params.toString()}`);
  }, [searchParams, router, urlFilter, urlPageSize]);

  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    const params = new URLSearchParams(searchParams);

    params.set("pageSize", newItemsPerPage.toString());
    params.set("page", "1");

    if (urlSearch) params.set("search", urlSearch);
    if (urlFilter !== "all") params.set("filter", urlFilter);

    router.push(`?${params.toString()}`);
  }, [searchParams, router, urlSearch, urlFilter]);

  // ===============================
  //    GET AVAILABLE STATUS FOR FILTER
  // ===============================
  const availableStatus = useMemo(() => {
    if (!Array.isArray(bapData)) return [];

    const statuses = bapData
      .map(bap => bap.status)
      .filter((status): status is "DRAFT" | "IN_PROGRESS" | "COMPLETED" | "APPROVED" =>
        status !== undefined && status !== null
      );
    return [...new Set(statuses)];
  }, [bapData]);

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
    return <AdminLoading message="Loading BAP data..." />;
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

    const startItem = (paginationMeta.currentPage - 1) * paginationMeta.pageSize + 1;
    const endItem = Math.min(paginationMeta.currentPage * paginationMeta.pageSize, paginationMeta.totalCount);

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-1 border-t pt-3">
        <div className="text-xs md:text-sm text-muted-foreground">
          Showing {startItem}-{endItem} of {paginationMeta.totalCount} entries
          {urlSearch && ` (search: "${urlSearch}")`}
          {urlFilter !== "all" && ` (filter: ${urlFilter})`}
        </div>
        <div className="text-xs md:text-sm text-muted-foreground">
          Page {paginationMeta.currentPage} of {paginationMeta.totalPages}
          {` | ${paginationMeta.pageSize} per page`}
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
  //    PAGE LAYOUT
  // ===============================
  const layoutProps: LayoutProps = {
    title: "Logistic Management",
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
                    <BreadcrumbPage>Logistic Management</BreadcrumbPage>
                  </Badge>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <Badge variant="outline">
                  <BreadcrumbPage>BAST List</BreadcrumbPage>
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
              title={isMobile ? "BAST" : "BAST Management"}
              description={
                isMobile ? "View all BAP records" : "Manage and monitor all Berita Acara Serah Terima Pekerjaan (BAST) records"
              }
              icon={<FileImageIcon className={isMobile ? "h-5 w-5" : "h-7 w-7"} />}
              gradientFrom="from-green-600"
              gradientTo="to-yellow-600"
              showActionArea={!isMobile}
              actionArea={
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <SearchInput
                    onSearch={handleSearch}
                    placeholder="Search BAP..."
                    className="w-full sm:w-64"
                    disabled={userLoading || isDataFetching}
                    initialValue={urlSearch}
                  />
                  <BapFilter
                    filterBy={urlFilter}
                    onFilterChange={handleFilterChange}
                    availableStatus={availableStatus}
                    className="your-custom-class"
                    variant="glass"
                    size="md"
                  />
                  <ItemsPerPageDropdown
                    itemsPerPage={urlPageSize}
                    itemsPerPageOptions={[10, 20, 50, 100, 200, 300, 400]}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    disabled={isDataFetching}
                  />
                  <CreateButtonBAP
                    role={user?.role || "admin"}
                    onSuccess={handleRefresh}
                    variant="default"
                    size={isMobile ? "sm" : "default"}
                    disabled={isDataFetching}
                  />
                </div>
              }
            />

            {/* Action Area untuk Mobile */}
            {isMobile && (
              <div className="mt-4 p-4 bg-white dark:bg-slate-900 rounded-lg shadow-sm border">
                <div className="flex flex-col gap-3">
                  <SearchInput
                    onSearch={handleSearch}
                    placeholder="Search BAP..."
                    className="w-full"
                    disabled={userLoading || isDataFetching}
                    initialValue={urlSearch}
                  />
                  <BapFilter
                    filterBy={urlFilter}
                    onFilterChange={handleFilterChange}
                    availableStatus={availableStatus}
                    className="your-custom-class"
                    variant="glass"
                    size="md"
                  />
                  <div className="flex-1">
                    <ItemsPerPageDropdown
                      itemsPerPage={urlPageSize}
                      itemsPerPageOptions={[10, 20, 50, 100, 200, 300, 400]}
                      onItemsPerPageChange={handleItemsPerPageChange}
                      disabled={isDataFetching}
                    />
                  </div>
                  <CreateButtonBAP
                    role={user?.role || "admin"}
                    onSuccess={handleRefresh}
                    variant="default"
                    size={isMobile ? "sm" : "default"}
                    disabled={isDataFetching}
                  />
                </div>
              </div>
            )}

            {/* TOP PAGINATION & ITEMS INFO */}
            {paginationMeta && paginationMeta.totalPages > 1 && (
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
                <BAPDataTable
                  bapData={bapData}
                  isLoading={false}
                />
              </div>
            )}

            {/* BOTTOM PAGINATION & ITEMS INFO */}
            {paginationMeta && paginationMeta.totalPages > 1 && (
              <div className="space-y-3">
                {renderItemsInfo()}
                {renderPagination()}
              </div>
            )}

            {/* EMPTY STATE */}
            {bapData.length === 0 && !isDataFetching && (
              <div className="text-center py-12 border rounded-lg bg-muted/20">
                <TruckIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">No BAP found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {urlSearch
                    ? `No BAP found for "${urlSearch}"`
                    : urlFilter !== "all"
                      ? `No BAP found with filter "${urlFilter}"`
                      : "No BAP data available"
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    ),
  };

  return <AdminLayout {...layoutProps} />;
}