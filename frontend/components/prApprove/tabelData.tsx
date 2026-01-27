"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    FileText,
    Search,
    X,
    Calendar,
    Building,
    User,
    CheckCircle,
    AlertCircle,
    ThumbsUp,
    ThumbsDown,
    Clock,
    Eye,
    Edit,
    Trash2,
    RefreshCw,
    Plus,
    ChevronRight
} from "lucide-react";
import type { UangMuka, UangMukaQueryInput, PaginationInfo, MetodePembayaran } from "@/types/typesUm";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { UMDetailSheet } from "./umDetailSheet";
import { UangMukaDetail, CairkanUangMukaData } from "@/types/typesUm";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateUangMukaStatus } from "@/lib/action/um/actionUm";

export interface UangMukaTableProps {
    uangMukaList: UangMuka[];
    isLoading: boolean;
    isError: boolean;
    role: { id: string };
    pagination: PaginationInfo;
    onDelete: (id: string, options?: {
        onSuccess?: () => void;
        onError?: (error: Error) => void;
    }) => void;
    isDeleting: boolean;
    onRefresh?: () => void;
    onFilterChange?: (filters: UangMukaQueryInput) => void;
    currentFilters?: UangMukaQueryInput;
}

// Status configuration
const statusConfig = {
    PENDING: {
        label: "Pending",
        labelId: "Menunggu",
        icon: Clock,
        color: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800",
        iconColor: "text-yellow-600 dark:text-yellow-400"
    },
    DISBURSED: {
        label: "Disbursed",
        labelId: "Dicairkan",
        icon: CheckCircle,
        color: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
        iconColor: "text-blue-600 dark:text-blue-400"
    },
    SETTLED: {
        label: "Settled",
        labelId: "Terselesaikan",
        icon: ThumbsUp,
        color: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800",
        iconColor: "text-green-600 dark:text-green-400"
    },
    REJECTED: {
        label: "Rejected",
        labelId: "Ditolak",
        icon: ThumbsDown,
        color: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800",
        iconColor: "text-red-600 dark:text-red-400"
    }
};

// Format currency
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

// Format date
const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }).format(new Date(date));
};

