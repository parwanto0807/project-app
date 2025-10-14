"use client";

import { useState, Fragment } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    FileText,
    Search,
    Filter,
    X,
    Calendar,
    Building,
    User,
    CheckCircle,
    AlertCircle,
    ThumbsUp,
    ThumbsDown,
    Clock,
} from "lucide-react";
import { PurchaseRequest, PurchaseRequestFilters } from "@/types/pr";
import { PaginationInfo } from "@/types/pr";
import SimplePurchaseRequestPdfDialog from "../pr/prPdfDialog"
import { PurchaseRequestSheet } from "./statusActions";

interface PurchaseRequestTableProps {
    purchaseRequests: PurchaseRequest[];
    isLoading: boolean;
    isError: boolean;
    role: "admin" | "user";
    pagination: PaginationInfo;
    onDelete: (id: string) => void;
    isDeleting: boolean;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
    onSearchChange: (search: string) => void;
    onStatusFilterChange: (status: PurchaseRequestFilters['status']) => void;
    onProjectFilterChange: (projectId: string) => void;
    onDateFilterChange: (dateFrom?: Date, dateTo?: Date) => void;
    onClearFilters: () => void;
    onStatusUpdate: (id: string, status: PurchaseRequest['status']) => void;
    currentSearch?: string;
    currentStatus?: PurchaseRequestFilters['status'];
    currentProjectId?: string;
    currentDateFrom?: Date;
    currentDateTo?: Date;
}

// Update status colors dan labels sesuai model baru
// Tambahkan di bagian styles/constants Anda
const statusColors = {
    DRAFT: "bg-gray-100 text-gray-800 border-gray-300",
    SUBMITTED: "bg-blue-50 text-blue-700 border-blue-200",
    APPROVED: "bg-green-50 text-green-700 border-green-200",
    REJECTED: "bg-red-50 text-red-700 border-red-200",
    REVISION_NEEDED: "bg-yellow-50 text-yellow-700 border-yellow-200",
    COMPLETED: "bg-purple-50 text-purple-700 border-purple-200",
    IN_PROGRESS: "bg-orange-50 text-orange-700 border-orange-200"
} as const;

// Atau versi dengan gradient subtle
const statusLabels = {
    DRAFT: "Draft",
    REVISION_NEEDED: "Revision Needed",
    SUBMITTED: "Submitted",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    COMPLETED: "Completed",
};

const statusIcons = {
    DRAFT: Clock,
    REVISION_NEEDED: AlertCircle,
    SUBMITTED: CheckCircle,
    APPROVED: ThumbsUp,
    REJECTED: ThumbsDown,
    COMPLETED: CheckCircle,
};

const PdfIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 0 24 24"
        {...props}
    >
        <path d="M6 2a2 2 0 0 0-2 2v16c0 1.103.897 2 2 2h12a2 2 0 0 0 2-2V8l-6-6H6z" />
        <path fill="#fff" d="M14 2v6h6" />
        <text
            x="7"
            y="18"
            fill="red"
            fontSize="8"
            fontWeight="bold"
            fontFamily="Arial, sans-serif"
        >
            Preview Pdf
        </text>
    </svg>
);

