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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    StaffBalance,
    getCategoryLabel,
    getCategoryColor,
} from "@/types/staffBalance";
import { formatCurrency } from "@/lib/utils";
import { Eye, TrendingUp, TrendingDown, Mail, Building, Briefcase, ArrowDownCircle, ArrowUpCircle, Plus, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CreateOpeningBalanceDialog } from "./CreateOpeningBalanceDialog";
import { StaffRefundDialog } from "./StaffRefundDialog";

interface TabelStaffBalanceProps {
    data: StaffBalance[];
    isLoading?: boolean;
}

export function TabelStaffBalance({ data, isLoading }: TabelStaffBalanceProps) {
    const router = useRouter();
    const [openingBalanceDialogOpen, setOpeningBalanceDialogOpen] = useState(false);
    const [refundDialogOpen, setRefundDialogOpen] = useState(false);
    const [selectedKaryawan, setSelectedKaryawan] = useState<{ id: string; name: string } | null>(null);
    const [selectedBalance, setSelectedBalance] = useState<StaffBalance | null>(null);

    const handleViewLedger = (karyawanId: string) => {
        router.push(`/admin-area/accounting/staff-balance/ledger/${karyawanId}`);
    };

    const handleOpeningBalance = (karyawanId: string, karyawanName: string) => {
        setSelectedKaryawan({ id: karyawanId, name: karyawanName });
        setOpeningBalanceDialogOpen(true);
    };

    const handleRefund = (balance: StaffBalance) => {
        setSelectedBalance(balance);
        setRefundDialogOpen(true);
    };

    const handleDialogSuccess = () => {
        router.refresh(); // Refresh data after creating opening balance or refund
    };

    // Skeleton Loader
    const renderSkeleton = () => (
        <div className="w-full">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Karyawan</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Kategori</TableHead>
                            <TableHead className="text-right">Total Masuk</TableHead>
                            <TableHead className="text-right">Total Keluar</TableHead>
                            <TableHead className="text-right">Saldo</TableHead>
                            <TableHead>Terakhir Update</TableHead>
                            <TableHead className="text-center">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[...Array(5)].map((_, index) => (
                            <TableRow key={index}>
                                <TableCell>
                                    <div className="flex flex-col gap-2">
                                        <Skeleton className="h-5 w-48" />
                                        <div className="flex items-center gap-1">
                                            <Mail className="h-3 w-3 text-muted-foreground" />
                                            <Skeleton className="h-4 w-32" />
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-1">
                                            <Building className="h-3 w-3 text-muted-foreground" />
                                            <Skeleton className="h-4 w-24" />
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Briefcase className="h-3 w-3 text-muted-foreground" />
                                            <Skeleton className="h-4 w-20" />
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="h-6 w-28 rounded-full" />
                                </TableCell>
                                <TableCell>
                                    <div className="flex justify-end">
                                        <Skeleton className="h-5 w-28" />
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex justify-end">
                                        <Skeleton className="h-5 w-28" />
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex justify-end">
                                        <Skeleton className="h-5 w-28" />
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="h-4 w-24" />
                                </TableCell>
                                <TableCell className="text-center">
                                    <Skeleton className="h-9 w-32 mx-auto" />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );

    // Empty State
    const renderEmptyState = () => (
        <div className="w-full">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Karyawan</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Kategori</TableHead>
                            <TableHead className="text-right">Total Masuk</TableHead>
                            <TableHead className="text-right">Total Keluar</TableHead>
                            <TableHead className="text-right">Saldo</TableHead>
                            <TableHead>Terakhir Update</TableHead>
                            <TableHead className="text-center">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell
                                colSpan={8}
                                className="text-center py-12"
                            >
                                <div className="flex flex-col items-center gap-4">
                                    <div className="rounded-full bg-muted p-3">
                                        <svg
                                            className="h-8 w-8 text-muted-foreground"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg text-muted-foreground">
                                            Data Staff Balance Tidak Ditemukan
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Tidak ada data saldo karyawan yang tersedia
                                        </p>
                                    </div>
                                </div>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </div>
    );

    if (isLoading) {
        return renderSkeleton();
    }

    if (!data || data.length === 0) {
        return renderEmptyState();
    }

    return (
        <div className="w-full">
            <div className="rounded-md border shadow-sm">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="font-semibold">Karyawan</TableHead>
                                <TableHead className="font-semibold">Department</TableHead>
                                <TableHead className="font-semibold">Kategori</TableHead>
                                <TableHead className="text-right font-semibold">Total Masuk</TableHead>
                                <TableHead className="text-right font-semibold">Total Keluar</TableHead>
                                <TableHead className="text-right font-semibold">Saldo</TableHead>
                                <TableHead className="font-semibold">Terakhir Update</TableHead>
                                <TableHead className="text-center font-semibold">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((balance) => {
                                const amount = Number(balance.amount);
                                const totalIn = Number(balance.totalIn);
                                const totalOut = Number(balance.totalOut);
                                const isPositive = amount > 0;
                                const isNegative = amount < 0;
                                const isNeutral = amount === 0;

                                return (
                                    <TableRow
                                        key={balance.id}
                                        className="hover:bg-muted/30 transition-colors group"
                                    >
                                        <TableCell>
                                            <div className="flex flex-col space-y-2">
                                                <span className="font-medium text-foreground">
                                                    {balance.karyawan.namaLengkap}
                                                </span>
                                                {balance.karyawan.email && (
                                                    <div className="flex items-center gap-1.5 text-sm">
                                                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span className="text-muted-foreground">
                                                            {balance.karyawan.email}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col space-y-2">
                                                {balance.karyawan.departemen && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Building className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span className="text-sm">{balance.karyawan.departemen}</span>
                                                    </div>
                                                )}
                                                {balance.karyawan.jabatan && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span className="text-xs text-muted-foreground">
                                                            {balance.karyawan.jabatan}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    getCategoryColor(balance.category),
                                                    "font-medium"
                                                )}
                                            >
                                                {getCategoryLabel(balance.category)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {totalIn > 0 && (
                                                    <ArrowDownCircle className="h-4 w-4 text-green-600" />
                                                )}
                                                <span className={cn(
                                                    "font-medium",
                                                    totalIn > 0 ? "text-green-700 dark:text-green-500" : "text-muted-foreground"
                                                )}>
                                                    {totalIn > 0 ? formatCurrency(totalIn) : "-"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {totalOut > 0 && (
                                                    <ArrowUpCircle className="h-4 w-4 text-orange-600" />
                                                )}
                                                <span className={cn(
                                                    "font-medium",
                                                    totalOut > 0 ? "text-orange-700 dark:text-orange-500" : "text-muted-foreground"
                                                )}>
                                                    {totalOut > 0 ? formatCurrency(totalOut) : "-"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {isPositive && (
                                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                                )}
                                                {isNegative && (
                                                    <TrendingDown className="h-4 w-4 text-red-600" />
                                                )}
                                                {isNeutral && (
                                                    <div className="h-4 w-4 text-muted-foreground" />
                                                )}
                                                <span
                                                    className={cn(
                                                        "font-semibold",
                                                        isPositive && "text-green-700 dark:text-green-500",
                                                        isNegative && "text-red-700 dark:text-red-500",
                                                        isNeutral && "text-muted-foreground"
                                                    )}
                                                >
                                                    {formatCurrency(amount)}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">
                                                    {new Date(balance.updatedAt).toLocaleDateString("id-ID", {
                                                        day: "2-digit",
                                                        month: "short",
                                                        year: "numeric",
                                                    })}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(balance.updatedAt).toLocaleTimeString("id-ID", {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleViewLedger(balance.karyawanId)}
                                                    className="gap-2 transition-all duration-200 hover:bg-primary hover:text-primary-foreground group-hover:shadow-sm"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    <span>Detail</span>
                                                </Button>
                                                {/* Show "Saldo Awal" button only if no transactions yet (totalIn and totalOut are 0) */}
                                                {totalIn === 0 && totalOut === 0 && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleOpeningBalance(balance.karyawanId, balance.karyawan.namaLengkap)}
                                                        className="gap-2 bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-600 hover:text-white transition-all duration-200"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                        <span>Saldo Awal</span>
                                                    </Button>
                                                )}

                                                {/* Show "Refund" button if saldo > 0 or has transactions */}
                                                {(amount > 0 || (totalIn > 0 && totalOut > 0)) && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleRefund(balance)}
                                                        className="gap-2 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-600 hover:text-white transition-all duration-200"
                                                    >
                                                        <Undo2 className="h-4 w-4" />
                                                        <span>Refund</span>
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Create Opening Balance Dialog */}
            {selectedKaryawan && (
                <CreateOpeningBalanceDialog
                    open={openingBalanceDialogOpen}
                    onOpenChange={setOpeningBalanceDialogOpen}
                    karyawanId={selectedKaryawan.id}
                    karyawanName={selectedKaryawan.name}
                    onSuccess={handleDialogSuccess}
                />
            )}

            {/* Staff Refund Dialog */}
            {selectedBalance && (
                <StaffRefundDialog
                    open={refundDialogOpen}
                    onOpenChange={setRefundDialogOpen}
                    karyawanId={selectedBalance.karyawanId}
                    karyawanName={selectedBalance.karyawan.namaLengkap}
                    category={selectedBalance.category}
                    currentBalance={Number(selectedBalance.amount)}
                    onSuccess={handleDialogSuccess}
                />
            )}
        </div>
    );
}