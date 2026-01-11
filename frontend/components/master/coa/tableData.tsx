"use client";

import { useState, useEffect } from "react";
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
    const getIndentLevel = (coa: ChartOfAccountsWithRelations, allCoas: ChartOfAccountsWithRelations[]) => {
        let level = 0;
        let currentParentId = coa.parentId;

        while (currentParentId) {
            level++;
            // Safety break
            if (level > 10) break;

            const parent = allCoas.find(c => c.id === currentParentId);
            if (parent) {
                currentParentId = parent.parentId;
            } else {
                break;
            }
        }
        return level;
    };

    const [localSearchTerm, setLocalSearchTerm] = useState(currentSearch || "");
    const router = useRouter();
    console.log("Role", role)
    // Debounce search untuk menghindari terlalu banyak request
    // Sync local search term with currentSearch prop changes (e.g. initial load or URL change)
    useEffect(() => {
        setLocalSearchTerm(currentSearch || "");
    }, [currentSearch]);

    // Debounce search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            // Only search if term changed from what parent has
            if (localSearchTerm !== currentSearch) {
                onSearchChange(localSearchTerm);
            }
        }, 800); // 800ms debounce

        return () => clearTimeout(timeoutId);
    }, [localSearchTerm, onSearchChange, currentSearch]);

    const handleSearchChange = (value: string) => {
        setLocalSearchTerm(value);
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

    // Full page loading skeleton REMOVED to prevent search bar focus loss.
    // Loading state is now handled inside individual sections.

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
            {/* Header Title Card (Visual Only) */}
            <Card className="border-0 shadow-sm overflow-hidden rounded-l">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-3 md:p-6 rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 md:p-2 bg-white/20 rounded-lg">
                            <FileText className="h-4 w-4 md:h-6 md:w-6 shadow-sm" />
                        </div>
                        <div>
                            <h1 className="text-[10px] md:text-xl font-bold uppercase tracking-wider md:tracking-normal whitespace-nowrap shadow-sm">
                                Chart of Accounts
                            </h1>
                            <p className="hidden md:block text-blue-100 text-sm whitespace-nowrap">
                                Kelola akun keuangan system
                            </p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Toolbar: Search, Filter, Actions (Separated from Header) */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between bg-white p-4 rounded-xl border shadow-sm">
                {/* Search Bar */}
                <div className="relative w-full lg:w-96">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Cari kode, nama, atau deskripsi..."
                        value={localSearchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-10 bg-gray-50 border-gray-200 text-gray-900 focus-visible:ring-blue-500 placeholder:text-gray-400"
                    />
                    {isLoading && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                        </div>
                    )}
                </div>

                {/* Controls Group */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-hide">
                    {/* Items Per Page */}
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs md:text-sm whitespace-nowrap hidden sm:inline">Show:</span>
                        <Select value={limit.toString()} onValueChange={handleItemsPerPageChange}>
                            <SelectTrigger className="w-[70px] md:w-20 h-9 text-xs md:text-sm bg-gray-50">
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
                    <Button variant="outline" size="sm" className="h-9 px-3 text-gray-600 border-gray-300 hover:bg-gray-50">
                        <Filter className="h-3.5 w-3.5 md:mr-2" />
                        <span className="hidden md:inline text-xs md:text-sm">Filter</span>
                    </Button>

                    {/* Add Button */}
                    <Button
                        onClick={handleAddCOA}
                        className="bg-blue-600 text-white hover:bg-blue-700 h-9 px-3 shadow-sm"
                        size="sm"
                    >
                        <Plus className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline text-xs md:text-sm font-medium">Tambah Akun</span>
                    </Button>
                </div>
            </div>

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
                                <tr className="border-b bg-gray-50/80 dark:bg-slate-800/80">
                                    <th className="text-left py-4 px-6 font-semibold uppercase text-xs text-gray-500 tracking-wider">Kode & Nama Akun</th>
                                    <th className="text-left py-4 px-6 font-semibold uppercase text-xs text-gray-500 tracking-wider">Tipe</th>
                                    <th className="text-left py-4 px-6 font-semibold uppercase text-xs text-gray-500 tracking-wider">Status</th>
                                    <th className="text-left py-4 px-6 font-semibold uppercase text-xs text-gray-500 tracking-wider">Saldo Normal</th>
                                    <th className="text-left py-4 px-6 font-semibold uppercase text-xs text-gray-500 tracking-wider">Posting Type</th>
                                    <th className="text-left py-4 px-6 font-semibold uppercase text-xs text-gray-500 tracking-wider">Arus Kas</th>
                                    <th className="text-left py-4 px-6 font-semibold uppercase text-xs text-gray-500 tracking-wider">Reconsiliasi</th>
                                    <th className="text-center py-4 px-6 font-semibold uppercase text-xs text-gray-500 tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isLoading ? (
                                    // Loading Skeletons for Table Rows
                                    [...Array(5)].map((_, index) => (
                                        <tr key={`skeleton-${index}`} className="animate-pulse">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <Skeleton className="h-8 w-8 rounded" />
                                                    <div className="space-y-2">
                                                        <Skeleton className="h-4 w-32" />
                                                        <Skeleton className="h-3 w-24" />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6"><Skeleton className="h-6 w-20 rounded-full" /></td>
                                            <td className="py-4 px-6"><Skeleton className="h-6 w-16 rounded-full" /></td>
                                            <td className="py-4 px-6"><Skeleton className="h-6 w-20 rounded-full" /></td>
                                            <td className="py-4 px-6"><Skeleton className="h-6 w-24 rounded-md" /></td>
                                            <td className="py-4 px-6"><Skeleton className="h-6 w-24 rounded-full" /></td>
                                            <td className="py-4 px-6"><Skeleton className="h-6 w-20 rounded-full" /></td>
                                            <td className="py-4 px-6 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <Skeleton className="h-8 w-8 rounded-full" />
                                                    <Skeleton className="h-8 w-8 rounded-full" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    coas.map((coa) => {
                                        const indentLevel = getIndentLevel(coa, coas);
                                        return (
                                            <tr key={coa.id} className="group hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-3" style={{ paddingLeft: `${indentLevel * 32}px` }}>
                                                            <div className="flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                                                                {getCoaTypeIcon(coa.type)}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <div className="font-medium text-gray-900 flex items-center gap-2">
                                                                    <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                                                        {coa.code}
                                                                    </span>
                                                                    {coa.parentId && (
                                                                        <ChevronRight className="h-3 w-3 text-gray-400" />
                                                                    )}
                                                                    <span className="text-sm font-semibold text-gray-800">
                                                                        {coa.name}
                                                                    </span>
                                                                </div>
                                                                {coa.description && (
                                                                    <p className="text-xs text-gray-500 mt-1 max-w-[700px] leading-relaxed">
                                                                        {coa.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <Badge variant="secondary" className={`font-normal ${getCoaTypeColor(coa.type)} border-0 bg-opacity-15`}>
                                                        {getCoaTypeIcon(coa.type)}
                                                        <span className="ml-1.5 text-xs font-semibold">{coa.type}</span>
                                                    </Badge>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <Badge variant="outline" className={`font-normal rounded-full px-3 py-0.5 ${getStatusColor(coa.status)} border`}>
                                                        {getStatusIcon(coa.status)}
                                                        <span className="ml-1.5 text-xs">{coa.status}</span>
                                                    </Badge>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${coa.normalBalance === CoaNormalBalance.DEBIT
                                                        ? "bg-blue-50 text-blue-700 border-blue-200"
                                                        : "bg-green-50 text-green-700 border-green-200"
                                                        }`}>
                                                        {coa.normalBalance}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${coa.postingType === CoaPostingType.HEADER
                                                        ? "bg-amber-50 text-amber-700 border-amber-200"
                                                        : "bg-indigo-50 text-indigo-700 border-indigo-200"
                                                        }`}>
                                                        {getPostingTypeIcon(coa.postingType)}
                                                        <span className="ml-1">{coa.postingType}</span>
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <Badge variant="outline" className={`font-normal ${getCashflowColor(coa.cashflowType)} border`}>
                                                        {getCashflowIcon(coa.cashflowType)}
                                                        <span className="ml-1.5 text-xs whitespace-nowrap">{coa.cashflowType}</span>
                                                    </Badge>
                                                </td>
                                                <td className="py-4 px-6">
                                                    {coa.isReconcilable ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                                                            <span className="text-xs font-medium text-emerald-700">Reconcilable</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="h-2 w-2 rounded-full bg-gray-300"></div>
                                                            <span className="text-xs text-gray-400">Non-Rec.</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Link href={`/admin-area/master/coa/update/${coa.id}`}>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 rounded-full transition-colors"
                                                            >
                                                                <span className="sr-only">Edit Akun</span>
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors"
                                                            onClick={() => onDelete(coa.id)}
                                                            disabled={isDeleting}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
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

            {/* Mobile/Tablet Card View (Accordion Style) */}
            <div className="lg:hidden">
                {isLoading ? (
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full rounded-lg" />
                        ))}
                    </div>
                ) : (
                    <Accordion type="multiple" className="space-y-3">
                        {coas.map((coa) => {
                            const indentLevel = getIndentLevel(coa, coas);
                            return (
                                <AccordionItem
                                    key={coa.id}
                                    value={coa.id}
                                    className={`border rounded-xl shadow-sm overflow-hidden ${coa.postingType === CoaPostingType.HEADER
                                        ? "bg-blue-50/50 border-blue-200"
                                        : "bg-white"
                                        }`}
                                >
                                    <AccordionTrigger className="px-4 py-3 hover:bg-black/5 hover:no-underline transition-all">
                                        <div className="flex items-center gap-3 w-full text-left pr-2" style={{ paddingLeft: `${indentLevel * 12}px` }}>
                                            {/* Visual Hierarchy Indicator */}
                                            {coa.parentId && (
                                                <div className="flex-shrink-0 w-1 h-8 bg-gray-300 rounded-full mr-1 opacity-50"></div>
                                            )}

                                            <div className={`flex flex-col gap-1 flex-1 ${coa.parentId ? "opacity-90" : ""}`}>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge variant="outline" className="font-mono text-[10px] px-1.5 h-5 border-gray-300 text-gray-500 bg-white/50">
                                                        {coa.code}
                                                    </Badge>
                                                    {/* Posting Type Badge */}
                                                    <Badge variant="secondary" className={`text-[10px] h-5 px-1.5 font-normal ${coa.postingType === CoaPostingType.HEADER
                                                        ? "bg-blue-100 text-blue-700"
                                                        : "bg-gray-100 text-gray-600"
                                                        }`}>
                                                        {coa.postingType}
                                                    </Badge>

                                                    {coa.isReconcilable && (
                                                        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm" title="Reconcilable"></div>
                                                    )}
                                                </div>
                                                <span className={`text-sm font-semibold ${coa.postingType === CoaPostingType.HEADER ? "text-blue-900" : "text-gray-900"
                                                    } line-clamp-1`}>
                                                    {coa.name}
                                                </span>
                                            </div>

                                            {/* Minimal Status Indicator on Header */}
                                            <Badge variant="secondary" className={`hidden sm:inline-flex text-[10px] px-2 h-6 ${getStatusColor(coa.status)} bg-opacity-10 border-0`}>
                                                {coa.status === CoaStatus.ACTIVE ? 'Aktif' : 'Non'}
                                            </Badge>
                                        </div>
                                    </AccordionTrigger>

                                    <AccordionContent className="px-4 pb-4 pt-1 bg-gray-50/50 border-t border-gray-100">
                                        <div className="space-y-4">
                                            {/* Detail Grid */}
                                            <div className="grid grid-cols-2 gap-3 mt-3">
                                                <div className="space-y-1">
                                                    <span className="text-xs text-gray-400 uppercase font-medium tracking-wide">Tipe Akun</span>
                                                    <div className="flex items-center gap-2">
                                                        {getCoaTypeIcon(coa.type)}
                                                        <span className="text-sm font-medium text-gray-700">{coa.type}</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <span className="text-xs text-gray-400 uppercase font-medium tracking-wide">Posting</span>
                                                    <div className="flex items-center gap-1.5">
                                                        {getPostingTypeIcon(coa.postingType)}
                                                        <span className="text-sm text-gray-700">{coa.postingType}</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <span className="text-xs text-gray-400 uppercase font-medium tracking-wide">Saldo Normal</span>
                                                    <Badge variant="outline" className="font-normal text-xs">
                                                        {coa.normalBalance}
                                                    </Badge>
                                                </div>

                                                <div className="space-y-1">
                                                    <span className="text-xs text-gray-400 uppercase font-medium tracking-wide">Arus Kas</span>
                                                    <Badge variant="outline" className={`font-normal text-xs ${getCashflowColor(coa.cashflowType)} border-0 bg-opacity-20`}>
                                                        {coa.cashflowType}
                                                    </Badge>
                                                </div>
                                            </div>

                                            {/* Description if any */}
                                            {coa.description && (
                                                <div className="p-3 bg-white rounded border border-gray-100 text-xs text-gray-600 italic">
                                                    "{coa.description}"
                                                </div>
                                            )}

                                            {/* Full Status Badges Area (if header simplified logic excluded something) */}
                                            <div className="flex flex-wrap gap-2 pt-2 border-t border-dashed border-gray-200">
                                                <Badge variant="outline" className={`text-xs ${getStatusColor(coa.status)}`}>
                                                    Status: {coa.status}
                                                </Badge>

                                                {coa.isReconcilable ? (
                                                    <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                                        Reconcilable
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-xs text-gray-400">
                                                        Non-Reconcilable
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-2 pt-2">
                                                <Link href={`/admin-area/master/coa/update/${coa.id}`} className="flex-1">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full h-9 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                                                    >
                                                        <Edit className="h-3.5 w-3.5 mr-2" />
                                                        Edit Akun
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-9 w-12 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                                                    onClick={() => onDelete(coa.id)}
                                                    disabled={isDeleting}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                )}

                {/* Empty State Mobile */}
                {(!isLoading && coas.length === 0) && (
                    <Card className="border-dashed">
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
            {
                total > 0 && (
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
                )
            }
        </div>
    );
}