export function PurchaseRequestVerifyTable({
    purchaseRequests,
    isLoading,
    isError,
    role,
    pagination,
    onPageChange,
    onLimitChange,
    onSearchChange,
    onStatusFilterChange,
    onProjectFilterChange,
    onDateFilterChange,
    onClearFilters,
    onStatusUpdate,
    currentSearch = "",
    currentStatus,
    currentProjectId,
    currentDateFrom,
    currentDateTo,
}: PurchaseRequestTableProps) {
    const [searchInput, setSearchInput] = useState(currentSearch);
    const [showFilters, setShowFilters] = useState(false);
    const [localDateFrom, setLocalDateFrom] = useState<string>(currentDateFrom?.toISOString().split('T')[0] || "");
    const [localDateTo, setLocalDateTo] = useState<string>(currentDateTo?.toISOString().split('T')[0] || "");
    const [selectedPurchaseRequest, setSelectedPurchaseRequest] = useState<PurchaseRequest | null>(null);
    const [detailSheetOpen, setDetailSheetOpen] = useState(false);
    const [pdfDialogOpen, setPdfDialogOpen] = useState(false);

    // console.log("DATA PR", purchaseRequests)

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearchChange(searchInput);
    };

    const handleSearchChange = (value: string) => {
        setSearchInput(value);
        onSearchChange(value);
    };

    const handleDateFilterApply = () => {
        const dateFrom = localDateFrom ? new Date(localDateFrom) : undefined;
        const dateTo = localDateTo ? new Date(localDateTo) : undefined;
        onDateFilterChange(dateFrom, dateTo);
    };

    const handleClearDateFilters = () => {
        setLocalDateFrom("");
        setLocalDateTo("");
        onDateFilterChange(undefined, undefined);
    };

    const handleViewDetail = (pr: PurchaseRequest) => {
        setSelectedPurchaseRequest(pr);
        setDetailSheetOpen(true);
    };

    const handleStatusUpdate = (id: string, status: PurchaseRequest['status']) => {
        onStatusUpdate(id, status);
        setDetailSheetOpen(false);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    // Safe date formatting function
    const formatDate = (date: Date | string | null | undefined): string => {
        if (!date) return '-';

        try {
            const dateObj = typeof date === 'string' ? new Date(date) : date;
            if (isNaN(dateObj.getTime())) return '-';

            return new Intl.DateTimeFormat('id-ID', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            }).format(dateObj);
        } catch (error) {
            console.error('Error formatting date:', error);
            return '-';
        }
    };

    const handleViewPdf = (pr: PurchaseRequest) => {
        setSelectedPurchaseRequest(pr);
        setPdfDialogOpen(true);
    };

    const totalPages = Math.ceil(pagination.total / pagination.limit);

    // Extract unique projects from purchase requests
    const projects = Array.from(new Map(
        purchaseRequests
            .filter(pr => pr.project?.name)
            .map(pr => [pr.projectId, {
                id: pr.projectId,
                name: pr.project?.name || pr.projectId
            }])
    ).values());

    if (isError) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-center text-red-500">
                        <p>Failed to load purchase requests</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            {/* Header dengan Gradient - Mobile Responsive */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-4 sm:p-6 rounded-lg">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold">Verify Purchase Requests</h1>
                        <p className="text-blue-100 mt-1 text-sm sm:text-base">
                            {role === "admin"
                                ? "Manage and track all purchase requests"
                                : "View and manage your purchase requests"}
                        </p>
                    </div>
                </div>
            </div>

            <Card className="w-full">
                <CardHeader className="p-4 sm:px-4">
                    {/* Search and Filters */}
                    <div className="flex flex-col space-y-4">
                        {/* Search Form */}
                        <form onSubmit={handleSearchSubmit} className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by PR number, project, or description..."
                                    value={searchInput}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    className="pl-10 pr-4 py-2 text-sm sm:text-base"
                                />
                            </div>
                        </form>

                        {/* Filters Section */}
                        <div className="flex flex-col space-y-2">
                            <div className="flex flex-col sm:flex-row gap-2 justify-between">
                                <div className="flex flex-col sm:flex-row gap-2 flex-1">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowFilters(!showFilters)}
                                        className="whitespace-nowrap text-xs sm:text-sm"
                                    >
                                        <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                        Date Filter
                                    </Button>
                                    <Select
                                        value={currentStatus || ""}
                                        onValueChange={(value) => onStatusFilterChange(value as PurchaseRequestFilters['status'])}
                                    >
                                        <SelectTrigger className="w-full sm:w-[180px] text-xs sm:text-sm">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="DRAFT" className="text-xs sm:text-sm">Draft</SelectItem>
                                            <SelectItem value="REVISION_NEEDED" className="text-xs sm:text-sm">Revision Needed</SelectItem>
                                            <SelectItem value="SUBMITTED" className="text-xs sm:text-sm">Submited</SelectItem>
                                            <SelectItem value="APPROVED" className="text-xs sm:text-sm">Approved</SelectItem>
                                            <SelectItem value="REJECTED" className="text-xs sm:text-sm">Rejected</SelectItem>
                                            <SelectItem value="COMPLETED" className="text-xs sm:text-sm">Completed</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={currentProjectId || ""}
                                        onValueChange={(value) => onProjectFilterChange(value)}
                                    >
                                        <SelectTrigger className="w-full sm:w-[180px] text-xs sm:text-sm">
                                            <SelectValue placeholder="Project" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {projects.map((project) => (
                                                <SelectItem key={project.id} value={project.id} className="text-xs sm:text-sm">
                                                    {project.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        variant="outline"
                                        onClick={onClearFilters}
                                        className="whitespace-nowrap text-xs sm:text-sm"
                                    >
                                        <X className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                        Clear All
                                    </Button>
                                </div>
                            </div>

                            {/* Date Filters */}
                            {showFilters && (
                                <div className="flex flex-col sm:flex-row gap-4 p-3 sm:p-4 border rounded-lg bg-muted/50">
                                    <div className="flex flex-col sm:flex-row gap-2 flex-1">
                                        <div className="flex flex-col space-y-2 flex-1">
                                            <label className="text-xs sm:text-sm font-medium">From Date</label>
                                            <Input
                                                type="date"
                                                value={localDateFrom}
                                                onChange={(e) => setLocalDateFrom(e.target.value)}
                                                className="w-full text-xs sm:text-sm"
                                            />
                                        </div>
                                        <div className="flex flex-col space-y-2 flex-1">
                                            <label className="text-xs sm:text-sm font-medium">To Date</label>
                                            <Input
                                                type="date"
                                                value={localDateTo}
                                                onChange={(e) => setLocalDateTo(e.target.value)}
                                                className="w-full text-xs sm:text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <Button
                                            onClick={handleDateFilterApply}
                                            className="whitespace-nowrap text-xs sm:text-sm"
                                        >
                                            Apply Dates
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={handleClearDateFilters}
                                            className="whitespace-nowrap text-xs sm:text-sm"
                                        >
                                            Clear Dates
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-1 sm:px-4">
                    {/* Desktop Table */}
                    <div className="hidden lg:block rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="font-semibold">PR Number</TableHead>
                                    <TableHead className="font-semibold">Project</TableHead>
                                    <TableHead className="font-semibold">SPK</TableHead>
                                    <TableHead className="font-semibold">Requested By</TableHead>
                                    <TableHead className="font-semibold">Request Date</TableHead>
                                    <TableHead className="font-semibold">Total Amount</TableHead>
                                    <TableHead className="font-semibold">Status</TableHead>
                                    <TableHead className="font-semibold text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, index) => (
                                        <TableRow key={`skeleton-${index}`}>
                                            <TableCell>
                                                <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                                            </TableCell>
                                            <TableCell>
                                                <div className="h-4 bg-muted rounded w-32 animate-pulse" />
                                            </TableCell>
                                            <TableCell>
                                                <div className="h-4 bg-muted rounded w-28 animate-pulse" />
                                            </TableCell>
                                            <TableCell>
                                                <div className="h-4 bg-muted rounded w-20 animate-pulse" />
                                            </TableCell>
                                            <TableCell>
                                                <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                                            </TableCell>
                                            <TableCell>
                                                <div className="h-4 bg-muted rounded w-20 animate-pulse" />
                                            </TableCell>
                                            <TableCell>
                                                <div className="h-6 bg-muted rounded w-16 animate-pulse" />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-2">
                                                    <div className="h-8 bg-muted rounded w-20 animate-pulse" />
                                                    <div className="h-8 bg-muted rounded w-20 animate-pulse" />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : purchaseRequests.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8">
                                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                <FileText className="h-12 w-12 mb-4 text-gray-300" />
                                                <p className="text-lg font-medium">No purchase requests found</p>
                                                <p className="text-sm mt-1">
                                                    {currentSearch || currentStatus || currentProjectId || currentDateFrom
                                                        ? "Try adjusting your search or filters"
                                                        : "No purchase requests available"}
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    purchaseRequests.map((pr) => {
                                        const cleanNumber = (value: string | number | null | undefined): number => {
                                            if (typeof value === "string") {
                                                return Number(value.replace(/\D/g, "")) || 0;
                                            }
                                            return typeof value === "number" ? value : 0;
                                        };

                                        const totalAmount = pr.details?.reduce(
                                            (sum, detail) => sum + cleanNumber(detail.estimasiTotalHarga),
                                            0
                                        ) ?? 0;

                                        const StatusIcon = statusIcons[pr.status];

                                        return (
                                            <TableRow
                                                key={pr.id}
                                                className="hover:bg-muted/50 transition-colors"
                                            >
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-blue-500" />
                                                        {pr.nomorPr}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Building className="h-4 w-4 text-green-500" />
                                                        <span className="text-wrap">
                                                            {pr.project?.name || pr.projectId}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm text-muted-foreground">
                                                        {pr.spk?.spkNumber || pr.spkId}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-purple-500" />
                                                        {pr.karyawan?.namaLengkap || pr.karyawanId}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-orange-500" />
                                                        {formatDate(pr.tanggalPr)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-semibold">
                                                    {formatCurrency(totalAmount)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={`${statusColors[pr.status]} border font-medium text-xs flex items-center gap-1`}
                                                    >
                                                        <StatusIcon className="h-3 w-3" />
                                                        {statusLabels[pr.status]}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            onClick={() => handleViewPdf(pr)}
                                                            className="flex items-center gap-1 text-red-600 hover:text-red-800 border px-2 py-1 cursor-pointer rounded text-sm bg-slate-300 hover:bg-white"
                                                        >
                                                            <PdfIcon className="w-4 h-4" />
                                                            Preview PDF
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleViewDetail(pr)}
                                                            className="flex items-center gap-1 bg-blue-600 text-white hover:bg-blue-700 border px-2 py-1 cursor-pointer rounded text-sm"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                            Verify
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden space-y-3">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, index) => (
                                <Card key={`skeleton-mobile-${index}`} className="animate-pulse">
                                    <CardContent className="p-3 space-y-2">
                                        <div className="h-3 bg-muted rounded w-3/4" />
                                        <div className="h-3 bg-muted rounded w-1/2" />
                                        <div className="h-3 bg-muted rounded w-2/3" />
                                        <div className="h-4 bg-muted rounded w-16" />
                                    </CardContent>
                                </Card>
                            ))
                        ) : purchaseRequests.length === 0 ? (
                            <Card>
                                <CardContent className="p-4 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                        <FileText className="h-8 w-8 sm:h-12 sm:w-12 mb-3 text-gray-300" />
                                        <p className="text-base sm:text-lg font-medium">No purchase requests found</p>
                                        <p className="text-xs sm:text-sm mt-1">
                                            {currentSearch || currentStatus || currentProjectId || currentDateFrom
                                                ? "Try adjusting your search or filters"
                                                : "No purchase requests available"}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            purchaseRequests.map((pr) => {
                                const totalAmount = pr.details?.reduce((sum, detail) =>
                                    sum + Number(detail.estimasiTotalHarga || 0), 0
                                ) || 0;

                                const StatusIcon = statusIcons[pr.status];

                                return (
                                    <Card
                                        key={pr.id}
                                        className="hover:shadow-md transition-shadow"
                                    >
                                        <CardContent className="p-3 space-y-2">
                                            {/* Header */}
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="flex items-center gap-1 flex-1 min-w-0">
                                                    <FileText className="h-3 w-3 text-blue-500 flex-shrink-0" />
                                                    <span className="font-semibold text-sm truncate">
                                                        {pr.nomorPr}
                                                    </span>
                                                </div>
                                                <Badge
                                                    variant="outline"
                                                    className={`${statusColors[pr.status]} border font-medium text-xs px-1 py-0 flex items-center gap-1`}
                                                >
                                                    <StatusIcon className="h-2 w-2" />
                                                    {statusLabels[pr.status]}
                                                </Badge>
                                            </div>

                                            {/* Project and SPK - Compact */}
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="space-y-1">
                                                    <p className="font-medium text-muted-foreground">Project</p>
                                                    <div className="flex items-center gap-1">
                                                        <Building className="h-3 w-3 text-green-500 flex-shrink-0" />
                                                        <span className="truncate text-xs">
                                                            {pr.project?.name || pr.projectId}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="font-medium text-muted-foreground">SPK</p>
                                                    <div className="text-xs truncate">
                                                        {pr.spk?.spkNumber || pr.spkId}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Requester and Date - Compact */}
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="space-y-1">
                                                    <p className="font-medium text-muted-foreground">Requested By</p>
                                                    <div className="flex items-center gap-1">
                                                        <User className="h-3 w-3 text-purple-500 flex-shrink-0" />
                                                        <span className="truncate text-xs">
                                                            {pr.karyawan?.namaLengkap || pr.karyawanId}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="font-medium text-muted-foreground">Date</p>
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3 text-orange-500 flex-shrink-0" />
                                                        <span className="text-xs">{formatDate(pr.tanggalPr)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Amount */}
                                            <div className="text-xs">
                                                <p className="font-medium text-muted-foreground">Total Amount</p>
                                                <p className="font-semibold text-sm">
                                                    {formatCurrency(totalAmount)}
                                                </p>
                                            </div>

                                            {/* Actions - Compact */}
                                            <div className="flex justify-end gap-1 pt-2 border-t">
                                                <Button
                                                    onClick={() => handleViewPdf(pr)}
                                                    className="flex items-center gap-1 text-red-600 hover:text-red-800 border px-2 py-1 rounded text-xs h-7"
                                                >
                                                    <PdfIcon className="w-3 h-3" />
                                                    PDF
                                                </Button>
                                                <Button
                                                    onClick={() => handleViewDetail(pr)}
                                                    className="flex items-center gap-1 bg-blue-600 text-white hover:bg-blue-700 border px-2 py-1 rounded text-xs h-7"
                                                >
                                                    <CheckCircle className="w-3 h-3" />
                                                    Verify
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })
                        )}
                    </div>

                    {/* Pagination - Mobile Responsive */}
                    {!isLoading && purchaseRequests.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0 pt-4">
                            {/* Items per page */}
                            <div className="flex items-center space-x-2">
                                <span className="text-xs sm:text-sm text-muted-foreground">Items per page:</span>
                                <Select
                                    value={pagination.limit.toString()}
                                    onValueChange={(value) => onLimitChange(Number(value))}
                                >
                                    <SelectTrigger className="w-16 sm:w-20 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="5" className="text-xs">5</SelectItem>
                                        <SelectItem value="10" className="text-xs">10</SelectItem>
                                        <SelectItem value="20" className="text-xs">20</SelectItem>
                                        <SelectItem value="50" className="text-xs">50</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Page info */}
                            <div className="text-xs sm:text-sm text-muted-foreground text-center">
                                Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                                {pagination.total} entries
                            </div>

                            {/* Pagination controls */}
                            <div className="flex items-center space-x-1 sm:space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onPageChange(pagination.page - 1)}
                                    disabled={pagination.page <= 1}
                                    className="h-8 px-2 text-xs"
                                >
                                    Prev
                                </Button>

                                {/* Page numbers */}
                                <div className="flex items-center space-x-1">
                                    {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                                        const pageNum = i + 1;
                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={pagination.page === pageNum ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => onPageChange(pageNum)}
                                                className="w-7 h-7 p-0 text-xs"
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                    {totalPages > 3 && (
                                        <>
                                            <span className="px-1 text-xs">...</span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onPageChange(totalPages)}
                                                className="w-7 h-7 p-0 text-xs"
                                            >
                                                {totalPages}
                                            </Button>
                                        </>
                                    )}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onPageChange(pagination.page + 1)}
                                    disabled={pagination.page >= totalPages}
                                    className="h-8 px-2 text-xs"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <PurchaseRequestSheet
                detailSheetOpen={detailSheetOpen}
                setDetailSheetOpen={setDetailSheetOpen}
                selectedPurchaseRequest={selectedPurchaseRequest}
                onStatusUpdate={handleStatusUpdate}
            />

            <SimplePurchaseRequestPdfDialog
                purchaseRequest={selectedPurchaseRequest}
                open={pdfDialogOpen}
                onOpenChange={setPdfDialogOpen}
            />
        </>
    );
}