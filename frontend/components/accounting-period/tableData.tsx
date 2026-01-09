
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
    Plus,
    Search,
    MoreHorizontal,
    Lock,
    Unlock,
    Edit,
    Calendar,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    CheckCircle2,
    XCircle,
    Info,
    Clock,
    User,
    AlertTriangle,
    ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

import { getPeriods, closePeriod, reopenPeriod } from "@/lib/action/accounting/period";
import { AccountingPeriod } from "@/schemas/accounting/period";

export function PeriodTable() {
    const [periods, setPeriods] = useState<AccountingPeriod[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit, setLimit] = useState(10);

    // Dialog State
    const [selectedPeriod, setSelectedPeriod] = useState<AccountingPeriod | null>(null);
    const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
    const [isReopenDialogOpen, setIsReopenDialogOpen] = useState(false);

    const fetchPeriods = async () => {
        setIsLoading(true);
        try {
            const res = await getPeriods({ search, page, limit });
            if (res.success) {
                setPeriods(res.data);
                setTotalPages(res.pagination.pages);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch periods");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPeriods();
        }, 500);
        return () => clearTimeout(timer);
    }, [search, page, limit]);

    const handleAction = async (action: 'close' | 'reopen', period: AccountingPeriod) => {
        setSelectedPeriod(period);
        if (action === 'close') setIsCloseDialogOpen(true);
        else setIsReopenDialogOpen(true);
    };

    const handleConfirmClose = async () => {
        if (!selectedPeriod) return;
        try {
            const res = await closePeriod(selectedPeriod.id);
            if (res.success) {
                toast.success(`Period ${selectedPeriod.periodCode} closed`);
                setIsCloseDialogOpen(false);
                fetchPeriods();
            }
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleConfirmReopen = async () => {
        if (!selectedPeriod) return;
        try {
            const res = await reopenPeriod(selectedPeriod.id, "Reopened");
            if (res.success) {
                toast.success(`Period ${selectedPeriod.periodCode} reopened`);
                setIsReopenDialogOpen(false);
                fetchPeriods();
            }
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <div className="space-y-3">
            {/* Search and Pagination Controls */}
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-white p-3 rounded-2xl border shadow-sm">
                <div className="relative w-full md:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <Input
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-9 text-xs md:text-sm border-gray-100 focus:border-emerald-500 rounded-xl"
                    />
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] md:text-xs text-gray-400 font-bold uppercase">Limit</span>
                        <select
                            className="h-8 rounded-lg border border-gray-100 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 px-2 font-bold text-gray-600 bg-gray-50"
                            value={limit}
                            onChange={(e) => setLimit(Number(e.target.value))}
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>

                    {/* Compact Pagination */}
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg"
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-[10px] md:text-xs font-bold text-gray-600 px-2">
                            {page} / {totalPages}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg"
                            disabled={page === totalPages}
                            onClick={() => setPage(page + 1)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {isLoading ? (
                <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-16 md:h-12 w-full rounded-xl" />
                    ))}
                </div>
            ) : periods.length === 0 ? (
                <Card className="rounded-2xl border-dashed border-2 py-12">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                        <Calendar className="h-10 w-10 opacity-20 mb-2" />
                        <p className="text-sm font-bold">No periods found</p>
                    </div>
                </Card>
            ) : (
                <>
                    {/* Desktop View Table */}
                    <div className="hidden lg:block bg-white rounded-2xl border shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-400 py-3">Code</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-400 py-3">Name</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-400 py-3 text-center">Date Range</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-400 py-3 text-center">Fiscal</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-400 py-3">Status</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-400 py-3 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {periods.map((period) => (
                                    <TableRow key={period.id} className="group hover:bg-emerald-50/20 transition-colors">
                                        <TableCell className="py-2.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                                                    <Clock className="h-3.5 w-3.5" />
                                                </div>
                                                <span className="text-[11px] font-bold text-gray-700">{period.periodCode}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-2.5">
                                            <span className="text-[11px] font-medium text-gray-600">{period.periodName}</span>
                                        </TableCell>
                                        <TableCell className="py-2.5 text-center">
                                            <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-gray-500 bg-gray-50 rounded-lg py-1 px-2 border w-fit mx-auto">
                                                <span>{format(new Date(period.startDate), "dd/MM/yy")}</span>
                                                <span className="text-gray-300">→</span>
                                                <span>{format(new Date(period.endDate), "dd/MM/yy")}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-2.5 text-center">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-gray-400 leading-tight">Y{period.fiscalYear}</span>
                                                <span className="text-[10px] font-bold text-indigo-600 leading-tight">Q{period.quarter}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-2.5">
                                            <Badge
                                                className={`
                                                    rounded-lg px-2 py-0.5 border text-[9px] font-black uppercase tracking-tighter
                                                    ${period.isClosed
                                                        ? "bg-gray-100 text-gray-500 border-gray-200"
                                                        : "bg-emerald-100 text-emerald-700 border-emerald-200"
                                                    }
                                                `}
                                                variant="outline"
                                            >
                                                {period.isClosed ? "Closed" : "Active"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-2.5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link href={`/admin-area/accounting/accounting-period/update/${period.id}`}>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-blue-500 hover:bg-blue-50">
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </Button>
                                                </Link>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-gray-400 hover:bg-gray-50">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="rounded-xl border-gray-100 shadow-xl overflow-hidden">
                                                        <DropdownMenuItem onClick={() => handleAction(period.isClosed ? 'reopen' : 'close', period)} className="text-xs font-bold p-2.5 cursor-pointer">
                                                            {period.isClosed ? (
                                                                <span className="text-emerald-600 flex items-center gap-2"><Unlock className="h-3.5 w-3.5" /> Reopen Period</span>
                                                            ) : (
                                                                <span className="text-amber-600 flex items-center gap-2"><Lock className="h-3.5 w-3.5" /> Close Period</span>
                                                            )}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile/Tablet Card View */}
                    <div className="lg:hidden space-y-2">
                        <Accordion type="single" collapsible className="space-y-2 w-full">
                            {periods.map((period) => (
                                <AccordionItem
                                    key={period.id}
                                    value={period.id}
                                    className="bg-white rounded-2xl border px-3 shadow-sm overflow-hidden border-b-0"
                                >
                                    <div className="flex items-center justify-between py-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${period.isClosed ? 'bg-gray-100 text-gray-400' : 'bg-emerald-100 text-emerald-600 animate-pulse-slow'}`}>
                                                <Calendar className="h-5 w-5" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter leading-none mb-0.5">{period.periodCode}</span>
                                                <span className="text-[13px] font-bold text-gray-800 leading-none">{period.periodName}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge className={`text-[8px] font-black uppercase rounded-md py-0.5 px-1.5 ${period.isClosed ? 'bg-gray-100 text-gray-500' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                                                {period.isClosed ? 'CLOSED' : 'ACTIVE'}
                                            </Badge>
                                            <AccordionTrigger className="p-0 hover:no-underline" />
                                        </div>
                                    </div>
                                    <AccordionContent className="pb-3 pt-1 border-t border-dashed border-gray-100">
                                        <div className="grid grid-cols-2 gap-3 mt-2">
                                            <div className="space-y-0.5">
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Start Date</p>
                                                <p className="text-[11px] font-bold text-gray-700">{format(new Date(period.startDate), "dd MMM yyyy")}</p>
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">End Date</p>
                                                <p className="text-[11px] font-bold text-gray-700">{format(new Date(period.endDate), "dd MMM yyyy")}</p>
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Fiscal Details</p>
                                                <p className="text-[11px] font-bold text-blue-600">Year {period.fiscalYear} / Q{period.quarter}</p>
                                            </div>
                                            <div className="flex justify-end items-end gap-2">
                                                <Link href={`/admin-area/accounting/accounting-period/update/${period.id}`} className="flex-1">
                                                    <Button size="sm" variant="outline" className="w-full text-[10px] font-bold h-8 rounded-lg border-blue-100 text-blue-600 hover:bg-blue-50">
                                                        <Edit className="h-3 w-3 mr-1" /> Edit
                                                    </Button>
                                                </Link>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className={`flex-1 text-[10px] font-bold h-8 rounded-lg ${period.isClosed ? 'border-emerald-100 text-emerald-600 hover:bg-emerald-50' : 'border-amber-100 text-amber-600 hover:bg-amber-50'}`}
                                                    onClick={() => handleAction(period.isClosed ? 'reopen' : 'close', period)}
                                                >
                                                    {period.isClosed ? <Unlock className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                                                    {period.isClosed ? 'Reopen' : 'Close'}
                                                </Button>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </>
            )}

            {/* Dialogs - Kept clean as before */}
            <AlertDialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
                <AlertDialogContent className="rounded-2xl max-w-[90vw] md:max-w-md">
                    <div className="flex flex-col items-center text-center">
                        <div className="h-12 w-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-3">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <AlertDialogTitle className="text-xl font-bold">Close Period?</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-gray-500 mt-1">
                            Closing <strong>{selectedPeriod?.periodCode}</strong> will lock all related transactions.
                        </AlertDialogDescription>
                    </div>
                    <AlertDialogFooter className="mt-4 gap-2">
                        <AlertDialogCancel className="rounded-xl h-10 border-gray-100 font-bold text-xs flex-1">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmClose} className="rounded-xl h-10 bg-amber-600 hover:bg-amber-700 font-bold text-xs flex-1">Confirm</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isReopenDialogOpen} onOpenChange={setIsReopenDialogOpen}>
                <AlertDialogContent className="rounded-2xl max-w-[90vw] md:max-w-md">
                    <div className="flex flex-col items-center text-center">
                        <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                            <Unlock className="h-6 w-6" />
                        </div>
                        <AlertDialogTitle className="text-xl font-bold">Reopen Period?</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-gray-500 mt-1">
                            Reopening <strong>{selectedPeriod?.periodCode}</strong> allows modifications again.
                        </AlertDialogDescription>
                    </div>
                    <AlertDialogFooter className="mt-4 gap-2">
                        <AlertDialogCancel className="rounded-xl h-10 border-gray-100 font-bold text-xs flex-1">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmReopen} className="rounded-xl h-10 bg-emerald-600 hover:bg-emerald-700 font-bold text-xs flex-1">Confirm</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
