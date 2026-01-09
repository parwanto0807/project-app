"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis,
} from "@/components/ui/pagination";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Plus,
    Search,
    Edit,
    Trash2,
    FileText,
    DollarSign,
    TrendingUp,
    CreditCard,
    Building,
    BarChart3,
    Package,
    Lock,
    Unlock,
    Folder,
    File,
    Calculator,
    Receipt,
    Filter,
    ChevronRight,
    ChevronDown,
    CheckCircle2,
    XCircle,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChartOfAccountsWithRelations, CoaCashflowType } from "@/types/coa";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Types berdasarkan enum yang Anda berikan
enum CoaType {
    ASET = "ASET",
    LIABILITAS = "LIABILITAS",
    EKUITAS = "EKUITAS",
    PENDAPATAN = "PENDAPATAN",
    HPP = "HPP",
    BEBAN = "BEBAN"
}

enum CoaNormalBalance {
    DEBIT = "DEBIT",
    CREDIT = "CREDIT"
}

enum CoaPostingType {
    HEADER = "HEADER",
    POSTING = "POSTING"
}

enum CoaStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    LOCKED = "LOCKED"
}

// Utility functions untuk icons dan colors
const getCoaTypeIcon = (type: CoaType) => {
    switch (type) {
        case CoaType.ASET:
            return <TrendingUp className="h-4 w-4 text-green-600" />;
        case CoaType.LIABILITAS:
            return <CreditCard className="h-4 w-4 text-red-600" />;
        case CoaType.EKUITAS:
            return <Building className="h-4 w-4 text-blue-600" />;
        case CoaType.PENDAPATAN:
            return <DollarSign className="h-4 w-4 text-emerald-600" />;
        case CoaType.HPP:
            return <Package className="h-4 w-4 text-orange-600" />;
        case CoaType.BEBAN:
            return <BarChart3 className="h-4 w-4 text-purple-600" />;
        default:
            return <FileText className="h-4 w-4 text-gray-600" />;
    }
};

const getCoaTypeColor = (type: CoaType) => {
    switch (type) {
        case CoaType.ASET:
            return "bg-green-100 text-green-800 border-green-200";
        case CoaType.LIABILITAS:
            return "bg-red-100 text-red-800 border-red-200";
        case CoaType.EKUITAS:
            return "bg-blue-100 text-blue-800 border-blue-200";
        case CoaType.PENDAPATAN:
            return "bg-emerald-100 text-emerald-800 border-emerald-200";
        case CoaType.HPP:
            return "bg-orange-100 text-orange-800 border-orange-200";
        case CoaType.BEBAN:
            return "bg-purple-100 text-purple-800 border-purple-200";
        default:
            return "bg-gray-100 text-gray-800 border-gray-200";
    }
};

const getPostingTypeIcon = (postingType: CoaPostingType) => {
    return postingType === CoaPostingType.HEADER
        ? <Folder className="h-4 w-4 text-amber-600" />
        : <File className="h-4 w-4 text-indigo-600" />;
};

const getCashflowIcon = (cashflowType: CoaCashflowType) => {
    switch (cashflowType) {
        case CoaCashflowType.OPERASIONAL:
            return <Calculator className="h-4 w-4 text-blue-600" />;
        case CoaCashflowType.INVESTASI:
            return <TrendingUp className="h-4 w-4 text-green-600" />;
        case CoaCashflowType.PENDANAAN:
            return <DollarSign className="h-4 w-4 text-purple-600" />;
        case CoaCashflowType.NONE:
            return <Receipt className="h-4 w-4 text-gray-600" />;
        default:
            return <Receipt className="h-4 w-4 text-gray-600" />;
    }
};

const getStatusIcon = (status: CoaStatus) => {
    switch (status) {
        case CoaStatus.ACTIVE:
            return <Unlock className="h-4 w-4 text-green-600" />;
        case CoaStatus.INACTIVE:
            return <Lock className="h-4 w-4 text-gray-600" />;
        case CoaStatus.LOCKED:
            return <Lock className="h-4 w-4 text-red-600" />;
        default:
            return <Lock className="h-4 w-4 text-gray-600" />;
    }
};

