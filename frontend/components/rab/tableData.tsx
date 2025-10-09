"use client";

import React, { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { RAB, RABDetail as RABDetailType, RABStatus } from "@/types/rab";
import { rabActions } from "@/hooks/use-rab";
import {
    MoreHorizontal,
    FileText,
    Edit,
    Trash2,
    Download,
    Search,
    Building,
    User,
    Calendar,
    ChevronDown,
    ChevronRight,
    Plus,
    Filter,
    DollarSign,
    Package,
    HardHat,
    AlertCircle,
    Truck,
    Wrench
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "../ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useRouter } from "next/navigation";
import { FaBuilding, FaToolbox } from "react-icons/fa";
import RABPdfDialog from "./rabPdfDialog";

export type CostBreakdown = {
    MATERIAL?: number;
    LABOR?: number;
    EQUIPMENT?: number;
    SUBCON?: number;
    TRANSPORT?: number;
    OVERHEAD?: number;
    OTHER?: number;
};



interface RABTableProps {
    rabs: RAB[];
    isLoading: boolean;
    isError: boolean;
    role: string;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
    onDelete: (id: string, options?: { onSuccess?: () => void }) => void;
    isDeleting: boolean;
}

// Skeleton Loading Component
const RABTableSkeleton = ({ isMobile = false }: { isMobile?: boolean }) => {
    if (isMobile) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <Card key={i} className="p-4 animate-pulse">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                            </div>
                            <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                        <div className="space-y-2 mb-3">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t">
                            <Skeleton className="h-4 w-20" />
                            <div className="flex gap-2">
                                <Skeleton className="h-8 w-20" />
                                <Skeleton className="h-8 w-8 rounded-full" />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                </div>
            ))}
        </div>
    );
};

// Helper function untuk cost breakdown dengan type safety
function getCostTypeBreakdown(items?: RABDetailType[]): Record<string, number> {
    return (items ?? []).reduce((acc, item) => {
        const type = item.costType || "OTHER";
        let subtotal = 0;

        if (typeof item.subtotal === 'number') {
            subtotal = item.subtotal;
        } else if (typeof item.subtotal === 'string') {
            subtotal = parseFloat(item.subtotal) || 0;
        } else if (item.qty && item.price) {
            const qty = typeof item.qty === 'number' ? item.qty : parseFloat(String(item.qty)) || 0;
            const price = typeof item.price === 'number' ? item.price : parseFloat(String(item.price)) || 0;
            subtotal = qty * price;
        }

        acc[type] = (acc[type] || 0) + subtotal;
        return acc;
    }, {} as Record<string, number>);
}

