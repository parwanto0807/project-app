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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
    StaffLedger,
    LedgerCategory,
    TransactionStaffBalanceType,
    getCategoryLabel,
    getCategoryColor,
    getTransactionTypeLabel,
    getTransactionTypeColor,
} from "@/types/staffBalance";
import { formatCurrency } from "@/lib/utils";
import {
    TrendingUp,
    TrendingDown,
    Calendar,
    Filter,
    FileText,
    ChevronLeft,
    ChevronRight,
    Plus,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { CreateOpeningBalanceDialog } from "./CreateOpeningBalanceDialog";

interface StaffLedgerContentProps {
    initialData: StaffLedger[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    karyawanId: string;
    karyawanName?: string;
}

export function StaffLedgerContent({
    initialData,
    pagination,
    karyawanId,
    karyawanName = "Karyawan",
}: StaffLedgerContentProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [openingBalanceDialogOpen, setOpeningBalanceDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(
        searchParams.get("category") || "all"
    );
    const [selectedType, setSelectedType] = useState(
        searchParams.get("type") || "all"
    );
    const [startDate, setStartDate] = useState(
        searchParams.get("startDate") || ""
    );
    const [endDate, setEndDate] = useState(searchParams.get("endDate") || "");

    const handleFilterChange = () => {
        const params = new URLSearchParams();
        if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory);
        if (selectedType && selectedType !== "all") params.set("type", selectedType);
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
        params.set("page", "1"); // Reset to first page

        router.push(
            `/admin-area/accounting/staff-balance/ledger/${karyawanId}?${params.toString()}`
        );
    };

    const handleResetFilter = () => {
        setSelectedCategory("all");
        setSelectedType("all");
        setStartDate("");
        setEndDate("");
        router.push(`/admin-area/accounting/staff-balance/ledger/${karyawanId}`);
    };

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", newPage.toString());
        router.push(
            `/admin-area/accounting/staff-balance/ledger/${karyawanId}?${params.toString()}`
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        Ledger: {karyawanName}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Detail transaksi dan mutasi saldo
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => router.push('/admin-area/accounting/staff-balance')}
                    className="group relative inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-slate-900 hover:bg-gradient-to-r hover:from-red-50 hover:to-transparent dark:hover:from-red-950/40 dark:hover:to-transparent transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-x-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-300 dark:focus:ring-red-700 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/5 to-red-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    <ChevronLeft className="h-4 w-4 text-red-600 dark:text-red-400 relative z-10 transition-all duration-200 group-hover:-translate-x-0.5 group-hover:text-red-700 dark:group-hover:text-red-300" />
                    <span className="text-sm font-medium text-red-700 dark:text-red-300 relative z-10 group-hover:text-red-800 dark:group-hover:text-red-200">
                        Kembali ke Staff balance
                    </span>
                </Button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                {/* Filter Section */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Filter Transaksi
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Category Filter */}
                        <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                                Kategori
                            </label>
                            <Select
                                value={selectedCategory}
                                onValueChange={setSelectedCategory}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua Kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Kategori</SelectItem>
                                    <SelectItem value={LedgerCategory.OPERASIONAL_PROYEK}>
                                        Operasional Proyek
                                    </SelectItem>
                                    <SelectItem value={LedgerCategory.PINJAMAN_PRIBADI}>
                                        Pinjaman Pribadi
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Type Filter */}
                        <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                                Tipe Transaksi
                            </label>
                            <Select value={selectedType} onValueChange={setSelectedType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua Tipe" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Tipe</SelectItem>
                                    <SelectItem
                                        value={TransactionStaffBalanceType.OPENING_BALANCE}
                                    >
                                        Saldo Awal
                                    </SelectItem>
                                    <SelectItem
                                        value={TransactionStaffBalanceType.CASH_ADVANCE}
                                    >
                                        Kasbon / Uang Muka
                                    </SelectItem>
                                    <SelectItem
                                        value={TransactionStaffBalanceType.EXPENSE_REPORT}
                                    >
                                        Laporan Pengeluaran
                                    </SelectItem>
                                    <SelectItem
                                        value={TransactionStaffBalanceType.LOAN_DISBURSEMENT}
                                    >
                                        Pencairan Pinjaman
                                    </SelectItem>
                                    <SelectItem
                                        value={TransactionStaffBalanceType.LOAN_REPAYMENT}
                                    >
                                        Pembayaran Pinjaman
                                    </SelectItem>
                                    <SelectItem
                                        value={TransactionStaffBalanceType.REIMBURSEMENT}
                                    >
                                        Reimbursement
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Start Date */}
                        <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                                Dari Tanggal
                            </label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>

                        {/* End Date */}
                        <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                                Sampai Tanggal
                            </label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                        <Button onClick={handleFilterChange} size="sm">
                            Terapkan Filter
                        </Button>
                        <Button
                            onClick={handleResetFilter}
                            variant="outline"
                            size="sm"
                        >
                            Reset
                        </Button>
                        <div className="ml-auto">
                            <Button
                                onClick={() => setOpeningBalanceDialogOpen(true)}
                                size="sm"
                                className="bg-indigo-600 hover:bg-indigo-700"
                                hidden={true}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Buat Saldo Awal
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Create Opening Balance Dialog */}
                <CreateOpeningBalanceDialog
                    open={openingBalanceDialogOpen}
                    onOpenChange={setOpeningBalanceDialogOpen}
                    karyawanId={karyawanId}
                    karyawanName={karyawanName}
                    onSuccess={() => router.refresh()}
                />

                {/* Table Section */}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                            <TableRow>
                                <TableHead className="font-semibold">Tanggal</TableHead>
                                <TableHead className="font-semibold">Keterangan</TableHead>
                                <TableHead className="font-semibold">Kategori</TableHead>
                                <TableHead className="font-semibold">Tipe</TableHead>
                                <TableHead className="text-right font-semibold">
                                    Saldo Awal
                                </TableHead>
                                <TableHead className="text-right font-semibold">
                                    Debit
                                </TableHead>
                                <TableHead className="text-right font-semibold">
                                    Kredit
                                </TableHead>
                                <TableHead className="text-right font-semibold">
                                    Saldo Akhir
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {initialData.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={8}
                                        className="text-center py-12"
                                    >
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-3">
                                                <FileText className="h-8 w-8 text-slate-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg text-slate-700 dark:text-slate-300">
                                                    Tidak Ada Transaksi
                                                </h3>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                    Belum ada transaksi untuk karyawan ini
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                initialData.map((ledger) => {
                                    const saldoAwal = Number(ledger.saldoAwal || 0);
                                    const debit = Number(ledger.debit);
                                    const kredit = Number(ledger.kredit);
                                    const saldo = Number(ledger.saldo);
                                    const isDebit = debit > 0;

                                    return (
                                        <TableRow
                                            key={ledger.id}
                                            className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors"
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-slate-400" />
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium">
                                                            {new Date(
                                                                ledger.tanggal
                                                            ).toLocaleDateString("id-ID", {
                                                                day: "2-digit",
                                                                month: "short",
                                                                year: "numeric",
                                                            })}
                                                        </span>
                                                        <span className="text-xs text-slate-500">
                                                            {new Date(
                                                                ledger.tanggal
                                                            ).toLocaleTimeString("id-ID", {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-xs">
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white text-wrap">
                                                        {ledger.keterangan}
                                                    </p>
                                                    {ledger.purchaseRequest && (
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                            PR: {ledger.purchaseRequest.nomorPr}
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        getCategoryColor(ledger.category),
                                                        "font-medium"
                                                    )}
                                                >
                                                    {getCategoryLabel(ledger.category)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        getTransactionTypeColor(ledger.type),
                                                        "font-medium"
                                                    )}
                                                >
                                                    {getTransactionTypeLabel(ledger.type)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                                    {formatCurrency(saldoAwal)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {debit > 0 ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <TrendingUp className="h-4 w-4 text-green-600" />
                                                        <span className="font-semibold text-green-700 dark:text-green-500">
                                                            {formatCurrency(debit)}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {kredit > 0 ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <TrendingDown className="h-4 w-4 text-red-600" />
                                                        <span className="font-semibold text-red-700 dark:text-red-500">
                                                            {formatCurrency(kredit)}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span
                                                    className={cn(
                                                        "font-bold",
                                                        saldo > 0 &&
                                                        "text-green-700 dark:text-green-500",
                                                        saldo < 0 &&
                                                        "text-red-700 dark:text-red-500",
                                                        saldo === 0 && "text-slate-500"
                                                    )}
                                                >
                                                    {formatCurrency(saldo)}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="p-6 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                                Menampilkan halaman {pagination.page} dari{" "}
                                {pagination.totalPages} ({pagination.total} transaksi)
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Sebelumnya
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page === pagination.totalPages}
                                >
                                    Selanjutnya
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