const getStatusColor = (status: CoaStatus) => {
    switch (status) {
        case CoaStatus.ACTIVE:
            return "bg-green-100 text-green-800 border-green-200";
        case CoaStatus.INACTIVE:
            return "bg-gray-100 text-gray-800 border-gray-200";
        case CoaStatus.LOCKED:
            return "bg-red-100 text-red-800 border-red-200";
        default:
            return "bg-gray-100 text-gray-800 border-gray-200";
    }
};

const getCashflowColor = (cashflowType: CoaCashflowType) => {
    switch (cashflowType) {
        case CoaCashflowType.OPERASIONAL:
            return "bg-blue-100 text-blue-800 border-blue-200";
        case CoaCashflowType.INVESTASI:
            return "bg-green-100 text-green-800 border-green-200";
        case CoaCashflowType.PENDANAAN:
            return "bg-purple-100 text-purple-800 border-purple-200";
        case CoaCashflowType.NONE:
            return "bg-gray-100 text-gray-800 border-gray-200";
        default:
            return "bg-gray-100 text-gray-800 border-gray-200";
    }
};

interface CoaTableProps {
    coas: ChartOfAccountsWithRelations[];
    isLoading: boolean;
    isError: boolean;
    role: string;
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
    onDelete: (id: string, options?: { onSuccess?: () => void }) => void;
    isDeleting: boolean;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
    onSearchChange: (search: string) => void;
    currentSearch: string;
}

