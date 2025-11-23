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
import { fetchAllSpkAdmin, deleteSpk } from "@/lib/action/master/spk/spk";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { LayoutProps } from "@/types/layout";
import TabelDataSpk from "@/components/spk/tabelData";
import { toast } from "sonner";
import ioClient from "socket.io-client";
import { useSession } from "@/components/clientSessionProvider";
import HeaderCard from "@/components/ui/header-card";
import { MessageSquareQuoteIcon } from "lucide-react";
import SearchInput from "@/components/shared/SearchInput";
import ItemsPerPageDropdown from "@/components/shared/itemsPerPageDropdown";
import { useMediaQuery } from "@/hooks/use-media-query";
import { AdminLoading } from "@/components/admin-loading";
import Pagination from "@/components/ui/paginationNew";
import SpkFilter from "@/components/spk/spkDropDownFilter";
import CreateButtonSPK from "@/components/spk/createSpkButton";

interface SPK {
  id: string;
  spkNumber: string;
  spkDate: Date;
  salesOrderId: string;
  teamId: string;
  createdById: string;
  progress: number;
  spkStatusClose: boolean;
  spkStatus: boolean;
  createdBy: {
    id: string;
    namaLengkap: string;
    jabatan?: string | null;
    nik?: string | null;
    departemen?: string | null;
  };

  salesOrder: {
    id: string;
    soNumber: string;
    projectName: string;
    customer: {
      name: string;
      address: string;
      branch: string;
    }
    project?: {
      id: string;
      name: string;
    };
    items: {
      id: string;
      lineNo: number;
      itemType: string;
      name: string;
      description?: string | null;
      qty: number;
      uom?: string | null;
      unitPrice: number;
      discount: number;
      taxRate: number;
      lineTotal: number;
    }[];
  };

  team?: {
    id: string;
    namaTeam: string;
    teamKaryawan?: {
      teamId: string;
      karyawan?: {
        id: string;
        namaLengkap: string;
        jabatan: string;
        departemen: string;
      };
    };
  } | null;

  details: {
    id: string;
    karyawan?: {
      id: string;
      namaLengkap: string;
      jabatan: string;
      departemen: string;
      nik: string;
    };
    salesOrderItemSPK?: {
      id: string;
      name: string;
      description?: string;
      qty: number;
      uom?: string | null;
    };
    lokasiUnit?: string | null;
  }[];

  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PaginationMeta {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

interface SPKResponse {
  data: SPK[];
  pagination: PaginationMeta;
}

const io = ioClient;
const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
  transports: ["websocket"],
  autoConnect: true,
});