// Detail Component untuk Expanded View
function RABDetail({ rab }: { rab: RAB }) {
    const costBreakdown = getCostTypeBreakdown(rab.rabDetails ?? []);
    const totalAmount = Object.values(costBreakdown).reduce((a: number, b: number) => a + b, 0);

    const getCostTypeIcon = (costType: string) => {
        const icons: Record<string, React.ReactNode> = {
            MATERIAL: <Package className="h-4 w-4 text-blue-600" />,     // Material / Bahan
            LABOR: <HardHat className="h-4 w-4 text-green-600" />,        // Tenaga kerja
            EQUIPMENT: <FaToolbox className="h-4 w-4 text-orange-600" />, // Peralatan
            SUBCON: <FaBuilding className="h-4 w-4 text-pink-600" />,     // Subkontraktor
            TRANSPORT: <Truck className="h-4 w-4 text-indigo-600" />,     // Transportasi
            OVERHEAD: <Wrench className="h-4 w-4 text-yellow-600" />,     // Overhead / umum
            OTHER: <DollarSign className="h-4 w-4 text-purple-600" />     // Lainnya
        };

        return icons[costType] || <DollarSign className="h-4 w-4 text-gray-600" />;
    };

    const getCostTypeLabel = (type: string): string => {
        switch (type) {
            case "MATERIAL":
                return "Produk / Bahan";
            case "LABOR":
                return "Tenaga Kerja / Jasa";
            case "EQUIPMENT":
                return "Peralatan / Mesin";
            case "SUBCON":
                return "Subkontraktor";
            case "TRANSPORT":
                return "Transportasi / Pengiriman";
            case "OVERHEAD":
                return "Biaya Overhead / Umum";
            case "OTHER":
                return "Biaya Lain-lain";
            default:
                return type.toLowerCase();
        }
    };


    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            PRELIMINARY: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800",
            SITEPREP: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-800",
            STRUCTURE: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800",
            ARCHITECTURE: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-300 dark:border-emerald-800",
            MEP: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800",
            FINISHING: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-800",
            LANDSCAPE: "bg-lime-100 text-lime-800 border-lime-200 dark:bg-lime-900 dark:text-lime-300 dark:border-lime-800",
            EQUIPMENT: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-800",
            OVERHEAD: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900 dark:text-cyan-300 dark:border-cyan-800",
            OTHER: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-800"
        };
        return colors[category] || "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-800";
    };

    // Fungsi untuk mendapatkan label dalam bahasa Indonesia
    const getCategoryLabel = (category: string): string => {
        const labels: Record<string, string> = {
            PRELIMINARY: "Pekerjaan Pendahuluan",
            SITEPREP: "Pekerjaan Persiapan",
            STRUCTURE: "Pekerjaan Struktur",
            ARCHITECTURE: "Pekerjaan Arsitektur",
            MEP: "Mechanical, Electrical, Plumbing",
            FINISHING: "Pekerjaan Finishing",
            LANDSCAPE: "Pekerjaan Landscaping",
            EQUIPMENT: "Peralatan dan Perlengkapan",
            OVERHEAD: "Biaya Overhead & Profit",
            OTHER: "Lain-lain"
        };
        return labels[category] || category;
    };


    const formatCurrencySafe = (amount: number | string): string => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return rabActions.formatCurrency(isNaN(numAmount) ? 0 : numAmount);
    };

    return (
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
            {/* Header Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h4 className="font-semibold text-lg text-slate-800 dark:text-slate-200">
                            Project Information
                        </h4>
                    </div>
                    <div className="space-y-3 pl-4">
                        <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                                {rab.project?.name || "N/A"}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                Customer: {rab.project?.customer?.name || "N/A"}
                            </p>
                        </div>
                        {rab.description && (
                            <div>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Description</p>
                                <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                                    {rab.description}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                            <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <h4 className="font-semibold text-lg text-slate-800 dark:text-slate-200">
                            Financial Summary
                        </h4>
                    </div>
                    <div className="space-y-3 pl-4 ">
                        {Object.entries(costBreakdown as CostBreakdown).map(([type, amount]) => (
                            <div key={type} className="flex justify-between items-center border-b">
                                <div className="flex items-center gap-2">
                                    {getCostTypeIcon(type)}
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400 capitalize">
                                            {type.toLowerCase()} {/* MATERIAL, LABOR, OTHER */}
                                        </span>
                                        <span className="text-xs text-slate-500 dark:text-slate-500">
                                            {getCostTypeLabel(type)} {/* Keterangan detail */}
                                        </span>
                                    </div>
                                </div>
                                <span className="font-semibold text-slate-900 dark:text-slate-100">
                                    {rabActions.formatCurrency(amount)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                            <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h4 className="font-semibold text-lg text-slate-800 dark:text-slate-200">
                            Metadata
                        </h4>
                    </div>
                    <div className="flex space-y-3 pl-4 gap-6">
                        <div>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Created</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                                {new Date(rab.createdAt).toLocaleDateString('id-ID')}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-500">
                                by {rab.createdBy?.name || "System"}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Last Updated</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                                {new Date(rab.updatedAt).toLocaleDateString('id-ID')}
                            </p>
                        </div>
                    </div>
                </div> */}
            </div>

            {/* RAB Items Details */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                        <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h4 className="font-semibold text-lg text-slate-800 dark:text-slate-200">
                        RAB Items ({rab.rabDetails?.length || 0})
                    </h4>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-700/50">
                            <TableRow>
                                <TableHead className="font-semibold w-8">Item Description</TableHead>
                                <TableHead className="font-semibold"></TableHead>
                                <TableHead className="font-semibold text-center">Qty</TableHead>
                                <TableHead className="font-semibold text-center">Unit</TableHead>
                                <TableHead className="font-semibold text-right">Unit Price</TableHead>
                                <TableHead className="font-semibold text-right">Subtotal</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(() => {
                                // Group items by category
                                const groupedItems = rab.rabDetails?.reduce((acc, item) => {
                                    const category = item.categoryRab || 'OTHER';
                                    if (!acc[category]) {
                                        acc[category] = [];
                                    }
                                    acc[category].push(item);
                                    return acc;
                                }, {} as Record<string, typeof rab.rabDetails>) || {};

                                return Object.entries(groupedItems).map(([category, items]) => {
                                    const categoryTotal = items?.reduce((sum, item) => {
                                        const subtotal = typeof item.subtotal === 'number' ? item.subtotal :
                                            typeof item.subtotal === 'string' ? parseFloat(item.subtotal) || 0 : 0;
                                        return sum + subtotal;
                                    }, 0) || 0;

                                    const sortedItems = items?.sort((a, b) => {
                                        const typeA = a.costType || "OTHER";
                                        const typeB = b.costType || "OTHER";
                                        if (typeA !== typeB) return typeA.localeCompare(typeB);
                                        return (a.description || "").localeCompare(b.description || "");
                                    });

                                    return (
                                        <React.Fragment key={category}>
                                            {/* Category Header */}
                                            <TableRow className="bg-blue-50 dark:bg-blue-900/20 border-y-2 border-blue-200 dark:border-blue-800">
                                                <TableCell className="font-bold text-blue-900 dark:text-blue-100 py-3 pl-4">
                                                    <div className="flex items-center gap-3">
                                                        <Badge variant="outline" className={`${getCategoryColor(category)} border-2 px-3 py-1 font-semibold`}>
                                                            {getCategoryLabel(category)}
                                                        </Badge>
                                                        <span className="text-sm font-normal text-blue-700 dark:text-blue-300">
                                                            {items?.length} {items?.length === 1 ? 'item' : 'items'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell colSpan={5} className="text-right font-bold text-blue-900 dark:text-blue-100 py-3 pr-4">
                                                    {formatCurrencySafe(categoryTotal)}
                                                </TableCell>
                                            </TableRow>

                                            {/* Items */}
                                            {sortedItems?.map((item) => (
                                                <TableRow key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 border-b border-slate-100 dark:border-slate-700">
                                                    <TableCell className="pl-8 py-3">
                                                        <div className="flex items-center gap-2">
                                                            {getCostTypeIcon(item.costType || "OTHER")}
                                                            <Badge variant="outline" className="text-xs h-5">
                                                                {item.costType?.toLowerCase() || "other"}
                                                            </Badge>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-3">
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-slate-900 dark:text-slate-100">
                                                                {item.description}
                                                            </p>
                                                            {item.notes && (
                                                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                                                    {item.notes}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="font-semibold">{item.qty}</span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="text-sm text-slate-600 dark:text-slate-400">
                                                            {item.unit}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {formatCurrencySafe(item.price)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-semibold text-green-600">
                                                        {formatCurrencySafe(item.subtotal || 0)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </React.Fragment>
                                    );
                                });
                            })()}
                        </TableBody>
                    </Table>
                    <div className="flex justify-end items-center p-2 w-full bg-gray-600 dark:bg-slate-200">
                        <span className="font-bold text-white dark:text-slate-800 text-lg mr-4">
                            Total :
                        </span>
                        <span className="font-bold text-lg text-white dark:text-green-600">
                            {rabActions.formatCurrency(totalAmount)}
                        </span>
                    </div>

                </div>
            </div>
        </div>
    );
}

// Mobile Card Component
function RABMobileCard({
    rab,
    onEdit,
    onDelete,
    onExport,
    isDeleting
}: {
    rab: RAB;
    onView: (id: string) => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onExport: (rab: RAB) => void;
    isDeleting: boolean;
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const costBreakdown = getCostTypeBreakdown(rab.rabDetails ?? []);
    const totalAmount = Object.values(costBreakdown).reduce((a: number, b: number) => a + b, 0);

    const getStatusConfig = (status: RABStatus) => {
        const config = {
            DRAFT: { variant: "secondary" as const, label: "Draft", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
            APPROVED: { variant: "default" as const, label: "Approved", className: "bg-green-100 text-green-800 border-green-200" },
            REJECTED: { variant: "destructive" as const, label: "Rejected", className: "bg-red-100 text-red-800 border-red-200" }
        };
        return config[status];
    };

    const statusConfig = getStatusConfig(rab.status);

    return (
        <Card className="mb-4 overflow-hidden border-l-4 border-l-blue-500 hover:shadow-md transition-all duration-200">
            <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50">
                            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                                {rab.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(rab.createdAt).toLocaleDateString('id-ID')}
                            </p>
                        </div>
                    </div>
                    <Badge className={`text-xs rounded-full px-2 py-1 border-0 ${statusConfig.className}`}>
                        {statusConfig.label}
                    </Badge>
                </div>

                {/* Project & Customer */}
                <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                        <div className="p-1 bg-red-100 dark:bg-red-900/50 rounded">
                            <Building className="h-3 w-3 text-red-600 dark:text-red-400" />
                        </div>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                            {rab.project?.name || "No Project"}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <div className="p-1 bg-purple-100 dark:bg-purple-900/50 rounded">
                            <User className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-slate-600 dark:text-slate-400">
                            {rab.project?.customer?.name || "N/A"}
                        </span>
                    </div>
                </div>

                {/* Financial Summary */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 mb-3">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Amount</span>
                        <span className="font-bold text-green-600 text-sm">
                            {rabActions.formatCurrency(totalAmount)}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(costBreakdown).slice(0, 4).map(([type, amount]) => (
                            <div key={type} className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-500 capitalize">
                                    {type.toLowerCase()}
                                </span>
                                <span className="font-medium">
                                    {rabActions.formatCurrency(amount)}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between items-center mt-1 pt-1 border-t border-slate-200 dark:border-slate-700">
                        <span className="text-xs text-slate-500 dark:text-slate-500">Items</span>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                            {rab.rabDetails?.length || 0} items
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onExport(rab)}
                            className="h-8 text-xs"
                        >
                            <Download className="h-3 w-3 mr-1" />
                            Export
                        </Button>
                    </div>

                    <div className="flex items-center gap-1">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => onEdit(rab.id)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => onDelete(rab.id)}
                                    className="text-red-600"
                                    disabled={isDeleting}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    {isDeleting ? "Deleting..." : "Delete"}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="h-8 w-8 p-0"
                        >
                            {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <RABDetail rab={rab} />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export function RABTable({
    rabs,
    isLoading,
    isError,
    role,
    pagination,
    onDelete,
    isDeleting
}: RABTableProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<RABStatus | "ALL">("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const isMobile = useMediaQuery("(max-width: 768px)");
    const router = useRouter();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedRAB, setSelectedRAB] = useState<RAB | null>(null);

    console.log("Role", role)

    const handleCreateRAB = () => {
        router.push("/admin-area/logistic/rab/create");
    };

    // Filter RABs berdasarkan search term dan status
    const filteredRABs = rabs.filter(rab => {
        const matchesSearch = rab.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rab.project?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rab.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rab.project?.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "ALL" || rab.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const handleView = (id: string) => {
        window.location.href = `/admin-area/logistic/rab/${id}`;
    };

    const handleEdit = (id: string) => {
        window.location.href = `/admin-area/logistic/rab/update/${id}`;
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this RAB?")) {
            onDelete(id, {
                onSuccess: () => {
                    console.log("RAB deleted successfully");
                }
            });
        }
    };
    const handleExport = (rab: RAB) => {
        setSelectedRAB(rab);
        setDialogOpen(true);
    };

    const toggleExpand = (id: string) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    const getStatusBadge = (status: RABStatus) => {
        const statusConfig = {
            DRAFT: {
                variant: "secondary" as const,
                label: "Draft",
                className: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200"
            },
            APPROVED: {
                variant: "default" as const,
                label: "Approved",
                className: "bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
            },
            REJECTED: {
                variant: "destructive" as const,
                label: "Rejected",
                className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200"
            }
        };

        const config = statusConfig[status];
        return (
            <Badge variant={config.variant} className={config.className}>
                {config.label}
            </Badge>
        );
    };

    if (isLoading) {
        return (
            <Card className="border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <CardTitle className="text-2xl">Rencana Anggaran Biaya</CardTitle>
                    <CardDescription className="text-blue-100">
                        Loading RAB data...
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <RABTableSkeleton isMobile={isMobile} />
                </CardContent>
            </Card>
        );
    }

    if (isError) {
        return (
            <Card className="border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-red-600 to-orange-600 text-white">
                    <CardTitle className="text-2xl flex items-center gap-2">
                        <AlertCircle className="h-6 w-6" />
                        Error Loading Data
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="text-center py-8">
                        <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                            Error loading RAB data
                        </h3>
                        <p className="text-slate-600 mb-4">
                            Please try refreshing the page or contact support if the problem persists.
                        </p>
                        <Button
                            onClick={() => window.location.reload()}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Retry
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-0 shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-white rounded-lg">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <div className="flex items-center space-x-4 flex-1">
                        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-white/20">
                            <FileText className="h-8 w-8 text-white" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-semibold">Rencana Anggaran Biaya</h1>
                            <p className="text-blue-100 text-sm">Manage and review your project cost estimates</p>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 flex-1">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" />
                            <Input
                                placeholder="Search by RAB name, project, customer..."
                                className="w-full pl-10 pr-4 py-3 bg-white/20 border-white/30 text-white placeholder-blue-100 text-base"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-4 flex-1 justify-center">
                            <Select value={statusFilter} onValueChange={(value: RABStatus | "ALL") => setStatusFilter(value)}>
                                <SelectTrigger className="w-[180px] bg-white/20 border-white/30 text-white">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Filter status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Status</SelectItem>
                                    <SelectItem value="DRAFT">Draft</SelectItem>
                                    <SelectItem value="APPROVED">Approved</SelectItem>
                                    <SelectItem value="REJECTED">Rejected</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="text-white text-sm whitespace-nowrap">
                                <span className="font-semibold">{filteredRABs.length}</span> RABs found
                            </div>
                        </div>
                    </div>

                    <Button
                        className="bg-white text-blue-600 hover:bg-blue-100 font-semibold text-base h-12 px-6 whitespace-nowrap cursor-pointer"
                        onClick={handleCreateRAB}
                    >
                        <Plus className="mr-2 h-5 w-5" />
                        New RAB
                    </Button>
                </div>
            </div>

            {/* Content */}
            <CardContent className="p-0">
                {filteredRABs.length === 0 ? (
                    <div className="text-center py-16">
                        <FileText className="mx-auto h-20 w-20 text-slate-300 mb-4" />
                        <h3 className="text-xl font-semibold text-slate-600 mb-2">
                            No RABs found
                        </h3>
                        <p className="text-slate-500 mb-6 max-w-md mx-auto">
                            {rabs.length === 0
                                ? "Get started by creating your first Rencana Anggaran Biaya to manage project costs effectively."
                                : "No RABs match your search criteria. Try adjusting your filters or search terms."
                            }
                        </p>
                        {rabs.length === 0 && (
                            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={handleCreateRAB}>
                                <Plus className="mr-2 h-5 w-5" />
                                Create First RAB
                            </Button>
                        )}
                    </div>
                ) : isMobile ? (
                    // Mobile View
                    <div className="p-4">
                        {filteredRABs.map((rab) => (
                            <RABMobileCard
                                key={rab.id}
                                rab={rab}
                                onView={handleView}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onExport={handleExport}
                                isDeleting={isDeleting}
                            />
                        ))}
                    </div>
                ) : (
                    // Desktop View
                    <>
                        <div className="rounded-b-lg">
                            <Table>
                                <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                                    <TableRow>
                                        <TableHead className="w-[50px]"></TableHead>
                                        <TableHead className="font-semibold">RAB Details</TableHead>
                                        <TableHead className="font-semibold ">Project</TableHead>
                                        <TableHead className="font-semibold ">Financial Summary</TableHead>
                                        <TableHead className="font-semibold ">Status</TableHead>
                                        <TableHead className="font-semibold ">Created</TableHead>
                                        <TableHead className="text-right font-semibold ">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRABs.map((rab) => {
                                        const costBreakdown = getCostTypeBreakdown(rab.rabDetails ?? []);
                                        const totalAmount = Object.values(costBreakdown).reduce((a: number, b: number) => a + b, 0);
                                        const isExpanded = expandedRow === rab.id;

                                        return (
                                            <React.Fragment key={rab.id}>
                                                <TableRow
                                                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                                                    onClick={() => toggleExpand(rab.id)}
                                                >
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 hover:bg-slate-100"
                                                        >
                                                            {isExpanded ? (
                                                                <ChevronDown className="h-4 w-4" />
                                                            ) : (
                                                                <ChevronRight className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/50">
                                                                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-slate-900 dark:text-slate-100">
                                                                    {rab.name}
                                                                </p>
                                                                {rab.description && (
                                                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                                                        {rab.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50">
                                                                <Building className="h-6 w-6 text-red-600 dark:text-red-400" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-slate-900 dark:text-slate-100">
                                                                    {rab.project?.name || "N/A"}
                                                                </p>
                                                                {/* <p className="text-sm text-slate-600 dark:text-slate-400">
                                                                    {rab.project?.customer?.name || "N/A"}
                                                                </p> */}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-2 min-w-[200px]">
                                                            {/* {Object.entries(costBreakdown).map(([type, amount]) => (
                                                                <div key={type} className="flex items-center justify-between text-sm">
                                                                    <span className="capitalize text-slate-600 dark:text-slate-400">
                                                                        {type.toLowerCase()}
                                                                    </span>
                                                                    <span className="font-semibold font-mono">
                                                                        {rabActions.formatCurrency(amount)}
                                                                    </span>
                                                                </div>
                                                            ))} */}
                                                            <span className="text-green-600 text-sm">
                                                                {rabActions.formatCurrency(totalAmount)}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getStatusBadge(rab.status)}
                                                        <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                                                            {rab.rabDetails?.length || 0} items
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm text-slate-900 dark:text-slate-100">
                                                            {new Date(rab.createdAt).toLocaleDateString('id-ID')}
                                                        </div>
                                                        <div className="text-xs text-slate-500 dark:text-slate-500">
                                                            by {rab.createdBy?.name || "System"}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <TooltipProvider>
                                                                {/* Edit */}
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleEdit(rab.id);
                                                                            }}
                                                                            className="h-8 text-green-600 hover:bg-green-50 hover:text-green-700 hover:border-green-700 
                     dark:text-green-400 dark:hover:bg-green-950 dark:hover:text-green-300 dark:hover:border-green-300
                     cursor-pointer transition-colors"
                                                                        >
                                                                            <Edit className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Edit RAB</TooltipContent>
                                                                </Tooltip>

                                                                {/* Export */}
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleExport(rab);
                                                                            }}
                                                                            className="h-8 text-orange-600 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-700 
                     dark:text-orange-400 dark:hover:bg-orange-950 dark:hover:text-orange-300 dark:hover:border-orange-300
                     cursor-pointer transition-colors"
                                                                        >
                                                                            <Download className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Preview PDF</TooltipContent>
                                                                </Tooltip>

                                                                {/* Delete */}
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleDelete(rab.id);
                                                                            }}
                                                                            disabled={isDeleting}
                                                                            className="h-8 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-700 
                     dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300 dark:hover:border-red-300
                     cursor-pointer transition-colors"
                                                                        >
                                                                            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                                                                            {isDeleting ? "Deleting..." : ""}
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Delete RAB</TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                                {isExpanded && (
                                                    <TableRow>
                                                        <TableCell colSpan={7} className="p-0 border-b-2 border-blue-200 dark:border-blue-800">
                                                            <RABDetail rab={rab} />
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                            {selectedRAB && (
                                <RABPdfDialog
                                    open={dialogOpen}
                                    onOpenChange={setDialogOpen}
                                    rab={selectedRAB}
                                />
                            )}
                        </div>

                        {/* Pagination */}
                        {pagination && pagination.pages > 1 && (
                            <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/20">
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Showing {((currentPage - 1) * (pagination.limit || 10)) + 1} to{" "}
                                    {Math.min(currentPage * (pagination.limit || 10), filteredRABs.length)} of{" "}
                                    {filteredRABs.length} RABs
                                </p>
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (currentPage > 1) setCurrentPage(currentPage - 1);
                                                }}
                                                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                                            />
                                        </PaginationItem>

                                        {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                                            <PaginationItem key={page}>
                                                <PaginationLink
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setCurrentPage(page);
                                                    }}
                                                    isActive={currentPage === page}
                                                >
                                                    {page}
                                                </PaginationLink>
                                            </PaginationItem>
                                        ))}

                                        <PaginationItem>
                                            <PaginationNext
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (currentPage < pagination.pages) setCurrentPage(currentPage + 1);
                                                }}
                                                className={currentPage === pagination.pages ? "pointer-events-none opacity-50" : ""}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}