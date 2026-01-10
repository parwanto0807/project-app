"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    MoreHorizontal,
    Pencil,
    Trash2,
    Send,
    Eye,
    Calendar,
    FileText,
    History,
    CheckCircle2,
    AlertCircle,
    Clock,
    TrendingUp,
    DollarSign,
    Filter,
    ChevronRight,
    Sparkles,
    Hash
} from "lucide-react";
import { OpeningBalance } from "@/types/openingBalance";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface TabelOpeningBalanceProps {
    data: OpeningBalance[];
    isLoading: boolean;
    onEdit: (ob: OpeningBalance) => void;
    onDelete: (id: string) => void;
    onPost: (id: string) => void;
    onView: (id: string) => void;
}

export const TabelOpeningBalance = ({
    data,
    isLoading,
    onEdit,
    onDelete,
    onPost,
    onView
}: TabelOpeningBalanceProps) => {
    const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'posted'>('all');

    const filteredData = data.filter(item => {
        if (filterStatus === 'all') return true;
        if (filterStatus === 'draft') return !item.isPosted;
        if (filterStatus === 'posted') return item.isPosted;
        return true;
    });

    const getTotalAmount = (ob: OpeningBalance) => {
        if (!ob.details) return 0;
        return ob.details.reduce((sum, detail) => sum + (Number(detail.debit) || 0), 0);
    };

    if (isLoading) {
        return <SkeletonTable />;
    }

    return (
        <div className="space-y-4 p-2">
            {/* Header & Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-2xl border border-slate-200">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        Opening Balances
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">Manage your opening balance transactions</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-white/60 backdrop-blur-md border border-slate-100 rounded-lg p-1 shadow-sm">
                        <Filter className="h-3 w-3 text-slate-400 ml-1 mr-1" />
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn("h-6 px-3 text-[10px] uppercase font-bold tracking-wider rounded-md transition-all",
                                filterStatus === 'all'
                                    ? "bg-blue-50 text-blue-600 shadow-sm"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-600")}
                            onClick={() => setFilterStatus('all')}
                        >
                            All
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn("h-6 px-3 text-[10px] uppercase font-bold tracking-wider rounded-md transition-all",
                                filterStatus === 'draft'
                                    ? "bg-amber-50 text-amber-600 shadow-sm"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-600")}
                            onClick={() => setFilterStatus('draft')}
                        >
                            Draft
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn("h-6 px-3 text-[10px] uppercase font-bold tracking-wider rounded-md transition-all",
                                filterStatus === 'posted'
                                    ? "bg-emerald-50 text-emerald-600 shadow-sm"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-600")}
                            onClick={() => setFilterStatus('posted')}
                        >
                            Posted
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blue-700 font-medium">Total Opening Balances</p>
                            <p className="text-2xl font-bold text-blue-900 mt-1">{data.length}</p>
                        </div>
                        <div className="p-2 rounded-xl bg-white/80">
                            <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                    </div>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-emerald-700 font-medium">Posted</p>
                            <p className="text-2xl font-bold text-emerald-900 mt-1">
                                {data.filter(item => item.isPosted).length}
                            </p>
                        </div>
                        <div className="p-2 rounded-xl bg-white/80">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        </div>
                    </div>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-amber-700 font-medium">Draft</p>
                            <p className="text-2xl font-bold text-amber-900 mt-1">
                                {data.filter(item => !item.isPosted).length}
                            </p>
                        </div>
                        <div className="p-2 rounded-xl bg-white/80">
                            <AlertCircle className="h-5 w-5 text-amber-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm overflow-hidden shadow-lg">
                <Table>
                    <TableHeader className="bg-gradient-to-r from-slate-50 to-blue-50/50">
                        <TableRow className="hover:bg-transparent border-b border-slate-200">
                            <TableHead className="py-4 text-slate-700 font-bold text-xs uppercase tracking-wider">Date & Info</TableHead>
                            <TableHead className="py-4 text-slate-700 font-bold text-xs uppercase tracking-wider">Description</TableHead>
                            <TableHead className="py-4 text-slate-700 font-bold text-xs uppercase tracking-wider text-center">Accounts</TableHead>
                            <TableHead className="py-4 text-slate-700 font-bold text-xs uppercase tracking-wider text-center">Amount</TableHead>
                            <TableHead className="py-4 text-slate-700 font-bold text-xs uppercase tracking-wider text-center">Status</TableHead>
                            <TableHead className="py-4 text-slate-700 font-bold text-xs uppercase tracking-wider">Created</TableHead>
                            <TableHead className="py-4 text-slate-700 font-bold text-xs uppercase tracking-wider text-center w-[60px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <AnimatePresence>
                            {filteredData.length === 0 ? (
                                <motion.tr
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <TableCell colSpan={7} className="h-48 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200">
                                                <FileText className="h-12 w-12 text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-semibold text-slate-700">No opening balances found</p>
                                                <p className="text-sm text-slate-500 mt-1">
                                                    {filterStatus === 'all'
                                                        ? "Create your first opening balance to get started"
                                                        : `No ${filterStatus} opening balances available`}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </motion.tr>
                            ) : (
                                filteredData.map((ob, index) => (
                                    <motion.tr
                                        key={ob.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={cn(
                                            "group hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/20 transition-all duration-200",
                                            index !== filteredData.length - 1 && "border-b border-slate-100"
                                        )}
                                    >
                                        {/* Date Column */}
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "p-2 rounded-xl",
                                                    ob.isPosted
                                                        ? "bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-600"
                                                        : "bg-gradient-to-br from-amber-100 to-amber-200 text-amber-600"
                                                )}>
                                                    <Calendar className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">
                                                        {format(new Date(ob.asOfDate), "dd MMM yyyy", { locale: id })}
                                                    </p>
                                                    <p className="text-xs text-slate-500">As of Date</p>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Description Column */}
                                        <TableCell className="py-4">
                                            <div className="max-w-xs">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <FileText className="h-4 w-4 text-blue-500" />
                                                    <p className="font-medium text-slate-900 truncate">
                                                        {ob.description || "No description"}
                                                    </p>
                                                </div>
                                                <p className="text-xs text-slate-500 line-clamp-2">
                                                    Opening balance for accounting period
                                                </p>
                                            </div>
                                        </TableCell>

                                        {/* Accounts Count Column */}
                                        <TableCell className="py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <Badge className={cn(
                                                    "px-3 py-1.5 text-xs font-semibold border-0 shadow-sm",
                                                    ob.isPosted
                                                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                                        : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                                )}>
                                                    <span className="flex items-center gap-1.5">
                                                        <Hash className="h-3 w-3" />
                                                        {ob._count?.details || 0} Accounts
                                                    </span>
                                                </Badge>
                                            </div>
                                        </TableCell>

                                        {/* Amount Column */}
                                        <TableCell className="py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                                                    <span className="text-sm font-bold text-slate-600">Rp</span>
                                                    {getTotalAmount(ob).toLocaleString('id-ID')}
                                                </div>
                                                <p className="text-[10px] text-slate-500 mt-1">Total Amount</p>
                                            </div>
                                        </TableCell>

                                        {/* Status Column */}
                                        <TableCell className="py-4 text-center">
                                            <div className="flex justify-center">
                                                {ob.isPosted ? (
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-200">
                                                        <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                                                        <span className="text-xs font-semibold text-emerald-700">Posted</span>
                                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200">
                                                        <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse" />
                                                        <span className="text-xs font-semibold text-amber-700">Draft</span>
                                                        <Clock className="h-3.5 w-3.5 text-amber-600" />
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* Created At Column */}
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <div className="p-1.5 rounded-lg bg-slate-100">
                                                    <History className="h-3.5 w-3.5" />
                                                </div>
                                                <div className="text-xs">
                                                    <p className="font-medium">{format(new Date(ob.createdAt), "dd MMM yyyy", { locale: id })}</p>
                                                    <p className="text-slate-500">{format(new Date(ob.createdAt), "HH:mm")}</p>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Actions Column */}
                                        <TableCell className="py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => onView(ob.id)}
                                                    className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                                                    title="View Details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>

                                                {!ob.isPosted && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => onEdit(ob)}
                                                            className="h-8 w-8 rounded-full bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700"
                                                            title="Edit Balance"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>

                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => onPost(ob.id)}
                                                            className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700"
                                                            title="Post to Ledger"
                                                        >
                                                            <Send className="h-3.5 w-3.5" />
                                                        </Button>

                                                        <div className="w-px h-4 bg-slate-200 mx-1"></div>

                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => onDelete(ob.id)}
                                                            className="h-8 w-8 rounded-full bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                                                            title="Delete Draft"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </motion.tr>
                                ))
                            )}
                        </AnimatePresence>
                    </TableBody>
                </Table>
            </div>

            {/* Mobile/Tablet Card View (MD and below) */}
            <div className="md:hidden space-y-4">
                <AnimatePresence>
                    {filteredData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200 text-center">
                            <div className="p-3 rounded-full bg-slate-100 mb-3">
                                <FileText className="h-8 w-8 text-slate-400" />
                            </div>
                            <p className="text-slate-600 font-medium">No opening balances found</p>
                        </div>
                    ) : (
                        filteredData.map((ob, index) => (
                            <motion.div
                                key={ob.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
                            >
                                {/* Card Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "p-2 rounded-lg",
                                            ob.isPosted
                                                ? "bg-emerald-100 text-emerald-600"
                                                : "bg-amber-100 text-amber-600"
                                        )}>
                                            <Calendar className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">
                                                {format(new Date(ob.asOfDate), "dd MMM yyyy", { locale: id })}
                                            </p>
                                            <p className="text-[10px] text-slate-500">As of Date</p>
                                        </div>
                                    </div>
                                    {ob.isPosted ? (
                                        <Badge className="bg-emerald-100 text-emerald-700 border-0 shadow-none hover:bg-emerald-200">
                                            Posted
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-amber-100 text-amber-700 border-0 shadow-none hover:bg-amber-200">
                                            Draft
                                        </Badge>
                                    )}
                                </div>

                                {/* Card Body */}
                                <div className="space-y-3">
                                    <div className="p-3 rounded-lg bg-slate-50/50 border border-slate-100">
                                        <p className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wide">Description</p>
                                        <p className="text-sm text-slate-700 font-medium line-clamp-2">
                                            {ob.description || "No description available"}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Total Amount</p>
                                            <p className="text-lg font-bold text-slate-900">
                                                Rp {getTotalAmount(ob).toLocaleString('id-ID')}
                                            </p>
                                        </div>
                                        <Badge variant="outline" className="h-8 px-2.5 gap-1.5 bg-slate-50">
                                            <Hash className="h-3.5 w-3.5 text-slate-500" />
                                            <span className="text-slate-600">{ob._count?.details || 0} Akun</span>
                                        </Badge>
                                    </div>
                                </div>

                                {/* Card Actions */}
                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onView(ob.id)}
                                        className="text-blue-600 bg-blue-50 border-blue-100 hover:bg-blue-100 text-xs h-8"
                                    >
                                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                                        View
                                    </Button>

                                    {!ob.isPosted && (
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onEdit(ob)}
                                                className="text-amber-600 bg-amber-50 border-amber-100 hover:bg-amber-100 text-xs h-8 px-2.5"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onPost(ob.id)}
                                                className="text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-100 text-xs h-8 px-2.5"
                                            >
                                                <Send className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onDelete(ob.id)}
                                                className="text-red-600 bg-red-50 border-red-100 hover:bg-red-100 text-xs h-8 px-2.5"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

const SkeletonTable = () => (
    <div className="space-y-4">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl">
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <Skeleton className="h-6 w-40 rounded-full" />
                </div>
                <Skeleton className="h-4 w-60 rounded-full" />
            </div>
            <div className="flex gap-2">
                <Skeleton className="h-9 w-20 rounded-lg" />
                <Skeleton className="h-9 w-20 rounded-lg" />
                <Skeleton className="h-9 w-20 rounded-lg" />
            </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-50">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32 rounded-full" />
                            <Skeleton className="h-8 w-20 rounded-full" />
                        </div>
                        <Skeleton className="h-10 w-10 rounded-xl" />
                    </div>
                </div>
            ))}
        </div>

        {/* Table Skeleton */}
        <div className="rounded-2xl border border-slate-200 overflow-hidden">
            {/* Table Header */}
            <div className="h-14 bg-gradient-to-r from-slate-50 to-blue-50/50 border-b flex items-center px-6 gap-6">
                {[1, 2, 3, 4, 5, 6, 7].map(i => (
                    <Skeleton key={i} className="h-4 flex-1 rounded-full" />
                ))}
            </div>

            {/* Table Rows */}
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 border-b flex items-center px-6 gap-6">
                    {/* Date Column */}
                    <div className="flex items-center gap-3 flex-1">
                        <Skeleton className="h-10 w-10 rounded-xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24 rounded-full" />
                            <Skeleton className="h-3 w-16 rounded-full" />
                        </div>
                    </div>

                    {/* Description Column */}
                    <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4 rounded-full" />
                            <Skeleton className="h-4 w-32 rounded-full" />
                        </div>
                        <Skeleton className="h-3 w-48 rounded-full" />
                    </div>

                    {/* Accounts Column */}
                    <div className="flex justify-center flex-1">
                        <Skeleton className="h-8 w-24 rounded-full" />
                    </div>

                    {/* Amount Column */}
                    <div className="space-y-2 flex-1 text-center">
                        <Skeleton className="h-6 w-20 rounded-full mx-auto" />
                        <Skeleton className="h-3 w-16 rounded-full mx-auto" />
                    </div>

                    {/* Status Column */}
                    <div className="flex justify-center flex-1">
                        <Skeleton className="h-7 w-24 rounded-full" />
                    </div>

                    {/* Created Column */}
                    <div className="flex items-center gap-2 flex-1">
                        <Skeleton className="h-7 w-7 rounded-lg" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-20 rounded-full" />
                            <Skeleton className="h-3 w-12 rounded-full" />
                        </div>
                    </div>

                    {/* Actions Column */}
                    <div className="flex justify-center">
                        <Skeleton className="h-9 w-9 rounded-full" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);