export default function SpkPageAdmin() {
  const [dataSpk, setDataSpk] = useState<SPK[]>([]);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(null);
  const { user, isLoading: userLoading } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isDataFetching, setIsDataFetching] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const searchParams = useSearchParams();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const router = useRouter();

  // Ambil nilai langsung dari URL params
  const urlPage = Number(searchParams.get("page")) || 1;
  const urlPageSize = Number(searchParams.get("pageSize")) || 10;
  const urlSearch = searchParams.get("search") || "";
  const urlFilter = searchParams.get("filter") || "on-progress";

  // ===============================
  //    FETCH SPK DATA - DENGAN FILTER
  // ===============================
  const fetchData = useCallback(async () => {
    // Validasi session/user dulu
    if (userLoading) return;
    if (!user || user.role !== "admin") return;

    try {
      setIsDataFetching(true);

      console.log("🔄 Fetching data dengan params:", {
        page: urlPage,
        pageSize: urlPageSize,
        searchTerm: urlSearch,
        filterBy: urlFilter
      });

      const result: SPKResponse = await fetchAllSpkAdmin({
        page: urlPage,
        pageSize: urlPageSize,
        searchTerm: urlSearch,
        filterBy: urlFilter, // Tambahkan filter ke API call
      });

      console.log("✅ Data berhasil di-fetch:", {
        dataCount: result.data.length,
        pagination: result.pagination,
        filterApplied: urlFilter
      });

      setDataSpk(result.data);
      setPaginationMeta(result.pagination);

    } catch (error) {
      console.error("❌ Error fetching SPK data:", error);
      toast.error("Gagal memuat data SPK");
    } finally {
      setIsDataFetching(false);
      setIsLoading(false);
    }
  }, [urlPage, urlPageSize, urlSearch, urlFilter, user, userLoading]);

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
  }, [user, userLoading, fetchData, router]);

  // ===============================
  //    EFFECT UNTUK URL PARAMS CHANGE
  // ===============================
  useEffect(() => {
    // Trigger fetch ketika URL params berubah
    if (!userLoading && user && user.role === "admin") {
      fetchData();
    }
  }, [urlPage, urlPageSize, urlSearch, urlFilter, fetchData, user, userLoading]);

  // ===============================
  //    FILTER HANDLER - FIXED
  // ===============================
  const handleFilterChange = useCallback((newFilter: string) => {
    const params = new URLSearchParams(searchParams);

    if (newFilter && newFilter !== "on-progress") {
      params.set("filter", newFilter);
    } else {
      params.delete("filter");
    }

    // Reset ke page 1 saat filter berubah
    params.set("page", "1");

    // Pertahankan search term dan pageSize yang ada
    if (urlSearch) {
      params.set("search", urlSearch);
    }
    if (urlPageSize !== 10) {
      params.set("pageSize", urlPageSize.toString());
    }

    router.push(`?${params.toString()}`);
  }, [searchParams, router, urlSearch, urlPageSize]);

  // ===============================
  //    SEARCH HANDLER - FIXED
  // ===============================
  const handleSearch = useCallback((term: string) => {
    const params = new URLSearchParams(searchParams);

    if (term) {
      params.set("search", term);
    } else {
      params.delete("search");
    }

    // Reset ke page 1 saat search
    params.set("page", "1");

    // Pertahankan filter dan pageSize yang ada
    if (urlFilter !== "on-progress") {
      params.set("filter", urlFilter);
    }
    if (urlPageSize !== 10) {
      params.set("pageSize", urlPageSize.toString());
    }

    router.push(`?${params.toString()}`);
  }, [searchParams, router, urlFilter, urlPageSize]);

  // ===============================
  //    ITEMS PER PAGE HANDLER - FIXED
  // ===============================
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    const params = new URLSearchParams(searchParams);

    // Set pageSize dan reset ke page 1
    params.set("pageSize", newItemsPerPage.toString());
    params.set("page", "1");

    // Pertahankan search term dan filter jika ada
    if (urlSearch) {
      params.set("search", urlSearch);
    }

    if (urlFilter !== "on-progress") {
      params.set("filter", urlFilter);
    }

    router.push(`?${params.toString()}`);
  };

  // ===============================
  //    GET AVAILABLE TEAMS FOR FILTER
  // ===============================
  const availableTeams = useMemo(() => {
    if (!Array.isArray(dataSpk)) return [];

    const teams = dataSpk
      .map(spk => spk.team?.namaTeam)
      .filter((namaTeam): namaTeam is string =>
        namaTeam !== undefined && namaTeam !== null && namaTeam.trim() !== ''
      );
    return [...new Set(teams)];
  }, [dataSpk]);

  // ===============================
  //    REALTIME UPDATE
  // ===============================
  useEffect(() => {
    socket.on("connect", () => {
      console.log("✅ Socket connected to server");
    });

    const handler = () => {
      console.log("Realtime: SPK updated → refresh data");
      fetchData();
    };

    socket.on("spk_updated", handler);

    return () => {
      socket.off("spk_updated", handler);
    };
  }, [fetchData]);

  // ===============================
  //    REFRESH HANDLER
  // ===============================
  const handleRefresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // ===============================
  //    DELETE HANDLER
  // ===============================
  const handleDeleteSpk = useCallback(async (spkId: string, options?: { onSuccess?: () => void }) => {
    try {
      const confirmDelete = window.confirm("Apakah Anda yakin ingin menghapus SPK ini?");
      if (!confirmDelete) return;

      setIsDeleting(true);

      // Optimistic update
      const previousData = dataSpk;
      setDataSpk(prevData => prevData.filter(spk => spk.id !== spkId));

      const result = await deleteSpk(spkId);

      if (!result.success) {
        setDataSpk(previousData);
        toast.error(result.message || "Gagal menghapus SPK");
        return;
      }

      toast.success(result.message || "SPK berhasil dihapus");
      options?.onSuccess?.();
      handleRefresh();

    } catch (error) {
      console.error("Error deleting SPK:", error);
      toast.error("Terjadi kesalahan saat menghapus SPK");
      handleRefresh();
    } finally {
      setIsDeleting(false);
    }
  }, [dataSpk, handleRefresh]);

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
    return <AdminLoading message="Loading SPK data..." />;
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
    title: "SPK Management",
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
                    <BreadcrumbPage>SPK Management</BreadcrumbPage>
                  </Badge>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <Badge variant="outline">
                  <BreadcrumbPage>SPK List</BreadcrumbPage>
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
                title={isMobile ? "SPK" : "SPK Management"}
                description={
                  isMobile ? "View all SPK records" : "Manage and monitor all SPK"
                }
                icon={<MessageSquareQuoteIcon className={isMobile ? "h-5 w-5" : "h-7 w-7"} />}
                gradientFrom="from-cyan-600"
                gradientTo="to-purple-600"
                showActionArea={!isMobile}
                actionArea={
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <SearchInput
                      onSearch={handleSearch}
                      placeholder="Search SPK..."
                      className="w-full sm:w-64"
                      // disabled={userLoading || isDataFetching}
                      showLoading={false}
                      initialValue={urlSearch}
                    />
                    <SpkFilter
                      filterBy={urlFilter} // Gunakan urlFilter dari URL
                      onFilterChange={handleFilterChange} // Gunakan handler baru
                      availableTeams={availableTeams}
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
                    <CreateButtonSPK
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
                      placeholder="Search SPK..."
                      className="w-full"
                      // disabled={userLoading || isDataFetching}
                      showLoading={false}
                      initialValue={urlSearch}
                    />
                    <SpkFilter
                      filterBy={urlFilter} // Gunakan urlFilter dari URL
                      onFilterChange={handleFilterChange} // Gunakan handler baru
                      availableTeams={availableTeams}
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
                    <CreateButtonSPK
                      role={user?.role || "admin"}
                      onSuccess={handleRefresh}
                      variant="default"
                      size={isMobile ? "sm" : "default"}
                      disabled={isDataFetching}
                    />
                  </div>
                </div>
              )}
            </>

            {/* TOP PAGINATION & ITEMS INFO */}
            {paginationMeta && paginationMeta.totalCount > 0 && (
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
                <TabelDataSpk
                  dataSpk={dataSpk}
                  isLoading={false}
                  role={user?.role}
                  onDeleteSpk={handleDeleteSpk}
                  isDeleting={isDeleting}
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
            {dataSpk.length === 0 && !isDataFetching && (
              <div className="text-center py-12 border rounded-lg bg-muted/20">
                <MessageSquareQuoteIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">No SPK found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {urlSearch
                    ? `No SPK found for "${urlSearch}"`
                    : urlFilter !== "all"
                      ? `No SPK found with filter "${urlFilter}"`
                      : "No SPK data available"
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