// Skeleton Loader
const UangMukaSkeleton = () => {
    return (
        <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
                <Card key={index} className="animate-pulse">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                            <div className="space-y-2 flex-1">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

// Configuration untuk debounce
const DEBOUNCE_DELAY = 800;

export function PrApprovalTable({
    uangMukaList,
    isLoading,
    isError,
    pagination,
    onDelete,
    isDeleting,
    onRefresh,
    onFilterChange,
    currentFilters
}: UangMukaTableProps) {
    const [open, setOpen] = useState(false)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [detailSheetOpen, setDetailSheetOpen] = useState(false);
    const [selectedUangMuka, setSelectedUangMuka] = useState<UangMukaDetail | null>(null);
    const [isCairkanSubmitting, setIsCairkanSubmitting] = useState(false);
    const router = useRouter();

    // Fungsi untuk membuka detail - DIPAKAI untuk membuka detail sheet
    const handleOpenDetail = useCallback((uangMuka: UangMuka) => {
        // Convert UangMuka to UangMukaDetail or use as needed
        const detailData: UangMukaDetail = {
            ...uangMuka,
            // Add any additional properties needed for detail view
        } as UangMukaDetail;

        setSelectedUangMuka(detailData);
        setDetailSheetOpen(true);
    }, []);

    // Fungsi untuk proses pencairan - DIPAKAI dengan data parameter
    const handleCairkanUangMuka = async (data: CairkanUangMukaData) => {
        setIsCairkanSubmitting(true);
        try {
            // Validasi sebelum kirim
            if (!data.existingData?.metodePencairan) {
                throw new Error("Metode pencairan tidak ditemukan");
            }
            await updateUangMukaStatus(
                data.id,
                {
                    status: "DISBURSED",
                    tanggalPencairan: data.tanggalPencairan,
                    buktiPencairan: data.buktiTransaksi,
                    // ✅ TAMBAHKAN FIELD METODE PEMBAYARAN DI SINI
                    metodePencairan: data.existingData.metodePencairan as MetodePembayaran,
                    namaBankTujuan: data.existingData.namaBankTujuan,
                    nomorRekeningTujuan: data.existingData.nomorRekeningTujuan,
                    namaEwalletTujuan: data.existingData.namaEwalletTujuan,
                    accountPencairanId: data.accountPencairanId
                }
                // ❌ HAPUS parameter existingData ketiga
            );

            toast.success("Uang muka berhasil dicairkan");

            // ✅ REFRESH DATA TABEL
            if (onRefresh) {
                onRefresh();
            }

        } catch (error) {
            console.error("Error mencairkan uang muka:", error);
            toast.error("Gagal mencairkan uang muka");
            throw error;
        } finally {
            setIsCairkanSubmitting(false);
        }
    };

    // State untuk local search input
    const [localSearch, setLocalSearch] = useState(currentFilters?.search || "");

    // Initialize filters
    const [filters, setFilters] = useState<UangMukaQueryInput>(() => {
        return currentFilters || {
            page: 1,
            limit: 10,
            search: "",
            status: undefined,
            karyawanId: undefined,
            spkId: undefined,
            startDate: undefined,
            endDate: undefined,
        };
    });

    // Ref untuk debounce timeout
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Sync filters ketika currentFilters berubah dari parent
    useEffect(() => {
        if (currentFilters) {
            setFilters(currentFilters);
            setLocalSearch(currentFilters.search || "");
        }
    }, [currentFilters]);

    // Handle search change dengan debounce yang lebih panjang
    const handleSearchChange = useCallback((search: string) => {
        setLocalSearch(search);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            const newFilters = { ...filters, search, page: 1 };
            setFilters(newFilters);
            onFilterChange?.(newFilters);
        }, DEBOUNCE_DELAY);
    }, [filters, onFilterChange]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    // Handle other filters
    const handleStatusFilter = useCallback((status: UangMukaQueryInput['status']) => {
        const newFilters = { ...filters, status, page: 1 };
        setFilters(newFilters);
        onFilterChange?.(newFilters);
    }, [filters, onFilterChange]);

    const handlePageChange = useCallback((page: number) => {
        const newFilters = { ...filters, page };
        setFilters(newFilters);
        onFilterChange?.(newFilters);
    }, [filters, onFilterChange]);

    const handleLimitChange = useCallback((limit: number) => {
        const newFilters = { ...filters, limit, page: 1 };
        setFilters(newFilters);
        onFilterChange?.(newFilters);
    }, [filters, onFilterChange]);

    const handleDeleteClick = (id: string) => {
        setSelectedId(id)
        setOpen(true)
    }

    const confirmDelete = () => {
        if (selectedId) {
            onDelete(selectedId, {
                onSuccess: () => setOpen(false),
                onError: () => setOpen(false),
            })
        }
    }

    const handleNewRequest = () => {
        router.push("/admin-area/finance/prApprove/create");
    };

    const handleClearFilters = useCallback(() => {
        const newFilters = {
            page: 1,
            limit: 10,
            search: "",
            status: undefined,
            karyawanId: undefined,
            spkId: undefined,
            startDate: undefined,
            endDate: undefined,
        };
        setFilters(newFilters);
        setLocalSearch("");

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        onFilterChange?.(newFilters);
    }, [onFilterChange]);

    // Handle PDF preview - MENGGUNAKAN handleOpenDetail
    const handlePreviewPdf = (uangMuka: UangMuka) => {
        console.log('Preview PDF for:', uangMuka.nomor);
        handleOpenDetail(uangMuka); // Use handleOpenDetail instead of just logging
    };

    // Handle edit - MENGGUNAKAN handleOpenDetail
    const handleEdit = (uangMuka: UangMuka) => {
        console.log('Edit:', uangMuka.nomor);
        handleOpenDetail(uangMuka); // Use handleOpenDetail for edit as well
    };

    const isActionDisabled = (status: string) => {
        return status === "DISBURSED" || status === "SETTLED" || status === "REJECTED";
    };

    if (isLoading) {
        return <UangMukaSkeleton />;
    }

    if (isError) {
        return (
            <Card>
                <CardContent className="p-6 text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                        Error Loading Data
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Failed to load uang muka data. Please try again.
                    </p>
                    {onRefresh && (
                        <Button onClick={onRefresh} variant="outline">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry
                        </Button>
                    )}
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header Mobile Optimized */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-4 md:p-6 rounded-lg">
                <div className="flex flex-col space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Request Approval List</h1>
                            <p className="text-blue-100 text-sm md:text-base mt-1">
                                Manage and track all cash advance requests
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="bg-white/20 text-white text-xs">
                                {pagination.total} Total
                            </Badge>
                            {onRefresh && (
                                <Button
                                    onClick={onRefresh}
                                    variant="secondary"
                                    className="bg-white/20 text-white hover:bg-white/30 border-0 h-8 w-8 p-0"
                                    size="sm"
                                >
                                    <RefreshCw className="h-3 w-3" />
                                </Button>
                            )}
                            <Button
                                className="hidden sm:flex bg-white text-blue-700 hover:bg-blue-50 font-semibold text-sm"
                                onClick={handleNewRequest}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                New Request
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Button - Floating Action Button */}
            <div className="sm:hidden fixed bottom-6 right-6 z-10">
                <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg rounded-full w-14 h-14 p-0 transition-all duration-200"
                    onClick={handleNewRequest}
                >
                    <Plus className="w-6 h-6" />
                </Button>
            </div>

            {/* Filter Section - Mobile Optimized */}
            <Card className="border-0 shadow-sm">
                <CardContent className="p-3 md:p-4">
                    <div className="flex flex-col space-y-3">
                        {/* Search Bar dengan Debounce yang Lebih Panjang */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by nomor, keterangan..."
                                value={localSearch}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="pl-8 md:pl-10 h-9 md:h-10 text-sm"
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                                {isLoading && (
                                    <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-blue-600"></div>
                                )}
                                {localSearch !== (filters.search || "") && !isLoading && (
                                    <div className="flex items-center space-x-1">
                                        <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse"></div>
                                        <span className="text-xs text-yellow-600 font-medium">
                                            {DEBOUNCE_DELAY / 1000}s
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info debounce status dengan detail waktu */}
                        {localSearch !== (filters.search || "") && (
                            <div className="text-xs text-yellow-600 bg-yellow-50 px-3 py-2 rounded-md border border-yellow-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                                        <span>⏳ Menunggu input selesai...</span>
                                    </div>
                                    <span className="font-semibold">{DEBOUNCE_DELAY / 1000} detik</span>
                                </div>
                                <div className="mt-1 text-yellow-500 text-xs">
                                    Pencarian akan otomatis dilakukan setelah {DEBOUNCE_DELAY / 1000} detik tidak ada input
                                </div>
                            </div>
                        )}

                        {/* Advanced Filters */}
                        <div className="flex flex-col sm:flex-row gap-2">
                            <div className="flex gap-2 flex-1">
                                <Select
                                    value={filters.status || ""}
                                    onValueChange={(value) => handleStatusFilter(value as UangMukaQueryInput['status'])}
                                >
                                    <SelectTrigger className="h-9 text-xs md:text-sm flex-1">
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PENDING" className="text-xs">Pending</SelectItem>
                                        <SelectItem value="DISBURSED" className="text-xs">Disbursed</SelectItem>
                                        <SelectItem value="SETTLED" className="text-xs">Settled</SelectItem>
                                        <SelectItem value="REJECTED" className="text-xs">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={filters.limit?.toString() || "10"}
                                    onValueChange={(value) => handleLimitChange(Number(value))}
                                >
                                    <SelectTrigger className="h-9 text-xs md:text-sm w-[100px]">
                                        <SelectValue placeholder="Items" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="5" className="text-xs">5 items</SelectItem>
                                        <SelectItem value="10" className="text-xs">10 items</SelectItem>
                                        <SelectItem value="20" className="text-xs">20 items</SelectItem>
                                        <SelectItem value="50" className="text-xs">50 items</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {(filters.search || filters.status) && (
                                <Button
                                    variant="outline"
                                    onClick={handleClearFilters}
                                    className="h-9 text-xs"
                                    size="sm"
                                >
                                    <X className="h-3 w-3 mr-1" />
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Desktop Table */}
            <div className="hidden lg:block">
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-0">
                        <div className="rounded-md border">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-muted/50 dark:bg-muted/20 border-b">
                                        <th className="p-3 text-left font-semibold text-sm">No</th>
                                        <th className="p-3 text-left font-semibold text-sm">Req. Approval Number</th>
                                        <th className="p-3 text-left font-semibold text-sm">PR Number</th>
                                        <th className="p-3 text-left font-semibold text-sm">SPK Number</th>
                                        <th className="p-3 text-left font-semibold text-sm">Sales Order Number</th>
                                        <th className="p-3 text-left font-semibold text-sm">Project</th>
                                        <th className="p-3 text-left font-semibold text-sm">Karyawan</th>
                                        <th className="p-3 text-left font-semibold text-sm">Tanggal</th>
                                        <th className="p-3 text-left font-semibold text-sm">Jumlah</th>
                                        <th className="p-3 text-left font-semibold text-sm">Status</th>
                                        <th className="p-3 text-right font-semibold text-sm">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {uangMukaList.map((item, index) => {
                                        const status = statusConfig[item.status as keyof typeof statusConfig];
                                        const StatusIcon = status?.icon || FileText;

                                        return (
                                            <tr key={item.id} className="border-b hover:bg-muted/50 dark:hover:bg-muted/20 transition-colors">
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-sm">{index + 1}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-3 w-3 text-blue-500" />
                                                        <span className="font-medium text-sm">{item.nomor}</span>
                                                        <ChevronRight className="h-4 w-4 text-blue-500" />
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-3 w-3 text-blue-500" />
                                                        <span className="text-sm text-gray-500">{item.purchaseRequest?.nomorPr}</span>
                                                        <ChevronRight className="h-4 w-4 text-blue-500" />
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-3 w-3 text-blue-500" />
                                                        <span className="text-sm text-gray-500">{item.spk?.spkNumber}</span>
                                                        <ChevronRight className="h-4 w-4 text-blue-500" />
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-3 w-3 text-blue-500" />
                                                        <span className="text-sm text-gray-500">{item.spk?.salesOrder.soNumber}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        <Building className="h-3 w-3 text-green-500" />
                                                        <span className="text-sm font-bold uppercase">{item.spk?.salesOrder?.project?.name || 'N/A'}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-3 w-3 text-purple-500" />
                                                        <span className="text-sm">{item.karyawan?.namaLengkap || 'N/A'}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-3 w-3 text-orange-500" />
                                                        <span className="text-sm">{formatDate(item.tanggalPengajuan)}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3 font-semibold text-sm">
                                                    {formatCurrency(item.jumlah)}
                                                </td>
                                                <td className="p-3">
                                                    <Badge
                                                        variant="outline"
                                                        className={`${status?.color} border font-medium flex items-center gap-1 text-sm`}
                                                    >
                                                        <StatusIcon className={`h-3 w-3 ${status?.iconColor}`} />
                                                        {status?.labelId}
                                                    </Badge>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex flex-col gap-1 items-end">
                                                        <Button
                                                            onClick={() => handlePreviewPdf(item)}
                                                            variant="default"
                                                            size="sm"
                                                            disabled={isActionDisabled(item.status)}
                                                            className={`flex items-center gap-1 transition-colors cursor-pointer w-44 h-8 justify-start px-2 rounded-xl shadow-sm ${isActionDisabled(item.status)
                                                                    ? "bg-slate-300 text-slate-500 cursor-not-allowed border-none shadow-none"
                                                                    : "bg-blue-600 text-white hover:bg-blue-700 border-none"
                                                                }`}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                            Approve Pencairan
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleEdit(item)}
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={isActionDisabled(item.status)}
                                                            className="flex items-center gap-1 text-orange-600 hover:text-orange-700 border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-900/20 dark:hover:border-orange-400 transition-colors disabled:opacity-50 cursor-pointer w-44 h-8 justify-start px-2 rounded-xl"
                                                            hidden>
                                                            <Edit className="h-4 w-4" />
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleDeleteClick(item.id)}
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={isDeleting || isActionDisabled(item.status)}
                                                            className="flex items-center gap-1 text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20 dark:hover:border-red-400 transition-colors disabled:opacity-50 cursor-pointer w-44 h-8 justify-start px-2 rounded-xl"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Mobile Card View - Professional Design */}
            <div className="lg:hidden space-y-3">
                {uangMukaList.map((item) => {
                    const status = statusConfig[item.status as keyof typeof statusConfig];
                    const StatusIcon = status?.icon || FileText;

                    return (
                        <Card key={item.id} className="border-0 shadow-sm hover:shadow-md transition-all duration-200">
                            <CardContent className="p-3">
                                {/* Header dengan Nomor dan Status */}
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <FileText className="h-3 w-3 text-blue-500 flex-shrink-0 mt-0.5" />
                                        <span className="font-semibold text-sm truncate">{item.nomor}</span>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={`${status?.color} border font-medium text-xs flex items-center gap-1`}
                                    >
                                        <StatusIcon className={`h-2.5 w-2.5 ${status?.iconColor}`} />
                                        {status?.label}
                                    </Badge>
                                </div>

                                {/* Details Grid Compact */}
                                <div className="grid grid-cols-1 gap-1.5 text-xs mb-3">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Building className="h-3 w-3 text-green-500 flex-shrink-0" />
                                        <span className="truncate">{item.spk?.salesOrder?.project?.name || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <User className="h-3 w-3 text-purple-500 flex-shrink-0" />
                                        <span className="truncate">{item.karyawan?.namaLengkap || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Calendar className="h-3 w-3 text-orange-500 flex-shrink-0" />
                                        <span>{formatDate(item.tanggalPengajuan)}</span>
                                    </div>
                                </div>

                                {/* Amount dan Actions */}
                                <div className="flex justify-between items-center pt-2 border-t">
                                    <div className="font-semibold text-sm text-gray-900">
                                        {formatCurrency(item.jumlah)}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <Button
                                            onClick={() => handlePreviewPdf(item)}
                                            variant="default"
                                            size="sm"
                                            disabled={isActionDisabled(item.status)}
                                            className={`flex items-center gap-1 transition-colors cursor-pointer w-full h-8 justify-start px-2 rounded-xl shadow-sm ${isActionDisabled(item.status)
                                                    ? "bg-slate-300 text-slate-500 cursor-not-allowed border-none shadow-none"
                                                    : "bg-blue-600 text-white hover:bg-blue-700 border-none"
                                                }`}
                                        >
                                            <Eye className="h-4 w-4" />
                                            Approve Pencairan
                                        </Button>
                                        <Button
                                            onClick={() => handleEdit(item)}
                                            variant="outline"
                                            size="sm"
                                            disabled={isActionDisabled(item.status)}
                                            className="flex items-center gap-1 text-orange-600 hover:text-orange-700 border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-900/20 dark:hover:border-orange-400 transition-colors disabled:opacity-50 cursor-pointer w-full h-8 justify-start px-2 rounded-xl"
                                            hidden >
                                            <Edit className="h-4 w-4" />
                                            Edit
                                        </Button>
                                        <Button
                                            onClick={() => handleDeleteClick(item.id)}
                                            variant="outline"
                                            size="sm"
                                            disabled={isDeleting || isActionDisabled(item.status)}
                                            className="flex items-center gap-1 text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20 dark:hover:border-red-400 transition-colors disabled:opacity-50 cursor-pointer w-full h-8 justify-start px-2 rounded-xl"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Pagination - Mobile Optimized */}
            {uangMukaList.length > 0 && (
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-3 md:p-4">
                        <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
                            {/* Page Info */}
                            <div className="text-xs text-muted-foreground">
                                Page {pagination.page} of {pagination.totalPages} • {pagination.total} items
                            </div>

                            {/* Pagination Controls */}
                            <div className="flex items-center space-x-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page <= 1}
                                    className="h-8 text-xs"
                                >
                                    Prev
                                </Button>

                                <div className="flex items-center space-x-1">
                                    {Array.from({ length: Math.min(3, pagination.totalPages) }, (_, i) => {
                                        const pageNum = i + 1;
                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={pagination.page === pageNum ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => handlePageChange(pageNum)}
                                                className="h-8 w-8 p-0 text-xs"
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                    {pagination.totalPages > 3 && (
                                        <>
                                            <span className="px-1 text-xs">...</span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePageChange(pagination.totalPages)}
                                                className="h-8 w-8 p-0 text-xs"
                                            >
                                                {pagination.totalPages}
                                            </Button>
                                        </>
                                    )}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page >= pagination.totalPages}
                                    className="h-8 text-xs"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Empty State */}
            {uangMukaList.length === 0 && !isLoading && (
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-6 text-center">
                        <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                            No Requests Found
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                            {filters.search || filters.status
                                ? "Try adjusting your search or filters"
                                : "No cash advance requests available"}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-semibold">Konfirmasi Hapus</DialogTitle>
                        <DialogDescription className="text-xs">
                            Aksi ini tidak dapat dibatalkan. Data yang dihapus akan hilang secara permanen.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="flex flex-row gap-2 justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                            className="h-9 text-xs"
                            size="sm"
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={isDeleting}
                            className="h-9 text-xs"
                            size="sm"
                        >
                            {isDeleting ? "Menghapus..." : "Hapus"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <UMDetailSheet
                open={detailSheetOpen}
                onOpenChange={setDetailSheetOpen}
                data={selectedUangMuka}
                onCairkan={handleCairkanUangMuka}
                isSubmitting={isCairkanSubmitting}
            />
        </div>
    );
}