export function CoaTable({
    coas,
    isLoading,
    isError,
    role,
    pagination,
    onDelete,
    isDeleting,
    onPageChange,
    onLimitChange,
    onSearchChange,
    currentSearch,
}: CoaTableProps) {
    const [localSearchTerm, setLocalSearchTerm] = useState(currentSearch || "");
    const router = useRouter();
    console.log("Role", role)
    // Debounce search untuk menghindari terlalu banyak request
    const handleSearchChange = (value: string) => {
        setLocalSearchTerm(value);
        // Trigger search dengan delay
        const timeoutId = setTimeout(() => {
            onSearchChange(value);
        }, 500);

        return () => clearTimeout(timeoutId);
    };

    const handleItemsPerPageChange = (value: string) => {
        const newLimit = Number(value);
        onLimitChange(newLimit);
    };

    const handlePageChange = (page: number) => {
        onPageChange(page);
    };

    const handleAddCOA = () => {
        router.push("/admin-area/master/coa/create");
    };

    // Generate pagination numbers
    const getPaginationNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        const { page, pages: totalPages } = pagination;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (page <= 3) {
                for (let i = 1; i <= 4; i++) {
                    pages.push(i);
                }
                pages.push('ellipsis');
                pages.push(totalPages);
            } else if (page >= totalPages - 2) {
                pages.push(1);
                pages.push('ellipsis');
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push(1);
                pages.push('ellipsis');
                for (let i = page - 1; i <= page + 1; i++) {
                    pages.push(i);
                }
                pages.push('ellipsis');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    // Skeleton loader
    if (isLoading) {
        return (
            <div className="space-y-6">
                {/* Header Skeleton */}
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                    <CardHeader className="pb-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="space-y-2">
                                <Skeleton className="h-8 w-64" />
                                <Skeleton className="h-4 w-96" />
                            </div>
                            <Skeleton className="h-10 w-32" />
                        </div>
                    </CardHeader>
                </Card>

                {/* Search Bar Skeleton */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Skeleton className="h-10 flex-1" />
                            <div className="flex gap-2">
                                <Skeleton className="h-10 w-24" />
                                <Skeleton className="h-10 w-24" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Table Skeleton */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-24" />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Skeleton className="h-8 w-8 rounded" />
                                        <Skeleton className="h-8 w-8 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isError) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="text-center text-red-500 py-8">
                        Error loading chart of accounts data
                    </div>
                </CardContent>
            </Card>
        );
    }

    const { page, limit, total, pages: totalPages } = pagination;
    const startIndex = (page - 1) * limit + 1;
    const endIndex = Math.min(page * limit, total);
    const paginationNumbers = getPaginationNumbers();

    return (
        <div className="space-y-6">
            {/* Header dengan Gradient */}
            <Card className="border-0 shadow-lg">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-6 rounded-xl">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 justify-between">
                        {/* Kiri: Title dan Search dalam satu baris */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1 w-full">
                            {/* Title Section */}
                            <div className="flex items-center gap-3 min-w-[200px]">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold whitespace-nowrap">Chart of Accounts</h1>
                                    <p className="text-blue-100 text-sm whitespace-nowrap">Kelola akun keuangan</p>
                                </div>
                            </div>

                            {/* Search Bar */}
                            <div className="relative flex-1 min-w-[300px]">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-200 h-4 w-4" />
                                <Input
                                    placeholder="Cari kode, nama, atau deskripsi..."
                                    value={localSearchTerm}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    className="pl-10 bg-white/10 border-white/20 text-white placeholder-blue-200"
                                />
                            </div>
                        </div>

                        {/* Kanan: Controls */}
                        <div className="flex items-center gap-3 flex-wrap">
                            {/* Items Per Page */}
                            <div className="flex items-center gap-2">
                                <span className="text-blue-100 text-sm whitespace-nowrap">Show:</span>
                                <Select
                                    value={limit.toString()}
                                    onValueChange={handleItemsPerPageChange}
                                >
                                    <SelectTrigger className="w-20 h-9 bg-white/10 border-white/20 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Filter Button */}
                            <Button
                                variant="outline"
                                size="sm"
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                            >
                                <Filter className="h-4 w-4 mr-2" />
                                Filter
                            </Button>

                            {/* Add COA Button */}
                            <Button
                                onClick={handleAddCOA}
                                className="bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-md"
                                size="sm"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Tambah COA
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Summary Cards */}
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="statistics">
                    <AccordionTrigger className="hover:underline group cursor-pointer">
                        <div className="flex items-center gap-3">
                            <BarChart3 className="h-5 w-5 text-gray-600" />
                            <span className="text-lg font-semibold text-gray-800">
                                Statistik Chart of Accounts
                            </span>

                            {/* Expand Here + Chevron */}
                            <div className="flex items-center gap-1 text-gray-700 font-medium">
                                <span className="text-sm text-blue-600">Expand here</span>
                                <ChevronDown
                                    className="h-4 w-4 font-bold text-indigo-600 transition-transform duration-200 group-data-[state=open]:rotate-180"
                                />
                            </div>
                        </div>
                    </AccordionTrigger>

                    <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                            {/* === Card 1 === */}
                            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:shadow-md transition-shadow">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-green-600">Total Akun</p>
                                            <p className="text-2xl font-bold text-green-800">{total}</p>
                                            <p className="text-xs text-green-500 mt-1">Semua akun</p>
                                        </div>
                                        <FileText className="h-8 w-8 text-green-600" />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* === Card 2 === */}
                            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:shadow-md transition-shadow">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-blue-600">Akun Aktif</p>
                                            <p className="text-2xl font-bold text-blue-800">
                                                {coas.filter((coa) => coa.status === CoaStatus.ACTIVE).length}
                                            </p>
                                            <p className="text-xs text-blue-500 mt-1">
                                                {(
                                                    (coas.filter((coa) => coa.status === CoaStatus.ACTIVE).length /
                                                        coas.length) *
                                                    100
                                                ).toFixed(1)}
                                                %
                                            </p>
                                        </div>
                                        <Unlock className="h-8 w-8 text-blue-600" />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* === Card 3 === */}
                            <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200 hover:shadow-md transition-shadow">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-purple-600">Akun Header</p>
                                            <p className="text-2xl font-bold text-purple-800">
                                                {coas.filter((coa) => coa.postingType === CoaPostingType.HEADER).length}
                                            </p>
                                            <p className="text-xs text-purple-500 mt-1">Grouping accounts</p>
                                        </div>
                                        <Folder className="h-8 w-8 text-purple-600" />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* === Card 4 === */}
                            <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 hover:shadow-md transition-shadow">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-orange-600">Dapat Direkonsiliasi</p>
                                            <p className="text-2xl font-bold text-orange-800">
                                                {coas.filter((coa) => coa.isReconcilable).length}
                                            </p>
                                            <p className="text-xs text-orange-500 mt-1">Bank & cash accounts</p>
                                        </div>
                                        <Calculator className="h-8 w-8 text-orange-600" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>


            {/* Desktop Table */}
            <Card className="hidden lg:block">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 uppercase mb-2">
                        <FileText className="h-5 w-5" />
                        Daftar Akun
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b bg-gray-50/50 dark:bg-slate-700">
                                    <th className="text-left py-3 px-4 font-semibold uppercase">Kode & Nama Akun</th>
                                    <th className="text-left py-3 px-4 font-semibold uppercase">Tipe</th>
                                    <th className="text-left py-3 px-4 font-semibold uppercase">Status</th>
                                    <th className="text-left py-3 px-4 font-semibold uppercase">Saldo Normal</th>
                                    <th className="text-left py-3 px-4 font-semibold uppercase">Posting Type</th>
                                    <th className="text-left py-3 px-4 font-semibold uppercase">Arus Kas</th>
                                    <th className="text-left py-3 px-4 font-semibold uppercase">Reconsiliasi</th>
                                    <th className="text-left py-3 px-4 font-semibold uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {coas.map((coa) => (
                                    <tr key={coa.id} className="border-b hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className={coa.parentId ? "ml-8 flex items-center gap-3" : "flex items-center gap-3"}>
                                                    <div className="flex-shrink-0">
                                                        {getCoaTypeIcon(coa.type)}
                                                    </div>
                                                    <div className="font-medium flex items-center gap-2">
                                                        <Badge variant="outline" className="font-mono text-xs">
                                                            {coa.code}
                                                        </Badge>
                                                        {coa.parentId && (
                                                            <ChevronRight className="h-3 w-3 text-gray-400" />
                                                        )}
                                                        <span>
                                                            {coa.name}
                                                        </span>
                                                    </div>
                                                    {coa.description && (
                                                        <div className="text-sm text-gray-500 mt-1">
                                                            {coa.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <Badge variant="outline" className={getCoaTypeColor(coa.type)}>
                                                {getCoaTypeIcon(coa.type)}
                                                <span className="ml-1">{coa.type}</span>
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4">
                                            <Badge variant="outline" className={getStatusColor(coa.status)}>
                                                {getStatusIcon(coa.status)}
                                                <span className="ml-1">{coa.status}</span>
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4">
                                            <Badge variant="outline" className={
                                                coa.normalBalance === CoaNormalBalance.DEBIT
                                                    ? "bg-blue-100 text-blue-800 border-blue-200"
                                                    : "bg-green-100 text-green-800 border-green-200"
                                            }>
                                                {coa.normalBalance}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4">
                                            <Badge variant="outline" className={
                                                coa.postingType === CoaPostingType.HEADER
                                                    ? "bg-amber-100 text-amber-800 border-amber-200"
                                                    : "bg-indigo-100 text-indigo-800 border-indigo-200"
                                            }>
                                                {getPostingTypeIcon(coa.postingType)}
                                                <span className="ml-1">{coa.postingType}</span>
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4">
                                            <Badge variant="outline" className={getCashflowColor(coa.cashflowType)}>
                                                {getCashflowIcon(coa.cashflowType)}
                                                <span className="ml-1">{coa.cashflowType}</span>
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4">
                                            {coa.isReconcilable ? (
                                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                                                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                                                    <span>Reconcilable</span>
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100">
                                                    <XCircle className="h-4 w-4 mr-1.5" />
                                                    <span>Non-Rec.</span>
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex gap-1">
                                                <Link href={`/admin-area/master/coa/update/${coa.id}`}>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                                    >
                                                        <span className="sr-only">Edit Akun</span> {/* Tambahan untuk aksesibilitas */}
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                                                    onClick={() => onDelete(coa.id)}
                                                    disabled={isDeleting}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Empty State */}
                    {coas.length === 0 && (
                        <div className="text-center py-8">
                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">Tidak ada akun yang ditemukan</p>
                            <p className="text-gray-400 text-sm mt-1">
                                {currentSearch ? "Coba ubah kata kunci pencarian" : "Mulai dengan menambahkan akun baru"}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
                {coas.map((coa) => (
                    <Card key={coa.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    {getCoaTypeIcon(coa.type)}
                                    <div>
                                        <div className="font-semibold text-gray-900">{coa.name}</div>
                                        <div className="text-sm text-gray-500 font-mono">{coa.code}</div>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <Link href={`/admin-area/master/coa/update/${coa.id}`}>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                        >
                                            <span className="sr-only">Edit Akun</span> {/* Tambahan untuk aksesibilitas */}
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-red-600"
                                        onClick={() => onDelete(coa.id)}
                                        disabled={isDeleting}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <span className="text-gray-500">Tipe:</span>
                                    <Badge variant="outline" className={`ml-2 ${getCoaTypeColor(coa.type)}`}>
                                        {coa.type}
                                    </Badge>
                                </div>
                                <div>
                                    <span className="text-gray-500">Status:</span>
                                    <Badge variant="outline" className={`ml-2 ${getStatusColor(coa.status)}`}>
                                        {coa.status}
                                    </Badge>
                                </div>
                                <div>
                                    <span className="text-gray-500">Saldo:</span>
                                    <Badge variant="outline" className="ml-2">
                                        {coa.normalBalance}
                                    </Badge>
                                </div>
                                <div>
                                    <span className="text-gray-500">Posting:</span>
                                    <Badge variant="outline" className="ml-2">
                                        {getPostingTypeIcon(coa.postingType)}
                                        <span className="ml-1">{coa.postingType}</span>
                                    </Badge>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-gray-500">Reconsiliasi:</span>
                                    {coa.isReconcilable ? (
                                        <Badge variant="outline" className="ml-2 bg-emerald-50 text-emerald-700 border-emerald-200">
                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                            Active
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="ml-2 bg-gray-50 text-gray-500 border-gray-200">
                                            <XCircle className="h-3 w-3 mr-1" />
                                            None
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {coa.description && (
                                <div className="mt-3 text-sm text-gray-600">
                                    {coa.description}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}

                {/* Empty State Mobile */}
                {coas.length === 0 && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center py-8">
                                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg">Tidak ada akun yang ditemukan</p>
                                <p className="text-gray-400 text-sm mt-1">
                                    {currentSearch ? "Coba ubah kata kunci pencarian" : "Mulai dengan menambahkan akun baru"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Pagination */}
            {total > 0 && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-gray-600">
                                Menampilkan {startIndex}-{endIndex} dari {total} akun
                            </div>

                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (page > 1) handlePageChange(page - 1);
                                            }}
                                            className={page === 1 ? "pointer-events-none opacity-50" : ""}
                                        />
                                    </PaginationItem>

                                    {paginationNumbers.map((pageNum, index) => (
                                        <PaginationItem key={index}>
                                            {pageNum === 'ellipsis' ? (
                                                <PaginationEllipsis />
                                            ) : (
                                                <PaginationLink
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handlePageChange(pageNum as number);
                                                    }}
                                                    isActive={page === pageNum}
                                                >
                                                    {pageNum}
                                                </PaginationLink>
                                            )}
                                        </PaginationItem>
                                    ))}

                                    <PaginationItem>
                                        <PaginationNext
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (page < totalPages) handlePageChange(page + 1);
                                            }}
                                            className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}