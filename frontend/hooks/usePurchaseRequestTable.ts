import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PurchaseRequest, PurchaseRequestWithRelations } from "@/types/pr";
import { getBasePath } from "@/components/pr/component/utils";

interface UsePurchaseRequestTableProps {
  purchaseRequests: PurchaseRequestWithRelations[];
  role: string;
  currentSearch: string;
  currentDateFrom?: Date;
  currentDateTo?: Date;
  onSearchChange: (search: string) => void;
  onDateFilterChange: (dateFrom?: Date, dateTo?: Date) => void;
  onStatusUpdate: (id: string, status: PurchaseRequest['status']) => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function usePurchaseRequestTable({
  purchaseRequests,
  role,
  currentSearch,
  currentDateFrom,
  currentDateTo,
  onSearchChange,
  onDateFilterChange,
  onStatusUpdate,
  // onPageChange,
  // onLimitChange,
}: UsePurchaseRequestTableProps) {
  const [searchInput, setSearchInput] = useState(currentSearch);
  const [showFilters, setShowFilters] = useState(false);
  const [localDateFrom, setLocalDateFrom] = useState<string>(
    currentDateFrom?.toISOString().split('T')[0] || ""
  );
  const [localDateTo, setLocalDateTo] = useState<string>(
    currentDateTo?.toISOString().split('T')[0] || ""
  );
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedPurchaseRequest, setSelectedPurchaseRequest] = useState<PurchaseRequest | null>(null);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPR, setSelectedPR] = useState<PurchaseRequest | null>(null);

  const router = useRouter();
  const basePath = getBasePath(role, "base");

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(searchInput);
  }, [searchInput, onSearchChange]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    onSearchChange(value);
  }, [onSearchChange]);

  const handleDateFilterApply = useCallback(() => {
    const dateFrom = localDateFrom ? new Date(localDateFrom) : undefined;
    const dateTo = localDateTo ? new Date(localDateTo) : undefined;
    onDateFilterChange(dateFrom, dateTo);
  }, [localDateFrom, localDateTo, onDateFilterChange]);

  const handleClearDateFilters = useCallback(() => {
    setLocalDateFrom("");
    setLocalDateTo("");
    onDateFilterChange(undefined, undefined);
  }, [onDateFilterChange]);

  const handleStatusUpdate = useCallback((id: string, status: PurchaseRequestWithRelations['status']) => {
    onStatusUpdate(id, status);
    setDetailOpen(false);
  }, [onStatusUpdate]);

  const toggleRowExpansion = useCallback((prId: string) => {
    setExpandedRows(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(prId)) {
        newExpanded.delete(prId);
      } else {
        newExpanded.add(prId);
      }
      return newExpanded;
    });
  }, []);

  const handleEdit = useCallback((purchaseRequest: PurchaseRequest) => {
    router.push(`${basePath}/update/${purchaseRequest.id}`);
  }, [router, basePath]);

  const handleCreateLpp = useCallback((id: string) => {
    const pr = purchaseRequests.find(pr => pr.id === id);
    if (!pr) {
      console.warn("Purchase Request tidak ditemukan");
      return;
    }

    const allDetails = pr.uangMuka?.flatMap(um =>
      um.pertanggungjawaban?.flatMap(pj => pj.details ?? []) ?? []
    ) ?? [];

    const hasDetails = allDetails.length;
    const pathType = hasDetails ? "edit" : "create";
    const path = getBasePath(role, pathType);
    
    router.push(`${path}${id}`);
  }, [purchaseRequests, role, router]);

  const handleViewPdf = useCallback((pr: PurchaseRequestWithRelations) => {
    setSelectedPurchaseRequest(pr);
    setPdfDialogOpen(true);
  }, []);

  const handleViewDetail = useCallback((pr: PurchaseRequestWithRelations) => {
    setSelectedPR(pr);
    setDetailOpen(true);
  }, []);

  const handleNewRequest = useCallback(() => {
    router.push(`${basePath}/create`);
  }, [router, basePath]);

  return {
    searchInput,
    setSearchInput,
    showFilters,
    setShowFilters,
    localDateFrom,
    setLocalDateFrom,
    localDateTo,
    setLocalDateTo,
    expandedRows,
    selectedPurchaseRequest,
    pdfDialogOpen,
    setPdfDialogOpen,
    detailOpen,
    setDetailOpen,
    selectedPR,
    setSelectedPR,
    basePath,
    router,
    handleSearchSubmit,
    handleSearchChange,
    handleDateFilterApply,
    handleClearDateFilters,
    handleStatusUpdate,
    toggleRowExpansion,
    handleEdit,
    handleCreateLpp,
    handleViewPdf,
    handleViewDetail,
    handleNewRequest,
  };
}